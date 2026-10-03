import type { Person, PersonField } from './commission'

export type CommissionSectionProps = {
  people: Person[]
  onAddPerson: () => void
  onRemovePerson: (id: string) => void
  onUpdatePerson: (id: string, field: PersonField, value: string) => void
  onAddSale: (personId: string) => void
  onUpdateSale: (personId: string, saleId: string, value: string) => void
  onRemoveSale: (personId: string, saleId: string) => void
}
