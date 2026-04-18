from django.urls import path
from .views import DashboardView, BehaviorView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('analytics/behavior/', BehaviorView.as_view(), name='analytics-behavior'),
]
