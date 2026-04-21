'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useTheme } from '@/lib/theme'
import Card from '@/components/ui/Card'

const fmt = (v) => `R$ ${(v / 1000).toFixed(0)}k`

/**
 * @param {{ data: { month: string, value: number }[] }} props
 */
export default function RevenueChart({ data = [] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor  = isDark ? '#2D3148' : '#E5E7EB'
  const labelColor = isDark ? '#9CA3AF' : '#6B7280'

  return (
    <Card className="col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">Receitas e Despesas</h2>
      </div>
      <div
        role="img"
        aria-label="Gráfico de linha mostrando evolução de receitas e despesas ao longo dos meses"
        className="h-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: labelColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: labelColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
              contentStyle={{
                background: isDark ? '#1A1D27' : '#fff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                color: isDark ? '#F9FAFB' : '#111827',
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#4CAF50"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="Receita"
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="Despesa"
              animationDuration={600}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
