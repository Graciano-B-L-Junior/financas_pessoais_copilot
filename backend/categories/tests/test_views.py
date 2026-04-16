import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from categories.models import Category


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="user@test.com", name="User", password="senha1234")


@pytest.fixture
def category(user):
    return Category.objects.create(user=user, name="Alimentação", type="EXPENSE")


@pytest.mark.django_db
class TestCategories:
    def test_listar_categorias(self, api_client, user, category):
        api_client.force_authenticate(user=user)
        response = api_client.get(reverse("category-list"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_criar_categoria(self, api_client, user):
        api_client.force_authenticate(user=user)
        payload = {"name": "Salário", "type": "INCOME", "color": "#22c55e"}
        response = api_client.post(reverse("category-list"), payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert Category.objects.filter(name="Salário", user=user).exists()

    def test_nao_ve_categorias_de_outro_usuario(self, api_client, category):
        outro = User.objects.create_user(email="outro@test.com", name="Outro", password="senha1234")
        api_client.force_authenticate(user=outro)
        response = api_client.get(reverse("category-list"))
        assert response.data["count"] == 0

    def test_atualizar_categoria(self, api_client, user, category):
        api_client.force_authenticate(user=user)
        url = reverse("category-detail", args=[category.id])
        response = api_client.patch(url, {"name": "Comida"})
        assert response.status_code == status.HTTP_200_OK
        category.refresh_from_db()
        assert category.name == "Comida"

    def test_deletar_categoria(self, api_client, user, category):
        api_client.force_authenticate(user=user)
        url = reverse("category-detail", args=[category.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
