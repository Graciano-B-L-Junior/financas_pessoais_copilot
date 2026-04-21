import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'

const schema = z.object({
  first_name: z.string().min(1, 'Nome obrigatório'),
  last_name:  z.string().optional(),
  email:      z.string().email('E-mail inválido'),
})

const inputBase = [
  'w-full rounded-lg border border-[var(--color-border)] bg-bg-card px-3 py-2 text-sm text-text-primary',
  'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow',
].join(' ')

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { addToast } = useToast()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', email: '' },
  })

  useEffect(() => {
    if (user) {
      reset({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '' })
    }
  }, [user, reset])

  const onSubmit = async (data) => {
    try {
      await api.updateProfile(data)
      if (refreshUser) await refreshUser()
      addToast({ type: 'success', message: 'Perfil atualizado com sucesso.' })
    } catch {
      addToast({ type: 'error', message: 'Erro ao atualizar perfil.' })
    }
  }

  if (!user) return (
    <div>
      <PageHeader title="Perfil" subtitle="Seus dados pessoais" />
      <div className="max-w-lg"><SkeletonCard /></div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Perfil" subtitle="Seus dados pessoais" />

      <div className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-xl bg-bg-card border border-[var(--color-border)] p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="first_name" className="text-sm font-medium text-text-primary">Nome *</label>
              <input id="first_name" type="text" {...register('first_name')} className={[inputBase, errors.first_name ? 'border-[#EF4444]' : ''].join(' ')} />
              {errors.first_name && <p role="alert" className="text-xs text-[#EF4444]">{errors.first_name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="last_name" className="text-sm font-medium text-text-primary">Sobrenome</label>
              <input id="last_name" type="text" {...register('last_name')} className={inputBase} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-text-primary">E-mail *</label>
            <input id="email" type="email" autoComplete="email" {...register('email')} className={[inputBase, errors.email ? 'border-[#EF4444]' : ''].join(' ')} />
            {errors.email && <p role="alert" className="text-xs text-[#EF4444]">{errors.email.message}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Salvar alterações</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
