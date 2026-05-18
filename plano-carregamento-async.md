# Plano de Implementação: Feedback Visual para Operações Assíncronas

## 1. Visão Geral
Como a aplicação utiliza **Next.js (App Router)** e faz integração com uma API externa (Django backend), diversas telas processam dados de forma assíncrona. O objetivo deste plano é padronizar os estados de carregamento (loading states) em todas as exibições de dados assíncronos, melhorando a percepção de performance e a experiência do usuário (UX).

## 2. Mecanismos Arquiteturais

A estratégia se baseará em três pilares principais do ecossistema Next.js/React:

1. **`loading.tsx` (React Suspense fallback nativo):** Para carregamento em transições de páginas inteiras.
2. **`<Suspense fallback={<Skeleton />}>`:** Para carregamentos parciais de seções específicas de uma página (ex: gráficos pesados).
3. **`pending` flag (via `useActionState` ou `useFormStatus`):** Para o envio de formulários (Server Actions) em Client Components.

## 3. Criação de Componentes Base (UI)

Antes de aplicar às páginas, os seguintes componentes genéricos devem ser criados em `src/components/ui/`:

- **`<Spinner />`**: Um indicador de loading circular, animado em CSS, para ações restritas (ex: dentro de um botão ou em blocos menores).
- **`<Skeleton />`**: Um bloco animado (efeito "pulsar") que simula o espaço que os dados irão ocupar antes do carregamento completo.
  - Variações: `<Skeleton type="text" />`, `<Skeleton type="card" />`, `<Skeleton type="table" />`.

## 4. Mapeamento e Intervenções por Rota

### 4.1. Dashboard (`/dashboard`)
- **Arquivo a criar:** `src/app/(protected)/dashboard/loading.tsx`
- **Comportamento:** O dashboard carrega várias métricas e gráficos consolidados. O `loading.tsx` deve exibir 6 `Skeleton cards` nas métricas principais e uma grande caixa de `Skeleton` no lugar do gráfico de "Receitas vs Despesas".

### 4.2. Lançamentos (`/lancamentos` e `/lancamentos/[id]`)
- **Arquivo a criar:** `src/app/(protected)/lancamentos/loading.tsx`
- **Comportamento:** Exibirá um `Skeleton table` contendo linhas fantasmas, indicando que a lista de transações está sendo carregada a partir do banco.
- **Formulário de Edição:** Se o formulário estiver buscando detalhes (na rota `/[id]`), a subpágina também deve ter seu próprio fallback caso o request demore.

### 4.3. Categorias (`/categorias`)
- **Arquivo a criar:** `src/app/(protected)/categorias/loading.tsx`
- **Comportamento:** Exibirá um componente `Skeleton` em formato de lista ou tabela.

### 4.4. Orçamento (`/orcamento`)
- **Arquivo a criar:** `src/app/(protected)/orcamento/loading.tsx`
- **Comportamento:** A página orçamentos requer cálculos complexos (verificar realizado do mês). O loading deve exibir Skeletons na barra de resumo e na listagem principal.

### 4.5. Análises (`/analises`)
- **Arquivo a criar:** `src/app/(protected)/analises/loading.tsx`
- **Comportamento:** Similar ao Dashboard, exibirá skeletons estruturados para as métricas rápidas e na listagem de "Top categorias".

## 5. Mapeamento de Client Actions (Formulários)

Muitos formulários já implementam o parâmetro `disabled={pending}` nos botões. A proposta é reforçar isso visualmente.
- Onde houver botão de salvar (`<button type="submit">`), substituir o texto de "Salvando..." por um componente `<Spinner />` acoplado ao lado do texto.
- **Intervenções:**
  - `src/components/forms/TransactionForm.tsx`
  - `src/components/forms/CategoryForm.tsx`
  - `src/components/forms/BudgetForm.tsx`
  - `src/components/forms/RegisterForm.tsx`
  - `src/components/forms/LoginForm.tsx`

## 6. Passos de Execução Recomendada (Roadmap)

1. **Passo 1:** Criar e estilizar os componentes de UI puros: `Spinner` e `Skeleton`.
2. **Passo 2:** Ajustar os botões de Client Actions nos formulários para utilizar o `Spinner`.
3. **Passo 3:** Criar os arquivos `loading.tsx` usando os componentes Skeleton para cada rota protegida.
4. **Passo 4:** Validar a experiência de rede lenta utilizando o *Network Throttling* do DevTools do navegador.
