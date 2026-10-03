import type { Person } from './commission'

export type TeamMemberDraft = Omit<Person, 'percentage' | 'fixedAmount'> & {
  percentage: number | string
  fixedAmount: number | string
}
