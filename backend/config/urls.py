from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import LogoutView, ProfileView, RegisterView
from apps.accounts.views import CookieTokenObtainPairView, CookieTokenRefreshView
from apps.analytics.views import DashboardView, ProfileAnalyticsView, CategorySeriesView, CategoryMonthsView
from apps.budgets.views import BudgetViewSet
from apps.categories.views import CategoryViewSet
from apps.transactions.views import (
    TransactionViewSet,
    SpreadsheetPreviewView,
    SpreadsheetConfirmView,
    SpreadsheetExportView,
    SpreadsheetTemplateView,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("budgets", BudgetViewSet, basename="budget")
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", lambda request: JsonResponse({"status": "ok"}), name="health"),
    path("api/v1/auth/register/", RegisterView.as_view(), name="register"),
    path("api/v1/auth/login/", CookieTokenObtainPairView.as_view(), name="login"),
    path("api/v1/auth/refresh/", CookieTokenRefreshView.as_view(), name="refresh"),
    path("api/v1/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/v1/profile/", ProfileView.as_view(), name="profile"),
    path("api/v1/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/v1/dashboard/category-series/", CategorySeriesView.as_view(), name="category-series"),
    path("api/v1/dashboard/category-months/", CategoryMonthsView.as_view(), name="category-months"),
    path("api/v1/analytics/profile/", ProfileAnalyticsView.as_view(), name="profile-analytics"),
    path("api/v1/", include(router.urls)),
    path("api/v1/transactions/import/preview/", SpreadsheetPreviewView.as_view(), name="spreadsheet-preview"),
    path("api/v1/transactions/import/confirm/", SpreadsheetConfirmView.as_view(), name="spreadsheet-confirm"),
    path("api/v1/transactions/export/", SpreadsheetExportView.as_view(), name="spreadsheet-export"),
    path("api/v1/transactions/template/", SpreadsheetTemplateView.as_view(), name="spreadsheet-template"),
]