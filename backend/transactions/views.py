from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.db.models import Sum
from django.http import HttpResponse
from datetime import datetime, date, timedelta

from .models import Category, Transaction, RecurringTransaction
from .serializers import (
    CategorySerializer,
    TransactionSerializer,
    RecurringTransactionSerializer,
)
from .filters import TransactionFilter
from .importers import import_from_xlsx, generate_template


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name']

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = TransactionFilter
    search_fields = ['description']
    ordering_fields = ['date', 'amount', 'created_at']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecurringTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ImportTransactionsView(APIView):
    """POST /api/v1/transactions/import/ — importa planilha xlsx."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "Nenhum arquivo enviado. Use o campo 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filename = file_obj.name or "planilha.xlsx"
        if not filename.lower().endswith((".xlsx", ".xlsm")):
            return Response(
                {"detail": "Formato inválido. Envie um arquivo .xlsx."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            count, errors = import_from_xlsx(file_obj, filename, request.user)
        except Exception as exc:
            return Response(
                {"detail": f"Erro ao processar a planilha: {exc}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response(
            {
                "created": count,
                "errors": errors,
                "message": (
                    f"{count} lançamento(s) importado(s) com sucesso."
                    if count
                    else "Nenhum lançamento encontrado na planilha."
                ),
            },
            status=status.HTTP_201_CREATED if count else status.HTTP_200_OK,
        )


class DownloadTemplateView(APIView):
    """GET /api/v1/transactions/template/ — baixa a planilha modelo."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        year_param = request.query_params.get("year")
        year = None
        if year_param:
            try:
                year = int(year_param)
            except ValueError:
                pass

        try:
            content = generate_template(year=year)
        except Exception as exc:
            return Response(
                {"detail": f"Erro ao gerar o template: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        year_label = year or date.today().year
        filename = f"template_gastos_{year_label}.xlsx"
        response = HttpResponse(
            content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

