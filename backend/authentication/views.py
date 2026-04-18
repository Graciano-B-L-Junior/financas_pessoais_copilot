from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.models import User


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'detail': 'E-mail e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Credenciais inválidas.'}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=user_obj.username, password=password)
        if user is None:
            return Response({'detail': 'Credenciais inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        response = Response({'detail': 'ok'})
        response.set_cookie('access', str(refresh.access_token), httponly=True, samesite='Lax')
        response.set_cookie('refresh', str(refresh), httponly=True, samesite='Lax')
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Sem refresh token.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)
            response = Response({'detail': 'ok'})
            response.set_cookie('access', new_access, httponly=True, samesite='Lax')
            response.set_cookie('refresh', str(refresh), httponly=True, samesite='Lax')
            return response
        except TokenError:
            return Response({'detail': 'Refresh token inválido.'}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass
        response = Response({'detail': 'logout efetuado'})
        response.delete_cookie('access')
        response.delete_cookie('refresh')
        return response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        if not username or not password or not email:
            return Response(
                {'detail': 'username, email e password são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'E-mail já cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'detail': 'Usuário já existe.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        refresh = RefreshToken.for_user(user)
        response = Response({'detail': 'Conta criada.'}, status=status.HTTP_201_CREATED)
        response.set_cookie('access', str(refresh.access_token), httponly=True, samesite='Lax')
        response.set_cookie('refresh', str(refresh), httponly=True, samesite='Lax')
        return response
