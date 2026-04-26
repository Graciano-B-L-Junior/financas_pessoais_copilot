# Financas Pessoais

Projeto base gerado a partir das instrucoes e das especificacoes em `.github/especificacoes/`.

## Stack

- Backend: Django + Django REST Framework
- Frontend: Node.js + Express + JavaScript puro
- Banco: PostgreSQL
- Filas: Celery + Redis
- CI: Jenkins

## Estrutura

- `backend/`: API Django + DRF com apps `accounts`, `categories`, `transactions` e `analytics`
- `frontend/`: interface Node.js + Express com views server-side
- `docker-compose.yml`: ambiente local com banco, redis, backend, worker e frontend
- `.github/especificacoes/`: fonte de verdade funcional e de contrato

## Ambientes com Docker Compose

Desenvolvimento:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Produção:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## Subir localmente com Docker Compose

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Servicos esperados:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Arquivos de ambiente

- Base compartilhada: `docker-compose.yml`
- Override de desenvolvimento: `docker-compose.dev.yml`
- Override de produção: `docker-compose.prod.yml`
- Backend dev: `backend/.env.dev.example`
- Backend prod: `backend/.env.prod.example`
- Frontend dev: `frontend/.env.dev.example`
- Frontend prod: `frontend/.env.prod.example`

## Rodar backend localmente

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## Rodar frontend localmente

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## Testes

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm test
```

## Observacoes

- Os endpoints e payloads devem seguir as specs `spec001` a `spec006`.
- Qualquer mudanca de contrato deve atualizar a spec correspondente.
- O scaffold gerado e uma base inicial e precisa de migrations Django antes de uso completo em producao.