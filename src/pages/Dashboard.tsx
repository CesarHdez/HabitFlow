import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, CheckCircle2, TrendingUp, Target, Plus, ArrowRight, Circle, Trophy } from 'lucide-react'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useHabitsStore } from '@/features/habits/store'
import { useTrackingStore } from '@/features/tracking/store'
import { HabitIcon } from '@/components/shared/habit-icon'
import { KPICardSkeleton } from '@/components/shared/SkeletonCard'
import { Button } from '@/components/ui/button'
import { format, subDays, parseISO } from 'date-fns'
import { calculateStreaks } from '@/lib/utils/streaks'
import { calcConsistencyScore, scoreColor, scoreLabel } from '@/lib/utils/consistency'
import { getTodayString, getWeekDays } from '@/lib/utils/dates'
import { fireCheckInConfetti, fireAllDoneConfetti } from '@/lib/utils/confetti'
import { useBadgeCheck } from '@/hooks/useBadgeCheck'
import { getNextBadge } from '@/constants/badges'
import { MOTIVATIONAL_QUOTES } from '@/constants/motivations'
import { cn } from '@/lib/utils/cn'

interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
}

function KPICard({ label, value, sub, icon: Icon, color }: KPICardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
        <div className="rounded-xl p-2.5 flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { habits, isLoading, fetchHabits } = useHabitsStore()
  const { fetchLogsForRange, toggleHabit, isHabitCompletedOnDate, logsByDate } = useTrackingStore()
  const allDoneRef = useRef(false)
  const { checkBadges } = useBadgeCheck()

  const today = getTodayString()
  const weekDays = useMemo(() => getWeekDays(today, 1), [today])
  const activeHabits = useMemo(() => habits.filter(h => h.isActive), [habits])

  useEffect(() => { fetchHabits() }, [fetchHabits])
  useEffect(() => {
    if (weekDays.length > 0) fetchLogsForRange(weekDays[0], weekDays[6])
  }, [weekDays, fetchLogsForRange])

  const completedToday = activeHabits.filter(h => isHabitCompletedOnDate(h.id, today)).length

  // Confetti al completar todos
  useEffect(() => {
    if (activeHabits.length > 0 && completedToday === activeHabits.length) {
      if (!allDoneRef.current) {
        allDoneRef.current = true
        fireAllDoneConfetti()
      }
    } else {
      allDoneRef.current = false
    }
  }, [completedToday, activeHabits.length])

  const bestCurrentStreak = useMemo(() => {
    if (activeHabits.length === 0) return 0
    return Math.max(...activeHabits.map(h => {
      const logs = Object.values(logsByDate).flat().filter(l => l.habitId === h.id)
      return calculateStreaks(h, logs, today).current
    }))
  }, [activeHabits, logsByDate, today])

  const weeklyRate = useMemo(() => {
    if (activeHabits.length === 0 || !weekDays.length) return 0
    const pastDays = weekDays.filter(d => d <= today)
    if (!pastDays.length) return 0
    const expected = activeHabits.length * pastDays.length
    const done = pastDays.reduce((s, d) =>
      s + activeHabits.filter(h => isHabitCompletedOnDate(h.id, d)).length, 0)
    return expected > 0 ? Math.round((done / expected) * 100) : 0
  }, [activeHabits, weekDays, today, isHabitCompletedOnDate])

  const lastWeekRate = useMemo(() => {
    if (activeHabits.length === 0) return 0
    const lastWeekDays = getWeekDays(format(subDays(parseISO(weekDays[0] ?? today), 1), 'yyyy-MM-dd'), 1)
    const expected = activeHabits.length * 7
    const done = lastWeekDays.reduce((s, d) =>
      s + activeHabits.filter(h => isHabitCompletedOnDate(h.id, d)).length, 0)
    return expected > 0 ? Math.round((done / expected) * 100) : 0
  }, [activeHabits, weekDays, today, isHabitCompletedOnDate])

  const nextBadge = useMemo(() => getNextBadge(bestCurrentStreak), [bestCurrentStreak])

  const quote = useMemo(() => {
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length]
  }, [])

  const todayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const allDone = activeHabits.length > 0 && completedToday === activeHabits.length
  const pct = activeHabits.length > 0 ? Math.round((completedToday / activeHabits.length) * 100) : 0

  const handleToggle = async (habitId: string) => {
    const wasDone = isHabitCompletedOnDate(habitId, today)
    await toggleHabit(habitId, today)
    if (!wasDone) {
      fireCheckInConfetti()
      setTimeout(checkBadges, 300)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Saludo */}
      <div>
        <p className="text-sm text-gray-400 dark:text-gray-500 capitalize">{todayLabel}</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
          {allDone ? '¡Día completado! 🎉' : completedToday === 0 ? '¡Empieza tu día!' : '¡Vas por buen camino!'}
        </h2>
        {activeHabits.length > 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 italic">"{quote}"</p>
        )}
      </div>

      {/* Barra de progreso */}
      {activeHabits.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {completedToday} de {activeHabits.length} completados
            </span>
            <span className="text-sm font-bold" style={{ color: allDone ? '#10B981' : '#6366F1' }}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ backgroundColor: allDone ? '#10B981' : '#6366F1' }}
            />
          </div>
        </div>
      )}

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <KPICard label="Racha activa" value={bestCurrentStreak}
            sub={bestCurrentStreak === 1 ? 'día consecutivo' : 'días consecutivos'}
            icon={Flame} color="#F97316" />
          <KPICard label="Tasa semanal" value={`${weeklyRate}%`}
            sub="completitud esta semana" icon={TrendingUp} color="#6366F1" />
          <KPICard label="Hoy" value={`${completedToday}/${activeHabits.length}`}
            sub={allDone ? '¡Todo completado!' : `${activeHabits.length - completedToday} pendientes`}
            icon={CheckCircle2} color="#10B981" />
          <KPICard label="Hábitos activos" value={activeHabits.length}
            sub={habits.filter(h => !h.isActive).length > 0
              ? `${habits.filter(h => !h.isActive).length} archivados` : 'todos activos'}
            icon={Target} color="#8B5CF6" />
        </div>
      )}

      {/* Comparativa semana actual vs anterior */}
      {activeHabits.length > 0 && !isLoading && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Esta semana vs semana anterior</p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">Anterior</span>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{lastWeekRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-700" style={{ width: `${lastWeekRate}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">Esta semana</span>
                <span className="text-sm font-bold text-indigo-500">{weeklyRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${weeklyRate}%` }} />
              </div>
            </div>
            <div className={cn(
              'text-sm font-bold flex-shrink-0 px-2.5 py-1 rounded-xl',
              weeklyRate >= lastWeekRate
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
            )}>
              {weeklyRate >= lastWeekRate ? '+' : ''}{weeklyRate - lastWeekRate}%
            </div>
          </div>
        </div>
      )}

      {/* Próximo logro */}
      {nextBadge && bestCurrentStreak > 0 && (
        <button
          onClick={() => navigate('/logros')}
          className="w-full flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-left hover:shadow-sm transition-shadow"
        >
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${nextBadge.color}20` }}>
            <Trophy className="h-5 w-5" style={{ color: nextBadge.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">Próximo logro</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{nextBadge.name}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((bestCurrentStreak / nextBadge.threshold) * 100, 100)}%`,
                    backgroundColor: nextBadge.color,
                  }} />
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {bestCurrentStreak}/{nextBadge.threshold}d
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
        </button>
      )}

      {/* Lista de hábitos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hábitos de hoy</h3>
          <button onClick={() => navigate('/tracking')}
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium">
            Vista semanal <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {activeHabits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Aún no tienes hábitos configurados</p>
            <Button size="sm" onClick={() => navigate('/habits/new')}>
              <Plus className="h-4 w-4" /> Crear primer hábito
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeHabits.map(habit => {
              const done = isHabitCompletedOnDate(habit.id, today)
              const streak = calculateStreaks(
                habit,
                Object.values(logsByDate).flat().filter(l => l.habitId === habit.id),
                today
              )
              const habitLogs = Object.values(logsByDate).flat().filter(l => l.habitId === habit.id)
              const consistency = calcConsistencyScore(habit, habitLogs, today)
              return (
                <motion.button
                  key={habit.id}
                  layout
                  onClick={() => handleToggle(habit.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all active:scale-[0.99]',
                    done
                      ? 'border-transparent'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm'
                  )}
                  style={done ? { backgroundColor: `${habit.color}12`, borderColor: `${habit.color}35` } : undefined}
                >
                  <HabitIcon name={habit.icon} color={habit.color} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate transition-all',
                      done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                    )}>
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {habit.goal.count}× / {habit.goal.frequency === 'DAILY' ? 'día' : habit.goal.frequency === 'WEEKLY' ? 'semana' : 'mes'}
                      </span>
                      {streak.current > 1 && (
                        <span className="text-xs font-semibold text-orange-500">🔥 {streak.current}</span>
                      )}
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${scoreColor(consistency)}18`, color: scoreColor(consistency) }}
                      >
                        {consistency}% {scoreLabel(consistency)}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ scale: done ? 1 : 0.9, opacity: done ? 1 : 0.4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {done
                      ? <CheckCircle2 className="h-6 w-6" style={{ color: habit.color }} />
                      : <Circle className="h-6 w-6 text-gray-300 dark:text-gray-700" />
                    }
                  </motion.div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
