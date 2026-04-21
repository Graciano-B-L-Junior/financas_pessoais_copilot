import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Pencil, Trash2 } from 'lucide-react'
import { SkeletonRow } from '@/components/ui/Skeleton'

const TYPE_VARIANT = { income: 'success', expense: 'danger' }
const TYPE_LABEL   = { income: 'Receita', expense: 'Despesa' }

/**
 * @param {{
 *   transactions: any[],
 *   loading: boolean,
 *   onEdit: (t: any) => void,
 *   onDelete: (id: number) => void,
 * }} props
 */
export default function TransactionTable({ transactions = [], loading, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-bg-card">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {['Descrição', 'Categoria', 'Conta', 'Data', 'Valor', 'Tipo', 'Ações'].map((h) => (
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
            ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
            : transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="px-4 py-3 text-sm text-text-primary max-w-[140px] truncate">
                  {t.description || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {t.category_name || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {t.account_name || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                  {new Date(t.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-text-primary whitespace-nowrap">
                  {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-4 py-3">
                  <Badge label={TYPE_LABEL[t.type] || t.type} variant={TYPE_VARIANT[t.type] || 'neutral'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="icon" onClick={() => onEdit(t)} aria-label={`Editar transação ${t.id}`}>
                      <Pencil size={14} aria-hidden="true" />
                    </Button>
                    <Button variant="icon" onClick={() => onDelete(t.id)} aria-label={`Excluir transação ${t.id}`}>
                      <Trash2 size={14} aria-hidden="true" className="text-[#EF4444]" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          {!loading && transactions.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-muted">
                Nenhuma transação encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
