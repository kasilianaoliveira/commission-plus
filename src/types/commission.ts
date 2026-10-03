export type Sale = {
  id: string
  amount: number | string
}

export type Person = {
  id: string
  name: string
  percentage: number
  fixedAmount: number
  sales: Sale[]
}

export type CommissionSummary = {
  sales: number
  commissions: number
}

export type PersonField = 'name' | 'percentage' | 'fixedAmount'

export type StoredPerson = Partial<Person> & { salesAmount?: number }
