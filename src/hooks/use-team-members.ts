import { useState } from 'react'
import type { Person, PersonField } from '../types/commission'
import type { TeamMemberDraft } from '../types/team-member'
import { createId, sortPeople } from '../utils/commission'

export function useTeamMembers(initial: Person[], version: number) {
  const [draft, setDraft] = useState({
    version,
    members: [] as TeamMemberDraft[],
    removedIds: [] as string[],
  })
  // A new saved version confirms the request succeeded. Failed saves keep drafts.
  if (draft.version !== version) {
    setDraft({ version, members: [], removedIds: [] })
  }
  const members = draft.version === version ? draft.members : []
  const removedIds = draft.version === version ? draft.removedIds : []
  const people = sortPeople([
    ...initial.filter(
      (person) =>
        !removedIds.includes(person.id) &&
        !members.some((member) => member.id === person.id),
    ),
    ...members,
  ])

  const addPerson = () =>
    setDraft((current) =>
      current.members.length > 0 || current.removedIds.length > 0
        ? current
        : {
            ...current,
            members: [
              {
                id: createId(),
                name: '',
                percentage: '',
                fixedAmount: '',
                sales: [],
              },
            ],
          },
    )
  const removePerson = (id: string) =>
    setDraft((current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== id),
      removedIds: initial.some((person) => person.id === id)
        ? [...current.removedIds, id]
        : current.removedIds,
    }))
  const editPerson = (id: string) => {
    const person = initial.find((member) => member.id === id)
    if (!person) return
    setDraft((current) =>
      current.members.length > 0 || current.removedIds.length > 0
        ? current
        : {
            ...current,
            members: [{ ...person }],
            removedIds: current.removedIds.filter(
              (removedId) => removedId !== id,
            ),
          },
    )
  }
  const updatePerson = (id: string, field: PersonField, value: string) => {
    if (field !== 'name' && !/^\d*(?:[.,]\d{0,2})?$/.test(value)) return
    setDraft((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === id ? { ...member, [field]: value } : member,
      ),
    }))
  }
  return {
    people,
    drafts: members,
    editPerson,
    addPerson,
    removePerson,
    updatePerson,
    discardChanges: () => setDraft({ version, members: [], removedIds: [] }),
  }
}
