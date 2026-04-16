from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from transactions.models import Transaction


class DashboardView(APIView):
    """Agrega receitas e despesas no período informado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.filter(user=request.user)

        start = request.query_params.get("start")
        end = request.query_params.get("end")
        category = request.query_params.get("category")
        tipo = request.query_params.get("type")
        is_recurring = request.query_params.get("is_recurring")

        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)
        if category:
            qs = qs.filter(category_id=category)
        if tipo:
            qs = qs.filter(type=tipo)
        if is_recurring is not None:
            qs = qs.filter(is_recurring=is_recurring.lower() == "true")

        totais = qs.values("type").annotate(total=Sum("amount"))
        resumo = {t["type"]: float(t["total"]) for t in totais}

        receitas = resumo.get("INCOME", 0.0)
        despesas = resumo.get("EXPENSE", 0.0)
        saldo = receitas - despesas

        por_categoria = (
            qs.values("category__id", "category__name", "type")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        return Response(
            {
                "receitas": receitas,
                "despesas": despesas,
                "saldo": saldo,
                "por_categoria": list(por_categoria),
            }
        )


class AnalyticsProfileView(APIView):
    """Análise do comportamento financeiro do usuário."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.filter(user=request.user)

        totais = qs.values("type").annotate(total=Sum("amount"))
        resumo = {t["type"]: float(t["total"]) for t in totais}
        receitas = resumo.get("INCOME", 0.0)
        despesas = resumo.get("EXPENSE", 0.0)

        taxa_poupanca = ((receitas - despesas) / receitas * 100) if receitas > 0 else 0.0

        maior_despesa = (
            qs.filter(type="EXPENSE")
            .values("category__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
            .first()
        )

        return Response(
            {
                "total_receitas": receitas,
                "total_despesas": despesas,
                "taxa_poupanca_percentual": round(taxa_poupanca, 2),
                "maior_categoria_despesa": maior_despesa,
            }
        )
