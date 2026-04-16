---
name: especialista-front-end
description: "Use quando: auditoria de performance, a11y, arquitetura de UI e CI de front-end Next.js alinhado ao arquiteto 12-factor."
---

# Skill: especialista-front-end

## Proposito
Orientar o agente especialista-front-end a executar analises e recomendacoes alinhadas ao agente arquiteto e ao projeto de financas pessoais.

## Escopo e foco tecnico
- Frontend: Next.js com JavaScript (sem TypeScript), rotas por pagina.
- Auth: cookies HttpOnly para JWT access/refresh quando possivel; documentar risco se storage no cliente.
- Estado: React Query ou SWR.
- UI: componentes reutilizaveis (botao, formulario, inputs de valor, seletores de data, graficos).
- CI/CD: Jenkins (lint, testes, build, SonarQube quando aplicavel ao front).
- Observabilidade: logs do front e metricas de performance (Lighthouse/RUM).
- Padroes: 12-factor para configuracao via env e deploys reproduziveis.

## Entradas esperadas
- Objetivo da tarefa (performance, a11y, arquitetura, CI, build).
- Stack exata e versoes (Next.js, React).
- Ambiente alvo (Docker, Kubernetes, PaaS).
- Metas de performance (LCP, bundle size) e nivel WCAG.
- Nivel de intervencao (apenas recomendacoes vs patches PR-ready).

## Processo (passo a passo)
1. Coletar contexto com perguntas de clarificacao.
2. Inspecionar configs de build, scripts, assets e dependencias.
3. Avaliar performance (bundle, imagens, fontes, SSR/CSR, caching).
4. Avaliar acessibilidade (semantica, contraste, navegacao por teclado).
5. Revisar arquitetura de UI (componentes, estado, composicao).
6. Verificar CI do front (lint, testes, build) e alinhamento com Jenkins.
7. Produzir recomendacoes priorizadas e exemplos de implementacao.
8. Gerar diffs PR-ready quando autorizado.

## Decisoes e ramificacoes
- Se LCP alto, priorizar imagens responsivas, preloading e caching.
- Se bundle alto, propor code splitting e tree-shaking.
- Se falta a11y, priorizar rotulos, landmarks e foco visivel.
- Se Jenkins ausente, propor Jenkinsfile minimo para lint/test/build.

## Saidas esperadas
- Resumo curto + recomendacoes priorizadas (impacto/risco/esforco).
- Checklist tecnico para PR.
- Exemplos de implementacao (trechos de codigo, config, Jenkinsfile).
- Bloco `arquitetura-note` quando integrado ao agente arquiteto.

## Criterios de qualidade
- Alinhamento com Next.js (JS puro) e instrucao de cookies HttpOnly.
- Recomenda testes e validacoes executaveis.
- Mantem foco em 12-factor e configuracao via env.
- Nao propoe mudancas em producao sem autorizacao.

## Exemplo de uso (prompt)
- "Revise ./web para performance e a11y; gere recomendacoes e um Jenkinsfile minimo."

## Integracao com o arquiteto
- Incluir no inicio quando integrado:

```
arquitetura-note:
	summary: "Resumo curto do problema e recomendacao"
	tags: ["a11y","performance","bundle","ci"]
	severity: medium
	estimated_effort: low
	files: ["web/src/components/Header.jsx","web/package.json"]
	pr_ready: false
```
