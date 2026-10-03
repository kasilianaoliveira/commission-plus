import { useState } from 'react'
import { Download, ReceiptText, Users, WalletCards } from 'lucide-react'
import type { CommissionSummary } from '../types/commission'
import { currency } from '../utils/commission'

type SummaryCardsProps = {
  summary: CommissionSummary
  peopleCount: number
  onExport: () => Promise<void>
}

export function SummaryCards({ summary, peopleCount, onExport }: SummaryCardsProps) {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      await onExport()
    } catch {
      setExportError('Não foi possível exportar a imagem. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section aria-label="Resumo do dia">
      <div className="summary-heading">
        <div>
          <h2>Resumo do dia</h2>
          <p>Exporte os valores atuais para compartilhar com o dono.</p>
        </div>
        <button className="export-button" type="button" onClick={handleExport} disabled={exporting}>
          <Download size={18} aria-hidden="true" />
          {exporting ? 'Gerando imagem…' : 'Exportar imagem'} <span className="export-format">PNG</span>
        </button>
      </div>
      {exportError && <p role="alert">{exportError}</p>}
      <div className="summary-grid">
      <article className="summary-card summary-card--primary">
        <span className="summary-icon">
          <ReceiptText size={21} />
        </span>
        <div>
          <small>Total vendido</small>
          <strong>{currency.format(summary.sales)}</strong>
        </div>
      </article>

      <article className="summary-card">
        <span className="summary-icon">
          <WalletCards size={21} />
        </span>
        <div>
          <small>Total em comissões</small>
          <strong>{currency.format(summary.commissions)}</strong>
        </div>
      </article>

      <article className="summary-card">
        <span className="summary-icon">
          <Users size={21} />
        </span>
        <div>
          <small>Pessoas</small>
          <strong>{peopleCount}</strong>
        </div>
      </article>
      </div>
    </section>
  )
}
