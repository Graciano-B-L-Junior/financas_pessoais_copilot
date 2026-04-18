from rest_framework import serializers
from .models import Category, Transaction, RecurringTransaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class TransactionSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)
    category_detail = CategorySerializer(source='category', read_only=True)
    user = serializers.ReadOnlyField(source='user.id')

    class Meta:
        model = Transaction
        fields = ['id', 'user', 'category', 'category_detail', 'amount', 'date', 'description', 'created_at']
        read_only_fields = ['user', 'created_at']


class RecurringTransactionSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)
    user = serializers.ReadOnlyField(source='user.id')

    class Meta:
        model = RecurringTransaction
        fields = ['id', 'user', 'category', 'amount', 'start_date', 'next_date', 'frequency', 'active', 'description', 'created_at']
        read_only_fields = ['user', 'created_at']
