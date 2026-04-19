import { useCallback, useRef, useState } from 'react'
import { useHabitsStore } from '@/features/habits/store'
import { useTrackingStore } from '@/features/tracking/store'
import { calculateStreaks } from '@/lib/utils/streaks'
import { getBadgesEarned } from '@/constants/badges'
import { getTodayString } from '@/lib/utils/dates'
import type { BadgeDefinition } from '@/types'

/**
 * Hook que verifica si se ha desbloqueado un badge nuevo tras completar un hábito.
 * Mantiene un registro de badges ya mostrados para no repetirlos en la sesión.
 */
export function useBadgeCheck() {
  const { habits } = useHabitsStore()
  const { logsByDate } = useTrackingStore()
  const shownBadges = useRef<Set<string>>(new Set())
  const [pendingBadge, setPendingBadge] = useState<BadgeDefinition | null>(null)

  const today = getTodayString()

  const checkBadges = useCallback(() => {
    const activeHabits = habits.filter(h => h.isActive)

    for (const habit of activeHabits) {
      const allLogs = Object.values(logsByDate).flat().filter(l => l.habitId === habit.id)
      const streak = calculateStreaks(habit, allLogs, today)
      const earned = getBadgesEarned(streak.current)

      for (const badge of earned) {
        const key = `${habit.id}-${badge.id}`
        if (!shownBadges.current.has(key)) {
          shownBadges.current.add(key)
          setPendingBadge(badge)
          return // mostrar uno a la vez
        }
      }
    }
  }, [habits, logsByDate, today])

  const dismissBadge = useCallback(() => setPendingBadge(null), [])

  return { pendingBadge, checkBadges, dismissBadge }
}
