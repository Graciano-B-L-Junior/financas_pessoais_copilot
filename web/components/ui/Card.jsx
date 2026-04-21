/**
 * Card base — fundo branco (light) / #1A1D27 (dark), borda sutil, sombra leve.
 * @param {{ children: import('react').ReactNode, className?: string, padding?: boolean }} props
 */
export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={[
        'rounded-xl bg-bg-card border border-[var(--color-border)] shadow-sm',
        padding ? 'p-6' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
