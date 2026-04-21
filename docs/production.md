# Resumo de Produção — Finanças Pessoais

Arquitetura mínima proposta para produção:

- Reverse proxy: `nginx` (TLS termina no edge, faz proxy para `web` e `/api`).
- Frontend: Next.js (`web`) rodando em modo `start` (build estático/SSR) por trás do `nginx`.
- Backend: Django + DRF (`api`) servido por Gunicorn.
- Tarefas assíncronas: Celery workers + Redis (broker / cache).
- Banco de dados: PostgreSQL com volume persistente.

Serviços (docker-compose / produção):

- `nginx` — proxy e terminação TLS (certificados via Let's Encrypt or Load Balancer).
- `web` — imagem production do Next.js (porta interna 3000).
- `api` — imagem Python com Gunicorn (porta interna 8000).
- `celery` — worker(s) para recorrências e jobs longos.
- `redis` — broker/cache.
- `db` — Postgres com volume para dados.

Recomendações operacionais:

- Secrets: **não** comitar `.env` em repositório; usar secret manager (Vault, AWS Secrets Manager) ou vars de CI/CD.
- TLS: preferir offload em LB (Cloud) ou usar `certbot` com volume de certificados para `nginx`.
- Backups: agendar dumps periódicos do Postgres (pg_dump) e verificar restauração.
- Logs: enviar stdout/stderr para um agregador (ELK/Cloud logs). Gunicorn logs e acesso Nginx devem ser coletados.
- Migrations: rodar migrations em job controlado antes de atualizar containers (evitar mudanças que quebrem compatibilidade).
- Escala: aumentar `gunicorn` workers para maior carga; replicar `web`/`api` via orquestrador (Kubernetes) para alta disponibilidade.

Pipeline de release (sugerido):

1. CI: lint -> tests (backend + frontend) -> build images -> push registry.
2. Staging: deploy em staging (compose ou Kubernetes), rodar smoke tests e migrations manuais/automáticas.
3. Prod: deploy imagens aprovadas, rodar migrations, rollout com healthchecks e monitoramento.

Checks de saúde e monitoramento mínimos:

- Healthchecks HTTP para `api` (liveness/ready), Nginx debe responder 200.
- Métricas: expor métricas básicas (Prometheus) e alertas para filas Celery backlog, CPU, erro de 5xx.

Arquivo(s) importantes no repositório:

- [docker-compose.prod.yml](docker-compose.prod.yml)
- [docker-compose.dev.yml](docker-compose.dev.yml)
- [nginx/nginx.conf](nginx/nginx.conf)

Como iniciar (dev):

```bash
cp .env.example .env
docker-compose -f docker-compose.dev.yml up --build
```

Como iniciar (produção local de teste):

```bash
cp .env.example .env
docker-compose -f docker-compose.prod.yml up --build -d
```

Notas finais:

Este conjunto `docker-compose` é adequado para desenvolvimento e pequenas implantações de teste. Para produção em escala, migrar para orquestrador (Kubernetes) e usar serviços gerenciados (RDS/Cloud SQL, managed Redis) aumenta resiliência e segurança.
