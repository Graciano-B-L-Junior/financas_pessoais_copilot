import { TrendingUp, TrendingDown } from 'lucide-react'
import Card from '@/components/ui/Card'

/**
 * @param {{
 *   label: string,
 *   value: string,
 *   trend: number,
 *   icon: import('react').ReactNode,
 * }} props
 */
export default function KpiCard({ label, value, trend, icon }) {
  const positive = trend >= 0

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-text-secondary">
          {icon}
        </div>
      </div>
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-3xl font-bold text-text-primary truncate">{value}</p>
      <div
        className={[
          'flex items-center gap-1 mt-2 text-xs font-medium',
          positive ? 'text-[#4CAF50]' : 'text-[#EF4444]',
        ].join(' ')}
        aria-label={`Variação: ${trend > 0 ? '+' : ''}${trend}%`}
      >
        {positive
          ? <TrendingUp size={14} aria-hidden="true" />
          : <TrendingDown size={14} aria-hidden="true" />}
        {trend > 0 ? '+' : ''}{trend}% ao mês
      </div>
    </Card>
  )
}
