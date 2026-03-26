import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: { email?: string; display_name?: string }) => Promise<void>
  initialize: () => () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  //Update Auth state immediately for faster feedback instead of waiting for initialize
  signIn: async (email, password) => {
    const supabase = createClient()
    const { data,error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({user: data.user, session: data.session, isLoading: false})
  },

  //Update Auth state immediately for faster feedback instead of waiting for initialize
  signUp: async (email, password, displayName) => {
    const supabase = createClient()
    const { data,error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
    set({user: data.user, session: data.session, isLoading: false})
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  updateProfile: async (updates) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      email: updates.email,
      data: updates.display_name ? { display_name: updates.display_name } : undefined,
    })
    if (error) throw error
  },

  initialize: () => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      set({ user: user ?? null, session: null, isLoading: false })
    })

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session, isLoading: false })
    })

    return () => subscription.unsubscribe()
  },
}))
