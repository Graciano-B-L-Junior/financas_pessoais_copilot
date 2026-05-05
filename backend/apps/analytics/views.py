from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.transactions.models import Transaction


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)
        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")
        category = self.request.query_params.get("category")
        tx_type = self.request.query_params.get("type")
        is_recurring = self.request.query_params.get("is_recurring")
        min_amount = self.request.query_params.get("min_amount")
        max_amount = self.request.query_params.get("max_amount")
        if start:
            queryset = queryset.filter(date__gte=start)
        if end:
            queryset = queryset.filter(date__lte=end)
        if category:
            queryset = queryset.filter(category_id=category)
        if tx_type:
            queryset = queryset.filter(type=tx_type)
        if is_recurring in {"true", "false"}:
            queryset = queryset.filter(is_recurring=is_recurring == "true")
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)
        return queryset

    def get(self, request):
        queryset = self.get_queryset()
        income_total = queryset.filter(type="receita").aggregate(total=Sum("amount"))["total"] or 0
        expense_total = queryset.filter(type="despesa").aggregate(total=Sum("amount"))["total"] or 0
        top_categories = list(
            queryset.values("category__name").annotate(total=Sum("amount")).order_by("-total")[:5]
        )
        
        # Monthly series: group by month for income and expenses
        monthly_data = queryset.annotate(month=TruncMonth("date")).values("month").annotate(
            income=Sum("amount", filter=Q(type="receita")),
            expenses=Sum("amount", filter=Q(type="despesa"))
        ).order_by("month")
        monthly_series = [
            {
                "month": item["month"].strftime("%Y-%m") if item["month"] else None,
                "income": item["income"] or 0,
                "expenses": item["expenses"] or 0,
            }
            for item in monthly_data
        ]
        
        # Category series: if category filter applied, show monthly evolution for that category
        category_id = request.query_params.get("category")
        category_series = []
        if category_id:
            category_monthly = queryset.annotate(month=TruncMonth("date")).values("month").annotate(
                total=Sum("amount")
            ).order_by("month")
            category_series = [
                {
                    "month": item["month"].strftime("%Y-%m") if item["month"] else None,
                    "total": item["total"] or 0,
                }
                for item in category_monthly
            ]
        
        return Response(
            {
                "status": 200,
                "status_text": "OK",
                "summary": {
                    "total_income": income_total,
                    "total_expenses": expense_total,
                    "balance": income_total - expense_total,
                    "transaction_count": queryset.count(),
                    "recurring_count": queryset.filter(is_recurring=True).count(),
                },
                "top_categories": [
                    {"category": item["category__name"], "total": item["total"]} for item in top_categories
                ],
                "monthly_series": monthly_series,
                "category_series": category_series,
            }
        )


class CategorySeriesView(APIView):
    """
    Endpoint para obter série temporal de despesas por categoria.
    
    Query params:
    - category_id: ID da categoria (obrigatório)
    - start: Data de início (YYYY-MM-DD)
    - end: Data de fim (YYYY-MM-DD)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category_id = request.query_params.get("category_id")
        start = request.query_params.get("start")
        end = request.query_params.get("end")

        if not category_id:
            return Response(
                {
                    "status": 400,
                    "status_text": "Bad Request",
                    "message": "category_id is required",
                    "category_series": [],
                },
                status=400,
            )

        queryset = Transaction.objects.filter(
            user=request.user,
            category_id=category_id
        )

        if start:
            queryset = queryset.filter(date__gte=start)
        if end:
            queryset = queryset.filter(date__lte=end)

        # Group by month and sum amounts
        monthly_data = queryset.annotate(month=TruncMonth("date")).values("month").annotate(
            total=Sum("amount")
        ).order_by("month")

        category_series = [
            {
                "month": item["month"].strftime("%Y-%m") if item["month"] else None,
                "total": float(item["total"] or 0),
            }
            for item in monthly_data
        ]

        return Response(
            {
                "status": 200,
                "status_text": "OK",
                "category_series": category_series,
            }
        )



class ProfileAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Transaction.objects.filter(user=request.user)
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        if start:
            queryset = queryset.filter(date__gte=start)
        if end:
            queryset = queryset.filter(date__lte=end)
        income_total = queryset.filter(type="receita").aggregate(total=Sum("amount"))["total"] or 0
        expense_total = queryset.filter(type="despesa").aggregate(total=Sum("amount"))["total"] or 0
        top_categories = list(
            queryset.values("category__name").annotate(total=Sum("amount")).order_by("-total")[:5]
        )
        expense_ratio = float(expense_total / income_total) if income_total else 0.0
        return Response(
            {
                "status": 200,
                "status_text": "OK",
                "summary": {
                    "income_total": income_total,
                    "expense_total": expense_total,
                    "balance": income_total - expense_total,
                    "expense_ratio": expense_ratio,
                    "income_ratio": 1.0 if income_total else 0.0,
                },
                "top_categories": [
                    {"category": item["category__name"], "total": item["total"]} for item in top_categories
                ],
                "insights": [
                    {
                        "code": "HIGH_EXPENSE_RATIO" if expense_ratio >= 0.7 else "HEALTHY_BALANCE",
                        "title": "Despesas elevadas" if expense_ratio >= 0.7 else "Saldo saudavel",
                        "description": "Suas despesas consumiram uma parte relevante da renda no periodo." if expense_ratio >= 0.7 else "Seu saldo esta positivo no periodo avaliado.",
                        "severity": "medium" if expense_ratio >= 0.7 else "low",
                        "suggestion": "Revise gastos variaveis e categorias de maior impacto." if expense_ratio >= 0.7 else "Mantenha o acompanhamento dos gastos recorrentes.",
                    }
                ],
                "monthly_series": [],
            }
        )