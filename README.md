# Finanças Pessoais

Aplicação web de controle de finanças pessoais com backend Django+DRF e frontend Next.js (JavaScript), seguindo os princípios 12-factor.

## Stack

| Camada      | Tecnologia                          |
|-------------|-------------------------------------|
| Backend     | Python 3.12, Django 4.2, DRF 3.15  |
| Auth        | JWT via cookies HttpOnly (simplejwt)|
| Banco       | PostgreSQL 16                       |
| Tarefas     | Celery + Redis 7                    |
| Frontend    | Next.js 14, React 18, SWR, Recharts |
| CI/CD       | Jenkins + SonarQube                 |
| Deploy      | Docker + Docker Compose             |

## Pré-requisitos

- Docker e Docker Compose
- Python 3.12+ (para desenvolvimento local sem Docker)
- Node.js 20+ (para desenvolvimento local do frontend)

## Rodando com Docker Compose

```bash
# 1. Copie o .env de exemplo e ajuste as variáveis
cp backend/.env.example backend/.env

# 2. Suba todos os serviços
docker compose up --build

# 3. Acesse
#    Frontend: http://localhost:3000
#    API:      http://localhost:8000/api/v1/
#    Swagger:  http://localhost:8000/api/v1/docs/
```

## Desenvolvimento local (sem Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # ajuste DB_HOST=localhost
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # ajuste NEXT_PUBLIC_API_URL
npm run dev
```

## Testes

```bash
# Backend (com cobertura mínima de 80%)
cd backend && pytest

# Frontend
cd frontend && npm test
```

## Variáveis de ambiente principais

| Variável                         | Descrição                                  |
|----------------------------------|--------------------------------------------|
| `SECRET_KEY`                     | Chave secreta Django (obrigatória)         |
| `DB_NAME / DB_USER / DB_PASSWORD`| Credenciais do PostgreSQL                  |
| `DB_HOST / DB_PORT`              | Host e porta do banco                      |
| `REDIS_URL`                      | URL do broker Redis                        |
| `CORS_ALLOWED_ORIGINS`           | Origins permitidas (ex: http://localhost:3000) |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Tempo de vida do access token (padrão: 15) |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS`   | Tempo de vida do refresh token (padrão: 7) |
| `NEXT_PUBLIC_API_URL`            | URL da API consumida pelo frontend         |

## Endpoints principais

| Método | Endpoint                          | Descrição                       |
|--------|-----------------------------------|---------------------------------|
| POST   | `/api/v1/auth/register/`          | Cadastro de usuário             |
| POST   | `/api/v1/auth/login/`             | Login (define cookies JWT)      |
| POST   | `/api/v1/auth/logout/`            | Logout (invalida tokens)        |
| POST   | `/api/v1/auth/refresh/`           | Renovar access token            |
| GET    | `/api/v1/auth/profile/`           | Dados do usuário autenticado    |
| CRUD   | `/api/v1/categories/`             | Categorias do usuário           |
| CRUD   | `/api/v1/transactions/`           | Lançamentos do usuário          |
| GET    | `/api/v1/analytics/dashboard/`    | Resumo financeiro do período    |
| GET    | `/api/v1/analytics/profile/`      | Análise de comportamento        |

## Estrutura de pastas

```
.
├── backend/
│   ├── core/               # Configurações Django (settings, urls, celery)
│   ├── accounts/           # Auth e perfil de usuário
│   ├── categories/         # CRUD de categorias
│   ├── transactions/       # Lançamentos e tarefas recorrentes
│   ├── analytics/          # Dashboard e análise de perfil
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/          # Rotas Next.js
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── lib/            # API client e helpers de auth
│   │   └── styles/         # CSS Modules
│   ├── middleware.js        # Proteção de rotas (SSR)
│   └── Dockerfile
├── docker-compose.yml
├── Jenkinsfile
└── sonar-project.properties
```

## CI/CD

O `Jenkinsfile` executa em ordem:
1. Lint backend (black, isort, flake8)
2. Testes backend (pytest + cobertura)
3. Lint frontend (eslint)
4. Testes frontend (jest)
5. Build frontend (next build)
6. Análise SonarQube + Quality Gate
7. Build de imagens Docker (apenas na branch `main`)
