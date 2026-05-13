from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.budgets.models import Budget, BudgetCategory
from apps.categories.models import Category
from apps.transactions.models import Transaction

User = get_user_model()


class CategorySeriesViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="joao@example.com",
            email="joao@example.com",
            password="Senha@123",
        )
        self.client.force_authenticate(self.user)
        self.category = Category.objects.create(
            user=self.user,
            name="Alimentação",
            type="despesa",
            description="Gastos com comida",
        )

    def test_daily_category_series_includes_budget_line(self):
        Transaction.objects.create(
            user=self.user,
            category=self.category,
            description="Mercado",
            amount="50.00",
            type="despesa",
            date=date(2026, 5, 10),
            is_active=True,
        )
        Transaction.objects.create(
            user=self.user,
            category=self.category,
            description="Restaurante",
            amount="30.00",
            type="despesa",
            date=date(2026, 5, 10),
            is_active=True,
        )

        budget = Budget.objects.create(user=self.user, month=date(2026, 5, 1), total_amount="300.00")
        BudgetCategory.objects.create(budget=budget, category=self.category, budgeted_amount="120.00")

        response = self.client.get(
            "/api/v1/dashboard/category-series/",
            {"category_id": self.category.id, "granularity": "daily", "month": "2026-05"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["granularity"], "daily")
        self.assertEqual(len(response.data["category_series"]), 31)
        self.assertTrue(response.data["budget"])
        self.assertTrue(all(point["total"] == 120.0 for point in response.data["budget_series"]))
        self.assertEqual(response.data["category_series"][9]["total"], 80.0)

    def test_monthly_category_series_includes_budget_values_when_available(self):
        Transaction.objects.create(
            user=self.user,
            category=self.category,
            description="Mercado abril",
            amount="70.00",
            type="despesa",
            date=date(2026, 4, 12),
            is_active=True,
        )
        Transaction.objects.create(
            user=self.user,
            category=self.category,
            description="Mercado maio",
            amount="90.00",
            type="despesa",
            date=date(2026, 5, 15),
            is_active=True,
        )

        april_budget = Budget.objects.create(user=self.user, month=date(2026, 4, 1), total_amount="200.00")
        BudgetCategory.objects.create(budget=april_budget, category=self.category, budgeted_amount="100.00")
        may_budget = Budget.objects.create(user=self.user, month=date(2026, 5, 1), total_amount="300.00")
        BudgetCategory.objects.create(budget=may_budget, category=self.category, budgeted_amount="150.00")

        response = self.client.get(
            "/api/v1/dashboard/category-series/",
            {"category_id": self.category.id, "granularity": "monthly"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["granularity"], "monthly")
        self.assertEqual([item["label"] for item in response.data["category_series"]], ["2026-04", "2026-05"])
        self.assertEqual([item["total"] for item in response.data["budget_series"]], [100.0, 150.0])