# SPEC-002: Módulo de categorias

## 1. Objetivo
Permitir que o usuário cadastre, consulte, atualize e remova categorias usadas para organizar receitas e despesas na plataforma.

## 2. Escopo
Este módulo cobre o gerenciamento de categorias do usuário autenticado, incluindo categorias de receita e despesa.

## 3. Modelagem
- **Category**
  - `id`
  - `user`
  - `name`
  - `type`
  - `description` (opcional)
  - `is_active`
  - `created_at`
  - `updated_at`

## 4. Regras de Negócio
- **C001** Toda categoria deve pertencer a um usuário autenticado.
- **C002** O usuário pode criar categorias dos tipos `receita` e `despesa`.
- **C003** O nome da categoria deve ser obrigatório.
- **C004** Não pode existir mais de uma categoria com o mesmo nome para o mesmo usuário e o mesmo tipo.
- **C005** O usuário só pode visualizar, alterar e excluir suas próprias categorias.
- **C006** O sistema deve impedir criação ou alteração de categoria com tipo inválido.
- **C007** O usuário pode desativar uma categoria sem removê-la fisicamente, quando necessário.
- **C008** Categorias inativas não devem ser usadas em novos lançamentos, salvo regra futura específica.

## 5. Requisitos Funcionais
- **RF001** Criar categoria.
- **RF002** Listar categorias do usuário autenticado.
- **RF003** Consultar detalhes de uma categoria.
- **RF004** Atualizar dados de uma categoria.
- **RF005** Excluir uma categoria.
- **RF006** Permitir ativação e desativação de categoria.

## 6. Requisitos Não Funcionais
- **RNF001** O módulo deve ser implementado com Django REST Framework.
- **RNF002** O acesso aos endpoints deve exigir autenticação.
- **RNF003** A persistência deve usar PostgreSQL com migrations do Django.
- **RNF004** As respostas devem seguir padrão JSON consistente.
- **RNF005** O módulo deve respeitar os princípios do 12-factor app.

## 7. Validações
- O nome da categoria deve ter conteúdo válido e não pode ser vazio.
- O tipo da categoria deve ser apenas `receita` ou `despesa`.
- O sistema deve impedir duplicidade de nome por usuário e por tipo.
- O usuário autenticado deve ser o proprietário da categoria.

## 8. Fluxos Esperados
### 8.1 Cadastro de categoria
1. O usuário informa nome, tipo e, opcionalmente, descrição.
2. O sistema valida os dados.
3. O sistema verifica se já existe categoria igual para o mesmo usuário e tipo.
4. O sistema cria a categoria e retorna a confirmação.

### 8.2 Atualização de categoria
1. O usuário seleciona uma categoria existente.
2. O sistema valida propriedade e dados enviados.
3. O sistema aplica a atualização.

### 8.3 Exclusão de categoria
1. O usuário solicita a remoção da categoria.
2. O sistema valida a propriedade.
3. O sistema remove ou inativa a categoria conforme a regra definida na implementação.

## 9. Definição da API (Interface)

### 9.1 Listar categorias
- **Endpoint** `GET /api/v1/categories/`
- **Objetivo**: listar as categorias do usuário autenticado.
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "results": [
    {
      "id": 1,
      "name": "Alimentação",
      "type": "despesa",
      "description": "Compras e refeições",
      "is_active": true
    }
  ]
}
```

### 9.2 Criar categoria
- **Endpoint** `POST /api/v1/categories/`
- **Campos obrigatórios**:
  - `name`
  - `type`
- **Campos opcionais**:
  - `description`
- **Resposta de sucesso**:
```json
{
  "status": 201,
  "status_text": "Created",
  "message": "Categoria cadastrada com sucesso"
}
```

### 9.3 Falha no cadastro da categoria
- **Status**: `400 Bad Request`
- **Cenários**:
  - nome vazio
  - tipo inválido
  - categoria duplicada para o mesmo usuário e tipo
- **Retorno**:
```json
{
  "status": 400,
  "status_text": "Bad Request",
  "message": "Não foi possível concluir o cadastro da categoria",
  "errors": {
    "name": ["Este campo é obrigatório."],
    "type": ["Tipo inválido."],
    "non_field_errors": ["Já existe uma categoria com este nome para este tipo."]
  }
}
```

### 9.4 Detalhar categoria
- **Endpoint** `GET /api/v1/categories/{id}/`
- **Objetivo**: retornar os dados de uma categoria específica do usuário.

### 9.5 Atualizar categoria
- **Endpoint** `PUT /api/v1/categories/{id}/`
- **Endpoint parcial** `PATCH /api/v1/categories/{id}/`
- **Objetivo**: atualizar nome, tipo, descrição ou status da categoria.

### 9.6 Excluir categoria
- **Endpoint** `DELETE /api/v1/categories/{id}/`
- **Objetivo**: remover a categoria do usuário.

## 10. Respostas de Erro
- **401 Unauthorized**: usuário não autenticado.
- **403 Forbidden**: categoria não pertence ao usuário autenticado.
- **404 Not Found**: categoria não encontrada.

## 11. Critérios de Aceite
- O usuário consegue criar uma categoria de receita ou despesa.
- O sistema impede categorias duplicadas para o mesmo usuário e tipo.
- O usuário consegue listar apenas suas próprias categorias.
- O usuário consegue atualizar e excluir apenas categorias que lhe pertencem.
- O sistema rejeita tipos inválidos e campos obrigatórios ausentes.