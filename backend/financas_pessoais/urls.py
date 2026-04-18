from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import os


def health(request):
    from django.db import connections
    db_ok = True
    try:
        connections['default'].cursor()
    except Exception:
        db_ok = False

    redis_ok = False
    redis_url = os.getenv('REDIS_URL', 'redis://redis:6379/0')
    try:
        import redis as redis_lib
        r = redis_lib.from_url(redis_url)
        r.ping()
        redis_ok = True
    except Exception:
        redis_ok = False

    status = 200 if db_ok and redis_ok else 500
    return JsonResponse({'db': db_ok, 'redis': redis_ok}, status=status)


api_v1 = [
    path('auth/', include('authentication.urls')),
    path('', include('transactions.urls')),
    path('', include('accounts.urls')),
    path('', include('analytics.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1)),
    path('health/', health),
]
