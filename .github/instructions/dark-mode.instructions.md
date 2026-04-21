---
description: "Use quando: implementar ou revisar o tema escuro (dark mode), tokens de cor para modo claro/escuro, toggle de tema, persistência de preferência do usuário ou qualquer componente que precise suportar ambos os temas."
applyTo: "web/**"
---

# Padrões de Dark Mode

Estratégia: **class-based dark mode** do Tailwind CSS (`darkMode: 'class'` em `tailwind.config`).
Não usar `darkMode: 'media'` — o usuário deve poder escolher independentemente da preferência do SO.

---

## Configuração do Tailwind

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

---

## Paleta de Tokens — Modo Escuro

Mapeamento dos tokens do `design-reference.instructions.md` para dark mode:

| Token | Light | Dark |
|---|---|---|
| `--color-bg-page` | `#F0F2F5` | `#0F1117` |
| `--color-bg-card` | `#FFFFFF` | `#1A1D27` |
| `--color-bg-sidebar` | `#FFFFFF` | `#1A1D27` |
| `--color-border` | `#E5E7EB` | `#2D3148` |
| `--color-text-primary` | `#111827` | `#F9FAFB` |
| `--color-text-secondary` | `#6B7280` | `#9CA3AF` |
| `--color-text-muted` | `#9CA3AF` | `#6B7280` |
| `--color-primary` | `#4CAF50` | `#4CAF50` *(mantém)* |
| `--color-primary-dark` | `#388E3C` | `#66BB6A` *(clareia no dark)* |

---

## Implementação via CSS Custom Properties

Definir os tokens em `globals.css` usando as classes `html` e `html.dark`:

```css
/* web/styles/globals.css */

html {
  --color-bg-page:       #F0F2F5;
  --color-bg-card:       #FFFFFF;
  --color-bg-sidebar:    #FFFFFF;
  --color-border:        #E5E7EB;
  --color-text-primary:  #111827;
  --color-text-secondary:#6B7280;
  --color-text-muted:    #9CA3AF;
  --color-primary:       #4CAF50;
  --color-primary-dark:  #388E3C;
}

html.dark {
  --color-bg-page:       #0F1117;
  --color-bg-card:       #1A1D27;
  --color-bg-sidebar:    #1A1D27;
  --color-border:        #2D3148;
  --color-text-primary:  #F9FAFB;
  --color-text-secondary:#9CA3AF;
  --color-text-muted:    #6B7280;
  --color-primary:       #4CAF50;
  --color-primary-dark:  #66BB6A;
}
```

Adicionar ao `tailwind.config` para usar os tokens como classes utilitárias:

```js
theme: {
  extend: {
    colors: {
      'bg-page':        'var(--color-bg-page)',
      'bg-card':        'var(--color-bg-card)',
      'bg-sidebar':     'var(--color-bg-sidebar)',
      'border-default': 'var(--color-border)',
      'text-primary':   'var(--color-text-primary)',
      'text-secondary': 'var(--color-text-secondary)',
      'text-muted':     'var(--color-text-muted)',
      primary:          'var(--color-primary)',
      'primary-dark':   'var(--color-primary-dark)',
    },
  },
}
```

Isso permite usar `bg-bg-card`, `text-text-primary` etc. sem precisar do prefixo `dark:` em cada classe.

---

## Gerenciamento do Tema

Usar um `ThemeProvider` leve (sem dependência externa):

```tsx
// web/lib/theme.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({ theme: 'system', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) setThemeState(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
    root.classList.toggle('dark', isDark)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

Envolver o layout raiz:
```tsx
// app/layout.tsx
<ThemeProvider>
  {children}
</ThemeProvider>
```

---

## Botão Toggle de Tema

Referência no mockup: ícone de lua 🌙 no header da área de conteúdo.

```tsx
'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const next: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
  const icons = { light: <Sun size={16} />, dark: <Moon size={16} />, system: <Monitor size={16} /> }

  return (
    <button
      onClick={() => setTheme(next[theme])}
      aria-label={`Tema atual: ${theme}. Clique para alternar`}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500
                 dark:text-gray-400 transition-colors duration-150"
    >
      {icons[theme]}
    </button>
  )
}
```

---

## Gráficos Recharts no Dark Mode

O Recharts não herda variáveis CSS automaticamente. Passar as cores via props condicionalmente:

```tsx
import { useTheme } from '@/lib/theme'

function RevenueChart() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor  = isDark ? '#2D3148' : '#E5E7EB'
  const labelColor = isDark ? '#9CA3AF' : '#6B7280'

  return (
    <LineChart data={data}>
      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
      <XAxis tick={{ fill: labelColor, fontSize: 12 }} />
      <YAxis tick={{ fill: labelColor, fontSize: 12 }} />
      <Line stroke="#4CAF50" strokeWidth={2} dot={false} />
    </LineChart>
  )
}
```

---

## Prevenção de Flash de Tema Errado (FOUT)

Inserir script bloqueante **antes** do carregamento do React para aplicar a classe `dark` sem piscar:

```tsx
// app/layout.tsx — dentro de <head>
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        var t = localStorage.getItem('theme');
        var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (t === 'dark' || (!t && p)) document.documentElement.classList.add('dark');
      })();
    `,
  }}
/>
```

---

## Checklist ao Criar Novos Componentes

- [ ] Usar tokens (`bg-bg-card`, `text-text-primary`) em vez de cores fixas (`bg-white`, `text-gray-900`)
- [ ] Verificar contraste em ambos os modos (WCAG AA)
- [ ] Testar foco visível no dark (`focus-visible:ring-[#4CAF50]` funciona em ambos os modos)
- [ ] Bordas usando `border-border-default` em vez de `border-gray-200`
- [ ] Gráficos passando cores via props condicionais (não via CSS)
- [ ] Inputs e selects: `bg-bg-card text-text-primary border-border-default`
