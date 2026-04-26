# SPEC-003: Módulo de lançamentos

## 1. Objetivo
Permitir que o usuário cadastre, consulte, atualize e remova lançamentos financeiros de receita e despesa, incluindo suporte a lançamentos recorrentes.

## 2. Escopo
Este módulo cobre o registro de movimentações financeiras do usuário autenticado, com associação a categorias, datas, valores, tipo do lançamento e recorrência.

## 3. Modelagem
- **Transaction**
  - `id`
  - `user`
  - `category`
  - `description`
  - `amount`
  - `type`
  - `date`
  - `is_recurring`
  - `frequency` (opcional)
  - `start_date` (opcional)
  - `end_date` (opcional)
  - `is_active`
  - `created_at`
  - `updated_at`

## 4. Regras de Negócio
- **C001** Todo lançamento deve pertencer a um usuário autenticado.
- **C002** Todo lançamento deve estar vinculado a uma categoria válida do mesmo usuário.
- **C003** O tipo do lançamento deve ser `receita` ou `despesa`.
- **C004** O valor do lançamento deve ser obrigatório e maior que zero.
- **C005** A data do lançamento deve ser obrigatória.
- **C006** O usuário só pode visualizar, alterar e excluir seus próprios lançamentos.
- **C007** Lançamentos recorrentes devem informar a frequência e o período de vigência quando aplicável.
- **C008** Lançamentos recorrentes devem poder ser gerados por processo automatizado.
- **C009** O sistema deve impedir vínculo com categoria inativa, salvo regra futura específica.
- **C010** O sistema deve impedir que categoria de tipo incompatível seja usada no lançamento.

## 5. Requisitos Funcionais
- **RF001** Criar lançamento.
- **RF002** Listar lançamentos do usuário autenticado.
- **RF003** Consultar detalhes de um lançamento.
- **RF004** Atualizar dados de um lançamento.
- **RF005** Excluir um lançamento.
- **RF006** Permitir criação de lançamento recorrente.
- **RF007** Permitir filtragem de lançamentos por período, categoria, tipo e recorrência.

## 6. Requisitos Não Funcionais
- **RNF001** O módulo deve ser implementado com Django REST Framework.
- **RNF002** O acesso aos endpoints deve exigir autenticação.
- **RNF003** A persistência deve usar PostgreSQL com migrations do Django.
- **RNF004** As respostas devem seguir padrão JSON consistente.
- **RNF005** O módulo deve respeitar os princípios do 12-factor app.
- **RNF006** O processamento de recorrentes deve ser compatível com Celery + Redis.

## 7. Validações
- O valor deve ser numérico e maior que zero.
- A data do lançamento deve ser válida.
- O tipo deve ser apenas `receita` ou `despesa`.
- A categoria deve pertencer ao usuário autenticado.
- A categoria deve ser compatível com o tipo do lançamento.
- O usuário autenticado deve ser o proprietário do lançamento.
- Lançamentos recorrentes devem respeitar frequência, data inicial e data final, quando informadas.

## 8. Fluxos Esperados
### 8.1 Cadastro de lançamento
1. O usuário informa categoria, descrição, valor, tipo e data.
2. O sistema valida os dados.
3. O sistema verifica propriedade da categoria e compatibilidade de tipo.
4. O sistema cria o lançamento e retorna a confirmação.

### 8.2 Cadastro de lançamento recorrente
1. O usuário informa os dados do lançamento e a recorrência.
2. O sistema valida frequência, período e dados principais.
3. O sistema cria o registro recorrente.
4. O processo automatizado gera os lançamentos futuros conforme a regra definida.

### 8.3 Atualização de lançamento
1. O usuário seleciona um lançamento existente.
2. O sistema valida propriedade e dados enviados.
3. O sistema aplica a atualização.

### 8.4 Exclusão de lançamento
1. O usuário solicita a remoção do lançamento.
2. O sistema valida a propriedade.
3. O sistema remove o lançamento.

## 9. Definição da API (Interface)

### 9.1 Listar lançamentos
- **Endpoint** `GET /api/v1/transactions/`
- **Objetivo**: listar os lançamentos do usuário autenticado.
- **Filtros suportados**:
  - `start`
  - `end`
  - `category`
  - `type`
  - `is_recurring`
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "results": [
    {
      "id": 1,
      "description": "Salário",
      "amount": 5000.00,
      "type": "receita",
      "date": "2026-04-01",
      "category": {
        "id": 2,
        "name": "Trabalho"
      },
      "is_recurring": false
    }
  ]
}
```

### 9.2 Criar lançamento
- **Endpoint** `POST /api/v1/transactions/`
- **Campos obrigatórios**:
  - `category`
  - `description`
  - `amount`
  - `type`
  - `date`
- **Campos opcionais**:
  - `is_recurring`
  - `frequency`
  - `start_date`
  - `end_date`
- **Resposta de sucesso**:
```json
{
  "status": 201,
  "status_text": "Created",
  "message": "Lançamento cadastrado com sucesso"
}
```

### 9.3 Falha no cadastro do lançamento
- **Status**: `400 Bad Request`
- **Cenários**:
  - valor inválido
  - categoria inexistente ou inativa
  - categoria de tipo incompatível
  - data inválida
  - recorrência incompleta
- **Retorno**:
```json
{
  "status": 400,
  "status_text": "Bad Request",
  "message": "Não foi possível concluir o cadastro do lançamento",
  "errors": {
    "amount": ["O valor deve ser maior que zero."],
    "category": ["Categoria inválida ou inativa."],
    "type": ["Tipo incompatível com a categoria."],
    "frequency": ["Campo obrigatório para lançamento recorrente."]
  }
}
```

### 9.4 Detalhar lançamento
- **Endpoint** `GET /api/v1/transactions/{id}/`
- **Objetivo**: retornar os dados de um lançamento específico do usuário.

### 9.5 Atualizar lançamento
- **Endpoint** `PUT /api/v1/transactions/{id}/`
- **Endpoint parcial** `PATCH /api/v1/transactions/{id}/`
- **Objetivo**: atualizar categoria, descrição, valor, tipo, data e recorrência.

### 9.6 Excluir lançamento
- **Endpoint** `DELETE /api/v1/transactions/{id}/`
- **Objetivo**: remover o lançamento do usuário.

## 10. Respostas de Erro
- **401 Unauthorized**: usuário não autenticado.
- **403 Forbidden**: lançamento não pertence ao usuário autenticado.
- **404 Not Found**: lançamento não encontrado.

## 11. Integração com recorrência
- Lançamentos recorrentes devem ser processados por tarefa agendada.
- O sistema deve permitir que o backend gere os lançamentos futuros com base em frequência e período.
- Em ambiente simples, a execução pode ser documentada com alternativa baseada em cron jobs.

## 12. Critérios de Aceite
- O usuário consegue criar um lançamento de receita ou despesa.
- O sistema impede cadastro com categoria inválida, inativa ou incompatível.
- O usuário consegue listar apenas seus próprios lançamentos.
- O usuário consegue atualizar e excluir apenas lançamentos que lhe pertencem.
- O sistema suporta lançamento recorrente com integração ao processo automatizado.
- O sistema permite filtros por período, categoria, tipo e recorrência.