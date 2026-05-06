# Financas Pessoais

Projeto base gerado a partir das instrucoes e das especificacoes em `.github/especificacoes/`.

## Stack

- Backend: Django + Django REST Framework
- Frontend: Node.js + Express + JavaScript puro
- Banco: PostgreSQL
- Filas: Celery + Redis
- CI: Jenkins

## Estrutura

- `backend/`: API Django + DRF com apps `accounts`, `categories`, `budgets`, `transactions` e `analytics`
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

- Os endpoints e payloads devem seguir as specs `spec001` a `spec007`.
- Qualquer mudanca de contrato deve atualizar a spec correspondente.
- O scaffold gerado e uma base inicial e precisa de migrations Django antes de uso completo em producao.

## Seed (popular banco de dados) — comando `manage.py seed`

O projeto inclui um comando de management Django para popular dados de desenvolvimento: categorias, lançamentos e orçamento para um usuário existente.

Como usar:

- Rodar dentro do container (recomendado):

```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py seed --select --transactions 1000 --budgets 1
```

- Rodar localmente (fora do container): exporte variáveis de ambiente que apontem para o Postgres exposto pelo Docker (porta padrão do compose de dev é `5433`):

```bash
DB_HOST=localhost DB_PORT=5433 DB_USER=financas DB_PASSWORD=financas_pass DB_NAME=financas_dev \
	python backend/manage.py seed --select
```

- Opções úteis:
	- `--select` : lista usuários e permite selecionar interativamente
	- `--username <name>` ou `--email <addr>` : escolhe o usuário diretamente
	- `--transactions <n>` : número de transações a criar (padrão 10)
	- `--budgets <n>` : número de orçamentos mensais a criar (padrão 1)
	- `--force` : remove transações previamente criadas pelo seed (descrição começando com `Seed:`) antes de criar novas

Observações importantes:
- Se você rodar `manage.py` fora do container e obtiver erro de autenticação/host, execute o comando dentro do container ou ajuste `DB_HOST/DB_PORT` para o host/porta onde o Postgres está exposto.
- O comando tenta fazer um fallback lendo `backend/.env.dev` quando aplicável para obter credenciais/porta.
- O seed usa `transaction.atomic()` e é idempotente para evitar duplicar registros quando possível.
