from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import EmailTokenObtainPairSerializer, ProfileSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response(
            {"status": 201, "status_text": "Created", "message": "Usuario cadastrado com sucesso"},
            status=status.HTTP_201_CREATED,
        )


class CookieTokenObtainPairView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            refresh = response.data.get("refresh")
            access = response.data.get("access")
            response.set_cookie("access_token", access, httponly=True, samesite="Lax")
            response.set_cookie("refresh_token", refresh, httponly=True, samesite="Lax")
        return response


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.data.copy()
        if "refresh" not in payload:
            payload["refresh"] = request.COOKIES.get("refresh_token")
        request._full_data = payload
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK and response.data.get("access"):
            response.set_cookie("access_token", response.data["access"], httponly=True, samesite="Lax")
        return response


class LogoutView(APIView):
    def post(self, request):
        token = request.data.get("refresh") or request.COOKIES.get("refresh_token")
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass
        response = Response({"status": 200, "status_text": "OK", "message": "Logout realizado com sucesso"})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return Response({"status": 200, "status_text": "OK", "message": "Perfil atualizado com sucesso"})