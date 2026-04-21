'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from '@/lib/theme'
import Card from '@/components/ui/Card'

const COLORS = ['#4CAF50', '#3D5A99', '#6B7FD7', '#81C784', '#F97316']

/**
 * @param {{ data: { name: string, value: number }[] }} props
 */
export default function ExpenseDonut({ data = [] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <Card>
      <h2 className="text-base font-semibold text-text-primary mb-3">Por Categoria</h2>
      <div
        role="img"
        aria-label="Gráfico de rosca mostrando distribuição de gastos por categoria"
        className="h-52 relative"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              paddingAngle={3}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [
                `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                '',
              ]}
              contentStyle={{
                background: isDark ? '#1A1D27' : '#fff',
                border: `1px solid ${isDark ? '#2D3148' : '#E5E7EB'}`,
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Label central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-text-muted">Total</p>
            <p className="text-sm font-bold text-text-primary">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
