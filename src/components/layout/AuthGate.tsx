import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IS_LOCAL_MODE, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/store'
import { useHabitsStore } from '@/features/habits/store'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoading, _setSession } = useAuthStore()
  const { fetchHabits } = useHabitsStore()

  useEffect(() => {
    if (IS_LOCAL_MODE) {
      // Sin Supabase: el usuario ya está "logueado" como local-user
      fetchHabits()
      if (location.pathname === '/login') navigate('/', { replace: true })
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      _setSession(session)
      if (session) {
        fetchHabits()
        if (window.location.pathname.endsWith('/login')) {
          navigate('/', { replace: true })
        }
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true })
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      _setSession(session)
      if (session) {
        fetchHabits()
        if (location.pathname === '/login') navigate('/', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user && location.pathname !== '/login') return null

  return <>{children}</>
}
