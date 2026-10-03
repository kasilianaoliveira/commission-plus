import type { Person, Sale } from '../types/commission'

const preferredOrder = ['lucas', 'luciano', 'adriele', 'ana']

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
  amount === '' || amount === '.' ? '' : saleAmountFormat.format(Number(amount))

const roundToCents = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100

export const getSalesTotal = (person: Person) =>
  roundToCents(
    person.sales.reduce((total, sale) => total + (Number(sale.amount) || 0), 0),
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

export const sortPeople = <T extends { name: string }>(people: T[]) =>
  [...people].sort((firstPerson, secondPerson) => {
    const firstPosition = preferredOrder.indexOf(firstPerson.name.toLowerCase())
    const secondPosition = preferredOrder.indexOf(
      secondPerson.name.toLowerCase(),
    )

    return (
      (firstPosition === -1 ? preferredOrder.length : firstPosition) -
      (secondPosition === -1 ? preferredOrder.length : secondPosition)
    )
  })
