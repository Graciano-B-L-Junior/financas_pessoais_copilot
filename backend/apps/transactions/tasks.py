"""
Celery tasks para importação em lote e exportação de planilhas XLSX.
"""
from __future__ import annotations

import logging
from decimal import Decimal

from celery import shared_task
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


_PROGRESS_INTERVAL = 10  # emite update_state a cada N rows


@shared_task(bind=True, max_retries=3)
def import_transactions_task(self, user_id: int, rows: list[dict], category_map: dict[str, int]) -> dict:
    """
    Persiste os lançamentos validados no banco de dados.

    Parâmetros
    ----------
    user_id     : pk do usuário dono dos lançamentos
    rows        : lista de dicts com {description, date_str, amount, category_name}
    category_map: {category_name: category_id} resolvido no momento da confirmação
    """
    from apps.transactions.models import Transaction

    total = len(rows)

    def _emit(idx: int, created: int, skipped: int) -> None:
        percent = int((idx + 1) / total * 100) if total else 100
        self.update_state(
            state="PROGRESS",
            meta={"percent": percent, "created": created, "skipped": skipped, "total": total},
        )

    try:
        user = User.objects.get(pk=user_id)
        created = 0
        skipped = 0

        for idx, row in enumerate(rows):
            cat_id = category_map.get(row["category_name"])
            if not cat_id:
                skipped += 1
            else:
                # Verificar duplicata: mesmo dia + valor + descrição
                already_exists = Transaction.objects.filter(
                    user=user,
                    date=row["date_str"],
                    amount=Decimal(str(row["amount"])),
                    description=row["description"],
                ).exists()

                if already_exists:
                    skipped += 1
                else:
                    from apps.categories.models import Category

                    try:
                        category = Category.objects.get(pk=cat_id, user=user)
                    except Category.DoesNotExist:
                        skipped += 1
                    else:
                        Transaction.objects.create(
                            user=user,
                            category=category,
                            description=row["description"],
                            amount=Decimal(str(row["amount"])),
                            type=category.type,
                            date=row["date_str"],
                        )
                        created += 1

            if idx % _PROGRESS_INTERVAL == 0 or idx == total - 1:
                _emit(idx, created, skipped)

        return {"created": created, "skipped": skipped, "total": total}

    except Exception as exc:
        logger.exception("Erro na task import_transactions_task: %s", exc)
        raise self.retry(exc=exc, countdown=10)


@shared_task(bind=True, max_retries=3)
def export_transactions_task(self, user_id: int, year: int) -> bytes:
    """
    Gera e retorna bytes do XLSX exportado para o usuário no ano especificado.
    Como a task retorna bytes, o resultado fica no Celery result backend (Redis).
    """
    from apps.transactions.models import Transaction
    from apps.transactions.services.spreadsheet_parser import generate_export

    try:
        transactions = (
            Transaction.objects.select_related("category")
            .filter(user_id=user_id, date__year=year)
            .order_by("date")
        )

        by_month: dict[int, list[dict]] = {}
        for tx in transactions:
            month = tx.date.month
            by_month.setdefault(month, []).append(
                {
                    "category_name": tx.category.name,
                    "description": tx.description,
                    "day": tx.date.day,
                    "amount": str(tx.amount),
                }
            )

        return generate_export(by_month, year)

    except Exception as exc:
        logger.exception("Erro na task export_transactions_task: %s", exc)
        raise self.retry(exc=exc, countdown=10)
