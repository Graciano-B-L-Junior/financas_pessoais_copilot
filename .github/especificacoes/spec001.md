#SPEC-001: Sistema de login

## 1: Objetivo
Sistema que permite usuários se cadastrarem e acessarem a plataforma

## 2: Modelagem
- **Users** (Django user default model)

## 3: Regras de Negócios
- **C001** Um usuário precisa registrar o Nome e Sobrenome, email e senha
- **C002** A senha precisa ser no minimo 6 digitos possuindo, caracteres maiusculos, minusculos e caracteres especiais e digitos
- **C003** Só pode existir um usuário com um email. Caso outro usuário tente se cadastrar com email já cadastrado em banco, O sistema tem que informar que já existe

## 4: Definição da API (Interface)

### 4.1 Cadastro de usuário
- **Endpoint** `POST /api/v1/auth/register/`
- **Objetivo**: criar um novo usuário na plataforma.
- **Campos obrigatórios**:
    - `first_name`
    - `last_name`
    - `email`
    - `password`

### 4.2 Resposta de sucesso no cadastro
- **Status**: `201 Created`
- **Retorno**:
```json
{
    "status": 201,
    "status_text": "Created",
    "message": "Usuário cadastrado com sucesso"
}
```

### 4.3 Resposta de falha no cadastro
- **Status**: `400 Bad Request`
- **Cenários**:
    - email já cadastrado
    - senha fora da política definida
    - campos obrigatórios ausentes
- **Retorno**:
```json
{
    "status": 400,
    "status_text": "Bad Request",
    "message": "Não foi possível concluir o cadastro",
    "errors": {
        "email": ["Este email já está cadastrado."],
        "password": ["A senha não atende aos critérios de segurança."]
    }
}
```

### 4.4 Login de usuário
- **Endpoint** `POST /api/v1/auth/login/`
- **Objetivo**: autenticar o usuário já cadastrado.
- **Falha de autenticação**:
```json
{
    "status": 400,
    "status_text": "Bad Request",
    "message": "Usuário ou senha inválidos"
}
```
