from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Q, Sum
from django.db.models.functions import TruncDay, TruncMonth
from django.utils.dateparse import parse_date
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.budgets.models import Budget
from apps.categories.models import Category
from apps.transactions.models import Transaction


def _month_bounds(month_value):
    parsed_month = parse_date(f"{month_value}-01") if len(month_value) == 7 else parse_date(month_value)
    if not parsed_month:
        return None

    month_start = date(parsed_month.year, parsed_month.month, 1)
    month_end = date(parsed_month.year, parsed_month.month, monthrange(parsed_month.year, parsed_month.month)[1])
    return month_start, month_end


def _to_float(value):
    if value is None:
        return 0.0
    return float(value)


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

        budget_queryset = (
            Budget.objects.filter(user=request.user)
            .prefetch_related("categories__category")
            .order_by("-month", "-created_at")
        )
        active_budget = budget_queryset.filter(status=Budget.STATUS_ACTIVE).first() or budget_queryset.first()
        budget_summary = active_budget.calculate_execution(persist=False) if active_budget else None
        budget_series = []
        for budget in budget_queryset.order_by("month")[:6]:
            execution = budget.calculate_execution(persist=False)
            budget_series.append(
                {
                    "month": execution["month"],
                    "budgeted": execution["budgeted_total"],
                    "actual": execution["actual_expenses"],
                    "execution_percentage": execution["execution_percentage"],
                }
            )
        
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
                "budget_summary": budget_summary,
                "budget_series": budget_series,
            }
        )


class CategorySeriesView(APIView):
    """
    Endpoint para obter série temporal de despesas por categoria.
    
    Query params:
    - category_id: ID da categoria (obrigatório)
    - granularity: monthly ou daily
    - start: Data de início (YYYY-MM-DD)
    - end: Data de fim (YYYY-MM-DD)
    - month: Mês selecionado para visão diária (YYYY-MM)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category_id = request.query_params.get("category_id")
        granularity = request.query_params.get("granularity", "monthly")
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        month = request.query_params.get("month")

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

        if granularity not in {"monthly", "daily"}:
            return Response(
                {
                    "status": 400,
                    "status_text": "Bad Request",
                    "message": "granularity must be monthly or daily",
                    "category_series": [],
                },
                status=400,
            )

        category = Category.objects.filter(
            id=category_id,
            user=request.user,
            type=Category.TYPE_EXPENSE,
        ).first()

        if not category:
            return Response(
                {
                    "status": 404,
                    "status_text": "Not Found",
                    "message": "Categoria não encontrada",
                    "category_series": [],
                },
                status=404,
            )

        queryset = Transaction.objects.filter(
            user=request.user,
            category=category,
            type=Category.TYPE_EXPENSE,
            is_active=True,
        )

        category_series = []
        budget_series = []
        budget_reference = None

        if granularity == "daily":
            if not month:
                return Response(
                    {
                        "status": 400,
                        "status_text": "Bad Request",
                        "message": "month is required for daily granularity",
                        "category_series": [],
                    },
                    status=400,
                )

            month_bounds = _month_bounds(month)
            if not month_bounds:
                return Response(
                    {
                        "status": 400,
                        "status_text": "Bad Request",
                        "message": "month must be a valid YYYY-MM value",
                        "category_series": [],
                    },
                    status=400,
                )

            month_start, month_end = month_bounds
            queryset = queryset.filter(date__range=(month_start, month_end))

            daily_totals = {}
            for item in queryset.annotate(period=TruncDay("date")).values("period").annotate(total=Sum("amount")):
                period = item["period"]
                period_key = period.date() if hasattr(period, "date") else period
                daily_totals[period_key] = item["total"] or Decimal("0")

            budget = (
                Budget.objects.filter(user=request.user, month=month_start, categories__category=category)
                .prefetch_related("categories__category")
                .first()
            )
            if budget:
                budget_category = budget.categories.filter(category=category).first()
                if budget_category:
                    budget_reference = {
                        "month": budget.month.strftime("%Y-%m"),
                        "category_id": category.id,
                        "category_name": category.name,
                        "budgeted_amount": _to_float(budget_category.budgeted_amount),
                    }

            current_day = month_start
            while current_day <= month_end:
                actual_total = _to_float(daily_totals.get(current_day, Decimal("0")))
                category_series.append(
                    {
                        "label": current_day.isoformat(),
                        "total": actual_total,
                    }
                )
                if budget_reference:
                    budget_series.append(
                        {
                            "label": current_day.isoformat(),
                            "total": budget_reference["budgeted_amount"],
                        }
                    )
                current_day += timedelta(days=1)
        else:
            if start:
                queryset = queryset.filter(date__gte=start)
            if end:
                queryset = queryset.filter(date__lte=end)

            monthly_data = (
                queryset.annotate(period=TruncMonth("date")).values("period").annotate(total=Sum("amount")).order_by("period")
            )

            month_labels = []
            for item in monthly_data:
                period = item["period"]
                if not period:
                    continue

                month_label = period.strftime("%Y-%m")
                month_labels.append(date(period.year, period.month, 1))
                category_series.append(
                    {
                        "label": month_label,
                        "total": _to_float(item["total"]),
                    }
                )

            budgets = (
                Budget.objects.filter(user=request.user, month__in=month_labels, categories__category=category)
                .prefetch_related("categories__category")
                .order_by("month")
            )
            budget_map = {}
            for budget in budgets:
                budget_category = budget.categories.filter(category=category).first()
                if budget_category:
                    budget_map[budget.month.strftime("%Y-%m")] = _to_float(budget_category.budgeted_amount)

            budget_series = [
                {
                    "label": item["label"],
                    "total": budget_map.get(item["label"]),
                }
                for item in category_series
            ]

        return Response(
            {
                "status": 200,
                "status_text": "OK",
                "granularity": granularity,
                "category": {
                    "id": category.id,
                    "name": category.name,
                },
                "budget": budget_reference,
                "category_series": category_series,
                "budget_series": budget_series,
            }
        )


class CategoryMonthsView(APIView):
    """
    Retorna os meses distintos com ao menos uma transação de despesa
    para a categoria informada, pertencente ao usuário autenticado.

    Query params:
    - category_id: ID da categoria (obrigatório, tipo despesa)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category_id = request.query_params.get("category_id")

        if not category_id:
            return Response(
                {"status": 400, "message": "category_id is required", "months": []},
                status=400,
            )

        category = Category.objects.filter(
            id=category_id,
            user=request.user,
            type=Category.TYPE_EXPENSE,
        ).first()

        if not category:
            return Response(
                {"status": 404, "message": "Categoria não encontrada", "months": []},
                status=404,
            )

        months = (
            Transaction.objects.filter(
                user=request.user,
                category=category,
                type=Category.TYPE_EXPENSE,
                is_active=True,
            )
            .annotate(month=TruncMonth("date"))
            .values_list("month", flat=True)
            .distinct()
            .order_by("-month")
        )

        return Response(
            {
                "status": 200,
                "months": [m.strftime("%Y-%m") for m in months if m],
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