from decimal import Decimal
from django.db import models, transaction
from django.conf import settings
from django.core.exceptions import ValidationError


class Account(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='BRL')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} ({self.user})'


class Category(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=(('income', 'Income'), ('expense', 'Expense')))
    color = models.CharField(max_length=7, blank=True, null=True)

    def __str__(self):
        return self.name


class Transaction(models.Model):
    TYPE_INCOME = 'income'
    TYPE_EXPENSE = 'expense'
    TYPE_CHOICES = (
        (TYPE_INCOME, 'Income'),
        (TYPE_EXPENSE, 'Expense'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Transaction({self.type} {self.amount} - {self.user})'

    def clean(self):
        errors = {}

        # amount must be positive
        try:
            amt = Decimal(self.amount)
        except Exception:
            errors['amount'] = 'Valor inválido.'
        else:
            if amt <= 0:
                errors['amount'] = 'O valor da transação deve ser maior que zero.'

        # account and user consistency
        if self.account and self.account.user_id != self.user_id:
            errors['account'] = 'A conta selecionada não pertence ao usuário.'

        # category user and type consistency
        if self.category:
            if self.category.user_id != self.user_id:
                errors['category'] = 'A categoria selecionada não pertence ao usuário.'
            if self.category.type != self.type:
                errors['category'] = 'O tipo da transação deve corresponder ao tipo da categoria.'

        if errors:
            raise ValidationError(errors)

    def _apply_effect(self, account_obj, txn_type, amount):
        # Apply effect of a transaction on account balance
        if txn_type == self.TYPE_INCOME:
            account_obj.balance = Decimal(account_obj.balance) + Decimal(amount)
        else:
            account_obj.balance = Decimal(account_obj.balance) - Decimal(amount)

    def save(self, *args, **kwargs):
        # Ensure validation and consistent balance updates (atomic)
        with transaction.atomic():
            self.full_clean()

            # Determine if update or create
            if self.pk:
                old = Transaction.objects.select_for_update().get(pk=self.pk)
            else:
                old = None

            # If account changed on update, lock both accounts
            if old:
                old_account = Account.objects.select_for_update().get(pk=old.account_id)
            else:
                old_account = None

            new_account = Account.objects.select_for_update().get(pk=self.account_id)

            # Revert old effect if updating
            if old:
                # If account changed, revert on old_account; otherwise revert on new_account first
                if old.account_id != self.account_id:
                    self._apply_effect(old_account, old.type, -old.amount)  # inverse
                    old_account.save()
                else:
                    # inverse effect on same account
                    # inverse: subtract income, add expense
                    if old.type == self.TYPE_INCOME:
                        new_account.balance = Decimal(new_account.balance) - Decimal(old.amount)
                    else:
                        new_account.balance = Decimal(new_account.balance) + Decimal(old.amount)
                    new_account.save()

            # Apply new effect on target account
            if self.type == self.TYPE_INCOME:
                new_account.balance = Decimal(new_account.balance) + Decimal(self.amount)
            else:
                new_account.balance = Decimal(new_account.balance) - Decimal(self.amount)
            new_account.save()

            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # On delete, revert effect
        with transaction.atomic():
            acc = Account.objects.select_for_update().get(pk=self.account_id)
            if self.type == self.TYPE_INCOME:
                acc.balance = Decimal(acc.balance) - Decimal(self.amount)
            else:
                acc.balance = Decimal(acc.balance) + Decimal(self.amount)
            acc.save()
            super().delete(*args, **kwargs)
