import logging

from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserReadSerializer, UserUpdateSerializer

logger = logging.getLogger(__name__)


def _set_auth_cookies(response, access_token, refresh_token):
    secure = settings.JWT_AUTH_COOKIE_SECURE
    samesite = settings.JWT_AUTH_COOKIE_SAMESITE
    response.set_cookie(
        settings.JWT_AUTH_COOKIE,
        str(access_token),
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
    )
    response.set_cookie(
        settings.JWT_AUTH_REFRESH_COOKIE,
        str(refresh_token),
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
    )


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        response = Response(UserReadSerializer(user).data, status=status.HTTP_201_CREATED)
        _set_auth_cookies(response, refresh.access_token, refresh)
        logger.info("Novo usuario registrado: %s", user.email)
        return response


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        response = Response(UserReadSerializer(user).data)
        _set_auth_cookies(response, refresh.access_token, refresh)
        logger.info("Login: %s", user.email)
        return response


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(settings.JWT_AUTH_COOKIE)
        response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE)
        return response


class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if not refresh_token:
            return Response({"detail": "Refresh token não encontrado."}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token
        except TokenError as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        response = Response(status=status.HTTP_200_OK)
        secure = settings.JWT_AUTH_COOKIE_SECURE
        samesite = settings.JWT_AUTH_COOKIE_SAMESITE
        response.set_cookie(
            settings.JWT_AUTH_COOKIE,
            str(access),
            httponly=True,
            secure=secure,
            samesite=samesite,
            max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        )
        return response


class ProfileView(generics.RetrieveUpdateAPIView):
    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserReadSerializer

    def get_object(self):
        return self.request.user
