# SPEC-004: Módulo de dashboard

## 1. Objetivo
Permitir que o usuário visualize indicadores consolidados da sua vida financeira, com filtros por período, categoria, tipo, recorrência e valor.

## 2. Escopo
Este módulo cobre a exibição de totais, resumos e listas agregadas de receitas e despesas do usuário autenticado.

## 3. Modelagem
- **DashboardSummary**
  - `period_start`
  - `period_end`
  - `total_income`
  - `total_expenses`
  - `balance`
  - `transaction_count`
  - `recurring_count`
  - `top_categories`
  - `monthly_series`

## 4. Regras de Negócio
- **C001** O dashboard deve exibir apenas dados do usuário autenticado.
- **C002** O dashboard deve permitir filtros por período, categoria, tipo, recorrência e faixa de valor.
- **C003** O período inicial não pode ser maior que o período final.
- **C004** O sistema deve calcular totais com base nos lançamentos existentes e válidos.
- **C005** O sistema deve diferenciar receitas e despesas nos agregados.
- **C006** O usuário deve poder consultar visão consolidada e dados para gráficos.
- **C007** Categorias inativas não devem aparecer como opção de filtro para novos filtros de lançamento, salvo regra futura específica.
- **C008** O dashboard deve ter gráficos referentes a todo tipo de transação, e que possa ser filtrada por valor monetario, categoria, data

## 5. Requisitos Funcionais
- **RF001** Exibir resumo financeiro do período selecionado.
- **RF002** Listar lançamentos resumidos para o dashboard.
- **RF003** Exibir totais por tipo de lançamento.
- **RF004** Exibir totais por categoria.
- **RF005** Permitir aplicação de filtros combinados.
- **RF006** Disponibilizar dados para gráficos de evolução temporal.

## 6. Requisitos Não Funcionais
- **RNF001** O módulo deve ser implementado com Django REST Framework.
- **RNF002** O acesso aos endpoints deve exigir autenticação.
- **RNF003** A persistência deve usar PostgreSQL e consultar os lançamentos existentes.
- **RNF004** As respostas devem seguir padrão JSON consistente.
- **RNF005** O módulo deve respeitar os princípios do 12-factor app.

## 7. Validações
- O período deve estar em formato de data válido.
- O período inicial deve ser menor ou igual ao período final.
- O tipo deve aceitar apenas `receita` ou `despesa` quando informado.
- A categoria deve pertencer ao usuário autenticado.
- A faixa de valor deve ser numérica e consistente.

## 8. Fluxos Esperados
### 8.1 Consulta do dashboard
1. O usuário acessa a visão do dashboard.
2. O sistema identifica o usuário autenticado.
3. O sistema calcula os indicadores do período padrão ou do período informado.
4. O sistema retorna os dados consolidados.

### 8.2 Consulta com filtros
1. O usuário informa período e filtros opcionais.
2. O sistema valida os parâmetros.
3. O sistema aplica os filtros sobre os lançamentos.
4. O sistema retorna os totais e listas agregadas.

## 9. Definição da API (Interface)

### 9.1 Consultar dashboard
- **Endpoint** `GET /api/v1/dashboard/`
- **Objetivo**: retornar visão consolidada do usuário autenticado.
- **Query params opcionais**:
  - `start`
  - `end`
  - `category`
  - `type`
  - `is_recurring`
  - `min_amount`
  - `max_amount`
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "summary": {
    "total_income": 5000.00,
    "total_expenses": 3200.00,
    "balance": 1800.00,
    "transaction_count": 18,
    "recurring_count": 4
  },
  "top_categories": [
    {
      "category": "Alimentação",
      "total": 900.00
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

### 9.2 Falha na consulta do dashboard
- **Status**: `400 Bad Request`
- **Cenários**:
  - período inválido
  - filtros inconsistentes
  - faixa de valor inválida
- **Retorno**:
```json
{
  "status": 400,
  "status_text": "Bad Request",
  "message": "Não foi possível carregar o dashboard",
  "errors": {
    "start": ["Data inicial inválida."],
    "end": ["Data final inválida."],
    "non_field_errors": ["O período inicial deve ser menor ou igual ao período final."]
  }
}
```

## 10. Respostas de Erro
- **401 Unauthorized**: usuário não autenticado.
- **403 Forbidden**: usuário sem permissão para acessar os dados.
- **404 Not Found**: recurso relacionado não encontrado.

## 11. Critérios de Aceite
- O usuário consegue visualizar resumo financeiro do período.
- O sistema retorna totais coerentes com os lançamentos.
- O usuário consegue filtrar por período, categoria, tipo e recorrência.
- O sistema rejeita períodos e faixas de valor inválidos.
- O dashboard exibe apenas dados do usuário autenticado.