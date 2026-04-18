from django.contrib import admin
from .models import Category, Transaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'date', 'category')

from .models import RecurringTransaction


@admin.register(RecurringTransaction)
class RecurringTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'frequency', 'next_date', 'active')
