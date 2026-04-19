import { parseISO, getISOWeek, getMonth, getYear, format, subDays, differenceInDays } from 'date-fns'
import type { HabitLog, Habit, StreakInfo } from '@/types'

function getPeriodKey(dateStr: string, frequency: Habit['goal']['frequency']): string {
  const date = parseISO(dateStr)
  switch (frequency) {
    case 'DAILY':   return dateStr
    case 'WEEKLY':  return `${getYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
    case 'MONTHLY': return `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`
    case 'YEARLY':  return `${getYear(date)}`
  }
}

function isPeriodComplete(logs: HabitLog[], requiredCount: number): boolean {
  return logs.filter(l => l.completed).length >= requiredCount
}

// ── Streak DAILY con detección correcta de huecos ─────────────

function calcDailyStreak(logs: HabitLog[], todayStr: string): StreakInfo {
  const completedSet = new Set(logs.filter(l => l.completed).map(l => l.date))
  if (completedSet.size === 0) {
    return { current: 0, best: 0, isOnStreak: false, gracePeriodActive: false }
  }

  const today = parseISO(todayStr)
  const todayDone = completedSet.has(todayStr)
  const yesterday = format(subDays(today, 1), 'yyyy-MM-dd')
  const gracePeriodActive = !todayDone && completedSet.has(yesterday)

  // Current streak: recorrer días consecutivos hacia atrás
  let current = 0
  if (todayDone || gracePeriodActive) {
    const startFrom = todayDone ? today : subDays(today, 1)
    for (let i = 0; i < 366; i++) {
      const d = format(subDays(startFrom, i), 'yyyy-MM-dd')
      if (completedSet.has(d)) current++
      else break
    }
  }

  // Best streak: escanear todas las fechas completadas en orden
  const sorted = Array.from(completedSet).sort()
  let best = sorted.length > 0 ? 1 : 0
  let temp = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInDays(parseISO(sorted[i]), parseISO(sorted[i - 1]))
    if (diff === 1) { temp++; best = Math.max(best, temp) }
    else temp = 1
  }
  best = Math.max(best, current)

  return { current, best, isOnStreak: current > 0, gracePeriodActive }
}

// ── Streak WEEKLY / MONTHLY / YEARLY ─────────────────────────

function calcPeriodStreak(
  habit: Habit,
  logs: HabitLog[],
  todayStr: string
): StreakInfo {
  const { frequency, count: requiredCount } = habit.goal

  const periodMap = new Map<string, HabitLog[]>()
  for (const log of logs) {
    const key = getPeriodKey(log.date, frequency)
    if (!periodMap.has(key)) periodMap.set(key, [])
    periodMap.get(key)!.push(log)
  }

  const todayPeriod = getPeriodKey(todayStr, frequency)
  const sortedPeriods = Array.from(periodMap.keys()).sort().reverse()

  let currentStreak = 0
  let tempStreak = 0
  let bestStreak = 0
  let gracePeriodActive = false
  let checkingCurrent = true

  for (let i = 0; i < sortedPeriods.length; i++) {
    const period = sortedPeriods[i]
    const complete = isPeriodComplete(periodMap.get(period)!, requiredCount)

    if (checkingCurrent && i === 0 && period === todayPeriod && !complete) {
      const prevPeriod = sortedPeriods[1]
      if (prevPeriod && isPeriodComplete(periodMap.get(prevPeriod)!, requiredCount)) {
        gracePeriodActive = true
      }
      continue
    }

    if (complete) {
      tempStreak++
      if (checkingCurrent) currentStreak = tempStreak
    } else {
      if (!gracePeriodActive || tempStreak === 0) {
        checkingCurrent = false
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 0
        gracePeriodActive = false
      }
    }
  }

  bestStreak = Math.max(bestStreak, tempStreak)
  return { current: currentStreak, best: bestStreak, isOnStreak: currentStreak > 0, gracePeriodActive }
}

// ── Punto de entrada público ──────────────────────────────────

export function calculateStreaks(habit: Habit, logs: HabitLog[], todayStr: string): StreakInfo {
  if (logs.length === 0) {
    return { current: 0, best: 0, isOnStreak: false, gracePeriodActive: false }
  }
  if (habit.goal.frequency === 'DAILY') {
    return calcDailyStreak(logs, todayStr)
  }
  return calcPeriodStreak(habit, logs, todayStr)
}

export function calculateCompletionRate(
  habit: Habit,
  logs: HabitLog[],
  lastNDays = 30,
  todayStr: string
): number {
  const today = parseISO(todayStr)
  const cutoff = subDays(today, lastNDays)
  const recentLogs = logs.filter(l => {
    const d = parseISO(l.date)
    return d >= cutoff && d <= today
  })
  if (recentLogs.length === 0) return 0

  if (habit.goal.frequency === 'DAILY') {
    const uniqueDaysCompleted = new Set(recentLogs.filter(l => l.completed).map(l => l.date)).size
    return Math.round((uniqueDaysCompleted / lastNDays) * 100)
  }

  const periodMap = new Map<string, HabitLog[]>()
  for (const log of recentLogs) {
    const key = getPeriodKey(log.date, habit.goal.frequency)
    if (!periodMap.has(key)) periodMap.set(key, [])
    periodMap.get(key)!.push(log)
  }
  const completed = Array.from(periodMap.values()).filter(p => isPeriodComplete(p, habit.goal.count)).length
  return Math.round((completed / periodMap.size) * 100)
}

export { getPeriodKey, isPeriodComplete }
