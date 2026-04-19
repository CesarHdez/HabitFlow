import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true cuando no hay credenciales — la app corre con localStorage */
export const IS_LOCAL_MODE = !url || !key

export const supabase = IS_LOCAL_MODE
  ? ({} as ReturnType<typeof createClient>)
  : createClient(url!, key!)

/** Obtiene el user_id autenticado; en modo local devuelve 'local-user' */
export async function getUserId(): Promise<string> {
  if (IS_LOCAL_MODE) return 'local-user'
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user.id
}
