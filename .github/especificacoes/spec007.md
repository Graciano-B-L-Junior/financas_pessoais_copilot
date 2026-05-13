# SPEC-007: Módulo de Orçamento de Gastos

## 1. Objetivo
Permitir que o usuário registre orçamentos de gastos mensais (gerais e por categorias) e acompanhe a evolução dos gastos reais em relação ao orçado, com visualização de comparativas e alertas de limite.

## 2. Escopo
Este módulo cobre a criação, atualização, consulta e acompanhamento de orçamentos mensais, incluindo orçamentos totais e desagregados por categoria, bem como cálculos de execução orçamentária e geração de alertas.

## 3. Modelagem
- **Budget**
  - `id`
  - `user`
  - `month`
  - `total_amount`
  - `status` (active, inactive, archived)
  - `created_at`
  - `updated_at`

- **BudgetCategory**
  - `id`
  - `budget`
  - `category`
  - `budgeted_amount`
  - `created_at`
  - `updated_at`

- **BudgetExecution**
  - `id`
  - `budget`
  - `actual_expenses`
  - `execution_percentage`
  - `remaining_amount`
  - `exceeded`
  - `category_executions` (agregado)
  - `calculated_at`

- **BudgetAlert**
  - `id`
  - `budget`
  - `category` (opcional)
  - `alert_type` (threshold_reached, exceeded, warning)
  - `threshold_percentage`
  - `message`
  - `created_at`

## 4. Regras de Negócio
- **C001** O orçamento deve ser associado ao usuário autenticado.
- **C002** Cada mês pode ter apenas um orçamento ativo por usuário.
- **C003** O orçamento total deve ser a soma dos orçamentos por categoria ou um valor definido diretamente.
- **C004** A execução orçamentária é calculada com base nos lançamentos (transações) do período.
- **C005** O sistema deve gerar alertas quando a execução atingir 75%, 90% e ultrapassar 100%.
- **C006** O sistema não deve expor dados de orçamentos de outros usuários.
- **C007** Um orçamento pode ser editado enquanto está ativo.
- **C008** Orçamentos finalizados podem ser visualizados mas não editados.
- **C009** A execução orçamentária deve ser recalculada a cada novo lançamento.

## 5. Requisitos Funcionais
- **RF001** Criar novo orçamento mensal com valor total.
- **RF002** Definir orçamentos específicos por categoria dentro de um orçamento.
- **RF003** Editar orçamento e seus valores de categorias.
- **RF004** Listar orçamentos do usuário com filtros por período.
- **RF005** Visualizar detalhes de um orçamento específico.
- **RF006** Consultar execução orçamentária em tempo real.
- **RF007** Visualizar comparativo entre orçado e realizado por categoria.
- **RF008** Receber alertas de limite orçamentário atingido ou ultrapassado.
- **RF009** Finalizar orçamento mensal.
- **RF010** Arquivar ou deletar orçamento.
- **RF011** Disponibilizar o orçamento mensal da categoria como linha de referência em gráficos de evolução de gastos quando a categoria estiver vinculada ao orçamento do mês selecionado.

## 6. Requisitos Não Funcionais
- **RNF001** O módulo deve ser implementado com Django REST Framework.
- **RNF002** O acesso aos endpoints deve exigir autenticação.
- **RNF003** A persistência deve usar PostgreSQL.
- **RNF004** As respostas devem seguir padrão JSON consistente.
- **RNF005** O módulo deve respeitar os princípios do 12-factor app.
- **RNF006** A execução orçamentária deve ser calculada eficientemente.
- **RNF007** Os alertas devem ser disparados em tempo real ou próximo real.

## 7. Validações
- O mês deve ser válido (formato YYYY-MM).
- O valor total do orçamento deve ser positivo.
- A soma dos orçamentos por categoria não deve ultrapassar 120% do total (se definido).
- Os valores por categoria devem ser positivos.
- Um usuário não pode ter dois orçamentos ativos para o mesmo mês.
- O período de um orçamento deve ser o mês completo (1º a último dia).

## 8. Fluxos Esperados
### 8.1 Criar orçamento mensal
1. O usuário acessa a seção de orçamentos.
2. O usuário cria um novo orçamento para um mês específico.
3. O usuário define um valor total (ou deixa 0 para soma de categorias).
4. O usuário define orçamentos específicos por categorias desejadas.
5. O sistema valida os dados.
6. O sistema persiste o orçamento como ativo.
7. O sistema retorna confirmação e os detalhes do orçamento criado.

### 8.2 Acompanhar execução orçamentária
1. O usuário visualiza um orçamento ativo.
2. O sistema calcula a execução baseada nos lançamentos do período.
3. O sistema exibe resumo: total orçado, total realizado, saldo restante.
4. O sistema exibe gráfico comparativo por categoria.
5. O sistema destaca categorias que atingiram limite.
6. O sistema exibe alertas gerados.

### 8.3 Editar orçamento
1. O usuário seleciona um orçamento ativo.
2. O usuário altera valores totais e/ou por categoria.
3. O sistema valida os novos valores.
4. O sistema persiste as alterações.
5. O sistema retorna o orçamento atualizado.

### 8.4 Finalizar orçamento
1. O usuário finaliza um orçamento (fim do mês).
2. O sistema marca o orçamento como inativo.
3. O sistema calcula e persiste a execução final.
4. O orçamento fica disponível para consulta mas não pode ser editado.

## 9. Definição da API (Interface)

### 9.1 Criar orçamento
- **Endpoint** `POST /api/v1/budgets/`
- **Objetivo**: criar novo orçamento mensal.
- **Request**:
```json
{
  "month": "2026-05",
  "total_amount": 3000.00,
  "categories": [
    {
      "category_id": 1,
      "budgeted_amount": 1000.00
    },
    {
      "category_id": 2,
      "budgeted_amount": 1500.00
    }
  ]
}
```
- **Resposta de sucesso** (201 Created):
```json
{
  "status": 201,
  "status_text": "Created",
  "data": {
    "id": 1,
    "month": "2026-05",
    "total_amount": 3000.00,
    "status": "active",
    "categories": [
      {
        "category_id": 1,
        "category_name": "Alimentação",
        "budgeted_amount": 1000.00
      },
      {
        "category_id": 2,
        "category_name": "Transporte",
        "budgeted_amount": 1500.00
      }
    ],
    "created_at": "2026-05-06T10:30:00Z",
    "updated_at": "2026-05-06T10:30:00Z"
  }
}
```

### 9.2 Listar orçamentos
- **Endpoint** `GET /api/v1/budgets/`
- **Objetivo**: listar orçamentos do usuário autenticado.
- **Query params opcionais**:
  - `month` (filtro por mês, ex: 2026-05)
  - `status` (active, inactive, archived)
  - `ordering` (-month, total_amount, etc.)
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "count": 5,
  "results": [
    {
      "id": 1,
      "month": "2026-05",
      "total_amount": 3000.00,
      "status": "active",
      "created_at": "2026-05-06T10:30:00Z",
      "updated_at": "2026-05-06T10:30:00Z"
    }
  ]
}
```

### 9.3 Consultar orçamento específico
- **Endpoint** `GET /api/v1/budgets/{id}/`
- **Objetivo**: retornar detalhes completos de um orçamento.
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "data": {
    "id": 1,
    "month": "2026-05",
    "total_amount": 3000.00,
    "status": "active",
    "categories": [
      {
        "category_id": 1,
        "category_name": "Alimentação",
        "budgeted_amount": 1000.00
      }
    ],
    "created_at": "2026-05-06T10:30:00Z",
    "updated_at": "2026-05-06T10:30:00Z"
  }
}
```

### 9.4 Consultar execução orçamentária
- **Endpoint** `GET /api/v1/budgets/{id}/execution/`
- **Objetivo**: retornar execução do orçamento em tempo real.
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "data": {
    "budget_id": 1,
    "month": "2026-05",
    "budgeted_total": 3000.00,
    "actual_expenses": 2150.50,
    "execution_percentage": 71.68,
    "remaining_amount": 849.50,
    "exceeded": false,
    "categories": [
      {
        "category_id": 1,
        "category_name": "Alimentação",
        "budgeted_amount": 1000.00,
        "actual_expenses": 750.25,
        "execution_percentage": 75.03,
        "remaining_amount": 249.75,
        "exceeded": false,
        "alert": {
          "type": "threshold_reached",
          "message": "75% do orçamento de Alimentação foi utilizado"
        }
      },
      {
        "category_id": 2,
        "category_name": "Transporte",
        "budgeted_amount": 1500.00,
        "actual_expenses": 1400.25,
        "execution_percentage": 93.35,
        "remaining_amount": 99.75,
        "exceeded": false,
        "alert": {
          "type": "warning",
          "message": "90% do orçamento de Transporte foi utilizado"
        }
      }
    ],
    "alerts": [
      {
        "id": 1,
        "alert_type": "threshold_reached",
        "message": "75% do orçamento de Alimentação foi utilizado",
        "created_at": "2026-05-06T12:00:00Z"
      }
    ],
    "calculated_at": "2026-05-06T14:30:00Z"
  }
}
```

### 9.5 Atualizar orçamento
- **Endpoint** `PATCH /api/v1/budgets/{id}/`
- **Objetivo**: editar orçamento e seus valores.
- **Request**:
```json
{
  "total_amount": 3200.00,
  "categories": [
    {
      "category_id": 1,
      "budgeted_amount": 1100.00
    }
  ]
}
```
- **Resposta de sucesso** (200 OK): retorna orçamento atualizado

### 9.6 Finalizar orçamento
- **Endpoint** `POST /api/v1/budgets/{id}/finalize/`
- **Objetivo**: finalizar orçamento mensal.
- **Resposta de sucesso** (200 OK):
```json
{
  "status": 200,
  "status_text": "OK",
  "message": "Orçamento finalizado com sucesso",
  "data": {
    "id": 1,
    "status": "inactive",
    "final_execution": {
      "budgeted_total": 3000.00,
      "actual_expenses": 2150.50,
      "execution_percentage": 71.68
    }
  }
}
```

### 9.7 Deletar orçamento
- **Endpoint** `DELETE /api/v1/budgets/{id}/`
- **Objetivo**: deletar orçamento (apenas não iniciados ou arquivados).
- **Resposta de sucesso** (204 No Content)

## 10. Respostas de Erro
- **400 Bad Request**: dados inválidos ou orçamento já existe para o mês
  ```json
  {
    "status": 400,
    "status_text": "Bad Request",
    "message": "Erro ao criar orçamento",
    "errors": {
      "month": ["Um orçamento ativo já existe para este mês."],
      "total_amount": ["O valor deve ser positivo."]
    }
  }
  ```
- **401 Unauthorized**: usuário não autenticado.
- **403 Forbidden**: usuário sem permissão (tentando editar orçamento finalizado).
- **404 Not Found**: orçamento não encontrado.
- **409 Conflict**: violação de regra de negócio.

## 11. Critérios de Aceite
- O usuário consegue criar um orçamento mensal com valor total e valores por categoria.
- O sistema rejeita orçamentos com dados inválidos.
- O usuário consegue visualizar um orçamento e sua execução em tempo real.
- O sistema calcula corretamente a execução como percentual do orçado.
- O sistema gera alertas quando limite de 75%, 90% e 100% é atingido.
- O usuário consegue editar orçamentos ativos.
- O sistema impede edição de orçamentos finalizados.
- O usuário consegue finalizar e visualizar orçamentos passados.
- O sistema não expõe dados de orçamentos de outros usuários.
- A API retorna mensagens de erro claras e consistentes.
