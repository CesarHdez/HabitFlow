import { useEffect } from 'react'
import { useHabitsStore } from '@/features/habits/store'
import { getTodayString } from '@/lib/utils/dates'
import { useTrackingStore } from '@/features/tracking/store'

export function getReminderSettings() {
  return {
    enabled: localStorage.getItem('reminder_enabled') === 'true',
    time: localStorage.getItem('reminder_time') ?? '08:00',
  }
}

export function setReminderSettings(enabled: boolean, time: string) {
  localStorage.setItem('reminder_enabled', String(enabled))
  localStorage.setItem('reminder_time', time)
}

export function useReminders() {
  const { habits } = useHabitsStore()
  const { isHabitCompletedOnDate } = useTrackingStore()

  useEffect(() => {
    if (!('Notification' in window)) return

    const check = () => {
      const { enabled, time } = getReminderSettings()
      if (!enabled || Notification.permission !== 'granted') return

      const now = new Date()
      const [hh, mm] = time.split(':').map(Number)
      if (now.getHours() !== hh || now.getMinutes() !== mm) return

      const today = getTodayString()
      const activeHabits = habits.filter(h => h.isActive)
      const pending = activeHabits.filter(h => !isHabitCompletedOnDate(h.id, today))
      if (pending.length === 0) return

      const lastFired = sessionStorage.getItem('reminder_last_fired')
      const todayKey = `${today}_${time}`
      if (lastFired === todayKey) return
      sessionStorage.setItem('reminder_last_fired', todayKey)

      new Notification('HabitFlow — Recordatorio', {
        body: pending.length === 1
          ? `Aún tienes pendiente: ${pending[0].name}`
          : `Tienes ${pending.length} hábitos pendientes de hoy`,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
      })
    }

    const interval = setInterval(check, 60_000)
    check()
    return () => clearInterval(interval)
  }, [habits, isHabitCompletedOnDate])
}
