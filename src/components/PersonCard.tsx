import { useState } from 'react'
import {
  CircleDollarSign,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import type { Person, PersonField } from '../types/commission'
import {
  calculateCommission,
  currency,
  formatSaleAmount,
  getSalesTotal,
} from '../utils/commission'

type PersonCardProps = {
  person: Person
  index: number
  onUpdatePerson: (id: string, field: PersonField, value: string) => void
  onRemovePerson: (id: string) => void
  onAddSale: (personId: string) => void
  onUpdateSale: (personId: string, saleId: string, value: string) => void
  onRemoveSale: (personId: string, saleId: string) => void
}

export function PersonCard({
  person,
  index,
  onUpdatePerson,
  onRemovePerson,
  onAddSale,
  onUpdateSale,
  onRemoveSale,
}: PersonCardProps) {
  const [focusedSaleId, setFocusedSaleId] = useState<string | null>(null)
  const commission = calculateCommission(person)

  return (
    <article className="person-card">
      <div className="person-number" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="person-content">
        <div className="person-header">
          <label className="name-field">
            <span className="sr-only">Nome da pessoa</span>
            <input
              value={person.name}
              onChange={(event) =>
                onUpdatePerson(person.id, 'name', event.target.value)
              }
              aria-label={`Nome da pessoa ${index + 1}`}
            />
          </label>
          <button
            className="delete-button"
            type="button"
            onClick={() => onRemovePerson(person.id)}
            aria-label={`Remover ${person.name || `pessoa ${index + 1}`}`}
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="fields-grid">
          <label className="field">
            <span>Percentual</span>
            <div className="input-wrap input-wrap--suffix">
              <input
                type="number"
                min="0"
                step="0.01"
                value={person.percentage}
                onChange={(event) =>
                  onUpdatePerson(person.id, 'percentage', event.target.value)
                }
              />
              <span>%</span>
            </div>
          </label>

          <label className="field">
            <span>Valor fixo</span>
            <div className="input-wrap input-wrap--prefix">
              <span>R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={person.fixedAmount}
                onChange={(event) =>
                  onUpdatePerson(person.id, 'fixedAmount', event.target.value)
                }
              />
            </div>
          </label>
        </div>

        <div className="sales-box">
          <div className="sales-heading">
            <div>
              <span>
                <ShoppingBag size={15} /> Vendas do dia
              </span>
              <small>Adicione cada venda separadamente</small>
            </div>
            <div className="sales-total">
              <small>Total vendido</small>
              <strong>{currency.format(getSalesTotal(person))}</strong>
            </div>
          </div>

          <div className="sales-list">
            <div className="sales-entries">
              {person.sales.map((sale, saleIndex) => (
                <div className="sale-row" key={sale.id}>
                  <label htmlFor={`sale-${sale.id}`}>
                    Venda {String(saleIndex + 1).padStart(2, '0')}
                  </label>
                  <div className="input-wrap input-wrap--prefix">
                    <span>R$</span>
                    <input
                      id={`sale-${sale.id}`}
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*([.,][0-9]*)?"
                      placeholder="0,00"
                      value={
                        sale.amount === 0
                          ? ''
                          : focusedSaleId === sale.id
                            ? String(sale.amount).replace('.', ',')
                            : formatSaleAmount(sale.amount)
                      }
                      onFocus={(event) => {
                        setFocusedSaleId(sale.id)
                        event.currentTarget.select()
                      }}
                      onBlur={() => {
                        onUpdateSale(person.id, sale.id, formatSaleAmount(sale.amount))
                        setFocusedSaleId(null)
                      }}
                      onChange={(event) =>
                        onUpdateSale(person.id, sale.id, event.target.value)
                      }
                    />
                  </div>
                  <button
                    className="remove-sale-button"
                    type="button"
                    onClick={() => onRemoveSale(person.id, sale.id)}
                    aria-label={`Remover venda ${saleIndex + 1} de ${person.name}`}
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>

            <button
              className="add-sale-button"
              type="button"
              onClick={() => onAddSale(person.id)}
            >
              <Plus size={16} /> Adicionar venda
            </button>
          </div>
        </div>

        <div className="calculation-row">
          <div className="calculation-formula">
            <span>
              {currency.format(commission.percentageAmount)}{' '}
              <small>percentual</small>
            </span>
            <b>+</b>
            <span>
              {currency.format(person.fixedAmount)} <small>fixo</small>
            </span>
          </div>
          <div className="commission-total">
            <span>
              <CircleDollarSign size={16} /> Comissão total
            </span>
            <strong>{currency.format(commission.total)}</strong>
          </div>
        </div>
      </div>
    </article>
  )
}
