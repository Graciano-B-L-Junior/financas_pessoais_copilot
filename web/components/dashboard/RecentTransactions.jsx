import Badge from '@/components/ui/Badge'
import { MoreHorizontal } from 'lucide-react'
import Card from '@/components/ui/Card'
import { SkeletonRow } from '@/components/ui/Skeleton'

const STATUS_VARIANT = {
  income:  'success',
  expense: 'danger',
}

const STATUS_LABEL = {
  income:  'Receita',
  expense: 'Despesa',
}

/**
 * @param {{ transactions: any[], loading?: boolean }} props
 */
export default function RecentTransactions({ transactions = [], loading = false }) {
  return (
    <Card padding={false} className="col-span-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-base font-semibold text-text-primary">Transações Recentes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Descrição', 'Categoria', 'Data', 'Valor', 'Tipo', ''].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary truncate max-w-[160px]">
                    {t.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {t.category_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary whitespace-nowrap">
                    {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={STATUS_LABEL[t.type] || t.type}
                      variant={STATUS_VARIANT[t.type] || 'neutral'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      aria-label="Menu de ações"
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-text-muted"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
