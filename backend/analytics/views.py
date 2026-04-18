from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from datetime import date, timedelta, datetime
from decimal import Decimal

from transactions.models import Transaction


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        end_param = request.query_params.get('end_date') or request.query_params.get('end')
        start_param = request.query_params.get('start_date') or request.query_params.get('start')
        category_id = request.query_params.get('category')

        end_date = datetime.fromisoformat(end_param).date() if end_param else date.today()
        start_date = datetime.fromisoformat(start_param).date() if start_param else end_date - timedelta(days=30)

        qs = Transaction.objects.filter(user=request.user, date__range=(start_date, end_date))
        if category_id:
            qs = qs.filter(category_id=category_id)

        income = qs.filter(amount__gt=0).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        expense_raw = qs.filter(amount__lt=0).aggregate(s=Sum('amount'))['s'] or Decimal('0')
        expense = abs(expense_raw)

        by_category = list(
            qs.values('category__name', 'category__id')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')
        )

        income_rows = list(
            Transaction.objects.filter(
                user=request.user,
                date__gte=end_date - timedelta(days=180),
                amount__gt=0,
            )
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )

        expense_rows = list(
            Transaction.objects.filter(
                user=request.user,
                date__gte=end_date - timedelta(days=180),
                amount__lt=0,
            )
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )

        # Pivot monthly_trend into {month, income, expense}
        trend_map: dict = {}
        for row in income_rows:
            key = str(row['month'])[:10]
            if key not in trend_map:
                trend_map[key] = {'month': key, 'income': 0, 'expense': 0}
            trend_map[key]['income'] = float(row.get('total') or 0)
        for row in expense_rows:
            key = str(row['month'])[:10]
            if key not in trend_map:
                trend_map[key] = {'month': key, 'income': 0, 'expense': 0}
            trend_map[key]['expense'] = float(abs(row.get('total') or 0))

        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'totals': {'income': float(income), 'expense': float(expense), 'balance': float(income - expense)},
            'by_category': by_category,
            'monthly_trend': list(trend_map.values()),
        })


class BehaviorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = min(int(request.query_params.get('days', 90)), 730)
        end = date.today()
        start = end - timedelta(days=days)
        qs = Transaction.objects.filter(user=request.user, date__range=(start, end))

        income_qs = qs.filter(amount__gt=0)
        expense_qs = qs.filter(amount__lt=0)

        total_income = income_qs.aggregate(s=Sum('amount'))['s'] or Decimal('0')
        total_expense_raw = expense_qs.aggregate(s=Sum('amount'))['s'] or Decimal('0')
        total_expense = abs(total_expense_raw)
        balance = total_income - total_expense
        months = max(Decimal(days) / Decimal('30'), Decimal('1'))
        avg_monthly_expense = round(total_expense / months, 2)

        top_expense_categories = list(
            expense_qs.values('category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')[:5]
        )
        # Make expense totals positive for presentation
        for item in top_expense_categories:
            item['total'] = float(abs(item.get('total') or 0))

        top_income_categories = list(
            income_qs.values('category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')[:5]
        )
        for item in top_income_categories:
            item['total'] = float(item.get('total') or 0)

        return Response({
            'period_days': days,
            'total_income': total_income,
            'total_expense': total_expense,
            'balance': balance,
            'avg_monthly_expense': avg_monthly_expense,
            'top_expense_categories': top_expense_categories,
            'top_income_categories': top_income_categories,
        })
