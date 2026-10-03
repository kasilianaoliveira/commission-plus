import type { Person, Sale } from '../types/commission'

export const STORAGE_KEY = 'commission-plus:people:v4'
export const LEGACY_STORAGE_KEYS = [
  'commission-plus:people:v3',
  'commission-plus:people:v2',
]

const preferredOrder = ['lucas', 'luciano', 'adriele', 'ana']

export const initialPeople: Person[] = [
  { id: 'lucas', name: 'Lucas', percentage: 20, fixedAmount: 53.33, sales: [{ id: 'lucas-sale-1', amount: 0 }] },
  { id: 'luciano', name: 'Luciano', percentage: 10, fixedAmount: 33.33, sales: [{ id: 'luciano-sale-1', amount: 0 }] },
  { id: 'adriele', name: 'Adriele', percentage: 10, fixedAmount: 33.33, sales: [{ id: 'adriele-sale-1', amount: 0 }] },
  { id: 'ana', name: 'Ana', percentage: 10, fixedAmount: 33.33, sales: [{ id: 'ana-sale-1', amount: 0 }] },
]

export const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const saleAmountFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
})

export const formatSaleAmount = (amount: Sale['amount']) =>
  amount === '' || amount === '.'
    ? ''
    : saleAmountFormat.format(Number(amount))

const roundToCents = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100

export const getSalesTotal = (person: Person) =>
  roundToCents(
    person.sales.reduce(
      (total, sale) => total + (Number(sale.amount) || 0),
      0,
    ),
  )

export const calculateCommission = (person: Person) => {
  const percentageAmount = roundToCents(
    getSalesTotal(person) * (person.percentage / 100),
  )

  return {
    percentageAmount,
    total: roundToCents(percentageAmount + person.fixedAmount),
  }
}

export const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`

export const sortPeople = (people: Person[]) =>
  [...people].sort((firstPerson, secondPerson) => {
    const firstPosition = preferredOrder.indexOf(firstPerson.name.toLowerCase())
    const secondPosition = preferredOrder.indexOf(secondPerson.name.toLowerCase())

    return (
      (firstPosition === -1 ? preferredOrder.length : firstPosition) -
      (secondPosition === -1 ? preferredOrder.length : secondPosition)
    )
  })

export const parseStoredPeople = (storedValue: string): Person[] => {
  const parsed = JSON.parse(storedValue) as Array<
    Partial<Person> & { salesAmount?: number }
  >

  if (!Array.isArray(parsed)) return initialPeople

  const people = parsed.map((person, personIndex): Person => {
    const sales = Array.isArray(person.sales)
      ? person.sales.map(
          (sale): Sale => ({
            id: sale.id || createId(),
            amount: sale.amount === '' ? '' : Number(sale.amount) || 0,
          }),
        )
      : [{ id: createId(), amount: Number(person.salesAmount) || 0 }]

    return {
      id: person.id || createId(),
      name:
        typeof person.name === 'string'
          ? person.name
          : `Pessoa ${personIndex + 1}`,
      percentage: Number(person.percentage) || 0,
      fixedAmount: Number(person.fixedAmount) || 0,
      sales: sales.length > 0 ? sales : [{ id: createId(), amount: 0 }],
    }
  })

  return sortPeople(people)
}
