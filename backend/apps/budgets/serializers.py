from decimal import Decimal

from rest_framework import serializers

from apps.categories.models import Category

from .models import Budget, BudgetCategory


class BudgetCategorySerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(source="category", queryset=Category.objects.all())
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = BudgetCategory
        fields = (
            "id",
            "category_id",
            "category_name",
            "budgeted_amount",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "category_name", "created_at", "updated_at")

    def validate_category(self, value):
        user = self.context["request"].user
        if value.user_id != user.id or not value.is_active or value.type != Category.TYPE_EXPENSE:
            raise serializers.ValidationError("Categoria inválida para orçamento.")
        return value

    def validate_budgeted_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("O valor deve ser maior que zero.")
        return value


class BudgetListSerializer(serializers.ModelSerializer):
    month = serializers.DateField(format="%Y-%m", input_formats=["%Y-%m", "%Y-%m-%d"])

    class Meta:
        model = Budget
        fields = (
            "id",
            "month",
            "total_amount",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class BudgetDetailSerializer(BudgetListSerializer):
    categories = BudgetCategorySerializer(many=True, required=False)
    execution = serializers.SerializerMethodField()

    class Meta(BudgetListSerializer.Meta):
        fields = BudgetListSerializer.Meta.fields + ("categories", "execution")

    def get_execution(self, obj):
        return obj.calculate_execution(persist=False)

    def validate(self, attrs):
        user = self.context["request"].user
        month = attrs.get("month", getattr(self.instance, "month", None))
        categories_data = attrs.get("categories", None)
        total_amount = attrs.get("total_amount", getattr(self.instance, "total_amount", Decimal("0")))

        if month is not None:
            qs = Budget.objects.filter(user=user, month=month)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"month": ["Já existe um orçamento para este mês."]})

        if categories_data is not None:
            category_ids = [item["category"].id for item in categories_data]
            if len(category_ids) != len(set(category_ids)):
                raise serializers.ValidationError({"categories": ["Não repita a mesma categoria dentro do orçamento."]})

            categories_total = sum((item["budgeted_amount"] for item in categories_data), Decimal("0"))
            if total_amount <= 0 and categories_total <= 0:
                raise serializers.ValidationError({"total_amount": ["Informe um valor total ou categorias com valores positivos."]})

            if total_amount > 0 and categories_total > (total_amount * Decimal("1.2")):
                raise serializers.ValidationError({"categories": ["A soma das categorias não pode ultrapassar 120% do total informado."]})

        return attrs

    def _resolve_total_amount(self, validated_data):
        categories_data = validated_data.pop("categories", None)
        total_amount = validated_data.get("total_amount", Decimal("0"))

        if categories_data:
            categories_total = sum((item["budgeted_amount"] for item in categories_data), Decimal("0"))
            if total_amount <= 0:
                validated_data["total_amount"] = categories_total
            validated_data["_categories_data"] = categories_data
        elif total_amount <= 0:
            validated_data["total_amount"] = Decimal("0")

        return validated_data

    def _save_categories(self, budget, categories_data):
        budget.categories.all().delete()
        BudgetCategory.objects.bulk_create(
            [
                BudgetCategory(
                    budget=budget,
                    category=item["category"],
                    budgeted_amount=item["budgeted_amount"],
                )
                for item in categories_data
            ]
        )

    def create(self, validated_data):
        validated_data = self._resolve_total_amount(validated_data)
        categories_data = validated_data.pop("_categories_data", [])
        validated_data["user"] = self.context["request"].user
        budget = super().create(validated_data)
        if categories_data:
            self._save_categories(budget, categories_data)
        budget.calculate_execution(persist=True)
        return budget

    def update(self, instance, validated_data):
        validated_data = self._resolve_total_amount(validated_data)
        categories_data = validated_data.pop("_categories_data", None)
        budget = super().update(instance, validated_data)
        if categories_data is not None:
            self._save_categories(budget, categories_data)
        budget.calculate_execution(persist=True)
        return budget