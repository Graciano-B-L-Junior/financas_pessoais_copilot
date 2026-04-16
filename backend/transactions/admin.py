from django.contrib import admin

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("description", "type", "amount", "date", "user", "is_recurring")
    list_filter = ("type", "is_recurring", "frequency")
    search_fields = ("description", "user__email")
    date_hierarchy = "date"
