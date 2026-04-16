import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from categories.models import Category
from transactions.models import Transaction


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="user@test.com", name="User", password="senha1234")


@pytest.fixture
def setup_data(user):
    cat_receita = Category.objects.create(user=user, name="Salário", type="INCOME")
    cat_despesa = Category.objects.create(user=user, name="Alimentação", type="EXPENSE")
    Transaction.objects.create(user=user, category=cat_receita, amount="3000.00", date="2024-01-05", type="INCOME")
    Transaction.objects.create(user=user, category=cat_despesa, amount="500.00", date="2024-01-10", type="EXPENSE")
    return user


@pytest.mark.django_db
class TestDashboard:
    def test_dashboard_retorna_saldo(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data)
        response = api_client.get(reverse("analytics-dashboard"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["receitas"] == 3000.0
        assert response.data["despesas"] == 500.0
        assert response.data["saldo"] == 2500.0

    def test_dashboard_filtro_por_periodo(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data)
        response = api_client.get(reverse("analytics-dashboard"), {"start": "2024-01-06", "end": "2024-01-31"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["receitas"] == 0.0
        assert response.data["despesas"] == 500.0


@pytest.mark.django_db
class TestAnalyticsProfile:
    def test_perfil_retorna_taxa_poupanca(self, api_client, setup_data):
        api_client.force_authenticate(user=setup_data)
        response = api_client.get(reverse("analytics-profile"))
        assert response.status_code == status.HTTP_200_OK
        assert "taxa_poupanca_percentual" in response.data
