from django.db.models import Prefetch
from django.utils.dateparse import parse_date
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import Budget, BudgetCategory
from .serializers import BudgetDetailSerializer, BudgetListSerializer


class BudgetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class BudgetViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = BudgetPagination

    def get_queryset(self):
        queryset = Budget.objects.select_related("user").prefetch_related(
            Prefetch("categories", queryset=BudgetCategory.objects.select_related("category")),
        ).filter(user=self.request.user)

        month = self.request.query_params.get("month")
        status_param = self.request.query_params.get("status")

        if month:
            month_date = parse_date(f"{month}-01") if len(month) == 7 else parse_date(month)
            if month_date:
                queryset = queryset.filter(month__year=month_date.year, month__month=month_date.month)
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by("-month", "-created_at")

    @action(detail=False, methods=["get"])
    def months(self, request):
        months = list(
            Budget.objects.filter(user=request.user)
            .order_by("-month")
            .values_list("month", flat=True)
            .distinct()
        )
        return Response(
            {
                "status": 200,
                "status_text": "OK",
                "data": [month.strftime("%Y-%m") for month in months],
            }
        )

    def get_serializer_class(self):
        if self.action == "list":
            return BudgetListSerializer
        return BudgetDetailSerializer

    @action(detail=True, methods=["get"])
    def execution(self, request, pk=None):
        budget = self.get_object()
        execution = budget.calculate_execution(persist=True)
        return Response({"status": 200, "status_text": "OK", "data": execution})

    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):
        budget = self.get_object()
        execution = budget.calculate_execution(persist=True)
        budget.status = Budget.STATUS_INACTIVE
        budget.save(update_fields=["status", "updated_at"])
        return Response(
            {
                "status": 200,
                "status_text": "OK",
                "message": "Orçamento finalizado com sucesso",
                "data": {
                    "id": budget.id,
                    "status": budget.status,
                    "final_execution": execution,
                },
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        budget = self.get_object()
        if budget.status == Budget.STATUS_ACTIVE:
            return Response(
                {
                    "status": 400,
                    "status_text": "Bad Request",
                    "message": "Finalize ou arquive o orçamento antes de excluir.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)