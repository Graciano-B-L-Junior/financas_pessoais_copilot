import { Download, Filter, CalendarDays } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Button from '@/components/ui/Button'

/**
 * @param {{ title: string, subtitle?: string, onExport?: () => void }} props
 */
export default function PageHeader({ title, subtitle, onExport }) {
  return (
    <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <ThemeToggle />
        {onExport && (
          <Button variant="primary" onClick={onExport} aria-label="Exportar relatório">
            <Download size={15} aria-hidden="true" />
            Exportar
          </Button>
        )}
      </div>
    </header>
  )
}
