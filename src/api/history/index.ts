import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Person } from '../../types/commission'
import type { Workspace } from '../../types/workspace'
import { sortPeople } from '../../utils/commission'

export const dayKey = (ownerId: string, date: string) =>
  ['workspace', ownerId, 'day', date] as const
export const historyKey = (ownerId: string) =>
  ['workspace', ownerId, 'history'] as const

export function useHistory(ownerId: string) {
  return useQuery({
    queryKey: historyKey(ownerId),
    queryFn: async ({ signal }) => {
      if (!supabase) throw new Error('Configure o Supabase.')
      // Fetch dates only; day contents are loaded on demand.
      const dates: string[] = []
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase
          .from('manager_days')
          .select('work_date')
          .eq('owner_id', ownerId)
          .order('work_date', { ascending: false })
          .range(offset, offset + 999)
          .abortSignal(signal)
        if (error) throw error
        dates.push(...data.map((row) => row.work_date as string))
        if (data.length < 1000) return dates
      }
    },
    retry: false,
  })
}

export function useDay(ownerId: string, date: string) {
  return useQuery({
    queryKey: dayKey(ownerId, date),
    queryFn: async ({ signal }): Promise<Workspace> => {
      if (!supabase) throw new Error('Configure o Supabase.')
      const { data, error } = await supabase
        .from('manager_days')
        .select('people, version')
        .eq('owner_id', ownerId)
        .eq('work_date', date)
        .abortSignal(signal)
        .maybeSingle()
      if (error) throw error
      if (!data) return { people: [], version: 0 }
      if (!Array.isArray(data.people) || !Number.isSafeInteger(data.version)) {
        throw new Error('Os registros do dia têm um formato inesperado.')
      }
      return {
        people: sortPeople(data.people as Person[]),
        version: data.version,
      }
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })
}
