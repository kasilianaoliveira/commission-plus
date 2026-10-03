import type { Person, PersonField } from './commission'

export type PersonCardProps = {
  person: Person
  index: number
  onUpdatePerson: (id: string, field: PersonField, value: string) => void
  onRemovePerson: (id: string) => void
  onAddSale: (personId: string) => void
  onUpdateSale: (personId: string, saleId: string, value: string) => void
  onRemoveSale: (personId: string, saleId: string) => void
}
