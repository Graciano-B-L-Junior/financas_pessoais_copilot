'use client'

import { motion } from 'framer-motion'
import { DURATION, btnHover, btnTap } from '@/lib/motion'

const VARIANTS = {
  primary:   'bg-primary hover:bg-primary-dark text-white',
  secondary: 'border border-[var(--color-border)] bg-bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-text-primary',
  ghost:     'text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800',
  danger:    'bg-[#EF4444] hover:bg-red-600 text-white',
  icon:      'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary',
}

/**
 * @param {{
 *   children?: import('react').ReactNode,
 *   variant?: keyof typeof VARIANTS,
 *   type?: 'button'|'submit'|'reset',
 *   onClick?: () => void,
 *   disabled?: boolean,
 *   loading?: boolean,
 *   className?: string,
 *   'aria-label'?: string,
 * }} props
 */
export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled,
  loading,
  className = '',
  ...rest
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : btnHover}
      whileTap={disabled || loading ? {} : btnTap}
      transition={{ duration: DURATION.fast }}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANTS[variant],
        variant === 'icon' ? '' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </motion.button>
  )
}
