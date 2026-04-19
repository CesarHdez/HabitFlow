import { useMemo } from 'react'
import { useHabitsStore } from '@/features/habits/store'
import { useTrackingStore } from '@/features/tracking/store'
import { HabitIcon, ICON_MAP } from '@/components/shared/habit-icon'
import { calculateStreaks } from '@/lib/utils/streaks'
import { BADGES, getNextBadge } from '@/constants/badges'
import { getTodayString } from '@/lib/utils/dates'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function Logros() {
  const { habits } = useHabitsStore()
  const { logsByDate } = useTrackingStore()
  const today = getTodayString()

  const activeHabits = useMemo(() => habits.filter(h => h.isActive), [habits])

  // Mejor streak global
  const bestStreak = useMemo(() => {
    if (activeHabits.length === 0) return 0
    return Math.max(...activeHabits.map(h => {
      const logs = Object.values(logsByDate).flat().filter(l => l.habitId === h.id)
      return calculateStreaks(h, logs, today).current
    }))
  }, [activeHabits, logsByDate, today])

  const earnedIds = new Set(BADGES.filter(b => bestStreak >= b.threshold).map(b => b.id))
  const nextBadge = getNextBadge(bestStreak)

  // Stats por hábito
  const habitStats = useMemo(() =>
    activeHabits.map(habit => {
      const logs = Object.values(logsByDate).flat().filter(l => l.habitId === habit.id)
      const streak = calculateStreaks(habit, logs, today)
      return { habit, streak }
    }).sort((a, b) => b.streak.current - a.streak.current),
  [activeHabits, logsByDate, today])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Logros</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Mejor racha activa: <span className="font-semibold text-orange-500">🔥 {bestStreak} días</span>
        </p>
      </div>

      {/* Próximo logro */}
      {nextBadge && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wide mb-2">Próximo logro</p>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center opacity-40 flex-shrink-0"
              style={{ backgroundColor: `${nextBadge.color}20` }}
            >
              {(() => { const Icon = ICON_MAP[nextBadge.icon] ?? Star; return <Icon className="h-6 w-6" style={{ color: nextBadge.color }} /> })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{nextBadge.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{nextBadge.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((bestStreak / nextBadge.threshold) * 100, 100)}%`,
                      backgroundColor: nextBadge.color,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {bestStreak}/{nextBadge.threshold}d
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de badges */}
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wide mb-3">Todos los logros</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const earned = earnedIds.has(badge.id)
            const Icon = ICON_MAP[badge.icon] ?? Star
            return (
              <div
                key={badge.id}
                className={cn(
                  'rounded-2xl border p-4 text-center transition-all',
                  earned
                    ? 'border-transparent shadow-sm'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-50 grayscale'
                )}
                style={earned ? { backgroundColor: `${badge.color}12`, borderColor: `${badge.color}30` } : undefined}
              >
                <div
                  className="h-12 w-12 rounded-xl mx-auto flex items-center justify-center mb-2"
                  style={{ backgroundColor: earned ? `${badge.color}20` : '#F3F4F6' }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{ color: earned ? badge.color : '#9CA3AF' }}
                  />
                </div>
                <p className={cn(
                  'text-xs font-semibold',
                  earned ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'
                )}>
                  {badge.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{badge.threshold} días</p>
                {earned && (
                  <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: badge.color }}>
                    ¡Obtenido!
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rachas por hábito */}
      {habitStats.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wide mb-3">Rachas por hábito</p>
          <div className="space-y-2">
            {habitStats.map(({ habit, streak }) => (
              <div
                key={habit.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5"
              >
                <HabitIcon name={habit.icon} color={habit.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{habit.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Mejor racha: {streak.best} días
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-orange-500">🔥 {streak.current}</p>
                  <p className="text-[10px] text-gray-400">actual</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
