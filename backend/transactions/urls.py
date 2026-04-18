from rest_framework import routers
from django.urls import path, include
from .views import (
    CategoryViewSet,
    TransactionViewSet,
    RecurringTransactionViewSet,
)

router = routers.DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'recurrings', RecurringTransactionViewSet, basename='recurring')

urlpatterns = [
    path('', include(router.urls)),
]

