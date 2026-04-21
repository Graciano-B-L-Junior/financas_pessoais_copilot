from rest_framework import serializers
from .models import Transaction, Account, Category


class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'user', 'account', 'category', 'type', 'amount', 'date', 'description', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('O valor da transação deve ser maior que zero.')
        return value

    def validate(self, data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        account = data.get('account')
        category = data.get('category')
        txn_type = data.get('type')

        errors = {}

        if account and user and account.user_id != user.id:
            errors['account'] = 'A conta selecionada não pertence ao usuário.'

        if category:
            if user and category.user_id != user.id:
                errors['category'] = 'A categoria selecionada não pertence ao usuário.'
            if txn_type and category.type != txn_type:
                errors['category'] = 'O tipo da transação deve corresponder ao tipo da categoria.'

        if errors:
            raise serializers.ValidationError(errors)

        return data


class AccountSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Account
        fields = ['id', 'user', 'name', 'balance', 'currency', 'created_at']
        read_only_fields = ['id', 'user', 'balance', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'user', 'name', 'type', 'color']
        read_only_fields = ['id', 'user']
