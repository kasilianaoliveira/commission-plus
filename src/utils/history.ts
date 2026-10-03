import type { Person } from '../types/commission'

export const WORK_TIME_ZONE = 'America/Sao_Paulo'

export function todayInWorkTimeZone(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: WORK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function isWorkDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < '1900-01-01' ||
    value > '9999-12-31'
  )
    return false
  const date = new Date(`${value}T12:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

export function formatWorkDate(value: string) {
  return value.split('-').reverse().join('/')
}

export function shiftWorkDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// A day only acquires fixed amounts when the manager explicitly starts it.
export function startDay(people: Person[]): Person[] {
  return people.map((person) => ({ ...person, sales: [] }))
}

export function normalizeDailyPeople(people: Person[]): Person[] {
  const money = (value: number | string) => {
    const number = value === '.' || value === '' ? 0 : Number(value)
    if (!Number.isFinite(number) || number < 0 || number > 1_000_000_000) {
      throw new Error('Informe valores entre zero e R$ 1 bilhão.')
    }
    return Math.round((number + Number.EPSILON) * 100) / 100
  }
  return people.map((person) => {
    if (
      !Number.isFinite(person.percentage) ||
      person.percentage < 0 ||
      person.percentage > 100
    ) {
      throw new Error('O percentual deve estar entre 0 e 100.')
    }
    return {
      ...person,
      fixedAmount: money(person.fixedAmount),
      sales: person.sales.map((sale) => ({
        ...sale,
        amount: money(sale.amount),
      })),
    }
  })
}
