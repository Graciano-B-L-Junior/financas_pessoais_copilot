from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """Autentica usando o token JWT armazenado em cookie HttpOnly."""

    def authenticate(self, request):
        cookie_name = settings.JWT_AUTH_COOKIE
        raw_token = request.COOKIES.get(cookie_name)
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError:
            return None
        return self.get_user(validated_token), validated_token
