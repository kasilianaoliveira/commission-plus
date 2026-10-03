import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Workspace } from '../../types/workspace'
import type { Person } from '../../types/commission'
import type { TeamMemberDraft } from '../../types/team-member'
import { sortPeople } from '../../utils/commission'
import { dayKey, historyKey } from '../history'
import { normalizeDailyPeople } from '../../utils/history'
import { teamKey } from '../team'

export function useWorkspaceAutosave(
  ownerId: string,
  workspace: Workspace,
  people: (Person | TeamMemberDraft)[],
  workDate?: string,
  autosave = true,
) {
  const queryClient = useQueryClient()
  const { mutate, reset, isPending, isError, error } = useMutation({
    mutationKey: ['save-workspace', ownerId, workDate],
    retry: false,
    mutationFn: async (snapshot: string): Promise<Workspace> => {
      if (!supabase) throw new Error('Configure o Supabase.')
      const draft: Person[] = JSON.parse(snapshot)
      const nextPeople = normalizeDailyPeople(draft)
      const members = nextPeople.map(
        ({ id, name, percentage, fixedAmount }) => ({
          id,
          name,
          percentage,
          fixedAmount,
        }),
      )
      if (!workDate && members.some((member) => !member.name.trim())) {
        throw new Error('Informe o nome de todos os membros da equipe.')
      }
      const { data, error } = await supabase.rpc(
        workDate ? 'save_manager_day' : 'save_manager_team',
        {
          expected_version: workspace.version,
          ...(workDate
            ? { next_people: nextPeople, selected_date: workDate }
            : { next_members: members }),
        },
      )
      if (error) throw error
      if (!Number.isSafeInteger(data))
        throw new Error('Resposta inesperada ao salvar.')
      return { people: nextPeople, version: data as number }
    },
    onSuccess: (saved, savedSnapshot) => {
      // Keep the editable string draft in cache; the database stores numeric cents.
      const cached = { ...saved, people: JSON.parse(savedSnapshot) as Person[] }
      queryClient.setQueryData(
        workDate ? dayKey(ownerId, workDate) : teamKey(ownerId),
        cached,
      )
      if (workDate)
        void queryClient.invalidateQueries({ queryKey: historyKey(ownerId) })
    },
  })
  const numericValue = (value: number | string) =>
    value === '' || value === '.' || value === ','
      ? ''
      : Number(String(value).replace(',', '.'))
  const snapshot = JSON.stringify(
    workDate
      ? people
      : people.map((person) => ({
          ...person,
          percentage: numericValue(person.percentage),
          fixedAmount: numericValue(person.fixedAmount),
        })),
  )
  const hasChanges = snapshot !== JSON.stringify(sortPeople(workspace.people))
  const hasUnsavedChanges = hasChanges || isPending
  const incompleteTeam =
    !workDate &&
    people.some(
      (person) =>
        !person.name.trim() ||
        numericValue(person.percentage) === '' ||
        numericValue(person.fixedAmount) === '',
    )

  useEffect(() => {
    if (!autosave || !hasChanges || isPending || isError || incompleteTeam)
      return
    const timer = window.setTimeout(() => mutate(snapshot), 700)
    return () => window.clearTimeout(timer)
  }, [
    autosave,
    hasChanges,
    snapshot,
    isPending,
    isError,
    incompleteTeam,
    mutate,
  ])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) =>
      event.preventDefault()
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [hasUnsavedChanges])

  return {
    status: incompleteTeam
      ? 'Preencha nome, percentual e valor fixo para salvar'
      : isError
        ? 'Falha ao salvar'
        : isPending
          ? 'Salvando…'
          : hasChanges
            ? 'Alterações pendentes'
            : 'Salvo na nuvem',
    error,
    hasUnsavedChanges,
    isPending,
    canSave: hasChanges && !isPending && !incompleteTeam,
    save: () => {
      if (hasChanges && !isPending && !incompleteTeam) mutate(snapshot)
    },
    reset,
    retry: autosave ? reset : () => mutate(snapshot),
  }
}
