---
name: aplicacao-financas-instructions
description: "Instruções de projeto para o agente — aplicação web de finanças pessoais (backend: Django+DRF, frontend: Next.js)."
applyTo: "**"
---

Propósito
---------

Este arquivo contém instruções persistentes para o desenvolvimento da aplicação web de finanças pessoais. Aplica-se ao repositório inteiro e deve guiar decisões de arquitetura, endpoints, fluxos de autenticação, práticas de CI/CD e padrões de implementação.

Linguagem e tom
- Preferir português (PT-BR) nas mensagens, issues e commits explicativos.

Requisitos funcionais (resumo)
- **Autenticação:** sistema com login e senha.
- **Landing:** página de apresentação do produto (site público).
- **Categorias:** CRUD de categorias (receitas/despesas).
- **Lançamentos:** cadastrar receitas e despesas (incluindo despesas recorrentes).
- **Dashboard:** painel com filtros (período, categoria, tipo, recorrência, valor).
- **Perfil:** página e API de perfil do usuário.
- **Análise de perfil:** endpoints para análise/comportamento financeiro com base em receitas e despesas.

Requisitos não funcionais
- **Backend:** Django + Django REST Framework.
- **Autenticação:** JWT (access + refresh). Indicar estratégia segura para armazenamento do token.
- **Frontend:** React com Next.js.
- **Arquitetura:** seguir os princípios do 12-factor app (config via env, logs stdout, processos stateless, backing services como recursos anexáveis).
- **CI/CD & Qualidade:** Jenkins para pipeline; integração com SonarQube para análise estática.

Diretivas de implementação (backend)
- Estrutura de projeto: usar apps Django por domínio (accounts, transactions, categories, analytics).
- Banco de dados recomendado: PostgreSQL (migrável via Django Migrations).
- Autenticação: usar `djangorestframework-simplejwt` ou similar; implementar refresh token e blacklisting de refresh quando necessário.
- Segurança: senhas com `PBKDF2` (padrão Django), validação de senha, rate-limiting em endpoints de auth.
- Endpoints RESTful: usar ViewSets + Routers do DRF; versionamento via URL (ex: `/api/v1/`).
- Serializers claros e separados entre leitura/escrita quando necessário.
- Filtros e paginação: usar `django-filter` e paginação configurável para listas grandes.
- Despesas recorrentes: modelo com campos `frequency`, `start_date`, `end_date` e um processo que gera lançamentos (ver seção de tarefas agendadas).

Diretivas de implementação (frontend)
- Estrutura: Next.js com rotas por página (landing, auth, dashboard, profile, categories, transactions).
- Autenticação: preferir HttpOnly cookies para armazenar tokens de acesso/refresh quando possível; se usar storage no cliente, documentar riscos e mitigar XSS.
- Estado: usar SWR/React Query ou similar para fetching e caching das APIs.
- Proteção de rotas: middleware que verifica auth no servidor (SSR) e cliente.
- Componentes reutilizáveis: botão, formulário, inputs de valor, seletores de data, gráficos (Chart.js ou Recharts).

Tarefa agendada e processamento de recorrentes
- Preferência por Celery + Redis como worker para gerar lançamentos recorrentes e enviar notificações. Se ambiente mais simples, documentar uma alternativa baseada em cron jobs.

CI/CD e Qualidade
- Jenkins pipeline deve executar: lint (backend: flake8/isort/black; frontend: eslint/prettier), testes unitários, build frontend, análise SonarQube, publishing de imagem Docker se aprovado.
- Pipeline de PR: rodar testes e analysis; bloqueio de merge em qualidade insuficiente.

Observabilidade e Deploy
- Logs para stdout/stderr, usar formato JSON quando integrado a sistemas de log centralizados.
- Health checks e métricas simples (ping, fila de tarefas pendentes).

Práticas de codificação e revisão
- Tests: backend com pytest-django, cobertura mínima 80% em módulos críticos; frontend com Jest/React Testing Library.
- Commits: mensagens curtas + descrição; seguir convenção `feat/bugfix/docs` no título.
- Documentação mínima: README com como rodar localmente (dev), endpoints importantes, variáveis de ambiente essenciais.

Exemplos de endpoints recomendados (REST)
- `POST /api/v1/auth/login/` -> recebe email+senha, retorna `access` e `refresh` JWT.
- `POST /api/v1/auth/refresh/` -> troca refresh por novo access.
- `GET /api/v1/categories/` -> listar categorias do usuário.
- `POST /api/v1/transactions/` -> criar receita/despesa (campos: amount, category, date, type, recurring? etc.).
- `GET /api/v1/dashboard/?start=YYYY-MM-DD&end=YYYY-MM-DD&category=ID` -> dados agregados para o dashboard.

Exemplos de prompts para o agente
- "Implemente o endpoint `POST /api/v1/transactions/` no Django + DRF: validações, serializer, testes unitários e docs Swagger." 
- "Crie o componente Next.js para o Dashboard que consome `/api/v1/dashboard/` e suporta filtros por data e categoria." 

- **TypeScript no frontend** Desejam React+Next com JavaScript puro
- **Banco de dados definitivo** PostGresSQL
- **Armazenamento de tokens:** preferem HttpOnly cookies (mais seguro) 
- **Processamento de recorrentes:** usar Celery+Redis
- **Requisitos de internacionalização (moeda/locale)** Portugues-Brasil, moeda BRL.

---
