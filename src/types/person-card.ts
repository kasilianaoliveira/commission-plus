import type { Person } from './commission'

export type PersonCardProps = {
  person: Person
  index: number
  onAddSale: (personId: string) => void
  onUpdateSale: (personId: string, saleId: string, value: string) => void
  onRemoveSale: (personId: string, saleId: string) => void
}
