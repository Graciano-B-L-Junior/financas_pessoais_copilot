from rest_framework import routers
from django.urls import path, include
from .views import (
    CategoryViewSet,
    TransactionViewSet,
    RecurringTransactionViewSet,
    ImportTransactionsView,
    DownloadTemplateView,
)

router = routers.DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'recurrings', RecurringTransactionViewSet, basename='recurring')

urlpatterns = [
    path('transactions/import/', ImportTransactionsView.as_view(), name='transactions-import'),
    path('transactions/template/', DownloadTemplateView.as_view(), name='transactions-template'),
    path('', include(router.urls)),
]

