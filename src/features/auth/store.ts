import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { IS_LOCAL_MODE, supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean

  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  _setSession: (session: Session | null) => void
}

const LOCAL_USER = {
  id: 'local-user',
  email: 'local@habitflow.app',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '',
} as unknown as User

export const useAuthStore = create<AuthState>((set) => ({
  user:      IS_LOCAL_MODE ? LOCAL_USER : null,
  session:   null,
  isLoading: IS_LOCAL_MODE ? false : true,

  signIn: async (email, password) => {
    if (IS_LOCAL_MODE) {
      set({ user: { ...LOCAL_USER, email } as User })
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email, password) => {
    if (IS_LOCAL_MODE) {
      set({ user: { ...LOCAL_USER, email } as User })
      return
    }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    if (!IS_LOCAL_MODE) await supabase.auth.signOut()
    set({ user: IS_LOCAL_MODE ? LOCAL_USER : null, session: null })
  },

  _setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),
}))
