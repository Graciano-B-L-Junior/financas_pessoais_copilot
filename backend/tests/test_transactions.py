import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User


@pytest.mark.django_db
def test_transactions_requires_auth():
    client = APIClient()
    res = client.get('/api/v1/transactions/')
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_categories_requires_auth():
    client = APIClient()
    res = client.get('/api/v1/categories/')
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_register_creates_user():
    client = APIClient()
    res = client.post(
        '/api/v1/auth/register/',
        {'username': 'testuser', 'password': 'TestPass123!'},
        format='json',
    )
    assert res.status_code == 201
    assert User.objects.filter(username='testuser').exists()


@pytest.mark.django_db
def test_login_sets_cookies():
    User.objects.create_user(username='cookieuser', password='cookiePass123')
    client = APIClient()
    res = client.post(
        '/api/v1/auth/login/',
        {'username': 'cookieuser', 'password': 'cookiePass123'},
        format='json',
    )
    assert res.status_code == 200
    assert 'access' in res.cookies


@pytest.mark.django_db
def test_authenticated_user_can_list_transactions():
    user = User.objects.create_user(username='listuser', password='listPass123')
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.get('/api/v1/transactions/')
    assert res.status_code == 200


@pytest.mark.django_db
def test_profile_endpoint():
    user = User.objects.create_user(username='profileuser', password='profilePass123')
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.get('/api/v1/profile/')
    assert res.status_code == 200
    assert res.data['username'] == 'profileuser'
