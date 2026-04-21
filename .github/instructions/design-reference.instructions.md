---
description: "Use quando: criar, revisar ou auditar componentes de UI, páginas, temas, estilos CSS/Tailwind, dashboards, gráficos e layouts para o front-end. Define o sistema visual completo da aplicação de finanças pessoais — paleta de cores, tipografia, espaçamento, cards, gráficos, tabelas e navegação."
applyTo: "web/**"
---

# Referência de Design — Dashboard de Finanças Pessoais

Baseada no sistema visual do dashboard "PayMetrics Business Analytics".
Todos os componentes e páginas do front-end DEVEM seguir este guia.

---

## Paleta de Cores

### Primárias
| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#4CAF50` | Botões CTA, item ativo da nav, indicadores positivos |
| `--color-primary-dark` | `#388E3C` | Hover de botões primários |
| `--color-primary-light` | `#81C784` | Badges de tendência positiva, backgrounds sutis |

### Neutras
| Token | Hex | Uso |
|---|---|---|
| `--color-bg-page` | `#F0F2F5` | Fundo da página |
| `--color-bg-card` | `#FFFFFF` | Fundo de cards, tabelas, painéis |
| `--color-bg-sidebar` | `#FFFFFF` | Fundo da sidebar |
| `--color-border` | `#E5E7EB` | Divisores, bordas de cards |
| `--color-text-primary` | `#111827` | Títulos, valores principais |
| `--color-text-secondary` | `#6B7280` | Labels, subtítulos, textos de apoio |
| `--color-text-muted` | `#9CA3AF` | Placeholders, textos desabilitados |

### Status
| Token | Hex | Uso |
|---|---|---|
| `--color-success` | `#4CAF50` | Badge "Concluído / Completed" |
| `--color-warning` | `#F59E0B` | Badge "Pendente / Pending" |
| `--color-danger` | `#EF4444` | Erros, saldos negativos |
| `--color-info` | `#3B82F6` | Informações neutras |

### Gráficos (sequência fixa para consistência)
```
Cor 1 (linha principal / destaque): #4CAF50
Cor 2 (Cartão de Crédito):          #3D5A99  (azul)
Cor 3 (Débito):                      #6B7FD7  (roxo-azulado)
Cor 4 (Carteira Digital):            #81C784  (verde-claro)
Cor 5 (Transferência Bancária):      #F97316  (laranja)
```

---

## Tipografia

- **Família**: `Inter`, fallback `system-ui, sans-serif`
- Importar via `next/font` para otimização automática de carregamento.

| Papel | Tamanho | Peso | Token |
|---|---|---|---|
| Título de página | `24px` | 700 | `text-2xl font-bold` |
| Valor KPI | `28px` | 700 | `text-3xl font-bold` |
| Título de card | `16px` | 600 | `text-base font-semibold` |
| Label / caption | `12px` | 400 | `text-xs` |
| Corpo | `14px` | 400 | `text-sm` |
| Trend badge | `12px` | 500 | `text-xs font-medium` |

---

## Espaçamento e Grid

- **Gap base entre cards**: `24px` (`gap-6`)
- **Padding interno de card**: `24px` (`p-6`)
- **Padding interno de card compacto**: `16px` (`p-4`)
- **Raio de borda de card**: `12px` (`rounded-xl`)
- **Raio de borda de badge/pill**: `9999px` (`rounded-full`)
- **Raio de borda de botão**: `8px` (`rounded-lg`)
- **Sombra de card**: `0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)` → `shadow-sm`

---

## Layout da Página

```
┌──────────────────────────────────────────────────────────────────┐
│  Sidebar (220px fixo)  │  Área principal (flex-1)                │
│  ─────────────────────  │  ─────────────────────────────────────  │
│  Logo + nome            │  Header: título + controles (right)    │
│  Nav items              │  ─────────────────────────────────────  │
│                         │  Grid de KPI cards (4 colunas)        │
│                         │  ─────────────────────────────────────  │
│  ─────────────────────  │  Grid 2 colunas: gráfico principal     │
│  Banner de insight      │  (col-span-2/3) + gráfico doughnut     │
│  (bottom sidebar)       │  ─────────────────────────────────────  │
│                         │  Grid 3 colunas: 2 gráficos + tabela  │
└──────────────────────────────────────────────────────────────────┘
```

- Layout principal: `flex h-screen overflow-hidden`
- Sidebar: `w-[220px] flex-shrink-0`
- Conteúdo: `flex-1 overflow-y-auto bg-[--color-bg-page] p-6`
- Breakpoints responsivos: colapsar sidebar em `< 768px` para menu hambúrguer

---

## Componentes

### Sidebar
- Fundo branco, borda direita `1px solid var(--color-border)`
- Logo no topo com ícone circular + nome + subtítulo
- Items de nav: ícone (20px) + label, `py-3 px-4`, hover `bg-gray-100 rounded-lg`
- Item ativo: `bg-[--color-primary] text-white rounded-lg`
- Banner de insight no fundo: `bg-primary-light/20`, texto pequeno + botão primário

### KPI Card
```
┌─────────────────────────┐
│ Ícone   Label       ··· │  ← header com overflow menu
│─────────────────────────│
│ $127,540                │  ← valor principal (text-3xl font-bold)
│ ↑ +18.2% ao mês         │  ← trend badge verde
└─────────────────────────┘
```
- 4 cards em `grid grid-cols-4 gap-6`
- Ícone: 18px, cor `--color-text-secondary`, dentro de wrapper circular `bg-gray-100`
- Trend positivo: cor `--color-primary`, seta ↑; trend negativo: `--color-danger`, seta ↓

### Gráfico de Linha (Revenue Analytics)
- Biblioteca: **Recharts** (`LineChart` + `ResponsiveContainer`)
- Linha única na cor `--color-primary`, espessura `2px`, ponto de destaque com tooltip
- Eixo X: meses abreviados; Eixo Y: valores formatados em K
- Grid horizontal suave: `stroke="#E5E7EB" strokeDasharray="3 3"`
- Seletor de período (dropdown) no header do card

### Gráfico Donut (Payment Methods)
- Biblioteca: **Recharts** (`PieChart` + `Pie` com `innerRadius`)
- Label central: valor total em negrito
- Legenda à direita: bullet colorido + label + percentual
- Cores: seguir sequência de cores para gráficos acima

### Gráfico de Barras (Customer Retention)
- Biblioteca: **Recharts** (`BarChart`)
- Barras na cor `--color-warning` (#F59E0B) com bordas arredondadas (`radius={[3,3,0,0]}`)
- Tooltip simples com valor e label

### Gráfico de Área (Today's Activity)
- Biblioteca: **Recharts** (`AreaChart`)
- Gradiente fill de azul-roxo para transparente
- Linha de borda `#6B7FD7`

### Tabela de Transações Recentes
- Header: `Customer Name | Amount | Status | Action`
- Header row: `text-xs font-medium text-gray-500 uppercase tracking-wider`
- Row hover: `hover:bg-gray-50`
- Borda entre linhas: `divide-y divide-gray-100`
- Avatar do cliente: círculo colorido de iniciais (32px)
- Valor: `font-semibold text-gray-900`
- Badge de status:
  - Completed: `bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs`
  - Pending: `bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 text-xs`
- Ação: ícone de três pontos `···` (overflow menu)
- Barra de busca acima da tabela: `input` com ícone lupa, `rounded-lg border border-gray-200`

---

## Botões

| Variante | Classes Tailwind |
|---|---|
| Primário | `bg-[#4CAF50] hover:bg-[#388E3C] text-white rounded-lg px-4 py-2 text-sm font-medium` |
| Secundário / outline | `border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm` |
| Ghost | `text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2` |
| Ícone | `p-2 rounded-lg hover:bg-gray-100 text-gray-500` |

---

## Controles de Header de Página

Padrão do header da área de conteúdo principal:
```
← Título da Página            [Data Range] [Filter] [🌙] [Export Report ↓]
   subtítulo descritivo
```
- Alinhamento: `flex justify-between items-center mb-6`
- Controles à direita: `flex items-center gap-3`
- Date range e Filter: botão secundário/outline com ícone
- Export Report: botão primário com ícone de download

---

## Ícones

- Biblioteca: **Lucide React** (`lucide-react`)
- Tamanho padrão: `16px` a `20px`
- Não usar ícones decorativos sem `aria-hidden="true"`

---

## Acessibilidade (mínimo obrigatório)

- Contraste de texto: mínimo WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)
- Todos os botões e inputs com `aria-label` quando sem texto visível
- Gráficos: incluir sempre `role="img"` e `aria-label` descritivo no container
- Foco visível: não remover `outline`; usar `focus-visible:ring-2 ring-primary`
- Badges de status: nunca transmitir informação só por cor — incluir texto

---

## Regras de Ouro

1. **Cards sempre em fundo branco** sobre fundo de página `#F0F2F5`.
2. **Verde (#4CAF50) é exclusivo de ações positivas** — lucros, conclusão, CTAs. Não usar para erros.
3. **Gráficos via Recharts** — não misturar Chart.js na mesma base de código.
4. **Fontes apenas via `next/font`** — nunca CDN externo para evitar layout shift.
5. **Espaçamento sempre múltiplo de 4px** (Tailwind `p-1` = 4px).
6. **Responsive-first**: mobile com sidebar colapsada, cards empilhados em coluna única.
