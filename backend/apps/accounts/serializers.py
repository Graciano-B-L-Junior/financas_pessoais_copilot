import re

from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "password")

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Este email ja esta cadastrado.")
        return email

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("A senha deve ter no minimo 6 caracteres.")
        checks = [r"[A-Z]", r"[a-z]", r"\d", r"[^A-Za-z0-9]"]
        if not all(re.search(pattern, value) for pattern in checks):
            raise serializers.ValidationError("A senha deve conter maiuscula, minuscula, numero e caractere especial.")
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        return User.objects.create_user(
            username=email,
            email=email,
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            password=validated_data["password"],
        )


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("first_name", "last_name", "email")

    def validate_email(self, value):
        email = value.lower().strip()
        qs = User.objects.filter(email=email).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este email ja esta cadastrado.")
        return email


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password", "")

        self.user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if not self.user:
            raise AuthenticationFailed("Nao foi possivel autenticar com as credenciais informadas.")

        refresh = self.get_token(self.user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }