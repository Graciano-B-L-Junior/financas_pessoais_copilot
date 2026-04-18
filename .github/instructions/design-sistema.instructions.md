---
description: "Use quando criar ou editar páginas, componentes, layouts ou estilos do frontend. Define paleta de cores, tipografia, espaçamento, componentes e padrões de layout do sistema de finanças pessoais."
applyTo: "**/*.{js,jsx,css}"
---

# Sistema de Design — Finanças Pessoais

## Paleta de Cores

### Cores Primárias (Verde)
```css
--color-primary-900: #1A3C2B;   /* Verde escuro — sidebar ativa, cards hero, botões primários */
--color-primary-700: #2E6B4A;   /* Verde médio — hover de botões, bordas de destaque */
--color-primary-500: #4CAF7A;   /* Verde claro — gráficos, indicadores, badges "Concluído" */
--color-primary-100: #D1FAE5;   /* Verde muito claro — fundos de badges e alertas de sucesso */
```

### Cores Neutras
```css
--color-neutral-50:  #F5F7F5;   /* Fundo geral da página */
--color-neutral-100: #F0F2F0;   /* Fundo de cards e painéis */
--color-neutral-200: #E5E7EB;   /* Bordas de cards, divisores */
--color-neutral-500: #6B7280;   /* Texto secundário, labels, placeholders */
--color-neutral-900: #111827;   /* Texto primário, títulos */
--color-white:       #FFFFFF;   /* Fundo de cards, sidebar, header */
```

### Status / Badges
```css
--color-status-success: #22C55E;  /* Concluído */
--color-status-warning: #EAB308;  /* Em Progresso */
--color-status-pending: #F97316;  /* Pendente */
--color-status-danger:  #EF4444;  /* Erro, exclusão */
```

---

## Tipografia

- **Fonte principal:** `Inter`, `Segoe UI`, `sans-serif` (sem serifa, moderna e legível)
- **Tamanhos:**
  - Títulos de página: `1.75rem` (28px), peso `700`
  - Subtítulos de seção: `1rem` (16px), peso `600`
  - Rótulos / labels: `0.875rem` (14px), peso `500`, cor `--color-neutral-500`
  - Corpo de texto: `0.875rem` (14px), peso `400`
  - Números destacados (métricas): `2.25rem` (36px), peso `700`

---

## Layout Geral

### Estrutura de Página
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (220px fixo)  │  Header (topo, fixo)        │
│                       ├─────────────────────────────┤
│  Logo                 │  Conteúdo principal          │
│  Nav items            │  (área de scroll)            │
│  ---                  │                             │
│  Settings             │                             │
│  Help                 │                             │
│  Logout               │                             │
└───────────────────────┴─────────────────────────────┘
```

### Sidebar
- Largura: `220px`, fixa à esquerda
- Fundo: `--color-white`
- Borda direita: `1px solid --color-neutral-200`
- **Item ativo:** borda esquerda `3px solid --color-primary-900`, fundo `--color-neutral-100`, texto `--color-primary-900`
- **Item inativo:** texto `--color-neutral-500`, sem borda, fundo transparente
- Seções separadas por rótulos em caixa-alta: `MENU`, `GERAL`
- Logo no topo com ícone circular verde + nome do produto

### Header / Topbar
- Altura: `64px`, fundo `--color-white`, borda inferior `1px solid --color-neutral-200`
- Contém: barra de busca (centro-esquerda), ícones de ação (direita), avatar + nome do usuário (extrema direita)
- Barra de busca: bordas arredondadas (`border-radius: 8px`), fundo `--color-neutral-50`

### Área de Conteúdo
- Padding: `24px`
- Fundo: `--color-neutral-50`
- Usa grid de 12 colunas com gap de `16px`

---

## Componentes

### Cards de Métricas (Stats Cards)
- Fundo branco (`--color-white`) ou verde-escuro (`--color-primary-900`) para o card de destaque
- `border-radius: 16px`
- `padding: 20px`
- Sombra sutil: `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`
- Número grande (36px, negrito) + label pequeno + indicador de tendência (ícone + texto)
- Ícone de link (`↗`) no canto superior direito

**Card de destaque (hero):**
- Fundo `--color-primary-900`, texto branco
- Badge de indicador: verde-claro com ícone de seta

### Botões
```css
/* Primário */
.btn-primary {
  background: var(--color-primary-900);
  color: #fff;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 0.875rem;
}
.btn-primary:hover { background: var(--color-primary-700); }

/* Secundário / Outline */
.btn-secondary {
  background: transparent;
  color: var(--color-neutral-900);
  border: 1px solid var(--color-neutral-200);
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 0.875rem;
}
.btn-secondary:hover { background: var(--color-neutral-100); }
```

### Badges de Status
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-success  { background: #D1FAE5; color: #166534; }
.badge-warning  { background: #FEF9C3; color: #854D0E; }
.badge-pending  { background: #FFEDD5; color: #9A3412; }
```

### Gráficos (Chart.js / Recharts)
- Barras: alternar entre `--color-primary-900` e `--color-primary-500`
- Barras inativas/futuras: usar padrão de hachura (`PatternFill` ou CSS `background-image: repeating-linear-gradient`)
- Fundo do gráfico: transparente; sem bordas de grade excessivas
- Eixos: texto `--color-neutral-500`, tamanho `12px`

### Formulários e Inputs
- `border: 1px solid --color-neutral-200`
- `border-radius: 8px`
- `padding: 10px 14px`
- Foco: `border-color: --color-primary-500`, `outline: none`, `box-shadow: 0 0 0 3px --color-primary-100`
- Label acima do campo, `font-size: 0.875rem`, `font-weight: 500`

### Tabelas / Listas de Itens
- Linhas separadas por `border-bottom: 1px solid --color-neutral-100`
- Avatar circular do usuário: `32px` de diâmetro
- Nome em negrito + descrição da tarefa em `--color-neutral-500`
- Badge de status alinhado à direita

### Time Tracker / Widget especial
- Fundo `--color-primary-900`, texto branco
- Fonte de relógio: monospace, tamanho `2rem`, negrito
- Botões de controle (pausar/parar): ícones circulares brancos

---

## Espaçamento e Border Radius

| Token           | Valor    | Uso                                   |
|----------------|----------|---------------------------------------|
| `--space-1`    | `4px`    | Gaps internos mínimos                 |
| `--space-2`    | `8px`    | Padding de badges, gaps de ícones     |
| `--space-3`    | `12px`   | Padding interno de botões (vertical)  |
| `--space-4`    | `16px`   | Gap de grid, padding de listas        |
| `--space-5`    | `20px`   | Padding de cards                      |
| `--space-6`    | `24px`   | Padding da área de conteúdo           |
| `--radius-sm`  | `8px`    | Botões, inputs, cards pequenos        |
| `--radius-md`  | `12px`   | Cards de seção                        |
| `--radius-lg`  | `16px`   | Cards de métricas, modais             |
| `--radius-full`| `999px`  | Badges, avatares, pills               |

---

## Iconografia

- Preferir ícones de linha (`stroke`), peso fino a médio (ex.: Heroicons, Feather Icons, Lucide)
- Tamanho padrão: `20px` (nav), `16px` (inline), `24px` (destaque)
- Cor dos ícones inativos: `--color-neutral-500`
- Cor dos ícones ativos/primários: `--color-primary-900`

---

## Responsividade

- **Desktop (≥1024px):** layout completo com sidebar fixa
- **Tablet (768px–1023px):** sidebar recolhida (apenas ícones), conteúdo expandido
- **Mobile (<768px):** sidebar como drawer/overlay; stats cards em coluna única

---

## Boas Práticas

- Usar variáveis CSS (`var(--color-primary-900)`) em todos os estilos — nunca cores hardcoded.
- Todo novo componente deve respeitar a paleta e os tokens de espaçamento acima.
- Manter contraste mínimo WCAG AA (4.5:1) para texto sobre fundo.
- Animações: `transition: 150ms ease` para hover/focus; evitar animações complexas sem motivo.
- Moeda exibida sempre em BRL com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
