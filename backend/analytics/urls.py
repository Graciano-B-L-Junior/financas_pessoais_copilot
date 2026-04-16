from django.urls import path

from .views import AnalyticsProfileView, DashboardView

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="analytics-dashboard"),
    path("profile/", AnalyticsProfileView.as_view(), name="analytics-profile"),
]
