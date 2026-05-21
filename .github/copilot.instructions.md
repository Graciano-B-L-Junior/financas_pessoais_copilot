---
name: aplicacao-financas-instructions
description: "Instruções de projeto para o agente — aplicação web de finanças pessoais (backend: Django+DRF, frontend: Next.js, App Router, TypeScript e React)."
applyTo: "**"
---

Propósito
---------

Este arquivo define as regras permanentes do projeto e vale para todo o repositório. Ele existe para evitar interpretações diferentes sobre arquitetura, contratos de API, fluxos, validações e stack técnica.

Prioridade das fontes
- A fonte de verdade funcional e de contrato é a pasta `.github/especificacoes/`.
- Se houver conflito entre este arquivo e uma spec, a spec do módulo vence.
- Se houver conflito entre uma implementação e a spec, a implementação deve ser ajustada para obedecer à spec.
- Se uma regra importante não estiver descrita em nenhuma spec, a spec correspondente deve ser criada ou atualizada antes da implementação.

Mapa de especificações
- `spec001.md`: autenticação e cadastro.
- `spec002.md`: categorias.
- `spec003.md`: lançamentos.
- `spec004.md`: dashboard.
- `spec005.md`: perfil.
- `spec006.md`: análise de perfil.
- `spec007.md`: orçamento de gastos.
- `spec008.md`: importação e exportação de planilhas.

Regra de uso das specs
- Antes de alterar qualquer módulo, ler a spec correspondente.
- Antes de criar um endpoint, payload, validação ou fluxo, confirmar se isso já está definido na spec.
- Antes de remover ou alterar comportamento existente, verificar o impacto na spec do módulo.
- Quando uma mudança de código alterar regra, resposta, campo, filtro ou erro, a spec do módulo deve ser atualizada na mesma entrega.

Linguagem e tom
- Preferir português (PT-BR) nas mensagens, issues e commits explicativos.

Requisitos funcionais (resumo)
- **Autenticação:** cadastro, login, refresh e logout.
- **Landing:** página pública de apresentação do produto.
- **Categorias:** CRUD de categorias de receita e despesa.
- **Lançamentos:** CRUD de receitas e despesas, incluindo recorrentes.
- **Dashboard:** visão consolidada com filtros.
- **Perfil:** consulta e atualização de dados do usuário.
- **Análise de perfil:** indicadores e insights financeiros.
- **Orçamentos:** registro e acompanhamento de limites de gastos mensais gerais e por categoria.
- **Planilhas:** importação, exportação e download de template XLSX do formato legado.

Requisitos não funcionais
- **Backend:** Django + Django REST Framework.
- **Autenticação:** JWT (access + refresh). Indicar estratégia segura para armazenamento do token.
- **Frontend:** Next.js (App Router) com TypeScript e React.
- **Arquitetura:** seguir os princípios do 12-factor app (config via env, logs stdout, processos stateless, backing services como recursos anexáveis).
- **CI/CD & Qualidade:** Jenkins para pipeline; integração com SonarQube para análise estática.

Diretivas de implementação (backend)
- Estrutura de projeto: usar apps Django por domínio, no mínimo `accounts`, `categories`, `transactions` e `analytics`.
- Banco de dados: PostgreSQL.
- Migrações: toda alteração estrutural de dados deve ser feita com migrations do Django.
- Autenticação: usar JWT com access e refresh; o refresh pode usar blacklist quando o fluxo exigir revogação.
- Armazenamento de token: preferir cookies `HttpOnly` para tokens quando houver camada web que suporte esse fluxo.
- Segurança de senha: usar o validador e hasher padrão do Django; senhas devem seguir a política definida nas specs.
- Rate limiting: aplicar proteção nos endpoints de autenticação quando disponível na base do projeto.
- API: versionar os endpoints em `/api/v1/`.
- Serializers e responses: separar leitura e escrita quando isso reduzir ambiguidade do contrato.
- Filtros e paginação: usar `django-filter` e paginação configurável para coleções grandes.
- Regras de domínio: categorias e lançamentos devem respeitar propriedade do usuário, tipo do lançamento e status ativo conforme a spec correspondente.
- Recorrência: lançamentos recorrentes devem ser compatíveis com Celery + Redis; se isso não estiver disponível no ambiente, documentar a alternativa com cron job antes de implementar.

Diretivas de implementação (frontend)
- Framework: Next.js com React (versão 13+, uso obrigatório do App Router).
- Linguagem: TypeScript (uso obrigatório) para segurança de tipos e qualidade de código.
- Organização obrigatória: componentes reutilizáveis, hooks customizados, serviços de API, layout e páginas conforme estrutura do Next.js.
- Autenticação: usar cookies `HttpOnly` para armazenar JWT; implementar middleware do Next.js para validação em rotas protegidas.
- Consumo de API: usar `fetch` nativo, `axios` ou bibliotecas como `SWR`/`React Query` para gerenciamento de estado assíncrono.
- Proteção de rotas: usar middleware do Next.js para validar autenticação e redirecionamento; proteger endpoints da API com middlewares.
- Interface: usar React com componentes reutilizáveis, CSS Modules ou bibliotecas como Tailwind CSS, seguindo boas práticas de UX e acessibilidade.
- Renderização: aproveitar Server Components do Next.js quando apropriado para melhor performance e SEO.

Tarefa agendada e processamento de recorrentes
- Preferência por Celery + Redis como worker para gerar lançamentos recorrentes e enviar notificações. Se ambiente mais simples, documentar uma alternativa baseada em cron jobs.

CI/CD e Qualidade
- Jenkins pipeline deve executar: lint (backend: flake8/isort/black; frontend: eslint/prettier), testes unitários, build frontend, análise SonarQube, publishing de imagem Docker se aprovado.
- Frontend: executar build Next.js (`next build`) e testes de componentes com Jest/React Testing Library.
- Pipeline de PR: rodar testes e analysis; bloqueio de merge em qualidade insuficiente.

Observabilidade e Deploy
- Logs para stdout e stderr.
- Quando necessário, usar formato JSON nos logs.
- Expor health checks simples para aplicação e para fila de tarefas.
- Manter processos stateless sempre que possível.

Práticas de codificação e revisão
- Tests: backend com pytest-django, cobertura mínima 80% em módulos críticos; frontend com Jest e React Testing Library, cobertura mínima 75% em componentes críticos.
- Commits: mensagens curtas e descritivas; seguir convenção `feat/bugfix/docs` no título.
- Documentação mínima: README com como rodar localmente (incluindo `npm install` e `npm run dev`), endpoints importantes e variáveis de ambiente essenciais.
- Specs: qualquer mudança em endpoint, regra de negócio, payload, filtro, resposta ou fluxo deve ser refletida no arquivo de spec correspondente.

Regras de contrato de API
- Respostas de sucesso e erro devem seguir o formato definido na spec do módulo.
- Campos obrigatórios, opcionais e tipos de dados devem ser os mesmos da spec.
- Mensagens de erro devem ser objetivas e em português do Brasil.
- Não adicionar campos novos em resposta sem atualizar a spec.
- Não omitir campos descritos na spec sem justificar e atualizar a spec.

Exemplos de endpoints recomendados (REST)
- `POST /api/v1/auth/login/` recebe email e senha e retorna access e refresh.
- `POST /api/v1/auth/refresh/` troca refresh por um novo access.
- `GET /api/v1/categories/` lista as categorias do usuário autenticado.
- `POST /api/v1/transactions/` cria um lançamento de receita ou despesa.
- `GET /api/v1/dashboard/` retorna os indicadores consolidados do usuário.

Exemplos de prompts para o agente
- "Implemente o endpoint `POST /api/v1/transactions/` no Django + DRF de acordo com a spec003, incluindo validações e testes."
- "Crie a página do dashboard no Next.js conforme a spec004, com filtros e consumo da API REST compatível com a especificação, incluindo testes de componentes."

Regras fixas do projeto
- Frontend obrigatoriamente com Next.js (App Router), TypeScript e React.
- Backend exclusivamente em Django + DRF.
- Banco de dados definitivo: PostgreSQL.
- Tokens: preferir cookies `HttpOnly`.
- Recorrentes: usar Celery + Redis quando disponível.
- Locale e moeda: português do Brasil e BRL.
- Tipo e validações: usar TypeScript no frontend para melhor segurança de tipos.

---
