from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category

User = get_user_model()


class CategoryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="joao@example.com", email="joao@example.com", password="Senha@123")
        self.client.force_authenticate(self.user)

    def test_create_category(self):
        response = self.client.post(
            "/api/v1/categories/",
            {"name": "Mercado", "type": "despesa", "description": "Compras mensais"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 1)