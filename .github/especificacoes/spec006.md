# SPEC-006: Módulo de análise de perfil

## 1. Objetivo
Permitir que o usuário visualize análises do seu comportamento financeiro com base em receitas, despesas, recorrência e evolução dos lançamentos.

## 2. Escopo
Este módulo cobre indicadores e insights financeiros derivados dos lançamentos do usuário autenticado.

## 3. Modelagem
- **ProfileAnalysisSummary**
  - `period_start`
  - `period_end`
  - `income_total`
  - `expense_total`
  - `balance`
  - `expense_ratio`
  - `income_ratio`
  - `most_used_categories`
  - `recurring_expenses_total`
  - `trend`
- **ProfileInsight**
  - `code`
  - `title`
  - `description`
  - `severity`
  - `suggestion`

## 4. Regras de Negócio
- **C001** A análise deve considerar apenas dados do usuário autenticado.
- **C002** O período analisado deve ser válido e opcionalmente filtrável.
- **C003** O sistema deve calcular receitas, despesas, saldo e proporções financeiras.
- **C004** O sistema deve identificar categorias mais utilizadas e despesas recorrentes relevantes.
- **C005** O sistema deve gerar insights baseados em comportamento financeiro.
- **C006** O sistema não deve expor dados de outros usuários.
- **C007** O sistema deve permitir uma visão consolidada e uma visão detalhada por período.

## 5. Requisitos Funcionais
- **RF001** Exibir resumo analítico do perfil financeiro.
- **RF002** Exibir insights de comportamento financeiro.
- **RF003** Exibir evolução de receitas e despesas.
- **RF004** Exibir proporção entre receitas e despesas.
- **RF005** Exibir categorias mais recorrentes.
- **RF006** Permitir consulta por período.

## 6. Requisitos Não Funcionais
- **RNF001** O módulo deve ser implementado com Django REST Framework.
- **RNF002** O acesso aos endpoints deve exigir autenticação.
- **RNF003** A persistência deve usar PostgreSQL e consultar os lançamentos existentes.
- **RNF004** As respostas devem seguir padrão JSON consistente.
- **RNF005** O módulo deve respeitar os princípios do 12-factor app.
- **RNF006** O cálculo analítico deve ser eficiente para conjuntos grandes de dados.

## 7. Validações
- O período deve conter datas válidas.
- O período inicial deve ser menor ou igual ao período final.
- Os cálculos devem considerar apenas lançamentos válidos e pertencentes ao usuário.
- As proporções devem ser numéricas e consistentes.

## 8. Fluxos Esperados
### 8.1 Consulta de análise
1. O usuário acessa a área de análise de perfil.
2. O sistema identifica o usuário autenticado.
3. O sistema calcula os indicadores do período solicitado ou do período padrão.
4. O sistema retorna resumo, insights e séries de evolução.

### 8.2 Consulta com filtros
1. O usuário informa um período específico.
2. O sistema valida as datas.
3. O sistema recalcula os indicadores considerando o filtro.
4. O sistema retorna os dados filtrados.

## 9. Definição da API (Interface)

### 9.1 Consultar análise de perfil
- **Endpoint** `GET /api/v1/analytics/profile/`
- **Objetivo**: retornar resumo analítico e insights do usuário autenticado.
- **Query params opcionais**:
  - `start`
  - `end`
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "summary": {
    "income_total": 5000.00,
    "expense_total": 3200.00,
    "balance": 1800.00,
    "expense_ratio": 0.64,
    "income_ratio": 1.0
  },
  "top_categories": [
    {
      "category": "Alimentação",
      "total": 900.00
    }
  ],
  "insights": [
    {
      "code": "HIGH_EXPENSE_RATIO",
      "title": "Despesas elevadas",
      "description": "Suas despesas consumiram uma parte relevante da renda no período.",
      "severity": "medium",
      "suggestion": "Revise gastos variáveis e categorias de maior impacto."
    }
  ],
  "monthly_series": [
    {
      "month": "2026-04",
      "income": 5000.00,
      "expenses": 3200.00
    }
  ]
}
```

### 9.2 Falha na consulta de análise
- **Status**: `400 Bad Request`
- **Cenários**:
  - período inválido
  - filtros inconsistentes
- **Retorno**:
```json
{
  "status": 400,
  "status_text": "Bad Request",
  "message": "Não foi possível gerar a análise de perfil",
  "errors": {
    "start": ["Data inicial inválida."],
    "end": ["Data final inválida."],
    "non_field_errors": ["O período inicial deve ser menor ou igual ao período final."]
  }
}
```

## 10. Respostas de Erro
- **401 Unauthorized**: usuário não autenticado.
- **403 Forbidden**: usuário sem permissão para acessar a análise.
- **404 Not Found**: análise não encontrada para o contexto solicitado.

## 11. Critérios de Aceite
- O usuário consegue visualizar análises do seu comportamento financeiro.
- O sistema retorna resumo, insights e séries temporais.
- O sistema aceita filtros por período.
- O sistema rejeita datas e filtros inválidos.
- O sistema não expõe dados de outros usuários.