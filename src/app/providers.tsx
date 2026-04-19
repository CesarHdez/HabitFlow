import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useUIStore } from '@/store/useUIStore'
import { BadgeNotification } from '@/components/shared/BadgeNotification'
import { useBadgeCheck } from '@/hooks/useBadgeCheck'
import { useReminders } from '@/hooks/useReminders'

function BadgeWatcher() {
  const { pendingBadge, dismissBadge } = useBadgeCheck()
  return <BadgeNotification badge={pendingBadge} onDismiss={dismissBadge} />
}

function ReminderWatcher() {
  useReminders()
  return null
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const { theme } = useUIStore()

  // Aplicar tema CSS
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // Escuchar cambios del sistema
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return (
    <>
      {children}
      <BadgeWatcher />
      <ReminderWatcher />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ duration: 3000 }}
      />
    </>
  )
}
