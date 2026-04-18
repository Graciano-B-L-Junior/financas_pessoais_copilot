from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from datetime import datetime, date, timedelta

from .models import Category, Transaction, RecurringTransaction
from .serializers import (
    CategorySerializer,
    TransactionSerializer,
    RecurringTransactionSerializer,
)
from .filters import TransactionFilter


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name']

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = TransactionFilter
    search_fields = ['description']
    ordering_fields = ['date', 'amount', 'created_at']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecurringTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

