import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerContainer, fadeSlideUp } from '@/lib/motion'
import { BarChart2, Shield, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="font-bold text-xl text-primary">FinançasPessoais</span>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">Entrar</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="text-center max-w-2xl">
          <motion.h1 variants={fadeSlideUp} className="text-4xl font-extrabold text-text-primary mb-4">
            Controle suas finanças com clareza
          </motion.h1>
          <motion.p variants={fadeSlideUp} className="text-text-secondary text-lg mb-8">
            Registre receitas e despesas, visualize seus gastos em dashboards intuitivos e tome decisões mais inteligentes.
          </motion.p>
          <motion.div variants={fadeSlideUp}>
            <Link href="/login" className="inline-block rounded-xl bg-primary text-white px-8 py-3 font-semibold text-base hover:bg-primary/90 transition-colors">
              Começar agora
            </Link>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
            {[
              { icon: BarChart2, title: 'Dashboard avançado', body: 'Gráficos de evolução e distribuição de gastos por categoria.' },
              { icon: Shield, title: 'Segurança JWT', body: 'Autenticação robusta com tokens de acesso e refresh.' },
              { icon: Zap, title: 'Rápido e responsivo', body: 'Interface otimizada para desktop e mobile.' },
            ].map(({ icon: Icon, title, body }) => (
              <motion.div key={title} variants={fadeSlideUp} className="rounded-xl bg-bg-card border border-[var(--color-border)] p-5">
                <Icon className="text-primary mb-3" size={22} />
                <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-text-secondary">{body}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
