'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { fadeIn } from '@/lib/motion'

/**
 * Date picker acessível com react-day-picker.
 * @param {{ value?: Date, onChange: (d: Date) => void, label?: string, error?: string, disabled?: boolean }} props
 */
export default function DatePicker({ value, onChange, label, error, disabled }) {
  const [open, setOpen] = useState(false)

  const formatted = value ? format(value, 'dd/MM/yyyy', { locale: ptBR }) : ''

  return (
    <div className="relative flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Selecionar data${value ? ': ' + formatted : ''}`}
        className={[
          'flex items-center gap-2 w-full rounded-lg border bg-bg-card px-3 py-2 text-sm text-left',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
          'transition-shadow duration-150',
          error
            ? 'border-[#EF4444] text-text-primary'
            : 'border-[var(--color-border)] text-text-primary',
        ].join(' ')}
      >
        <CalendarDays size={16} className="text-text-secondary" aria-hidden="true" />
        <span className={value ? '' : 'text-text-muted'}>{formatted || 'Selecione a data'}</span>
      </button>

      {error && (
        <p role="alert" className="text-xs text-[#EF4444] mt-0.5">{error}</p>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 mt-1 z-50 bg-bg-card rounded-xl border border-[var(--color-border)] shadow-lg"
          >
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(d) => { onChange(d); setOpen(false) }}
              locale={ptBR}
              className="p-3"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
