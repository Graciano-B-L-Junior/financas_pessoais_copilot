from django.conf import settings
from django.db import models


class Category(models.Model):
    TYPE_INCOME = "receita"
    TYPE_EXPENSE = "despesa"
    TYPE_CHOICES = ((TYPE_INCOME, "Receita"), (TYPE_EXPENSE, "Despesa"))

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "name", "type"], name="unique_category_per_user_type"),
        ]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.type})"