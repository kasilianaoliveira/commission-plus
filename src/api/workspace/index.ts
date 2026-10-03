import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Workspace } from '../../types/workspace'
import type { Person } from '../../types/commission'
import { parseStoredPeople, sortPeople } from '../../utils/commission'

const workspaceKey = (ownerId: string) => ['workspace', ownerId] as const

async function loadWorkspace(
  ownerId: string,
  signal: AbortSignal,
): Promise<Workspace> {
  if (!supabase) throw new Error('Configure o Supabase.')
  const { data: loaded, error } = await supabase
    .from('manager_workspaces')
    .select('people, version')
    .eq('owner_id', ownerId)
    .abortSignal(signal)
    .maybeSingle()
  if (error) throw error
  let data = loaded
  if (!data) {
    const created = await supabase
      .from('manager_workspaces')
      .insert({ owner_id: ownerId })
      .select('people, version')
      .abortSignal(signal)
      .single()
    if (created.error) {
      // Another session may have created the workspace at the same time.
      const retry = await supabase
        .from('manager_workspaces')
        .select('people, version')
        .eq('owner_id', ownerId)
        .abortSignal(signal)
        .single()
      if (retry.error) throw created.error
      data = retry.data
    } else data = created.data
  }
  if (!Array.isArray(data.people) || !Number.isSafeInteger(data.version)) {
    throw new Error('Os dados salvos têm um formato inesperado.')
  }
  return {
    people: parseStoredPeople(JSON.stringify(data.people)),
    version: data.version,
  }
}

export function useWorkspace(ownerId: string) {
  return useQuery({
    queryKey: workspaceKey(ownerId),
    queryFn: ({ signal }) => loadWorkspace(ownerId, signal),
    // The editor owns its draft. Background reads must not replace its saved version.
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })
}

export function useWorkspaceAutosave(
  ownerId: string,
  workspace: Workspace,
  people: Person[],
) {
  const queryClient = useQueryClient()
  const { mutate, reset, isPending, isError, error } = useMutation({
    mutationKey: ['save-workspace', ownerId],
    retry: false,
    mutationFn: async (snapshot: string): Promise<Workspace> => {
      if (!supabase) throw new Error('Configure o Supabase.')
      const nextPeople: Person[] = JSON.parse(snapshot)
      const { data, error } = await supabase.rpc('save_manager_workspace', {
        expected_version: workspace.version,
        next_people: nextPeople,
      })
      if (error) throw error
      if (!Number.isSafeInteger(data))
        throw new Error('Resposta inesperada ao salvar.')
      return { people: nextPeople, version: data as number }
    },
    onSuccess: (saved) =>
      queryClient.setQueryData(workspaceKey(ownerId), saved),
  })
  const snapshot = JSON.stringify(people)
  const hasChanges = snapshot !== JSON.stringify(sortPeople(workspace.people))
  const hasUnsavedChanges = hasChanges || isPending

  useEffect(() => {
    if (!hasChanges || isPending || isError) return
    const timer = window.setTimeout(() => mutate(snapshot), 700)
    return () => window.clearTimeout(timer)
  }, [hasChanges, snapshot, isPending, isError, mutate])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) =>
      event.preventDefault()
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [hasUnsavedChanges])

  return {
    status: isError
      ? 'Falha ao salvar'
      : isPending
        ? 'Salvando…'
        : hasChanges
          ? 'Alterações pendentes'
          : 'Salvo na nuvem',
    error,
    hasUnsavedChanges,
    retry: reset,
  }
}
