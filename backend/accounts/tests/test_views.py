import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="teste@example.com", name="Teste", password="senha1234")


@pytest.mark.django_db
class TestRegister:
    def test_registro_com_dados_validos(self, api_client):
        url = reverse("auth-register")
        payload = {"email": "novo@example.com", "name": "Novo", "password": "senha1234"}
        response = api_client.post(url, payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email="novo@example.com").exists()

    def test_registro_email_duplicado(self, api_client, user):
        url = reverse("auth-register")
        payload = {"email": user.email, "name": "Outro", "password": "senha1234"}
        response = api_client.post(url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_registro_senha_curta(self, api_client):
        url = reverse("auth-register")
        payload = {"email": "curto@example.com", "name": "Curto", "password": "123"}
        response = api_client.post(url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    def test_login_valido(self, api_client, user):
        url = reverse("auth-login")
        response = api_client.post(url, {"email": user.email, "password": "senha1234"})
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.cookies

    def test_login_senha_errada(self, api_client, user):
        url = reverse("auth-login")
        response = api_client.post(url, {"email": user.email, "password": "errada"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_usuario_inexistente(self, api_client):
        url = reverse("auth-login")
        response = api_client.post(url, {"email": "nao@existe.com", "password": "senha1234"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestProfile:
    def test_obter_perfil_autenticado(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse("auth-profile")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email

    def test_perfil_sem_autenticacao(self, api_client):
        url = reverse("auth-profile")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
