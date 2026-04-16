import logging
from datetime import date
from dateutil.relativedelta import relativedelta

from celery import shared_task

from .models import Transaction

logger = logging.getLogger(__name__)

FREQUENCY_DELTA = {
    "DAILY": relativedelta(days=1),
    "WEEKLY": relativedelta(weeks=1),
    "MONTHLY": relativedelta(months=1),
    "YEARLY": relativedelta(years=1),
}


@shared_task
def gerar_lancamentos_recorrentes():
    """Gera lançamentos recorrentes para o dia de hoje."""
    hoje = date.today()
    recorrentes = Transaction.objects.filter(
        is_recurring=True,
        start_date__lte=hoje,
    ).exclude(end_date__lt=hoje)

    criados = 0
    for parent in recorrentes:
        delta = FREQUENCY_DELTA.get(parent.frequency)
        if not delta:
            continue
        # Verifica se já existe lançamento gerado para hoje
        ja_existe = Transaction.objects.filter(
            parent_transaction=parent,
            date=hoje,
        ).exists()
        if not ja_existe:
            Transaction.objects.create(
                user=parent.user,
                category=parent.category,
                amount=parent.amount,
                description=parent.description,
                date=hoje,
                type=parent.type,
                is_recurring=False,
                parent_transaction=parent,
            )
            criados += 1

    logger.info("Lançamentos recorrentes gerados: %d", criados)
    return criados
