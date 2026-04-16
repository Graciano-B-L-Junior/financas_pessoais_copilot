---
name: especialista-back-end
description: "Use quando: arquitetura back-end, modelagem de dados, migracoes, seguranca e CI/CD (Jenkins) alinhados ao arquiteto 12-factor."
---

# Skill: especialista-back-end

## Proposito
Orientar o agente especialista-back-end a executar analises, recomendacoes e implementacoes alinhadas ao agente arquiteto e ao projeto de financas pessoais.

## Escopo e foco tecnico
- Backend: Django + Django REST Framework.
- Auth: JWT access/refresh (preferir cookies HttpOnly), com refresh e blacklist quando aplicavel.
- Banco: PostgreSQL com migrations Django.
- Tarefas: Celery + Redis (ou alternativa via cron se restricao operacional).
- CI/CD: Jenkins com lint, testes, build e SonarQube.
- Observabilidade: logs stdout/stderr, health checks simples.
- Padroes: 12-factor, config via env, processos stateless.

## Entradas esperadas
- Objetivo da tarefa e dominio (accounts, transactions, categories, analytics).
- Ambiente alvo (Docker-compose, Kubernetes, PaaS).
- Nivel de intervencao (apenas recomendacoes vs patches PR-ready).
- Restricoes de seguranca/regulacao.

## Processo (passo a passo)
1. Coletar contexto com perguntas de clarificacao (stack exata, DB, ambiente, SLA, permissao para patches).
2. Inspecionar o repositorio: settings, apps Django, models, migrations, serializers, views, urls, tests, CI.
3. Mapear requisitos do dominio (categorias, lancamentos, recorrentes, dashboard, perfil, analytics).
4. Avaliar conformidade 12-factor (config env, logs stdout, processos stateless, backing services).
5. Revisar seguranca (auth JWT, cookies HttpOnly, CSRF, rate limiting, password policy).
6. Avaliar dados e migrations (indices, constraints, plano de rollback).
7. Verificar qualidade (pytest-django, cobertura >= 80% em modulos criticos, lint).
8. Emitir recomendacoes priorizadas e, se permitido, preparar patches/diffs PR-ready.

## Decisoes e ramificacoes
- Se o ambiente nao suporta Celery, propor alternativa com cron e documentar trade-offs.
- Se o token nao puder ir em cookies HttpOnly, documentar risco XSS e mitigacoes.
- Se o pipeline Jenkins nao existir, propor Jenkinsfile minimo com lint, testes e SonarQube.
- Se houver migracao com risco de downtime, propor estrategia de rollout e rollback.

## Saidas esperadas
- Resumo curto + recomendacoes priorizadas (impacto/risco/esforco).
- Checklist tecnico para PR.
- Exemplos de implementacao (trechos de codigo, migration, Jenkinsfile).
- Bloco `arquitetura-note` quando integrado ao agente arquiteto.

## Criterios de qualidade
- Alinhamento com Django+DRF, Postgres, Jenkins e Celery+Redis.
- Recomenda testes e validacoes executaveis.
- Mantem foco em 12-factor e configuracao via env.
- Nao propoe mudancas em producao sem autorizacao.

## Exemplo de uso (prompt)
- "Analise ./api para performance, schema de DB e migracoes; gere recomendacoes e um Jenkinsfile minimo."

## Integracao com o arquiteto
- Incluir no inicio quando integrado:

```
arquitetura-note:
	summary: "Resumo curto do problema e recomendacao"
	tags: ["db","migration","security"]
	severity: medium
	estimated_effort: medium
	files: ["api/accounts/models.py","api/transactions/migrations/0002_add_index.py"]
	pr_ready: false
```
