import type { User } from '@supabase/supabase-js'
import type { Person } from './commission'

export type Workspace = { people: Person[]; version: number }

export type CloudCalculatorProps = { user: User }

export type CalculatorProps = CloudCalculatorProps & {
  workspace: Workspace
  team: Workspace
  date: string
  dates: string[]
  onDateChange: (date: string) => void
}
