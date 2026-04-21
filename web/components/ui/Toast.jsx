'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { toastVariants } from '@/lib/motion'
import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext({ toast: (msg, type) => {} })

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = ++_id
    setToasts((prev) => [...prev, { id, message, type }])
    const duration = type === 'error' ? 6000 : 4000
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const COLORS = {
    success: 'border-l-4 border-[#4CAF50] bg-bg-card',
    error:   'border-l-4 border-[#EF4444] bg-bg-card',
    info:    'border-l-4 border-[#3B82F6] bg-bg-card',
    warning: 'border-l-4 border-[#F59E0B] bg-bg-card',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-80"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              variants={toastVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={[
                'flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg',
                'border border-[var(--color-border)]',
                COLORS[t.type] || COLORS.info,
              ].join(' ')}
            >
              <p className="flex-1 text-sm text-text-primary">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Fechar notificação"
                className="text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
