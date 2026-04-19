"""
Importador e gerador de template xlsx para lançamentos.

Formato esperado da planilha:
  - Abas nomeadas como "Gastos Janeiro", "Gastos Fevereiro", etc.
  - O ano é extraído do nome do arquivo (ex: "Gastos Mensais 2024.xlsx").
  - Dentro de cada aba há DOIS grupos de colunas lado a lado:
      Grupo Esquerdo: B–F (colunas 2–6)
      Grupo Direito:  H–L (colunas 8–12)
  - Em cada grupo de 5 colunas:
      Linha de cabeçalho de categoria: célula mesclada spanning 5 colunas.
      Linhas de dados:
        1ª coluna do grupo = Observação (B ou H)
        4ª coluna do grupo = Dia (E ou K)
        5ª coluna do grupo = R$ (F ou L)
  - Valores negativos = despesas, positivos = receitas.
"""

import re
from datetime import date
from decimal import Decimal, InvalidOperation

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

MONTH_MAP = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3,
    "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9,
    "outubro": 10, "novembro": 11, "dezembro": 12,
}

MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

HEADER_SKIP_VALUES = {
    "categoria", "category", "observação", "observacao", "obs",
    "descrição", "descricao", "dia", "r$", "valor", "data",
}

# ─────────────────────────────────────────────────────────────────────────────
# Definição dos dois grupos de colunas (B–F e H–L)
# ─────────────────────────────────────────────────────────────────────────────
# Cada grupo: (col_inicio, col_fim, col_obs, col_dia, col_valor)
COLUMN_GROUPS = [
    # Grupo Esquerdo: B(2) → F(6)
    {"start": 2, "end": 6, "obs": 2, "dia": 5, "valor": 6},
    # Grupo Direito: H(8) → L(12)
    {"start": 8, "end": 12, "obs": 8, "dia": 11, "valor": 12},
]


def _get_month_from_sheet(sheet_name: str):
    name_lower = sheet_name.lower()
    for month_name, month_num in MONTH_MAP.items():
        if month_name in name_lower:
            return month_num
    return None


def _get_year_from_filename(filename: str) -> int:
    match = re.search(r"\b(20\d{2}|19\d{2})\b", filename)
    return int(match.group(1)) if match else date.today().year


def _parse_amount(value) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, str):
        # Remove R$, spaces, thousand dots, convert comma to dot
        value = value.replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
    try:
        d = Decimal(str(value))
        return d.quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError):
        return None


def _parse_day(value) -> int | None:
    if value is None:
        return None
    try:
        day = int(value)
        if 1 <= day <= 31:
            return day
    except (ValueError, TypeError):
        pass
    return None


def _get_merged_value(ws, row_idx: int, col_idx: int):
    """Retorna o valor da célula, resolvendo células mescladas."""
    cell = ws.cell(row=row_idx, column=col_idx)
    for merged in ws.merged_cells.ranges:
        if (merged.min_row <= row_idx <= merged.max_row and
                merged.min_col <= col_idx <= merged.max_col):
            return ws.cell(row=merged.min_row, column=merged.min_col).value
    return cell.value


def _is_category_header_for_group(ws, row_idx: int, group: dict) -> bool:
    """
    Verifica se a linha possui uma célula mesclada cobrindo TODAS as colunas
    do grupo (de group["start"] a group["end"]).

    Linhas de dados têm merge parcial (3 cols para observação);
    cabeçalhos de categoria têm merge total (5 cols = grupo inteiro).
    """
    for merged in ws.merged_cells.ranges:
        if merged.min_row <= row_idx <= merged.max_row:
            if (merged.min_col == group["start"] and
                    merged.max_col == group["end"]):
                return True
    return False


def import_from_xlsx(file_obj, filename: str, user):
    """
    Importa transações de um arquivo xlsx.

    Args:
        file_obj: objeto de arquivo (upload Django).
        filename: nome original do arquivo (usado para extrair o ano).
        user: instância do User dono dos lançamentos.

    Returns:
        tuple (int created_count, list[str] errors)
    """
    from .models import Category, Transaction

    wb = openpyxl.load_workbook(file_obj, data_only=True)
    year = _get_year_from_filename(filename)

    to_create: list[Transaction] = []
    errors: list[str] = []
    category_cache: dict[str, Category] = {}

    for sheet_name in wb.sheetnames:
        month = _get_month_from_sheet(sheet_name)
        if month is None:
            continue

        ws = wb[sheet_name]
        # Cada grupo tem seu próprio "estado de categoria" independente
        current_category: dict[int, str | None] = {
            g["start"]: None for g in COLUMN_GROUPS
        }

        for row_idx in range(1, ws.max_row + 1):
            for group in COLUMN_GROUPS:
                gkey = group["start"]

                # ── Detectar cabeçalho de categoria para este grupo ────────
                if _is_category_header_for_group(ws, row_idx, group):
                    cat_value = _get_merged_value(ws, row_idx, group["start"])
                    if cat_value and str(cat_value).strip():
                        label = str(cat_value).strip()
                        if label.lower() not in HEADER_SKIP_VALUES:
                            current_category[gkey] = label
                    continue  # linha de cabeçalho, não precisa ler dados

                # ── Ler dados desta linha para este grupo ───────────────────
                obs_val = _get_merged_value(ws, row_idx, group["obs"])
                day_raw = ws.cell(row=row_idx, column=group["dia"]).value
                amount_raw = ws.cell(row=row_idx, column=group["valor"]).value

                day = _parse_day(day_raw)
                amount = _parse_amount(amount_raw)

                if day is None or amount is None:
                    continue

                # Ignorar linhas de cabeçalho textual
                if isinstance(obs_val, str) and obs_val.strip().lower() in HEADER_SKIP_VALUES:
                    continue

                try:
                    tx_date = date(year, month, day)
                except ValueError:
                    errors.append(
                        f"Aba '{sheet_name}', linha {row_idx}, grupo "
                        f"{get_column_letter(group['start'])}-"
                        f"{get_column_letter(group['end'])}: data inválida "
                        f"(ano={year}, mês={month}, dia={day})."
                    )
                    continue

                # ── Resolver categoria ──────────────────────────────────────
                category = None
                cat_name = current_category[gkey]
                if cat_name:
                    key = cat_name.lower()
                    if key not in category_cache:
                        existing = Category.objects.filter(
                            name__iexact=cat_name, user=user
                        ).first()
                        if existing:
                            category_cache[key] = existing
                        else:
                            category_cache[key] = Category.objects.create(
                                name=cat_name, user=user
                            )
                    category = category_cache[key]

                to_create.append(Transaction(
                    user=user,
                    category=category,
                    amount=amount,
                    date=tx_date,
                    description=str(obs_val).strip() if obs_val else "",
                ))

    if to_create:
        Transaction.objects.bulk_create(to_create)

    return len(to_create), errors


# ─────────────────────────────────────────────────────────────────────────────
# Gerador de planilha template
# ─────────────────────────────────────────────────────────────────────────────

_COLOR_PRIMARY = "2E6B4A"
_COLOR_HEADER_BG = "D1FAE5"
_COLOR_CAT_BG = "4CAF7A"
_COLOR_CAT_FG = "FFFFFF"
_COLOR_ROW_ALT = "F5F7F5"
_COLOR_BORDER = "E5E7EB"


def _thin_border():
    side = Side(style="thin", color=_COLOR_BORDER)
    return Border(left=side, right=side, top=side, bottom=side)


def _style_title(ws, row: int):
    ws.merge_cells(start_row=row, start_column=2, end_row=row, end_column=12)
    cell = ws.cell(row=row, column=2)
    cell.font = Font(bold=True, size=14, color=_COLOR_PRIMARY)
    cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[row].height = 28


def _style_group_col_headers(ws, row: int, group: dict):
    """Cabeçalhos de coluna para um grupo (Observação | Dia | R$)."""
    # Merge primeiras 3 colunas do grupo para "CATEGORIA / OBSERVAÇÃO"
    ws.merge_cells(
        start_row=row, start_column=group["start"],
        end_row=row, end_column=group["start"] + 2,
    )
    fill = PatternFill(fill_type="solid", fgColor=_COLOR_HEADER_BG)
    font = Font(bold=True, color=_COLOR_PRIMARY)

    c = ws.cell(row=row, column=group["start"], value="OBSERVAÇÃO")
    c.font = font
    c.fill = fill
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = _thin_border()

    for col_offset, text in [(3, "DIA"), (4, "R$")]:
        col = group["start"] + col_offset
        c = ws.cell(row=row, column=col, value=text)
        c.font = font
        c.fill = fill
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.border = _thin_border()

    ws.row_dimensions[row].height = 20


def _style_category_row_group(ws, row: int, name: str, group: dict):
    """Categoria header — merge das 5 colunas do grupo."""
    ws.merge_cells(
        start_row=row, start_column=group["start"],
        end_row=row, end_column=group["end"],
    )
    cell = ws.cell(row=row, column=group["start"], value=name)
    cell.font = Font(bold=True, color=_COLOR_CAT_FG)
    cell.fill = PatternFill(fill_type="solid", fgColor=_COLOR_CAT_BG)
    cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    cell.border = _thin_border()
    ws.row_dimensions[row].height = 18


def _style_data_row_group(
    ws, row: int, obs: str, day: int | None, amount: float | None,
    group: dict, alt: bool = False
):
    """Linha de dados dentro de um grupo."""
    fill_color = _COLOR_ROW_ALT if alt else "FFFFFF"
    fill = PatternFill(fill_type="solid", fgColor=fill_color)

    # Merge primeiras 3 colunas do grupo para observação
    ws.merge_cells(
        start_row=row, start_column=group["start"],
        end_row=row, end_column=group["start"] + 2,
    )
    c = ws.cell(row=row, column=group["start"], value=obs if obs else None)
    c.fill = fill
    c.border = _thin_border()

    # Dia
    c = ws.cell(row=row, column=group["dia"], value=day)
    c.fill = fill
    c.border = _thin_border()
    c.alignment = Alignment(horizontal="center")

    # Valor
    c = ws.cell(row=row, column=group["valor"], value=amount)
    c.fill = fill
    c.border = _thin_border()
    if amount is not None:
        c.number_format = '#,##0.00'
        c.font = Font(color="EF4444" if amount < 0 else "22C55E")

    ws.row_dimensions[row].height = 16


def _set_column_widths(ws):
    """Define larguras das colunas para os dois grupos B-F e H-L."""
    ws.column_dimensions["A"].width = 2   # margem
    # Grupo esquerdo B–F
    ws.column_dimensions["B"].width = 18  # Obs
    ws.column_dimensions["C"].width = 10
    ws.column_dimensions["D"].width = 10
    ws.column_dimensions["E"].width = 8   # Dia
    ws.column_dimensions["F"].width = 14  # R$
    # Separador
    ws.column_dimensions["G"].width = 3
    # Grupo direito H–L
    ws.column_dimensions["H"].width = 18  # Obs
    ws.column_dimensions["I"].width = 10
    ws.column_dimensions["J"].width = 10
    ws.column_dimensions["K"].width = 8   # Dia
    ws.column_dimensions["L"].width = 14  # R$


SAMPLE_CATEGORIES_LEFT = [
    {
        "name": "ALIMENTAÇÃO",
        "rows": [
            ("Supermercado", 3, -350.00),
            ("Padaria", 5, -25.50),
            ("Restaurante", 12, -89.90),
        ],
    },
    {
        "name": "TRANSPORTE",
        "rows": [
            ("Uber", 2, -18.00),
            ("Posto de gasolina", 10, -200.00),
        ],
    },
    {
        "name": "MORADIA",
        "rows": [
            ("Aluguel", 1, -1500.00),
            ("Conta de luz", 8, -120.00),
            ("Internet", 8, -99.90),
        ],
    },
]

SAMPLE_CATEGORIES_RIGHT = [
    {
        "name": "SAÚDE",
        "rows": [
            ("Farmácia", 6, -45.00),
            ("Plano de saúde", 1, -300.00),
        ],
    },
    {
        "name": "LAZER",
        "rows": [
            ("Cinema", 15, -40.00),
            ("Streaming", 10, -39.90),
        ],
    },
    {
        "name": "RECEITA",
        "rows": [
            ("Salário", 5, 3500.00),
        ],
    },
]


def _write_group_data(ws, start_row: int, categories: list, group: dict) -> int:
    """Escreve categorias e dados dentro de um grupo. Retorna última linha usada."""
    current_row = start_row
    alt = False
    for cat in categories:
        _style_category_row_group(ws, current_row, cat["name"], group)
        current_row += 1
        for obs, day, amount in cat["rows"]:
            _style_data_row_group(ws, current_row, obs, day, amount, group, alt=alt)
            current_row += 1
            alt = not alt
        # Linha vazia para o usuário adicionar
        _style_data_row_group(ws, current_row, "", None, None, group, alt=False)
        current_row += 1
    return current_row


def generate_template(year: int | None = None) -> bytes:
    """
    Gera um workbook xlsx de template com abas para cada mês do ano.
    Usa duas seções lado a lado: B–F (esquerdo) e H–L (direito).

    Args:
        year: ano a exibir no template (padrão: ano atual).

    Returns:
        Conteúdo do arquivo como bytes.
    """
    import io
    from datetime import date as _date

    year = year or _date.today().year
    wb = openpyxl.Workbook()
    wb.remove(wb.active)  # Remove default sheet

    group_left = COLUMN_GROUPS[0]
    group_right = COLUMN_GROUPS[1]

    for month_idx, month_name in enumerate(MONTH_NAMES, start=1):
        ws = wb.create_sheet(title=f"Gastos {month_name}")

        _set_column_widths(ws)

        # Row 1: título
        ws.cell(row=1, column=2, value=f"GASTOS {month_name.upper()} {year}")
        _style_title(ws, 1)

        # Row 2: cabeçalhos de coluna para cada grupo
        _style_group_col_headers(ws, 2, group_left)
        _style_group_col_headers(ws, 2, group_right)

        # Row 3+: dados dos grupos
        data_start = 3
        _write_group_data(ws, data_start, SAMPLE_CATEGORIES_LEFT, group_left)
        _write_group_data(ws, data_start, SAMPLE_CATEGORIES_RIGHT, group_right)

        # Freeze panes abaixo dos cabeçalhos
        ws.freeze_panes = ws.cell(row=3, column=1)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.read()
