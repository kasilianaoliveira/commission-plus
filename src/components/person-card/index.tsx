import { useState } from 'react'
import { CircleDollarSign, Plus, ShoppingBag, X } from 'lucide-react'
import type { Sale } from '../../types/commission'
import type { PersonCardProps } from '../../types/person-card'
import {
  calculateCommission,
  currency,
  formatSaleAmount,
  getSalesTotal,
} from '../../utils/commission'
import styles from './style.module.css'

function getSaleInputValue(sale: Sale, isFocused: boolean) {
  if (sale.amount === 0) return ''
  if (isFocused) return String(sale.amount).replace('.', ',')
  return formatSaleAmount(sale.amount)
}

export function PersonCard({
  person,
  index,
  onAddSale,
  onUpdateSale,
  onRemoveSale,
}: PersonCardProps) {
  const [focusedSaleId, setFocusedSaleId] = useState<string | null>(null)
  const commission = calculateCommission(person)

  return (
    <article className={styles['person-card']}>
      <div
        className={styles['person-number']}
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className={styles['person-content']}>
        <div className={styles['person-header']}>
          <h3>{person.name || 'Sem nome'}</h3>
        </div>
        <div className={styles['fields-grid']}>
          <div className={styles['field']}>
            <span>Percentual</span>
            <strong>{person.percentage.toLocaleString('pt-BR')}%</strong>
          </div>
          <div className={styles['field']}>
            <span>Valor fixo deste dia</span>
            <strong>{currency.format(person.fixedAmount)}</strong>
          </div>
        </div>

        <div className={styles['sales-box']}>
          <div className={styles['sales-heading']}>
            <div>
              <span>
                <ShoppingBag size={15} /> Vendas do dia
              </span>
              <small>Adicione cada venda separadamente</small>
            </div>
            <div className={styles['sales-total']}>
              <small>Total vendido</small>
              <strong>{currency.format(getSalesTotal(person))}</strong>
            </div>
          </div>

          <div className={styles['sales-list']}>
            <div className={styles['sales-entries']}>
              {person.sales.map((sale, saleIndex) => (
                <div
                  className={styles['sale-row']}
                  key={sale.id}
                >
                  <label htmlFor={`sale-${sale.id}`}>
                    Venda {String(saleIndex + 1).padStart(2, '0')}
                  </label>
                  <div
                    className={[
                      styles['input-wrap'],
                      styles['input-wrap--prefix'],
                    ].join(' ')}
                  >
                    <span>R$</span>
                    <input
                      id={`sale-${sale.id}`}
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*([.,][0-9]*)?"
                      placeholder="0,00"
                      value={getSaleInputValue(sale, focusedSaleId === sale.id)}
                      onFocus={(event) => {
                        setFocusedSaleId(sale.id)
                        event.currentTarget.select()
                      }}
                      onBlur={() => {
                        onUpdateSale(
                          person.id,
                          sale.id,
                          formatSaleAmount(sale.amount),
                        )
                        setFocusedSaleId(null)
                      }}
                      onChange={(event) =>
                        onUpdateSale(person.id, sale.id, event.target.value)
                      }
                    />
                  </div>
                  <button
                    className={styles['remove-sale-button']}
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
              className={styles['add-sale-button']}
              type="button"
              onClick={() => onAddSale(person.id)}
            >
              <Plus size={16} /> Adicionar venda
            </button>
          </div>
        </div>

        <div className={styles['calculation-row']}>
          <div className={styles['calculation-formula']}>
            <span>
              {currency.format(commission.percentageAmount)}{' '}
              <small>percentual</small>
            </span>
            <b>+</b>
            <span>
              {currency.format(person.fixedAmount)} <small>fixo</small>
            </span>
          </div>
          <div className={styles['commission-total']}>
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
