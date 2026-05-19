"""
Parser para importação de planilhas XLSX no formato legado.

Estrutura esperada:
- Aba "Gastos e acompanhamentos" (ignorada)
- Abas mensais: "Gastos Janeiro", "Gastos Fevereiro", ..., "Gastos Dezembro"
  - Linha 1: nome do mês
  - Linha 4+: blocos de tabelas de categorias espalhados horizontalmente
    - Âncora de tabela: linha com colunas "Observação", "dia", "R$"
    - Nome da categoria: 1 ou 2 linhas ACIMA da âncora na mesma coluna
    - Linhas de dados seguem abaixo da âncora, parando na primeira linha vazia
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from typing import IO

import openpyxl

MONTH_MAP: dict[str, int] = {
    "janeiro": 1,
    "fevereiro": 2,
    "março": 3,
    "marco": 3,
    "abril": 4,
    "maio": 5,
    "junho": 6,
    "julho": 7,
    "agosto": 8,
    "setembro": 9,
    "outubro": 10,
    "novembro": 11,
    "dezembro": 12,
}

# Nomes que NÃO devem ser usados como categoria
_IGNORE_LABELS = frozenset(
    [
        "observação",
        "observacao",
        "dia",
        "r$",
        "none",
        "",
        *MONTH_MAP.keys(),
        *[m.capitalize() for m in MONTH_MAP.keys()],
        *["gastos e acompanhamentos", "gastos e acompanhamento 2018"],
    ]
)

SCAN_MIN_ROW = 3
SCAN_MAX_ROW = 160


@dataclass
class ImportRow:
    row_number: int
    sheet: str
    category_name: str
    description: str
    day: int | None
    amount: Decimal | None
    # campos construídos / validados
    date_str: str | None = None  # ISO "YYYY-MM-DD"
    errors: list[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0


@dataclass
class ParseResult:
    rows: list[ImportRow] = field(default_factory=list)
    sheets_found: list[str] = field(default_factory=list)
    categories_found: list[str] = field(default_factory=list)

    @property
    def valid_count(self) -> int:
        return sum(1 for r in self.rows if r.is_valid)

    @property
    def error_count(self) -> int:
        return sum(1 for r in self.rows if not r.is_valid)


def _normalize(value: object) -> str:
    return str(value).strip().lower() if value is not None else ""


def _is_anchor_row(row: tuple) -> bool:
    """Retorna True se a linha contém 'Observação', 'dia' e 'R$' (âncoras da tabela)."""
    normalized = [_normalize(c) for c in row if c is not None]
    return "observação" in normalized and "dia" in normalized and "r$" in normalized


def _find_category(ws, anchor_row_idx: int, anchor_col_idx: int) -> str | None:
    """Procura o nome da categoria nas 2 linhas acima da âncora, na mesma coluna (base-1)."""
    for delta in (1, 2):
        target_row = anchor_row_idx - delta
        if target_row < 1:
            continue
        val = ws.cell(row=target_row, column=anchor_col_idx).value
        if val is not None and _normalize(val) not in _IGNORE_LABELS:
            return str(val).strip()
    return None


def _parse_day(value: object) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        pass
    # Aceita objetos datetime vindos diretamente da célula
    if hasattr(value, "day"):
        return int(value.day)
    return None


def _parse_amount(value: object) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except InvalidOperation:
        return None


def _build_date(year: int, month_number: int, day: int | None) -> tuple[str | None, list[str]]:
    errors: list[str] = []
    if day is None:
        errors.append("Dia ausente ou inválido.")
        return None, errors
    try:
        import datetime

        dt = datetime.date(year, month_number, day)
        return dt.isoformat(), errors
    except ValueError:
        errors.append(f"Data inválida: dia {day} para o mês {month_number}/{year}.")
        return None, errors


def _infer_year_from_filename(filename: str) -> int | None:
    match = re.search(r"\b(20\d{2})\b", filename)
    if match:
        return int(match.group(1))
    return None


def parse_xlsx(file: IO[bytes], filename: str = "", year: int | None = None) -> ParseResult:
    """
    Lê um arquivo XLSX no formato legado e retorna um ParseResult com todas as linhas extraídas,
    cada uma já com validações aplicadas. Nenhum dado é gravado no banco nesta etapa.
    """
    result = ParseResult()
    all_categories: set[str] = set()

    if year is None:
        year = _infer_year_from_filename(filename)
    if year is None:
        year = 2018  # fallback explícito para retrocompatibilidade

    wb = openpyxl.load_workbook(file, data_only=True, read_only=True)

    for sheet_name in wb.sheetnames:
        # Ignorar aba consolidadora
        if _normalize(sheet_name) in ("gastos e acompanhamentos",):
            continue

        # Inferir mês a partir do nome da aba (ex: "Gastos Abril" → abril → 4)
        month_number: int | None = None
        for token in sheet_name.split():
            token_norm = _normalize(token)
            if token_norm in MONTH_MAP:
                month_number = MONTH_MAP[token_norm]
                break
        if month_number is None:
            continue  # Aba desconhecida, pular

        result.sheets_found.append(sheet_name)

        # Materializar apenas as linhas necessárias (read_only sheet)
        rows_data: dict[int, list] = {}
        for row_idx, row in enumerate(
            wb[sheet_name].iter_rows(
                min_row=SCAN_MIN_ROW, max_row=SCAN_MAX_ROW, values_only=False
            ),
            start=SCAN_MIN_ROW,
        ):
            rows_data[row_idx] = list(row)

        # Encontrar âncoras de tabelas
        anchor_positions: list[tuple[int, int, str]] = []  # (row_idx, col_idx_1based, category_name)
        for row_idx, row_cells in rows_data.items():
            row_values = tuple(c.value for c in row_cells)
            if not _is_anchor_row(row_values):
                continue
            # Pode haver múltiplas tabelas na mesma linha de âncora
            for col_offset, cell in enumerate(row_cells):
                if _normalize(cell.value) == "observação":
                    col_1based = cell.column
                    cat = _find_category(wb[sheet_name], row_idx, col_1based)
                    if cat:
                        all_categories.add(cat)
                        anchor_positions.append((row_idx, col_1based, cat))

        # Para cada âncora, extrair os lançamentos abaixo
        for anchor_row, obs_col, category_name in anchor_positions:
            # Colunas: Observação=obs_col, dia=obs_col+1, R$=obs_col+2
            # (baseado no padrão confirmado na planilha real)
            dia_col = obs_col + 1
            valor_col = obs_col + 2

            data_row_start = anchor_row + 1
            for row_idx in range(data_row_start, SCAN_MAX_ROW + 1):
                obs_val = wb[sheet_name].cell(row=row_idx, column=obs_col).value
                dia_val = wb[sheet_name].cell(row=row_idx, column=dia_col).value
                valor_val = wb[sheet_name].cell(row=row_idx, column=valor_col).value

                # Parar na linha vazia (obs e valor ambos nulos)
                if obs_val is None and valor_val is None and dia_val is None:
                    break

                description = str(obs_val).strip() if obs_val is not None else ""
                day = _parse_day(dia_val)
                amount = _parse_amount(valor_val)

                errors: list[str] = []

                # Validações
                if not description:
                    errors.append("Descrição ausente.")
                if amount is None:
                    errors.append("Valor ausente ou não-numérico.")
                elif amount < Decimal("0"):
                    errors.append(f"Valor negativo: {amount}.")
                elif amount == Decimal("0"):
                    errors.append("Valor igual a zero.")

                # Verificar se a data é compatível com o mês da aba
                if hasattr(dia_val, "month") and dia_val.month != month_number:
                    errors.append(
                        f"Mês da data ({dia_val.month}) incompatível com a aba ({month_number})."
                    )

                date_str, date_errors = _build_date(year, month_number, day)
                errors.extend(date_errors)

                result.rows.append(
                    ImportRow(
                        row_number=row_idx,
                        sheet=sheet_name,
                        category_name=category_name,
                        description=description,
                        day=day,
                        amount=amount,
                        date_str=date_str,
                        errors=errors,
                    )
                )

    result.categories_found = sorted(all_categories)
    return result


# ─── Gerador de template ──────────────────────────────────

TEMPLATE_CATEGORIES = [
    "Comida",
    "Entretenimento",
    "Água",
    "Luz",
    "Gás",
    "Celular",
    "Compras casa",
    "Pessoal",
    "Moto",
    "Sherlock",
]

MONTHS_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]


def generate_template(categories: list[str] | None = None) -> bytes:
    """
    Gera um arquivo XLSX vazio no formato legado com 12 abas mensais e
    blocos de tabelas para cada categoria ativa.
    Retorna bytes prontos para HTTP response.
    """
    if categories is None:
        categories = TEMPLATE_CATEGORIES

    wb = openpyxl.Workbook()
    summary = wb.active
    summary.title = "Gastos e acompanhamentos"
    summary.append(["Gastos e acompanhamento - Template"])
    summary.append(MONTHS_PT)

    for month in MONTHS_PT:
        ws = wb.create_sheet(title=f"Gastos {month}")
        ws.append([month])
        ws.append([])
        ws.append([])

        # Cada categoria ocupa 3 colunas: Observação | dia | R$
        # Elas são dispostas lado a lado na horizontal (como na planilha legada)
        header_row: list[str] = []
        subheader_row: list[str] = []
        for cat in categories:
            header_row += [cat, "", ""]
            subheader_row += ["Observação", "dia", "R$"]

        ws.append(header_row)
        ws.append(subheader_row)

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()


def generate_export(transactions_by_month: dict[int, list[dict]], year: int) -> bytes:
    """
    Gera um XLSX com os lançamentos existentes no banco organizados em abas mensais.
    `transactions_by_month`: {month_number: [{"category_name", "description", "day", "amount"}, ...]}
    """
    wb = openpyxl.Workbook()
    summary = wb.active
    summary.title = "Gastos e acompanhamentos"
    summary.append([f"Gastos e acompanhamento {year}"])
    summary.append(MONTHS_PT)

    for month_idx, month in enumerate(MONTHS_PT, start=1):
        ws = wb.create_sheet(title=f"Gastos {month}")
        ws.append([month])
        ws.append([])
        ws.append([])

        month_txs = transactions_by_month.get(month_idx, [])
        # Agrupar por categoria
        by_category: dict[str, list[dict]] = {}
        for tx in month_txs:
            by_category.setdefault(tx["category_name"], []).append(tx)

        if not by_category:
            continue

        categories = list(by_category.keys())
        header_row: list = []
        subheader_row: list = []
        for cat in categories:
            header_row += [cat, "", ""]
            subheader_row += ["Observação", "dia", "R$"]

        ws.append(header_row)
        ws.append(subheader_row)

        max_rows = max(len(v) for v in by_category.values())
        for i in range(max_rows):
            data_row: list = []
            for cat in categories:
                txs = by_category[cat]
                if i < len(txs):
                    t = txs[i]
                    data_row += [t.get("description", ""), t.get("day", ""), t.get("amount", "")]
                else:
                    data_row += ["", "", ""]
            ws.append(data_row)

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
