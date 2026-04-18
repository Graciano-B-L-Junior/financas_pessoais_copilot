Finanças Pessoais — Projeto

Como rodar em desenvolvimento:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

A aplicação de backend estará em `http://localhost:8000` e o frontend em `http://localhost:3000`.

Para produção (exemplo):

```bash
export POSTGRES_PASSWORD=strong_password_here
docker-compose -f docker-compose.prod.yml up --build -d
```

Notas:
- Ajuste `backend/.env.prod` e `frontend/.env.prod` com segredos reais antes de rodar em produção.
- Os containers do backend executam migrações e `collectstatic` no entrypoint automático.

Verificação de health

Após subir o ambiente em desenvolvimento, verifique o health endpoint:

```bash
curl http://localhost:8000/health/
```

Checklist para PR (PR-ready)

- Código formatado e lintado (`flake8` no backend).
- Testes automatizados adicionados (`pytest` / `pytest-django`).
- Migrations incluídas para mudanças em models.
- `README.md` atualizado com passos de execução e variáveis de ambiente.
- `Jenkinsfile` com pipeline mínimo (lint, tests, build).

Endpoints novos

- `POST /auth/register/` — criar usuário e setar cookies JWT.
- `POST /auth/login/` — login que seta cookies HttpOnly.
- `GET /api/reports/summary/` — resumo agregado por categoria (params: `start`, `end`).
- CRUD `api/recurrings/` — gerencia entradas recorrentes.

