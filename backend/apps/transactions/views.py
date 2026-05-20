import logging

from django.http import HttpResponse
from rest_framework import permissions, status, viewsets

logger = logging.getLogger(__name__)
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.categories.models import Category

from .models import Transaction
from .serializers import TransactionSerializer
from .services.spreadsheet_parser import ParseResult, generate_template, parse_xlsx
from .tasks import export_transactions_task, import_transactions_task

# Magic bytes para validação sem dependência nativa
_XLSX_MAGIC = b"PK\x03\x04"   # XLSX é um ZIP
_XLS_MAGIC = b"\xd0\xcf\x11\xe0"  # XLS legado (Compound Document)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
LARGE_FILE_THRESHOLD = 500  # linhas


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["category", "type", "is_recurring"]
    search_fields = ["description"]
    ordering_fields = ["date", "amount", "created_at"]

    def get_queryset(self):
        queryset = Transaction.objects.select_related("category").filter(user=self.request.user)
        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")
        if start:
            queryset = queryset.filter(date__gte=start)
        if end:
            queryset = queryset.filter(date__lte=end)
        return queryset


def _serialize_parse_result(result: ParseResult, user) -> dict:
    """Converte ParseResult em payload JSON para a pré-visualização no frontend."""
    # Mapear categorias conhecidas para seus IDs no banco
    existing_categories = {
        c.name.lower(): c.id
        for c in Category.objects.filter(user=user, is_active=True)
    }

    rows_out = []
    for row in result.rows:
        rows_out.append(
            {
                "row_number": row.row_number,
                "sheet": row.sheet,
                "category_name": row.category_name,
                "description": row.description,
                "day": row.day,
                "amount": str(row.amount) if row.amount is not None else None,
                "date": row.date_str,
                "errors": row.errors,
                "is_valid": row.is_valid,
                "category_exists": row.category_name.lower() in existing_categories,
            }
        )

    missing_categories = [
        cat for cat in result.categories_found
        if cat.lower() not in existing_categories
    ]

    return {
        "sheets_found": result.sheets_found,
        "categories_found": result.categories_found,
        "missing_categories": missing_categories,
        "total": len(result.rows),
        "valid_count": result.valid_count,
        "error_count": result.error_count,
        "rows": rows_out,
    }


class SpreadsheetPreviewView(APIView):
    """
    POST /api/v1/transactions/import/preview/
    Recebe o arquivo XLSX, executa o parse em memória e retorna os dados
    para pré-visualização. Nada é salvo no banco nesta etapa.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > MAX_FILE_SIZE:
            return Response(
                {"detail": "Arquivo excede o limite de 5 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar tipo por magic bytes (sem dependência nativa)
        file_bytes = file.read()
        if not (file_bytes[:4] == _XLSX_MAGIC or file_bytes[:4] == _XLS_MAGIC):
            return Response(
                {"detail": "Tipo de arquivo não permitido. Envie um arquivo .xlsx ou .xls."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        year_param = request.data.get("year")
        year = int(year_param) if year_param and str(year_param).isdigit() else None

        import io

        result = parse_xlsx(io.BytesIO(file_bytes), filename=file.name, year=year)

        if not result.rows:
            return Response(
                {"detail": "Nenhum lançamento encontrado. Verifique o formato do arquivo."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response(_serialize_parse_result(result, request.user), status=status.HTTP_200_OK)


class SpreadsheetConfirmView(APIView):
    """
    POST /api/v1/transactions/import/confirm/
    Recebe o payload validado do preview e salva no banco.
    Para arquivos grandes (> LARGE_FILE_THRESHOLD linhas), delega ao Celery.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        rows = request.data.get("rows", [])
        category_map_input = request.data.get("category_map", {})  # {name: id}

        if not rows:
            return Response({"detail": "Nenhum dado para importar."}, status=status.HTTP_400_BAD_REQUEST)

        # Filtrar apenas linhas válidas: sem erros e com categoria existente
        valid_rows = [r for r in rows if not r.get("errors") and r.get("category_exists", True)]

        if not valid_rows:
            return Response(
                {"detail": "Nenhuma linha válida para importar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Construir mapa de categorias: aceitar o informado pelo frontend ou resolver pelo banco
        existing_categories = {
            c.name.lower(): c.id
            for c in Category.objects.filter(user=request.user, is_active=True)
        }
        category_map = {
            name: int(cat_id) for name, cat_id in category_map_input.items()
        }
        # Complementar com os existentes no banco
        for row in valid_rows:
            cat_name = row.get("category_name", "")
            if cat_name not in category_map:
                resolved = existing_categories.get(cat_name.lower())
                if resolved:
                    category_map[cat_name] = resolved

        payload_rows = [
            {
                "description": r["description"],
                "date_str": r["date"],
                "amount": r["amount"],
                "category_name": r["category_name"],
            }
            for r in valid_rows
        ]

        if len(valid_rows) > LARGE_FILE_THRESHOLD:
            try:
                from kombu.exceptions import OperationalError as BrokerError
                task = import_transactions_task.delay(request.user.pk, payload_rows, category_map)
                return Response(
                    {"task_id": task.id, "queued": len(valid_rows)},
                    status=status.HTTP_202_ACCEPTED,
                )
            except BrokerError:
                logger.warning(
                    "Broker Celery indisponível — processando %d linhas de forma síncrona.",
                    len(valid_rows),
                )

        # Importação síncrona: arquivos pequenos ou fallback quando broker está fora
        result = import_transactions_task(request.user.pk, payload_rows, category_map)
        return Response({"created": result["created"], "skipped": result["skipped"]}, status=status.HTTP_201_CREATED)


class SpreadsheetExportView(APIView):
    """
    GET /api/v1/transactions/export/?year=2024
    Gera e retorna o XLSX com os lançamentos do banco organizados no formato legado.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year_param = request.query_params.get("year")
        if not year_param or not year_param.isdigit():
            return Response({"detail": "Informe o parâmetro 'year'."}, status=status.HTTP_400_BAD_REQUEST)

        year = int(year_param)
        xlsx_bytes = export_transactions_task(request.user.pk, year)

        response = HttpResponse(
            xlsx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="gastos_{year}.xlsx"'
        return response


class SpreadsheetTemplateView(APIView):
    """
    GET /api/v1/transactions/template/
    Retorna um XLSX vazio no formato legado com as categorias ativas do usuário.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_categories = list(
            Category.objects.filter(user=request.user, is_active=True).values_list("name", flat=True)
        )
        xlsx_bytes = generate_template(categories=user_categories or None)

        response = HttpResponse(
            xlsx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="template_gastos.xlsx"'
        return response