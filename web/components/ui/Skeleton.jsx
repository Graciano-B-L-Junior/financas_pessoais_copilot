'use client'

import { motion } from 'framer-motion'

/** Linha shimmer para tabelas */
export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <motion.div
            className="h-4 rounded-lg bg-gray-200 dark:bg-gray-700"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
          />
        </td>
      ))}
    </tr>
  )
}

/** Card shimmer para KPI e outros */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={['rounded-xl bg-bg-card border border-[var(--color-border)] p-6', className].join(' ')}>
      <motion.div
        className="h-4 w-1/3 rounded-lg bg-gray-200 dark:bg-gray-700 mb-4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="h-8 w-2/3 rounded-lg bg-gray-200 dark:bg-gray-700"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
      />
    </div>
  )
}
