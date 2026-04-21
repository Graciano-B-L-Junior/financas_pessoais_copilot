import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import TransactionTable from '@/components/transactions/TransactionTable'
import TransactionModal from '@/components/transactions/TransactionModal'

export default function TransactionsPage() {
  const [transactions, setTransactions]   = useState([])
  const [accounts, setAccounts]           = useState([])
  const [categories, setCategories]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [modalOpen, setModalOpen]         = useState(false)
  const [editing, setEditing]             = useState(null)
  const { addToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, a, c] = await Promise.all([
        api.getTransactions(),
        api.getAccounts(),
        api.getCategories(),
      ])
      setTransactions(t.results ?? t)
      setAccounts(a.results ?? a)
      setCategories(c.results ?? c)
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar transações.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (tx) => { setEditing(tx); setModalOpen(true) }

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await api.updateTransaction(editing.id, data)
        addToast({ type: 'success', message: 'Transação atualizada.' })
      } else {
        await api.createTransaction(data)
        addToast({ type: 'success', message: 'Transação criada.' })
      }
      load()
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar transação.' })
      throw new Error('submit failed')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteTransaction(id)
      addToast({ type: 'success', message: 'Transação excluída.' })
      load()
    } catch {
      addToast({ type: 'error', message: 'Erro ao excluir transação.' })
    }
  }

  return (
    <div>
      <PageHeader title="Transações" subtitle="Gerencie suas receitas e despesas">
        <Button onClick={openCreate} variant="primary">
          <Plus size={16} className="mr-1.5" /> Nova Transação
        </Button>
      </PageHeader>

      <TransactionTable
        transactions={transactions}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
