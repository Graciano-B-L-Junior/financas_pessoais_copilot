from rest_framework import serializers

from categories.models import Category

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Transaction
        fields = (
            "id",
            "category",
            "category_name",
            "amount",
            "description",
            "date",
            "type",
            "is_recurring",
            "frequency",
            "start_date",
            "end_date",
            "parent_transaction",
            "created_at",
        )
        read_only_fields = ("id", "created_at", "category_name")

    def validate_category(self, value):
        request = self.context["request"]
        if value.user != request.user:
            raise serializers.ValidationError("Categoria inválida.")
        return value

    def validate(self, attrs):
        if attrs.get("is_recurring") and not attrs.get("frequency"):
            raise serializers.ValidationError({"frequency": "Frequência obrigatória para lançamentos recorrentes."})
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
