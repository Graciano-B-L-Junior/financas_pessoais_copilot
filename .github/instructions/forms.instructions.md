---
description: "Use quando: criar ou revisar formulários, campos de entrada, inputs de valor monetário, seletores de data, selects de categoria, validação visual, estados de erro e feedback de submissão no front-end."
applyTo: "web/**"
---

# Padrões de Formulários e Inputs

Stack de formulários: **React Hook Form** + **Zod** para validação de schema.
Não usar Formik, yup ou validação manual por estado.

---

## Estrutura Base de Formulário

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ /* campos */ })
type FormData = z.infer<typeof schema>

export function MyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  // ...
}
```

---

## Anatomia de Campo

```
┌─────────────────────────────┐
│ Label *                     │  ← text-sm font-medium text-gray-700
│ ┌───────────────────────┐   │
│ │ Ícone   Placeholder   │   │  ← input base
│ └───────────────────────┘   │
│ Mensagem de erro/hint        │  ← text-xs text-red-500 ou text-gray-500
└─────────────────────────────┘
```

### Classes do Input Base

```
rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900
placeholder:text-gray-400
focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent
disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
transition-shadow duration-150 w-full
```

### Estado de Erro

Adicionar ao input quando `errors.campo`:
```
border-red-400 focus:ring-red-400
```

Mensagem de erro abaixo do campo:
```tsx
{errors.campo && (
  <p role="alert" className="mt-1 text-xs text-red-500">
    {errors.campo.message}
  </p>
)}
```

---

## Input de Valor Monetário

Regras:
- Sempre exibir prefixo de moeda (`R$`) à esquerda do campo
- Aceitar apenas dígitos; formatar automaticamente com máscara (`1.234,56`)
- Valor interno do schema Zod deve ser `number` (centavos ou float), não `string`
- Não usar `type="number"` — usar `type="text"` com máscara para controle total

```tsx
import { NumericFormat } from 'react-number-format'
import { Controller } from 'react-hook-form'

<Controller
  name="amount"
  control={control}
  render={({ field }) => (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
      <NumericFormat
        {...field}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        fixedDecimalScale
        className="pl-9 /* + classes base do input */"
        placeholder="0,00"
        onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
      />
    </div>
  )}
/>
```

Schema Zod para valor monetário:
```ts
amount: z.number({ required_error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
```

---

## Seletor de Data

- Biblioteca: **react-day-picker** com estilo customizado via Tailwind (não usar `react-datepicker`)
- Para ranges de período (filtro do dashboard): usar o modo `range` do `react-day-picker`
- Input de ativação: botão secundário com ícone de calendário + data formatada

```tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'

// Formato de exibição padrão
const formatted = format(date, "dd/MM/yyyy", { locale: ptBR })
```

Posicionamento do popover: abaixo do input, alinhado à esquerda, `z-50`, com sombra `shadow-lg rounded-xl border border-gray-100`.

Schema Zod para data:
```ts
date: z.date({ required_error: 'Informe a data' }),
```

---

## Select de Categoria

- Usar `<select>` nativo estilizado ou **Radix UI Select** para acessibilidade completa
- Ícone colorido (bolinha) da categoria ao lado do label na opção selecionada

```tsx
// Classe do select nativo
"appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm
 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
```

Para selects com busca (> 10 opções), usar **Radix UI Combobox** ou `cmdk`.

---

## Toggle Receita / Despesa

Padrão segmented control (não radio buttons isolados):

```
┌──────────────────────────────┐
│  [ Receita ]  [ Despesa ]    │
└──────────────────────────────┘
```

```tsx
// Tab ativa: bg-primary text-white rounded-lg
// Tab inativa: text-gray-600 hover:bg-gray-100 rounded-lg
```

Schema Zod:
```ts
type: z.enum(['income', 'expense'], { required_error: 'Selecione o tipo' }),
```

---

## Checkbox de Recorrência

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    {...register('isRecurring')}
    className="h-4 w-4 rounded border-gray-300 text-[#4CAF50]
               focus:ring-[#4CAF50] focus:ring-offset-0"
  />
  <span className="text-sm text-gray-700">Despesa recorrente</span>
</label>
```

Quando marcado, exibir campos adicionais (`frequency`, `end_date`) com animação de `fadeSlideUp` (ver `motion.instructions.md`).

---

## Botão de Submissão

Estado padrão, loading e desabilitado:

```tsx
<button
  type="submit"
  disabled={isSubmitting}
  className="w-full rounded-lg bg-[#4CAF50] px-4 py-2 text-sm font-medium text-white
             hover:bg-[#388E3C] disabled:opacity-60 disabled:cursor-not-allowed
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4CAF50]
             transition-colors duration-150"
>
  {isSubmitting ? 'Salvando...' : 'Salvar'}
</button>
```

Nunca desabilitar o botão apenas porque o form ainda não foi tocado — deixar a validação disparar no submit.

---

## Layout de Formulário em Modal

- Container: `max-w-lg w-full rounded-2xl bg-white p-6 shadow-xl`
- Header: título `text-lg font-semibold` + botão de fechar (ícone X)
- Campos em coluna com `gap-4`
- Linha com 2 campos lado a lado (ex.: valor + data): `grid grid-cols-2 gap-4`
- Footer: botões alinhados à direita (`flex justify-end gap-3`)
  - Cancelar: botão outline
  - Confirmar: botão primário

---

## Feedback Pós-Submissão

- **Sucesso**: toast verde (ver `motion.instructions.md`) + fechar modal automaticamente após `300ms`
- **Erro de API (4xx/5xx)**: toast vermelho com mensagem do servidor; campo específico marcado com erro se o backend retornar erros por campo
- **Erro de rede**: toast vermelho com mensagem genérica "Não foi possível conectar. Tente novamente."

Nunca exibir erros apenas no console — sempre dar feedback visual ao usuário.

---

## Regras de Validação Comuns (Zod)

```ts
// Texto obrigatório
name: z.string().min(1, 'Campo obrigatório').max(100, 'Máximo 100 caracteres'),

// Valor monetário
amount: z.number().positive('Valor deve ser maior que zero'),

// Data não retroativa (para recorrências)
endDate: z.date().min(new Date(), 'Data deve ser futura').optional(),

// Frequência de recorrência
frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
```
