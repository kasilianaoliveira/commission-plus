import { Plus, Users } from 'lucide-react'
import type { Person, PersonField } from '../types/commission'
import { PersonCard } from './PersonCard'

type CommissionSectionProps = {
  people: Person[]
  onAddPerson: () => void
  onRemovePerson: (id: string) => void
  onUpdatePerson: (id: string, field: PersonField, value: string) => void
  onAddSale: (personId: string) => void
  onUpdateSale: (personId: string, saleId: string, value: string) => void
  onRemoveSale: (personId: string, saleId: string) => void
}

export function CommissionSection({
  people,
  onAddPerson,
  onRemovePerson,
  onUpdatePerson,
  onAddSale,
  onUpdateSale,
  onRemoveSale,
}: CommissionSectionProps) {
  return (
    <section className="commissions-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Equipe</span>
          <h2>Comissões individuais</h2>
          <p>Edite os campos abaixo para recalcular automaticamente.</p>
        </div>
        <button className="add-button" type="button" onClick={onAddPerson}>
          <Plus size={18} strokeWidth={2.5} /> Adicionar pessoa
        </button>
      </div>

      <div className="people-list">
        {people.map((person, index) => (
          <PersonCard
            key={person.id}
            person={person}
            index={index}
            onUpdatePerson={onUpdatePerson}
            onRemovePerson={onRemovePerson}
            onAddSale={onAddSale}
            onUpdateSale={onUpdateSale}
            onRemoveSale={onRemoveSale}
          />
        ))}

        {people.length === 0 && (
          <div className="empty-state">
            <Users size={28} />
            <h3>Nenhuma pessoa adicionada</h3>
            <p>Adicione alguém para começar a calcular.</p>
            <button className="add-button" type="button" onClick={onAddPerson}>
              <Plus size={18} /> Adicionar pessoa
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
