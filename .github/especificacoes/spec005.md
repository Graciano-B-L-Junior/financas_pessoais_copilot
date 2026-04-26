# SPEC-005: Módulo de perfil

## 1. Objetivo
Permitir que o usuário consulte e atualize seus dados cadastrais e preferências básicas da conta.

## 2. Escopo
Este módulo cobre a visualização e manutenção dos dados de perfil do usuário autenticado.

## 3. Modelagem
- **User**
  - `id`
  - `first_name`
  - `last_name`
  - `email`
  - `password`
  - `is_active`
  - `date_joined`
- **Profile** (opcional, se necessário para extensões futuras)
  - `user`
  - `phone_number` (opcional)
  - `avatar_url` (opcional)
  - `created_at`
  - `updated_at`

## 4. Regras de Negócio
- **C001** O perfil deve pertencer a um usuário autenticado.
- **C002** O usuário pode visualizar seus próprios dados cadastrais.
- **C003** O usuário pode atualizar nome, sobrenome e email.
- **C004** O email do perfil deve continuar único no sistema.
- **C005** O sistema deve impedir que um usuário altere dados de outro usuário.
- **C006** O usuário pode solicitar desativação da conta apenas se a regra de negócio do produto permitir.
- **C007** Alterações de senha devem seguir o fluxo de autenticação apropriado.

## 5. Requisitos Funcionais
- **RF001** Consultar dados do perfil.
- **RF002** Atualizar dados do perfil.
- **RF003** Exibir informações básicas da conta.
- **RF004** Permitir ação de desativação da conta, se habilitada.

## 6. Requisitos Não Funcionais
- **RNF001** O módulo deve ser implementado com Django REST Framework.
- **RNF002** O acesso aos endpoints deve exigir autenticação.
- **RNF003** A persistência deve usar PostgreSQL com migrations do Django, se houver tabela adicional.
- **RNF004** As respostas devem seguir padrão JSON consistente.
- **RNF005** O módulo deve respeitar os princípios do 12-factor app.

## 7. Validações
- O nome e sobrenome devem ser válidos quando informados.
- O email deve seguir formato válido e permanecer único.
- O usuário autenticado deve ser o proprietário do perfil.
- Campos opcionais do perfil estendido devem ser validados quando presentes.

## 8. Fluxos Esperados
### 8.1 Consulta de perfil
1. O usuário acessa a página de perfil.
2. O sistema identifica o usuário autenticado.
3. O sistema retorna os dados cadastrais do usuário.

### 8.2 Atualização de perfil
1. O usuário altera nome, sobrenome ou email.
2. O sistema valida os dados enviados.
3. O sistema verifica duplicidade de email, se houver alteração.
4. O sistema salva a atualização e retorna a confirmação.

## 9. Definição da API (Interface)

### 9.1 Consultar perfil
- **Endpoint** `GET /api/v1/profile/`
- **Objetivo**: retornar os dados do usuário autenticado.
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "data": {
    "first_name": "João",
    "last_name": "Silva",
    "email": "joao@exemplo.com"
  }
}
```

### 9.2 Atualizar perfil
- **Endpoint** `PUT /api/v1/profile/`
- **Endpoint parcial** `PATCH /api/v1/profile/`
- **Campos permitidos**:
  - `first_name`
  - `last_name`
  - `email`
- **Resposta de sucesso**:
```json
{
  "status": 200,
  "status_text": "OK",
  "message": "Perfil atualizado com sucesso"
}
```

### 9.3 Falha na atualização do perfil
- **Status**: `400 Bad Request`
- **Cenários**:
  - email já cadastrado
  - email inválido
  - campos com formato inválido
- **Retorno**:
```json
{
  "status": 400,
  "status_text": "Bad Request",
  "message": "Não foi possível atualizar o perfil",
  "errors": {
    "email": ["Este email já está cadastrado."],
    "first_name": ["Este campo não pode ficar em branco."]
  }
}
```

## 10. Respostas de Erro
- **401 Unauthorized**: usuário não autenticado.
- **403 Forbidden**: usuário sem permissão para acessar ou alterar o perfil.
- **404 Not Found**: perfil não encontrado.

## 11. Critérios de Aceite
- O usuário consegue consultar seus dados de perfil.
- O usuário consegue atualizar nome, sobrenome e email.
- O sistema impede duplicidade de email.
- O sistema rejeita alterações inválidas.
- O usuário não consegue acessar dados de outro perfil.