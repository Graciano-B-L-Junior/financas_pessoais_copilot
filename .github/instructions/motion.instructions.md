---
description: "Use quando: adicionar animações, transições, micro-interações, skeleton loaders, toasts, modais animados ou qualquer movimento de UI no front-end. Define os padrões de animação com Framer Motion para a aplicação de finanças pessoais."
applyTo: "web/**"
---

# Padrões de Animação e Transição

Biblioteca exclusiva: **Framer Motion** (`framer-motion`).
Não usar CSS keyframes manuais ou outras libs de animação (ex.: GSAP, react-spring).

---

## Princípios

1. **Animação serve à função** — reforça hierarquia e feedback, nunca distrai.
2. **Durações curtas**: preferir `200ms–400ms`; nunca ultrapassar `600ms` em interações de usuário.
3. **Easing padrão**: `easeOut` para entradas, `easeIn` para saídas, `easeInOut` para transições bidirecionais.
4. **Respeitar `prefers-reduced-motion`** — sempre usar o hook `useReducedMotion` ou a variante `motionSafe`.
5. **Não animar layout crítico** (LCP elements) — pode impactar Core Web Vitals.

---

## Tokens de Duração e Easing

```ts
// lib/motion.ts  — importar daqui em todos os componentes
export const DURATION = {
  fast:   0.15,  // hover, ripple
  normal: 0.25,  // entrada de card, botão
  slow:   0.4,   // modal, page transition
} as const

export const EASE = {
  out:    [0.0, 0.0, 0.2, 1],
  in:     [0.4, 0.0, 1.0, 1],
  inOut:  [0.4, 0.0, 0.2, 1],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
} as const
```

---

## Variantes Reutilizáveis

### Fade + Slide para Cards / Painéis

```tsx
// Entrada de card vindo de baixo
export const fadeSlideUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASE.out } },
}

// Stagger de lista de cards (KPI grid, tabela)
export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}
```

Uso no dashboard KPI grid:
```tsx
<motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-4 gap-6">
  {kpis.map(kpi => (
    <motion.div key={kpi.id} variants={fadeSlideUp}>
      <KpiCard {...kpi} />
    </motion.div>
  ))}
</motion.div>
```

### Fade simples para tooltips e dropdowns

```tsx
export const fadeIn = {
  hidden:  { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1,   transition: { duration: DURATION.fast, ease: EASE.out } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: DURATION.fast, ease: EASE.in } },
}
```

Sempre envolver com `<AnimatePresence>` quando há montagem/desmontagem condicional.

### Slide lateral para Sidebar (mobile)

```tsx
export const slideSidebar = {
  hidden:  { x: '-100%' },
  visible: { x: 0, transition: { duration: DURATION.slow, ease: EASE.out } },
  exit:    { x: '-100%', transition: { duration: DURATION.normal, ease: EASE.in } },
}
```

### Page Transition

```tsx
// Em _app.tsx ou layout.tsx com AnimatePresence mode="wait"
export const pageTransition = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE.out } },
  exit:    { opacity: 0, y: -8, transition: { duration: DURATION.normal, ease: EASE.in } },
}
```

---

## Micro-interações de Botão

```tsx
// Aplicar diretamente em <motion.button>
const buttonTap = { scale: 0.97 }
const buttonHover = { scale: 1.02 }

<motion.button
  whileHover={buttonHover}
  whileTap={buttonTap}
  transition={{ duration: DURATION.fast }}
>
  Exportar Relatório
</motion.button>
```

---

## Skeleton Loader (Listas e Cards)

Usar `motion` com ciclo de opacidade para simular shimmer:

```tsx
<motion.div
  className="h-8 rounded-lg bg-gray-200"
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
/>
```

Criar um componente `<SkeletonCard />` e `<SkeletonRow />` para reutilização na tabela e nos KPI cards.

---

## Toasts / Notificações

- Entrar pelo canto superior direito: `x: 32` → `x: 0`
- Sair em `x: 32` + `opacity: 0`
- Duração de permanência: `4000ms` para sucesso, `6000ms` para erro
- Sempre usando `<AnimatePresence>` no container de toasts

```tsx
export const toastVariants = {
  hidden:  { opacity: 0, x: 32, scale: 0.95 },
  visible: { opacity: 1, x: 0,  scale: 1, transition: { duration: DURATION.normal, ease: EASE.out } },
  exit:    { opacity: 0, x: 32, scale: 0.95, transition: { duration: DURATION.fast, ease: EASE.in } },
}
```

---

## Gráficos (Recharts + Framer Motion)

- **Não** animar o SVG do Recharts diretamente com Framer Motion.
- Usar as props nativas do Recharts: `isAnimationActive={true}` (padrão) com `animationDuration={600}` e `animationEasing="ease-out"`.
- Para fade-in do container do gráfico, envolver o card com `motion.div` usando `fadeSlideUp`.

---

## Acessibilidade

```tsx
// Hook obrigatório em qualquer componente com animação
import { useReducedMotion } from 'framer-motion'

function AnimatedCard({ children }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      variants={reduce ? {} : fadeSlideUp}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}
```

Quando `useReducedMotion()` retorna `true`, passar variantes vazias `{}` para desabilitar o movimento, mantendo a funcionalidade.
