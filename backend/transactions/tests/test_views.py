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
def category(user):
    return Category.objects.create(user=user, name="Alimentação", type="EXPENSE")


@pytest.fixture
def transaction(user, category):
    return Transaction.objects.create(
        user=user,
        category=category,
        amount="150.00",
        description="Supermercado",
        date="2024-01-15",
        type="EXPENSE",
    )


@pytest.mark.django_db
class TestTransactions:
    def test_listar_lancamentos(self, api_client, user, transaction):
        api_client.force_authenticate(user=user)
        response = api_client.get(reverse("transaction-list"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_criar_lancamento(self, api_client, user, category):
        api_client.force_authenticate(user=user)
        payload = {
            "category": category.id,
            "amount": "200.00",
            "description": "Almoço",
            "date": "2024-01-20",
            "type": "EXPENSE",
        }
        response = api_client.post(reverse("transaction-list"), payload)
        assert response.status_code == status.HTTP_201_CREATED

    def test_lancamento_recorrente_exige_frequencia(self, api_client, user, category):
        api_client.force_authenticate(user=user)
        payload = {
            "category": category.id,
            "amount": "100.00",
            "date": "2024-01-01",
            "type": "EXPENSE",
            "is_recurring": True,
        }
        response = api_client.post(reverse("transaction-list"), payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_filtro_por_tipo(self, api_client, user, transaction):
        api_client.force_authenticate(user=user)
        response = api_client.get(reverse("transaction-list"), {"type": "INCOME"})
        assert response.data["count"] == 0

    def test_nao_ve_lancamentos_de_outro_usuario(self, api_client, transaction):
        outro = User.objects.create_user(email="outro@test.com", name="Outro", password="senha1234")
        api_client.force_authenticate(user=outro)
        response = api_client.get(reverse("transaction-list"))
        assert response.data["count"] == 0
