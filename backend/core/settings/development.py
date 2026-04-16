from decouple import config

from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Desabilita HTTPS-only para dev
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
JWT_AUTH_COOKIE_SECURE = False
