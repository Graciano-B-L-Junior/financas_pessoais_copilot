import openpyxl

file_path = "/home/desenvolvimento/estudos_copilot/.github/especificacoes/arquivos de referencia/Gastos Mensais 2018.xlsx"
wb = openpyxl.load_workbook(file_path, data_only=True, read_only=True)

print("=== SHEET NAMES ===")
for name in wb.sheetnames:
    print(f"  - {repr(name)}")

# Inspect first non-summary sheet
for sheet_name in wb.sheetnames:
    norm = sheet_name.strip().lower()
    if norm in ("gastos e acompanhamentos", "gastos e acompanhamento 2018"):
        continue
    ws = wb[sheet_name]
    print(f"\n=== Sheet: {repr(sheet_name)} ===")
    print("First 15 rows:")
    for i, row in enumerate(ws.iter_rows(min_row=1, max_row=15, values_only=True), start=1):
        cells = [c for c in row if c is not None]
        if cells:
            print(f"  Row {i}: {row[:20]}")
    break

# Find anchor rows in first data sheet
print("\n=== Looking for anchor rows (Observação / dia / R$) in ALL sheets ===")
for sheet_name in wb.sheetnames:
    norm = sheet_name.strip().lower()
    if norm in ("gastos e acompanhamentos", "gastos e acompanhamento 2018"):
        continue
    ws = wb[sheet_name]
    for i, row in enumerate(ws.iter_rows(min_row=1, max_row=20, values_only=True), start=1):
        normalized = [str(c).strip().lower() for c in row if c is not None]
        if "observação" in normalized or "observacao" in normalized or "dia" in normalized:
            print(f"  Sheet={repr(sheet_name)}, Row={i}: {[c for c in row if c is not None][:10]}")
    break

# Look at actual data cells - check types for day and value
print("\n=== Sample data rows with types ===")
for sheet_name in wb.sheetnames:
    norm = sheet_name.strip().lower()
    if norm in ("gastos e acompanhamentos", "gastos e acompanhamento 2018"):
        continue
    ws = wb[sheet_name]
    # Read without values_only to get cell types
    wb2 = openpyxl.load_workbook(file_path, data_only=True)
    ws2 = wb2[sheet_name]
    for i, row in enumerate(ws2.iter_rows(min_row=1, max_row=20), start=1):
        cells_info = []
        for cell in row:
            if cell.value is not None:
                cells_info.append(f"col{cell.column}={repr(cell.value)}(type:{cell.data_type},numfmt:{cell.number_format})")
        if cells_info:
            print(f"  Row {i}: {cells_info[:8]}")
    break
