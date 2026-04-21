import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { staggerContainer, fadeSlideUp } from '@/lib/motion'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonRow } from '@/components/ui/Skeleton'
import CategoryModal from '@/components/categories/CategoryModal'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const { addToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getCategories()
      setCategories(res.results ?? res)
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar categorias.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (cat) => { setEditing(cat); setModalOpen(true) }

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await api.updateCategory(editing.id, data)
        addToast({ type: 'success', message: 'Categoria atualizada.' })
      } else {
        await api.createCategory(data)
        addToast({ type: 'success', message: 'Categoria criada.' })
      }
      load()
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar categoria.' })
      throw new Error('submit failed')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteCategory(id)
      addToast({ type: 'success', message: 'Categoria excluída.' })
      load()
    } catch {
      addToast({ type: 'error', message: 'Erro ao excluir categoria. Verifique se está em uso.' })
    }
  }

  return (
    <div>
      <PageHeader title="Categorias" subtitle="Organize suas transações por categoria">
        <Button onClick={openCreate} variant="primary">
          <Plus size={16} className="mr-1.5" /> Nova Categoria
        </Button>
      </PageHeader>

      <div className="rounded-xl bg-bg-card border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-text-secondary">
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Tipo</th>
              <th className="text-left px-4 py-3 font-medium">Cor</th>
              <th className="text-right px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
            {loading
              ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={4} />)
              : categories.map((cat) => (
                  <motion.tr key={cat.id} variants={fadeSlideUp} className="border-b border-[var(--color-border)] last:border-0 hover:bg-bg transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{cat.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={cat.type === 'income' ? 'success' : 'danger'}>{cat.type === 'income' ? 'Receita' : 'Despesa'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block h-5 w-5 rounded-full border border-[var(--color-border)]" style={{ background: cat.color || '#cccccc' }} title={cat.color} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(cat)} aria-label="Editar" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(cat.id)} aria-label="Excluir" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[#EF4444]"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
            }
          </motion.tbody>
        </table>
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  )
}
