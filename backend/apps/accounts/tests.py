from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RegisterViewTests(APITestCase):
    def test_register_user(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "first_name": "Ana",
                "last_name": "Silva",
                "email": "ana@example.com",
                "password": "Senha@123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="ana@example.com").exists())