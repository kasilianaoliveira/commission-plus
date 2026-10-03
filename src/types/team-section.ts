import type { Person, PersonField } from './commission'
import type { TeamMemberDraft } from './team-member'

export type TeamSectionProps = {
  people: TeamMemberDraft[]
  savedPeople: Person[]
  canSave: boolean
  isSaving: boolean
  hasChanges: boolean
  saveError?: string
  saveStatus: string
  onSave: () => void
  onCancel: () => void
  onAddPerson: () => void
  onEditPerson: (id: string) => void
  onRemovePerson: (id: string) => void
  onUpdatePerson: (id: string, field: PersonField, value: string) => void
}
