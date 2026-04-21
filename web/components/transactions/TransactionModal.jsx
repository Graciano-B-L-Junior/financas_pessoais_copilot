'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { fadeIn } from '@/lib/motion'
import Button from '@/components/ui/Button'
import MonetaryInput from '@/components/ui/MonetaryInput'
import DatePicker from '@/components/ui/DatePicker'

const schema = z.object({
  type:        z.enum(['income', 'expense'], { required_error: 'Selecione o tipo' }),
  amount:      z.number({ required_error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
  date:        z.date({ required_error: 'Informe a data' }),
  category:    z.number({ required_error: 'Selecione a categoria' }).int().positive().optional().nullable(),
  account:     z.number({ required_error: 'Selecione a conta' }).int().positive(),
  description: z.string().max(255).optional(),
})

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: z.infer<typeof schema>) => Promise<void>,
 *   categories: {id:number,name:string,type:string}[],
 *   accounts: {id:number,name:string}[],
 *   initial?: Partial<z.infer<typeof schema>>,
 * }} props
 */
export default function TransactionModal({
  open,
  onClose,
  onSubmit,
  categories = [],
  accounts = [],
  initial,
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      date: new Date(),
      description: '',
      account: accounts[0]?.id ?? undefined,
      category: null,
      ...initial,
    },
  })

  const selectedType = watch('type')

  // Reset form on open with initial values
  useEffect(() => {
    if (open) {
      reset({
        type: 'expense',
        amount: 0,
        date: new Date(),
        description: '',
        account: accounts[0]?.id ?? undefined,
        category: null,
        ...initial,
      })
    }
  }, [open, initial, reset, accounts])

  const filteredCategories = categories.filter(
    (c) => c.type === selectedType
  )

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="txn-modal-title"
        >
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 max-w-lg w-full rounded-2xl bg-bg-card p-6 shadow-xl border border-[var(--color-border)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 id="txn-modal-title" className="text-lg font-semibold text-text-primary">
                {initial?.amount ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <button
                onClick={onClose}
                aria-label="Fechar modal"
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
              {/* Tipo: Receita / Despesa */}
              <div>
                <p className="text-sm font-medium text-text-primary mb-1.5">Tipo</p>
                <div className="inline-flex rounded-lg border border-[var(--color-border)] overflow-hidden">
                  {([['income', 'Receita'], ['expense', 'Despesa']]).map(([val, lbl]) => (
                    <label key={val} className="cursor-pointer select-none">
                      <input
                        type="radio"
                        value={val}
                        {...register('type')}
                        className="sr-only"
                      />
                      <span
                        className={[
                          'block px-5 py-2 text-sm font-medium transition-colors duration-150',
                          selectedType === val
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800',
                        ].join(' ')}
                      >
                        {lbl}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.type && (
                  <p role="alert" className="mt-1 text-xs text-[#EF4444]">{errors.type.message}</p>
                )}
              </div>

              {/* Conta */}
              <div className="flex flex-col gap-1">
                <label htmlFor="account" className="text-sm font-medium text-text-primary">
                  Conta <span aria-hidden="true">*</span>
                </label>
                <select
                  id="account"
                  {...register('account', { valueAsNumber: true })}
                  className={[inputBase, errors.account ? 'border-[#EF4444]' : ''].join(' ')}
                >
                  <option value="">Selecione</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.account && (
                  <p role="alert" className="text-xs text-[#EF4444]">{errors.account.message}</p>
                )}
              </div>

              {/* Valor + Data lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                <MonetaryInput
                  name="amount"
                  control={control}
                  label="Valor *"
                  error={errors.amount?.message}
                />
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Data *"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.date?.message}
                    />
                  )}
                />
              </div>

              {/* Categoria */}
              <div className="flex flex-col gap-1">
                <label htmlFor="category" className="text-sm font-medium text-text-primary">
                  Categoria
                </label>
                <select
                  id="category"
                  {...register('category', { valueAsNumber: true })}
                  className={[inputBase, errors.category ? 'border-[#EF4444]' : ''].join(' ')}
                >
                  <option value="">Sem categoria</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.category && (
                  <p role="alert" className="text-xs text-[#EF4444]">{errors.category.message}</p>
                )}
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1">
                <label htmlFor="description" className="text-sm font-medium text-text-primary">
                  Descrição
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder="Ex.: Supermercado, Salário…"
                  {...register('description')}
                  className={inputBase}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Salvar
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
