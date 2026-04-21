import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, fadeSlideUp } from '@/lib/motion'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import PageHeader from '@/components/layout/PageHeader'
import KpiCard from '@/components/dashboard/KpiCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import ExpenseDonut from '@/components/dashboard/ExpenseDonut'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'

export default function DashboardPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(() => addToast({ type: 'error', message: 'Erro ao carregar dashboard.' }))
      .finally(() => setLoading(false))
  }, [])

  const kpis = data ? [
    { label: 'Saldo total',   value: data.balance,  icon: Wallet,     trend: null },
    { label: 'Receitas (mês)',value: data.income,   icon: TrendingUp,  trend: data.income_change },
    { label: 'Despesas (mês)',value: data.expenses, icon: TrendingDown,trend: data.expense_change },
    { label: 'Transações',    value: data.count,    icon: DollarSign, trend: null, isCurrency: false },
  ] : Array(4).fill(null)

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral das suas finanças" />

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={i} variants={fadeSlideUp}>
            <KpiCard {...kpi} loading={loading} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" className="lg:col-span-2">
          <RevenueChart data={data?.monthly_series} loading={loading} />
        </motion.div>
        <motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
          <ExpenseDonut data={data?.category_breakdown} loading={loading} />
        </motion.div>
      </div>

      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
        <RecentTransactions transactions={data?.recent_transactions} loading={loading} />
      </motion.div>
    </div>
  )
}
