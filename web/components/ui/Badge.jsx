const VARIANTS = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

/**
 * @param {{ label: string, variant?: keyof typeof VARIANTS, className?: string }} props
 */
export default function Badge({ label, variant = 'neutral', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className,
      ].join(' ')}
    >
      {label}
    </span>
  )
}
