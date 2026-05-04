from rest_framework import serializers

from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Transaction
        fields = (
            "id",
            "category",
            "category_name",
            "description",
            "amount",
            "type",
            "date",
            "is_recurring",
            "frequency",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("O valor deve ser maior que zero.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        category = attrs.get("category", getattr(self.instance, "category", None))
        tx_type = attrs.get("type", getattr(self.instance, "type", None))
        is_recurring = attrs.get("is_recurring", getattr(self.instance, "is_recurring", False))
        frequency = attrs.get("frequency", getattr(self.instance, "frequency", ""))

        if category.user_id != user.id or not category.is_active:
            raise serializers.ValidationError({"category": ["Categoria invalida ou inativa."]})
        if category.type != tx_type:
            raise serializers.ValidationError({"type": ["Tipo incompativel com a categoria."]})
        if is_recurring and not frequency:
            raise serializers.ValidationError({"frequency": ["Campo obrigatorio para lancamento recorrente."]})
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)