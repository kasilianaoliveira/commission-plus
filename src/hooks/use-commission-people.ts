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
  initialPeople,
  LEGACY_STORAGE_KEYS,
  parseStoredPeople,
  sortPeople,
  STORAGE_KEY,
} from '../utils/commission'

export const loadLocalPeople = () => {
  try {
    const storedPeople = localStorage.getItem(STORAGE_KEY)
    if (storedPeople) return parseStoredPeople(storedPeople)

    const legacyPeople = LEGACY_STORAGE_KEYS.map((key) =>
      localStorage.getItem(key),
    ).find((value) => value !== null)
    if (!legacyPeople) return null

    const migratedPeople = parseStoredPeople(legacyPeople)
    const hasAna = migratedPeople.some(
      (person) => person.name.trim().toLowerCase() === 'ana',
    )

    return hasAna
      ? migratedPeople
      : [
          ...migratedPeople,
          {
            id: 'ana',
            name: 'Ana',
            percentage: 10,
            fixedAmount: 33.33,
            sales: [],
          },
        ]
  } catch {
    return null
  }
}

export function useCommissionPeople(initial: Person[] = initialPeople) {
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
    setPeople((currentPeople) =>
      currentPeople.map((person) =>
        person.id === id
          ? {
              ...person,
              [field]:
                field === 'name' ? value : Math.max(0, Number(value) || 0),
            }
          : person,
      ),
    )
  }

  const addPerson = () => {
    setPeople((currentPeople) => [
      ...currentPeople,
      {
        id: createId(),
        name: 'Nova pessoa',
        percentage: 10,
        fixedAmount: 0,
        sales: [{ id: createId(), amount: 0 }],
      },
    ])
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
    if (!/^\d*(?:[.,]\d*)?$/.test(value)) return

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
    addPerson,
    removePerson,
    updatePerson,
    addSale,
    updateSale,
    removeSale,
    replacePeople: setPeople,
  }
}
