from django.db.models import Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from api.apps.transactions.models import Transaction, Account


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)

        qs = Transaction.objects.filter(user=user)

        # Current month aggregates
        month_qs = qs.filter(date__gte=month_start)
        income   = month_qs.filter(type='income').aggregate(s=Sum('amount'))['s'] or 0
        expenses = month_qs.filter(type='expense').aggregate(s=Sum('amount'))['s'] or 0

        # Last month aggregates for trend
        last_qs       = qs.filter(date__gte=last_month_start, date__lt=month_start)
        last_income   = last_qs.filter(type='income').aggregate(s=Sum('amount'))['s'] or 1
        last_expenses = last_qs.filter(type='expense').aggregate(s=Sum('amount'))['s'] or 1

        # Account balance
        balance = Account.objects.filter(user=user).aggregate(s=Sum('balance'))['s'] or 0
        count   = qs.count()

        # Monthly series (last 6 months)
        series = []
        for i in range(5, -1, -1):
            start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            end   = (start + timedelta(days=32)).replace(day=1)
            m_income   = qs.filter(date__gte=start, date__lt=end, type='income').aggregate(s=Sum('amount'))['s'] or 0
            m_expenses = qs.filter(date__gte=start, date__lt=end, type='expense').aggregate(s=Sum('amount'))['s'] or 0
            series.append({'month': start.strftime('%b'), 'income': float(m_income), 'expenses': float(m_expenses)})

        # Category breakdown
        breakdown = (
            qs.filter(type='expense', date__gte=month_start)
            .values('category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')[:8]
        )

        # Recent transactions
        recent = qs.select_related('category', 'account').order_by('-date')[:10]
        recent_data = [
            {
                'id':       t.id,
                'description': t.description,
                'amount':   float(t.amount),
                'type':     t.type,
                'date':     t.date.isoformat(),
                'category': t.category.name if t.category else None,
                'account':  t.account.name if t.account else None,
            }
            for t in recent
        ]

        return Response({
            'balance':          float(balance),
            'income':           float(income),
            'expenses':         float(expenses),
            'count':            count,
            'income_change':    round((float(income) - float(last_income)) / float(last_income) * 100, 1),
            'expense_change':   round((float(expenses) - float(last_expenses)) / float(last_expenses) * 100, 1),
            'monthly_series':   series,
            'category_breakdown': [
                {'name': r['category__name'] or 'Outros', 'value': float(r['total'])}
                for r in breakdown
            ],
            'recent_transactions': recent_data,
        })
