import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Person } from '../../types/commission'
import type { Workspace } from '../../types/workspace'
import { sortPeople } from '../../utils/commission'

export const teamKey = (ownerId: string) =>
  ['workspace', ownerId, 'team'] as const

export function useTeam(ownerId: string) {
  return useQuery({
    queryKey: teamKey(ownerId),
    queryFn: async ({ signal }): Promise<Workspace> => {
      if (!supabase) throw new Error('Configure o Supabase.')
      const { data, error } = await supabase
        .from('manager_teams')
        .select('members, version')
        .eq('owner_id', ownerId)
        .abortSignal(signal)
        .maybeSingle()
      if (error) throw error
      if (!data) return { people: [], version: 0 }
      if (!Array.isArray(data.members) || !Number.isSafeInteger(data.version)) {
        throw new Error('O cadastro da equipe tem um formato inesperado.')
      }
      return {
        people: sortPeople(
          data.members.map((member: Omit<Person, 'sales'>) => ({
            ...member,
            sales: [],
          })),
        ),
        version: data.version,
      }
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })
}
