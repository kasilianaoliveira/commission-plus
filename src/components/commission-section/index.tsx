import { Users } from 'lucide-react'
import type { CommissionSectionProps } from '../../types/commission-section'
import { PersonCard } from '../person-card'
import styles from './style.module.css'

export function CommissionSection({
  people,
  onAddSale,
  onUpdateSale,
  onRemoveSale,
}: CommissionSectionProps) {
  return (
    <section className={styles['commissions-section']}>
      <div className={styles['section-heading']}>
        <div>
          <span className={styles['section-kicker']}>Equipe</span>
          <h2>Comissões individuais</h2>
          <p>
            Nome, percentual e fixo vêm do cadastro da equipe ao iniciar o dia.
            Registre as vendas abaixo.
          </p>
        </div>
      </div>

      <div className={styles['people-list']}>
        {people.map((person, index) => (
          <PersonCard
            key={person.id}
            person={person}
            index={index}
            onAddSale={onAddSale}
            onUpdateSale={onUpdateSale}
            onRemoveSale={onRemoveSale}
          />
        ))}

        {people.length === 0 && (
          <div className={styles['empty-state']}>
            <Users size={28} />
            <h3>Nenhum registro neste dia</h3>
            <p>Cadastre sua equipe e inicie o dia para lançar as vendas.</p>
          </div>
        )}
      </div>
    </section>
  )
}
