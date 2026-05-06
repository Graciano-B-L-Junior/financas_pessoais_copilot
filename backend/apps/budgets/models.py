from calendar import monthrange
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Sum
from django.utils import timezone

from apps.categories.models import Category
from apps.transactions.models import Transaction


def json_safe(value):
    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}

    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]

    if hasattr(value, "isoformat") and callable(value.isoformat):
        return value.isoformat()

    return value


class Budget(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = (
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_ARCHIVED, "Archived"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="budgets")
    month = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "month"], name="unique_budget_per_user_month"),
        ]
        ordering = ["-month", "-created_at"]

    def __str__(self):
        return f"{self.user_id} - {self.month:%Y-%m}"

    def month_bounds(self):
        start = self.month.replace(day=1)
        last_day = monthrange(self.month.year, self.month.month)[1]
        end = self.month.replace(day=last_day)
        return start, end

    def effective_total_amount(self):
        if self.total_amount and self.total_amount > 0:
            return self.total_amount

        return self.categories.aggregate(total=Sum("budgeted_amount"))["total"] or Decimal("0")

    def calculate_execution(self, persist=False):
        month_start, month_end = self.month_bounds()
        expense_queryset = Transaction.objects.filter(
            user=self.user,
            type=Category.TYPE_EXPENSE,
            is_active=True,
            date__range=(month_start, month_end),
        ).select_related("category")

        actual_expenses = expense_queryset.aggregate(total=Sum("amount"))["total"] or Decimal("0")
        category_totals = {
            item["category_id"]: item["total"] or Decimal("0")
            for item in expense_queryset.values("category_id").annotate(total=Sum("amount"))
        }

        category_executions = []
        category_alerts = []
        threshold_rules = [
            (100, "exceeded", "Orcamento de {name} ultrapassado"),
            (90, "warning", "90% do orçamento de {name} foi utilizado"),
            (75, "threshold_reached", "75% do orçamento de {name} foi utilizado"),
        ]

        for budget_category in self.categories.select_related("category").all():
            budgeted_amount = budget_category.budgeted_amount or Decimal("0")
            actual_amount = category_totals.get(budget_category.category_id, Decimal("0"))
            execution_percentage = float((actual_amount / budgeted_amount) * 100) if budgeted_amount else 0.0
            remaining_amount = budgeted_amount - actual_amount
            exceeded = actual_amount > budgeted_amount

            alert_payload = None
            for threshold, alert_type, message_template in threshold_rules:
                if execution_percentage >= threshold:
                    alert_payload = {
                        "type": alert_type,
                        "threshold_percentage": threshold,
                        "message": message_template.format(name=budget_category.category.name),
                    }
                    category_alerts.append(
                        {
                            "category": budget_category.category,
                            **alert_payload,
                        }
                    )
                    break

            category_executions.append(
                {
                    "category_id": budget_category.category_id,
                    "category_name": budget_category.category.name,
                    "budgeted_amount": budgeted_amount,
                    "actual_expenses": actual_amount,
                    "execution_percentage": round(execution_percentage, 2),
                    "remaining_amount": remaining_amount,
                    "exceeded": exceeded,
                    "alert": alert_payload,
                }
            )

        budgeted_total = self.effective_total_amount()
        execution_percentage = float((actual_expenses / budgeted_total) * 100) if budgeted_total else 0.0
        remaining_amount = budgeted_total - actual_expenses
        exceeded = actual_expenses > budgeted_total

        if persist:
            BudgetAlert.objects.filter(budget=self).delete()

        alerts = []
        for threshold, alert_type, message_template in threshold_rules:
            if execution_percentage >= threshold:
                alert_payload = {
                    "type": alert_type,
                    "threshold_percentage": threshold,
                    "message": message_template.format(name=f"{self.month:%Y-%m}"),
                }
                alerts.append(alert_payload)
                if persist:
                    BudgetAlert.objects.update_or_create(
                        budget=self,
                        category=None,
                        alert_type=alert_type,
                        threshold_percentage=threshold,
                        defaults={"message": alert_payload["message"]},
                    )

        if persist:
            for category_alert in category_alerts:
                BudgetAlert.objects.update_or_create(
                    budget=self,
                    category=category_alert["category"],
                    alert_type=category_alert["type"],
                    threshold_percentage=category_alert["threshold_percentage"],
                    defaults={"message": category_alert["message"]},
                )

            BudgetExecution.objects.update_or_create(
                budget=self,
                defaults={
                    "actual_expenses": actual_expenses,
                    "category_executions": json_safe(category_executions),
                    "execution_percentage": round(execution_percentage, 2),
                    "exceeded": exceeded,
                    "remaining_amount": remaining_amount,
                },
            )

        return {
            "budget_id": self.id,
            "month": self.month.strftime("%Y-%m"),
            "budgeted_total": budgeted_total,
            "actual_expenses": actual_expenses,
            "execution_percentage": round(execution_percentage, 2),
            "remaining_amount": remaining_amount,
            "exceeded": exceeded,
            "categories": category_executions,
            "alerts": alerts,
            "calculated_at": timezone.now().isoformat(),
        }


class BudgetCategory(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name="categories")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="budget_allocations")
    budgeted_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["budget", "category"], name="unique_budget_category"),
        ]
        ordering = ["category__name"]

    def __str__(self):
        return f"{self.budget_id} - {self.category_id}"


class BudgetExecution(models.Model):
    budget = models.OneToOneField(Budget, on_delete=models.CASCADE, related_name="execution_record")
    actual_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    execution_percentage = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    exceeded = models.BooleanField(default=False)
    category_executions = models.JSONField(default=list, blank=True)
    calculated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Execution {self.budget_id}"


class BudgetAlert(models.Model):
    ALERT_THRESHOLD_REACHED = "threshold_reached"
    ALERT_WARNING = "warning"
    ALERT_EXCEEDED = "exceeded"
    ALERT_CHOICES = (
        (ALERT_THRESHOLD_REACHED, "Threshold reached"),
        (ALERT_WARNING, "Warning"),
        (ALERT_EXCEEDED, "Exceeded"),
    )

    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name="alerts")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="budget_alerts", null=True, blank=True)
    alert_type = models.CharField(max_length=30, choices=ALERT_CHOICES)
    threshold_percentage = models.PositiveSmallIntegerField()
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["budget", "category", "alert_type", "threshold_percentage"],
                name="unique_budget_alert",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return self.message