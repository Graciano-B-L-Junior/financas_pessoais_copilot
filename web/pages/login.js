import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { fadeSlideUp } from '@/lib/motion'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/ui/ThemeToggle'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export default function LoginPage() {
  const router  = useRouter()
  const { signIn } = useAuth()
  const { addToast } = useToast()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const inputBase = [
    'w-full rounded-lg border border-[var(--color-border)] bg-bg-card px-3 py-2 text-sm text-text-primary',
    'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    'transition-shadow',
  ].join(' ')

  const onSubmit = async ({ email, password }) => {
    try {
      await signIn(email, password)
      router.replace('/dashboard')
    } catch (err) {
      addToast({
        type: 'error',
        message: err?.response?.data?.detail || 'Credenciais inválidas.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" className="w-full max-w-sm">
        <div className="rounded-2xl bg-bg-card border border-[var(--color-border)] p-8 shadow-xl">
          <h1 className="text-2xl font-extrabold text-text-primary mb-1">Entrar</h1>
          <p className="text-sm text-text-secondary mb-6">Acesse sua conta de finanças pessoais.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-text-primary">E-mail</label>
              <input id="email" type="email" placeholder="voce@email.com" autoComplete="username" {...register('email')} className={[inputBase, errors.email ? 'border-[#EF4444]' : ''].join(' ')} />
              {errors.email && <p role="alert" className="text-xs text-[#EF4444]">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-text-primary">Senha</label>
              <input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} className={[inputBase, errors.password ? 'border-[#EF4444]' : ''].join(' ')} />
              {errors.password && <p role="alert" className="text-xs text-[#EF4444]">{errors.password.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">Entrar</Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
