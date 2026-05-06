# Generated manually for SPEC-007.

from decimal import Decimal

import django.core.validators
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("categories", "0001_initial"),
        ("transactions", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Budget",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("month", models.DateField()),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("status", models.CharField(choices=[("active", "Active"), ("inactive", "Inactive"), ("archived", "Archived")], default="active", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="budgets", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-month", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="BudgetExecution",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("actual_expenses", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("execution_percentage", models.DecimalField(decimal_places=2, default=0, max_digits=7)),
                ("remaining_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("exceeded", models.BooleanField(default=False)),
                ("category_executions", models.JSONField(blank=True, default=list)),
                ("calculated_at", models.DateTimeField(auto_now=True)),
                ("budget", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="execution_record", to="budgets.budget")),
            ],
        ),
        migrations.CreateModel(
            name="BudgetAlert",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("alert_type", models.CharField(choices=[("threshold_reached", "Threshold reached"), ("warning", "Warning"), ("exceeded", "Exceeded")], max_length=30)),
                ("threshold_percentage", models.PositiveSmallIntegerField()),
                ("message", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("budget", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="alerts", to="budgets.budget")),
                ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="budget_alerts", to="categories.category")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="BudgetCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("budgeted_amount", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal("0.01"))])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("budget", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="categories", to="budgets.budget")),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="budget_allocations", to="categories.category")),
            ],
            options={
                "ordering": ["category__name"],
            },
        ),
        migrations.AddConstraint(
            model_name="budget",
            constraint=models.UniqueConstraint(fields=("user", "month"), name="unique_budget_per_user_month"),
        ),
        migrations.AddConstraint(
            model_name="budgetcategory",
            constraint=models.UniqueConstraint(fields=("budget", "category"), name="unique_budget_category"),
        ),
        migrations.AddConstraint(
            model_name="budgetalert",
            constraint=models.UniqueConstraint(fields=("budget", "category", "alert_type", "threshold_percentage"), name="unique_budget_alert"),
        ),
    ]