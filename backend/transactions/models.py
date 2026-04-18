from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Transaction(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} {self.amount}"


class RecurringTransaction(models.Model):
    FREQUENCY_DAILY = 'daily'
    FREQUENCY_WEEKLY = 'weekly'
    FREQUENCY_MONTHLY = 'monthly'
    FREQUENCY_CHOICES = [
        (FREQUENCY_DAILY, 'Diário'),
        (FREQUENCY_WEEKLY, 'Semanal'),
        (FREQUENCY_MONTHLY, 'Mensal'),
    ]

    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    next_date = models.DateField(null=True, blank=True)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
    active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} {self.amount} {self.frequency}"
