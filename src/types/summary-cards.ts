import type { CommissionSummary } from './commission'

export type SummaryCardsProps = {
  summary: CommissionSummary
  peopleCount: number
  onExport: () => Promise<void>
}
