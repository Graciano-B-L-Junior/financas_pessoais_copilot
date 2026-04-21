'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { fadeIn } from '@/lib/motion'
import Button from '@/components/ui/Button'

const COLORS = ['#4CAF50', '#3D5A99', '#6B7FD7', '#81C784', '#F97316', '#EF4444', '#F59E0B', '#3B82F6']

const schema = z.object({
  name:  z.string().min(1, 'Nome obrigatório').max(100, 'Máximo 100 caracteres'),
  type:  z.enum(['income', 'expense'], { required_error: 'Selecione o tipo' }),
  color: z.string().min(1, 'Selecione uma cor').optional().nullable(),
})

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: z.infer<typeof schema>) => Promise<void>,
 *   initial?: { name?: string, type?: string, color?: string },
 * }} props
 */
export default function CategoryModal({ open, onClose, onSubmit, initial }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: 'expense', color: COLORS[0], ...initial },
  })

  const selectedType  = watch('type')
  const selectedColor = watch('color')

  useEffect(() => {
    if (open) reset({ name: '', type: 'expense', color: COLORS[0], ...initial })
  }, [open, initial, reset])

  const submit = async (data) => {
    await onSubmit(data)
    onClose()
  }

  const inputBase = [
    'w-full rounded-lg border bg-bg-card px-3 py-2 text-sm text-text-primary',
    'placeholder:text-text-muted border-[var(--color-border)]',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    'transition-shadow duration-150',
  ].join(' ')

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cat-modal-title">
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50" />
          <motion.div key="modal" variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="relative z-10 max-w-md w-full rounded-2xl bg-bg-card p-6 shadow-xl border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-5">
              <h2 id="cat-modal-title" className="text-lg font-semibold text-text-primary">
                {initial?.name ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={onClose} aria-label="Fechar" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="cat-name" className="text-sm font-medium text-text-primary">Nome *</label>
                <input id="cat-name" type="text" placeholder="Ex.: Alimentação" {...register('name')} className={[inputBase, errors.name ? 'border-[#EF4444]' : ''].join(' ')} />
                {errors.name && <p role="alert" className="text-xs text-[#EF4444]">{errors.name.message}</p>}
              </div>

              {/* Tipo */}
              <div>
                <p className="text-sm font-medium text-text-primary mb-1.5">Tipo</p>
                <div className="inline-flex rounded-lg border border-[var(--color-border)] overflow-hidden">
                  {[['income', 'Receita'], ['expense', 'Despesa']].map(([val, lbl]) => (
                    <label key={val} className="cursor-pointer select-none">
                      <input type="radio" value={val} {...register('type')} className="sr-only" />
                      <span className={['block px-5 py-2 text-sm font-medium transition-colors duration-150', selectedType === val ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'].join(' ')}>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cores */}
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Cor</p>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue('color', c)}
                      aria-label={`Selecionar cor ${c}`}
                      className={['h-7 w-7 rounded-full border-2 transition-transform', selectedColor === c ? 'border-[var(--color-primary)] scale-110' : 'border-transparent'].join(' ')}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit" loading={isSubmitting}>Salvar</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
