from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from api.apps.transactions.views import TransactionViewSet, AccountViewSet, CategoryViewSet
from api.views import DashboardView


def health(request):
    return JsonResponse({'status': 'ok'})


router = routers.DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'accounts', AccountViewSet, basename='accounts')
router.register(r'categories', CategoryViewSet, basename='categories')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health),
    path('api/v1/auth/login/',   TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),
    path('api/v1/auth/logout/',  TokenBlacklistView.as_view(),   name='token_blacklist'),
    path('api/v1/dashboard/',    DashboardView.as_view(),        name='dashboard'),
    path('api/v1/', include((router.urls, 'api'), namespace='v1')),
]

