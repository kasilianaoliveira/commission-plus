import { useMemo, useState } from 'react'
import type {
  CommissionSummary,
  Person,
  PersonField,
} from '../types/commission'
import {
  calculateCommission,
  createId,
  getSalesTotal,
  sortPeople,
} from '../utils/commission'

export function useCommissionPeople(initial: Person[] = []) {
  const [people, setPeople] = useState<Person[]>(initial)

  const orderedPeople = useMemo(() => sortPeople(people), [people])

  const summary = useMemo<CommissionSummary>(
    () =>
      people.reduce(
        (totals, person) => {
          totals.sales += getSalesTotal(person)
          totals.commissions += calculateCommission(person).total
          return totals
        },
        { sales: 0, commissions: 0 },
      ),
    [people],
  )

  const updatePerson = (id: string, field: PersonField, value: string) => {
    if (field !== 'name' && !Number.isFinite(Number(value))) return
    setPeople((currentPeople) =>
      currentPeople.map((person) =>
        person.id === id
          ? {
              ...person,
              [field]:
                field === 'name'
                  ? value
                  : field === 'fixedAmount'
                    ? Math.round(Math.max(0, Number(value) || 0) * 100) / 100
                    : Math.max(0, Number(value) || 0),
            }
          : person,
      ),
    )
  }

  const removePerson = (id: string) => {
    setPeople((currentPeople) =>
      currentPeople.filter((person) => person.id !== id),
    )
  }

  const addSale = (personId: string) => {
    setPeople((currentPeople) =>
      currentPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              sales: [...person.sales, { id: createId(), amount: '' }],
            }
          : person,
      ),
    )
  }

  const updateSale = (personId: string, saleId: string, value: string) => {
    if (!/^\d*(?:[.,]\d{0,2})?$/.test(value)) return

    const amount = value.replace(',', '.')
    if (amount !== '' && amount !== '.' && !Number.isFinite(Number(amount)))
      return

    setPeople((currentPeople) =>
      currentPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              sales: person.sales.map((sale) =>
                sale.id === saleId
                  ? {
                      ...sale,
                      amount,
                    }
                  : sale,
              ),
            }
          : person,
      ),
    )
  }

  const removeSale = (personId: string, saleId: string) => {
    setPeople((currentPeople) =>
      currentPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              sales: person.sales.filter((sale) => sale.id !== saleId),
            }
          : person,
      ),
    )
  }

  return {
    people: orderedPeople,
    summary,
    removePerson,
    updatePerson,
    addSale,
    updateSale,
    removeSale,
    replacePeople: setPeople,
  }
}
