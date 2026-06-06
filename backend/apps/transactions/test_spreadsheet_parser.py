import io
from decimal import Decimal

import openpyxl

from apps.transactions.services.spreadsheet_parser import parse_xlsx


def _build_income_summary_workbook(values):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Gastos e acompanhamentos"
    ws.append(["Gastos e acompanhamento 2018"])
    for _ in range(8):
        ws.append([])
    ws.append(["", *values])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def test_parse_xlsx_imports_revenue_from_summary_sheet():
    values = [
        1000,
        0,
        -500,
        "abc",
        Decimal("200.75"),
        None,
        1500,
        0,
        50,
        "",
        1234.56,
        999,
    ]
    workbook = _build_income_summary_workbook(values)

    result = parse_xlsx(workbook, filename="Gastos Mensais 2018.xlsx")

    assert result.sheets_found == ["Gastos e acompanhamentos"]
    assert result.categories_found == ["Receita"]
    assert len(result.rows) == 10

    january = next(r for r in result.rows if r.date_str == "2018-01-01")
    assert january.amount == Decimal("1000.00")
    assert january.description == "Receita mensal"
    assert january.category_name == "Receita"
    assert january.errors == []

    march = next(r for r in result.rows if r.date_str == "2018-03-01")
    assert march.amount == Decimal("-500.00")
    assert "Valor negativo" in march.errors[0]

    april = next(r for r in result.rows if r.date_str == "2018-04-01")
    assert april.amount is None
    assert april.errors == ["Valor ausente ou não-numérico."]

    may = next(r for r in result.rows if r.date_str == "2018-05-01")
    assert may.amount == Decimal("200.75")
    assert may.errors == []
    assert january.type == "receita"


def _build_expense_month_workbook(category_name: str, description: str, day: int, amount: Decimal):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Gastos Janeiro"
    ws.append(["Janeiro"])
    ws.append([])
    ws.append([])
    ws.append([category_name, "", ""])
    ws.append(["Observação", "dia", "R$"])
    ws.append([description, day, amount])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def test_parse_xlsx_imports_expense_rows_as_despesa():
    workbook = _build_expense_month_workbook("Mercado", "Supermercado", 15, Decimal("120.00"))

    result = parse_xlsx(workbook, filename="Gastos Mensais 2018.xlsx")

    assert result.sheets_found == ["Gastos Janeiro"]
    assert result.categories_found == ["Mercado"]
    assert len(result.rows) == 1

    row = result.rows[0]
    assert row.category_name == "Mercado"
    assert row.type == "despesa"
    assert row.description == "Supermercado"
    assert row.date_str == "2018-01-15"
    assert row.amount == Decimal("120.00")
    assert row.errors == []
