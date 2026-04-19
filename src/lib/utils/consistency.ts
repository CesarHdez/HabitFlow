import { format, parseISO, subDays } from 'date-fns'
import type { Habit, HabitLog } from '@/types'

/**
 * Consistency Score (0–100): % de días/períodos completados en los últimos N días.
 * Más honesto que el streak — no se destruye por fallar un día aislado.
 */
export function calcConsistencyScore(
  habit: Habit,
  logs: HabitLog[],
  todayStr: string,
  windowDays = 30
): number {
  const today = parseISO(todayStr)
  const completedDates = new Set(
    logs.filter(l => l.completed).map(l => l.date)
  )

  if (habit.goal.frequency === 'DAILY') {
    let hit = 0
    for (let i = 0; i < windowDays; i++) {
      const d = format(subDays(today, i), 'yyyy-MM-dd')
      if (completedDates.has(d)) hit++
    }
    return Math.round((hit / windowDays) * 100)
  }

  // WEEKLY: contar semanas completas (excluir la semana actual en curso)
  const todayDay = today.getDay()
  const currentWeekStart = format(subDays(today, (todayDay + 6) % 7), 'yyyy-MM-dd')

  const weekBuckets: Record<string, number> = {}
  for (let i = 0; i < windowDays; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd')
    const dDate = parseISO(d)
    const weekStart = format(subDays(dDate, (dDate.getDay() + 6) % 7), 'yyyy-MM-dd')
    if (weekStart === currentWeekStart) continue // semana en curso, no contar
    if (!weekBuckets[weekStart]) weekBuckets[weekStart] = 0
    if (completedDates.has(d)) weekBuckets[weekStart]++
  }
  const weeks = Object.values(weekBuckets)
  if (weeks.length === 0) return 0
  const completed = weeks.filter(c => c >= habit.goal.count).length
  return Math.round((completed / weeks.length) * 100)
}

/** Devuelve color semántico según el score */
export function scoreColor(score: number): string {
  if (score >= 80) return '#10B981'
  if (score >= 50) return '#6366F1'
  if (score >= 25) return '#F59E0B'
  return '#EF4444'
}

/** Devuelve etiqueta según el score */
export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Muy bueno'
  if (score >= 40) return 'Regular'
  if (score >= 20) return 'Bajo'
  return 'Inicial'
}
