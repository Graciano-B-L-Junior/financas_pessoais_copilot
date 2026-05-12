# Plano de Migração Frontend: Express → Next.js

## 📋 Resumo Executivo

Reestruturação do frontend de **Express + EJS** para **Next.js + React + TypeScript**, mantendo funcionalidade integral, melhorando performance, testabilidade e experiência do desenvolvedor.

**Impacto estimado:**
- Esforço total: ~80-120h (distribuídas em 6 fases)
- Risco: Médio (mudança estrutural, mas com testes como rede de segurança)
- Bloqueadores: Nenhum (pode ser feito em paralelo com backend)
- ROI: Alto (melhor DX, performance, SEO, manutenibilidade)

---

## 🎯 Objetivos da Migração

1. ✅ Modernizar stack frontend (Next.js 13+, React, TypeScript)
2. ✅ Melhorar performance (SSR, ISR, code splitting automático)
3. ✅ Melhorar testabilidade (React Testing Library vs. Supertest)
4. ✅ Melhorar DX (hot reload, file-based routing, API routes)
5. ✅ Manter compatibilidade 1:1 com specs001-006
6. ✅ Manter autenticação JWT com cookies HttpOnly
7. ✅ Integrar middleware de autenticação do Next.js

---

## 🏗️ Arquitetura Alvo

### Estrutura de Pastas (Next.js 13+ App Router)

```
frontend/
├── .env.local                      # Variáveis de ambiente local
├── .env.example                    # Template de variáveis
├── next.config.js                  # Configuração do Next.js
├── tsconfig.json                   # Configuração TypeScript
├── jest.config.js                  # Atualizado para React Testing Library
├── eslint.config.js                # Estendido para React/TypeScript
├── package.json                    # Atualizado com deps Next.js
│
├── src/
│   ├── app/                        # App Router (Next.js 13+)
│   │   ├── layout.tsx              # Layout raiz
│   │   ├── page.tsx                # Home page (landing)
│   │   ├── error.tsx               # Error boundary
│   │   ├── not-found.tsx           # 404 page
│   │   │
│   │   ├── (auth)/                 # Route group para login/register
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx          # Layout específico
│   │   │
│   │   ├── (protected)/            # Route group para rotas autenticadas
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── categories/[id]/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── transactions/[id]/page.tsx
│   │   │   ├── budgets/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── layout.tsx          # Middleware de autenticação
│   │   │
│   │   └── api/                    # API Routes (se necessário para proxy)
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   └── logout/route.ts
│   │       └── middleware.ts       # Middleware global
│   │
│   ├── components/                 # Componentes React reutilizáveis
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── NavApp.tsx
│   │   ├── form/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── CategoryForm.tsx
│   │   │   └── TransactionForm.tsx
│   │   ├── dashboard/
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── ChartSection.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── table/
│   │   │   ├── TransactionsTable.tsx
│   │   │   └── CategoriesTable.tsx
│   │   └── common/
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── ErrorBanner.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── hooks/                      # React Hooks customizados
│   │   ├── useAuth.ts              # Contexto/estado de autenticação
│   │   ├── useApi.ts               # SWR para chamadas de API
│   │   ├── usePagination.ts
│   │   └── useForm.ts
│   │
│   ├── lib/                        # Funções utilitárias
│   │   ├── api.ts                  # Cliente Axios/Fetch
│   │   ├── auth.ts                 # Lógica de autenticação
│   │   ├── validators.ts           # Validações de formulário
│   │   ├── formatters.ts           # Formatação de dados (moeda, data)
│   │   └── session.ts              # Gerenciamento de sessão/cookies
│   │
│   ├── types/                      # Tipos TypeScript
│   │   ├── api.ts                  # Tipos de resposta da API
│   │   ├── user.ts
│   │   ├── transaction.ts
│   │   ├── category.ts
│   │   └── budget.ts
│   │
│   ├── context/                    # React Context para estado global
│   │   └── AuthContext.tsx         # Contexto de autenticação
│   │
│   ├── middleware.ts               # Middleware global do Next.js
│   └── config/                     # Configuração de ambiente
│       └── env.ts                  # Validação e export de env vars
│
├── public/                         # Assets estáticos
│   ├── css/
│   │   └── styles.css              # Estilos globais
│   └── images/
│
└── tests/                          # Testes com Jest + React Testing Library
    ├── components/
    │   ├── LoginForm.test.tsx
    │   ├── Dashboard.test.tsx
    │   └── ...
    ├── hooks/
    │   ├── useAuth.test.ts
    │   └── useApi.test.ts
    ├── lib/
    │   ├── api.test.ts
    │   └── validators.test.ts
    ├── pages/
    │   ├── login.test.tsx
    │   └── dashboard.test.tsx
    └── __mocks__/
        └── handlers.ts             # MSW (Mock Service Worker)
```

### Stack de Dependências

**Remover:**
- express
- ejs
- morgan
- cookie-parser
- supertest
- nodemon

**Adicionar:**
- next@latest
- react@18+
- react-dom@18+
- typescript
- @types/react
- @types/node
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- swr (ou react-query/tanstack-query)
- zod (ou yup para validações)
- tailwindcss (ou css-modules)
- msw (Mock Service Worker para testes)

**Manter:**
- axios (ou substituir por fetch nativo)
- dotenv
- eslint + prettier

---

## 📅 Plano em Fases

### Fase 1: Preparação e Setup (Estimado: 8-10h)

**Objetivo:** Criar ambiente Next.js base e validar build

**Tarefas:**
- [ ] Criar novo projeto Next.js (`npx create-next-app@latest`)
- [ ] Configurar TypeScript
- [ ] Configurar ESLint + Prettier alinhado ao projeto
- [ ] Configurar Jest + React Testing Library
- [ ] Configurar Tailwind CSS ou CSS Modules
- [ ] Setup de variáveis de ambiente (.env.local, .env.example)
- [ ] Criar arquivo `src/config/env.ts` com validação de env vars
- [ ] Criar middleware de autenticação (`src/middleware.ts`)
- [ ] Validar build: `npm run build` sem erros
- [ ] Documentar mudanças no Dockerfile e docker-compose

**Entregáveis:**
- PR #X: Estrutura base do Next.js com build passando
- Dockerfile.dev e Dockerfile atualizados
- docker-compose.yml com volume correto (/app/node_modules)

**Critério de sucesso:**
```bash
npm install
npm run dev  # Servidor rodando em localhost:3000
npm run build  # Build sem erros
npm test  # Jest passando (mesmo que vazio)
```

---

### Fase 2: Autenticação e Layout (Estimado: 15-20h)

**Objetivo:** Implementar login/registro e layout da aplicação

**Tarefas:**
- [ ] Criar `src/types/api.ts` com tipos da API Django
- [ ] Criar `src/lib/api.ts` - cliente HTTP com interceptadores
- [ ] Criar `src/lib/session.ts` - gerenciamento de cookies HttpOnly
- [ ] Criar `src/context/AuthContext.tsx` - contexto global de auth
- [ ] Criar hook `src/hooks/useAuth.ts`
- [ ] Implementar página `app/(auth)/login/page.tsx`
- [ ] Implementar página `app/(auth)/register/page.tsx`
- [ ] Criar componente `components/form/LoginForm.tsx`
- [ ] Criar componente `components/form/RegisterForm.tsx`
- [ ] Implementar `app/(protected)/layout.tsx` com proteção de rotas
- [ ] Criar componente `components/layout/Header.tsx` com nav
- [ ] Implementar logout via API route `app/api/auth/logout/route.ts`
- [ ] Testes para AuthContext, useAuth hook, componentes de form
- [ ] Validar fluxo completo: register → login → protected route

**Entregáveis:**
- PR #X+1: Autenticação completa (login, register, logout)
- Testes de autenticação com >80% cobertura

**Specs impactadas:**
- spec001.md: Validar contrato de auth (/api/v1/auth/*) sem mudanças

**Critério de sucesso:**
```
npm test -- auth  # Testes passando
Login/Register/Logout sem erros
Cookies HttpOnly verificáveis no navegador
Proteção de rotas funcionando (redirect para /login se não autenticado)
```

---

### Fase 3: Páginas Públicas (Estimado: 10-12h)

**Objetivo:** Implementar landing page e páginas de erro

**Tarefas:**
- [ ] Implementar `app/page.tsx` - landing page (ex-landing.ejs)
- [ ] Criar `app/layout.tsx` - layout global
- [ ] Implementar `app/error.tsx` - error boundary
- [ ] Implementar `app/not-found.tsx` - página 404
- [ ] Criar componentes base (Header público, Footer)
- [ ] Adaptar CSS de estilos globais para Tailwind/CSS Modules
- [ ] Testes de páginas públicas

**Entregáveis:**
- PR #X+2: Landing page e páginas de erro

**Critério de sucesso:**
```
Landing page renderiza sem erros
404 page funciona
Error boundary captura erros
CSS renderizado corretamente
```

---

### Fase 4: Dashboard e Filtros (Estimado: 20-25h)

**Objetivo:** Implementar dashboard com filtros e indicadores

**Tarefas:**
- [ ] Criar tipos em `src/types/dashboard.ts`
- [ ] Implementar página `app/(protected)/dashboard/page.tsx`
- [ ] Criar hook `useApi` para SWR/React Query (revalidação automática)
- [ ] Criar componente `components/dashboard/SummaryCard.tsx`
- [ ] Criar componente `components/dashboard/ChartSection.tsx` (gráficos)
- [ ] Criar componente `components/dashboard/FilterBar.tsx`
- [ ] Implementar lógica de filtros (período, tipo de lançamento)
- [ ] Testes para componentes do dashboard
- [ ] Validar integração com API `/api/v1/dashboard/`

**Entregáveis:**
- PR #X+3: Dashboard funcional com filtros

**Specs impactadas:**
- spec004.md: Validar contrato de dashboard sem mudanças

**Critério de sucesso:**
```
npm test -- dashboard  # >80% cobertura
Dashboard carrega dados
Filtros funcionam (período, tipo)
Dados renderizam corretamente
```

---

### Fase 5: CRUD de Recursos (Estimado: 30-35h)

**Objetivo:** Implementar páginas de categorias, lançamentos e budgets

**Tarefas:**

**Categorias:**
- [ ] Página `app/(protected)/categories/page.tsx` - listagem
- [ ] Página `app/(protected)/categories/[id]/page.tsx` - detalhe/edição
- [ ] Componente `components/form/CategoryForm.tsx`
- [ ] Componente `components/table/CategoriesTable.tsx`
- [ ] Testes e validação com spec002

**Lançamentos (Transactions):**
- [ ] Página `app/(protected)/transactions/page.tsx` - listagem
- [ ] Página `app/(protected)/transactions/[id]/page.tsx` - detalhe/edição
- [ ] Componente `components/form/TransactionForm.tsx`
- [ ] Componente `components/table/TransactionsTable.tsx`
- [ ] Suporte para lançamentos recorrentes (select de recorrência)
- [ ] Testes e validação com spec003

**Budgets:**
- [ ] Página `app/(protected)/budgets/page.tsx`
- [ ] Componente `components/form/BudgetForm.tsx`
- [ ] Testes e validação

**Geral:**
- [ ] Implementar validações de formulário com Zod/Yup
- [ ] Implementar componentes de Modal para criação/edição
- [ ] Implementar componentes de Toast para feedback
- [ ] Paginação em tabelas grandes
- [ ] Testes >80% cobertura

**Entregáveis:**
- PR #X+4: CRUD de categorias
- PR #X+5: CRUD de lançamentos
- PR #X+6: CRUD de budgets

**Specs impactadas:**
- spec002.md (categorias): Validar contrato
- spec003.md (lançamentos): Validar contrato, incluindo recorrentes
- spec005.md (se existir para budgets): Validar contrato

**Critério de sucesso:**
```
npm test -- crud  # >80% cobertura
Listar recursos
Criar recurso
Editar recurso
Deletar recurso
Validações de formulário funcionam
```

---

### Fase 6: Perfil, Analytics e Polish (Estimado: 15-20h)

**Objetivo:** Finalizar recursos, melhorias e validação integral

**Tarefas:**
- [ ] Página `app/(protected)/profile/page.tsx` - perfil do usuário
- [ ] Componente `components/form/ProfileForm.tsx`
- [ ] Página `app/(protected)/analytics/page.tsx` - análise de perfil
- [ ] Componentes para gráficos avançados (se spec006 exigir)
- [ ] Testes para perfil e analytics
- [ ] Melhorias de UX/UI (dark mode, responsividade, acessibilidade)
- [ ] Otimizações de performance (lazy loading, image optimization)
- [ ] Revisar e atualizar SEO (meta tags, Open Graph)
- [ ] Testes E2E (Playwright/Cypress opcional)
- [ ] Atualizar CI/CD para rodar testes Next.js
- [ ] Validação cruzada com specs 005 e 006

**Entregáveis:**
- PR #X+7: Perfil e Analytics
- PR #X+8: Melhorias de performance, acessibilidade e SEO

**Specs impactadas:**
- spec005.md (perfil): Validar contrato
- spec006.md (analytics): Validar contrato

**Critério de sucesso:**
```
npm test -- profile  # >80% cobertura
npm test -- analytics  # >80% cobertura
npm run build  # Sem warnings
Lighthouse score: >80 (Performance, Accessibility)
```

---

## 🔄 Checklist por Fase (PR Review)

### Antes de Merge

- [ ] Tests passam localmente (`npm test`)
- [ ] Build passa (`npm run build`)
- [ ] Lint passa (`npm run lint`)
- [ ] SonarQube analysis aprovada
- [ ] Cobertura de testes ≥75% (frontend)
- [ ] Funcionalidade validada contra spec correspondente
- [ ] Sem console errors/warnings (exceto dev logs esperados)
- [ ] Responsividade validada (mobile, tablet, desktop)
- [ ] Acessibilidade testada (tab navigation, screen reader)

### Antes de Deploy

- [ ] Docker build passa
- [ ] docker-compose up funciona
- [ ] Variáveis de ambiente documentadas
- [ ] Migração de dados (se houver) documentada
- [ ] Rollback plan documentado
- [ ] Performance testada (Lighthouse, bundle size)

---

## ⚠️ Riscos e Mitiguação

| Risco | Probabilidade | Impacto | Mitiguação |
|-------|---------------|--------|-----------|
| Compatibilidade CSS quebrada | Média | Médio | Testar responsividade em cada fase; usar CSS Modules |
| Testes incompletos | Média | Médio | Exigir ≥75% cobertura antes de merge |
| Regressão em autenticação | Baixa | Alto | Validação cruzada com backend; testes de integração |
| Performance degradada | Baixa | Médio | Auditar bundle size; usar Next.js analytics |
| Variáveis de ambiente perdidas | Baixa | Médio | Documentar todas as env vars em .env.example |

---

## 📊 Métricas de Sucesso

- ✅ 100% das specs validadas (001-006)
- ✅ Cobertura de testes ≥75% (frontend)
- ✅ Build time <60s
- ✅ Bundle size <300KB (gzipped)
- ✅ Lighthouse Performance ≥80
- ✅ 0 console errors em produção
- ✅ Tempo de carregamento FCP <2s

---

## 🛠️ Próximos Passos

1. **Validar este plano** com stakeholders (arquiteto, especialista frontend, especialista backend)
2. **Criar tracking**: Adicionar cards/issues por fase no repositório
3. **Iniciar Fase 1**: Setup base do Next.js
4. **Revisar specs**: Confirmar que todos os contratos são conhecidos antes de Fase 2
5. **Documentar**: README com instruções de dev (npm run dev, npm test, etc)

---

## 📚 Referências

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [TypeScript React Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- Specs do projeto: `.github/especificacoes/`
- Instruções do projeto: `.github/copilot.instructions.md`

---

**Autor:** Arquiteto  
**Data:** 2026-05-12  
**Status:** Pronto para Aprovação e Execução
