import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../lib/formatters'

export default function DashboardChart({ porCategoria }) {
  const data = (porCategoria || [])
    .slice(0, 6)
    .map((item) => ({
      name: item.category__name,
      total: Number.parseFloat(item.total),
      tipo: item.type,
      label: item.type === 'INCOME' ? 'Receita' : 'Despesa',
    }))

  if (!data.length) return <p>Sem dados para o período.</p>

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap={18}>
        <CartesianGrid stroke="rgba(96, 112, 139, 0.12)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#60708b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: '#8d9ab1', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => formatCurrency(value).replace(',00', '')}
        />
        <Tooltip
          cursor={{ fill: 'rgba(139, 174, 247, 0.08)' }}
          contentStyle={{
            borderRadius: 18,
            border: '1px solid rgba(112, 151, 240, 0.18)',
            boxShadow: '0 18px 38px rgba(134, 158, 198, 0.14)',
            background: 'rgba(255, 255, 255, 0.94)',
          }}
          formatter={(value) => formatCurrency(value)}
          labelStyle={{ color: '#162033', fontWeight: 700 }}
        />
        <Bar dataKey="total" radius={[14, 14, 14, 14]} maxBarSize={46}>
          {data.map((item) => (
            <Cell key={`${item.name}-${item.label}`} fill={item.tipo === 'INCOME' ? '#99d5c6' : '#8baef7'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
