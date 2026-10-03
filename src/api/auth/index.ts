import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import type { AuthAction } from '../../types/auth'
import { supabase } from '../../lib/supabase'

const authKey = ['auth', 'user'] as const

export function useAuth() {
  const queryClient = useQueryClient()
  const [recovering, setRecovering] = useState(false)
  const query = useQuery({
    queryKey: authKey,
    queryFn: async () => {
      if (!supabase) return null
      const { data, error } = await supabase.auth.getUser()
      if (error && error.name !== 'AuthSessionMissingError') throw error
      return data.user
    },
    enabled: Boolean(supabase),
    staleTime: Infinity,
    retry: false,
  })

  useEffect(() => {
    if (!supabase) return
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') {
        setRecovering(false)
        queryClient.removeQueries({ queryKey: ['workspace'] })
      }
      // Cancel the initial lookup so it cannot overwrite a newer auth event.
      void queryClient.cancelQueries({ queryKey: authKey })
      queryClient.setQueryData<User | null>(authKey, session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [queryClient])

  return { ...query, recovering, finishRecovery: () => setRecovering(false) }
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Configure o Supabase.')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  })
}

export function useAuthAction() {
  return useMutation({
    mutationFn: async ({ mode, email, password }: AuthAction) => {
      if (!supabase) throw new Error('Configure o Supabase.')
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: window.location.origin,
          },
        )
        if (error) throw error
        return 'Se o e-mail existir, você receberá as instruções de recuperação.'
      }
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
        if (error?.code === 'user_already_exists') {
          throw new Error(
            'Este e-mail já tem uma conta. Entre ou recupere sua senha.',
          )
        }
        if (error) throw error
        return data.session
          ? ''
          : 'Se este e-mail ainda não tiver conta, você receberá uma confirmação. Se já tiver, entre ou recupere sua senha.'
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      return ''
    },
  })
}

export function usePasswordUpdate(onDone: () => void) {
  return useMutation({
    mutationFn: async (password: string) => {
      if (!supabase) throw new Error('Configure o Supabase.')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    onSuccess: onDone,
  })
}
