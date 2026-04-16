from django.db import models


class Category(models.Model):
    class TransactionType(models.TextChoices):
        INCOME = "INCOME", "Receita"
        EXPENSE = "EXPENSE", "Despesa"

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    color = models.CharField(max_length=7, default="#6366f1", help_text="Cor hexadecimal, ex: #6366f1")
    icon = models.CharField(max_length=50, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "categoria"
        verbose_name_plural = "categorias"
        ordering = ["name"]
        unique_together = [("user", "name", "type")]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
