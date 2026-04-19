import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import { format, parseISO, subDays, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useHabitsStore } from '@/features/habits/store'
import { useTrackingStore } from '@/features/tracking/store'
import { HabitIcon } from '@/components/shared/habit-icon'
import { Badge } from '@/components/ui/badge'
import { calculateStreaks } from '@/lib/utils/streaks'
import { getTodayString } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import type { Habit } from '@/types'

// ── Heatmap de 12 semanas (84 días) ──────────────────────────

function HabitHeatmap({ habit, logsByDate }: { habit: Habit; logsByDate: Record<string, import('@/types').HabitLog[]> }) {
  const today = getTodayString()
  const todayDate = parseISO(today)

  // Empezar en el lunes de hace 11 semanas
  const startDate = startOfWeek(subDays(todayDate, 83), { weekStartsOn: 1 })

  const weeks: { date: string; done: boolean; future: boolean }[][] = []
  for (let w = 0; w < 12; w++) {
    const week: { date: string; done: boolean; future: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const date = format(addDays(startDate, w * 7 + d), 'yyyy-MM-dd')
      const logs = logsByDate[date] ?? []
      const done = logs.some(l => l.habitId === habit.id && l.completed)
      const future = date > today
      week.push({ date, done, future })
    }
    weeks.push(week)
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map(({ date, done, future }) => (
            <div
              key={date}
              title={format(parseISO(date), 'dd MMM yyyy', { locale: es })}
              className={cn(
                'h-3 w-3 rounded-sm flex-shrink-0',
                future ? 'opacity-0'
                  : done ? ''
                  : 'bg-gray-100 dark:bg-gray-800'
              )}
              style={!future && done ? { backgroundColor: habit.color } : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Gráfico de tendencia (últimas 8 semanas) ──────────────────

function TrendChart({ activeHabits, logsByDate }: {
  activeHabits: Habit[]
  logsByDate: Record<string, import('@/types').HabitLog[]>
}) {
  const today = getTodayString()
  const data = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subDays(parseISO(today), (7 - i) * 7), { weekStartsOn: 1 })
      const days = Array.from({ length: 7 }, (_, d) => format(addDays(weekStart, d), 'yyyy-MM-dd'))
      const label = format(weekStart, 'd MMM', { locale: es })
      const totalExpected = activeHabits.length * 7
      const totalDone = days.reduce((sum, day) => {
        const logs = logsByDate[day] ?? []
        return sum + activeHabits.filter(h => logs.some(l => l.habitId === h.id && l.completed)).length
      }, 0)
      const pct = totalExpected > 0 ? Math.round((totalDone / totalExpected) * 100) : 0
      return { label, pct }
    })
  }, [activeHabits, logsByDate, today])

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v) => [`${v}%`, 'Completitud']}
          contentStyle={{
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            fontSize: 12,
            backgroundColor: 'white',
          }}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke="#6366F1"
          strokeWidth={2.5}
          dot={{ fill: '#6366F1', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Por día de semana ─────────────────────────────────────────

function WeekdayChart({ activeHabits, logsByDate }: {
  activeHabits: Habit[]
  logsByDate: Record<string, import('@/types').HabitLog[]>
}) {
  const today = getTodayString()
  const data = useMemo(() => {
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const counts = [0, 0, 0, 0, 0, 0, 0]
    const totals = [0, 0, 0, 0, 0, 0, 0]
    for (let i = 0; i < 28; i++) {
      const d = format(subDays(parseISO(today), i), 'yyyy-MM-dd')
      const dow = (parseISO(d).getDay() + 6) % 7
      const logs = logsByDate[d] ?? []
      counts[dow] += activeHabits.filter(h => logs.some(l => l.habitId === h.id && l.completed)).length
      totals[dow] += activeHabits.length
    }
    return labels.map((label, i) => ({
      label,
      pct: totals[i] > 0 ? Math.round((counts[i] / totals[i]) * 100) : 0,
    }))
  }, [activeHabits, logsByDate, today])

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => [`${v}%`, 'Completitud']} contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: 12 }} />
        <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pct >= 70 ? '#10B981' : entry.pct >= 40 ? '#6366F1' : '#D1D5DB'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function Analytics() {
  const { habits, fetchHabits } = useHabitsStore()
  const { fetchLogsForRange, logsByDate } = useTrackingStore()
  const [selectedHabit, setSelectedHabit] = useState<string | 'all'>('all')
  const today = getTodayString()

  const activeHabits = useMemo(() => habits.filter(h => h.isActive), [habits])

  useEffect(() => { fetchHabits() }, [fetchHabits])
  useEffect(() => {
    const start = format(subDays(parseISO(today), 90), 'yyyy-MM-dd')
    fetchLogsForRange(start, today)
  }, [today, fetchLogsForRange])

  const habitStats = useMemo(() =>
    activeHabits.map(habit => {
      const allLogs = Object.values(logsByDate).flat().filter(l => l.habitId === habit.id)
      const streak = calculateStreaks(habit, allLogs, today)
      const last30 = allLogs.filter(l => l.completed && l.date >= format(subDays(parseISO(today), 29), 'yyyy-MM-dd'))
      const rate = Math.round((last30.length / 30) * 100)
      return { habit, streak, rate, total: allLogs.filter(l => l.completed).length }
    }).sort((a, b) => b.streak.current - a.streak.current),
  [activeHabits, logsByDate, today])

  const displayHabits = selectedHabit === 'all'
    ? activeHabits
    : activeHabits.filter(h => h.id === selectedHabit)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analíticas</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Historial y tendencias de tus hábitos</p>
      </div>

      {activeHabits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Crea hábitos y empieza a registrarlos para ver tus analíticas</p>
        </div>
      ) : (
        <>
          {/* Resumen por hábito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {habitStats.map(({ habit, streak, rate, total }) => (
              <button
                key={habit.id}
                onClick={() => setSelectedHabit(selectedHabit === habit.id ? 'all' : habit.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:shadow-sm',
                  selectedHabit === habit.id
                    ? 'border-transparent shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                )}
                style={selectedHabit === habit.id
                  ? { backgroundColor: `${habit.color}12`, borderColor: `${habit.color}40` }
                  : undefined}
              >
                <HabitIcon name={habit.icon} color={habit.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{habit.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-orange-500 font-medium">🔥 {streak.current}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{rate}% (30d)</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{total} total</span>
                  </div>
                </div>
                {streak.best > 0 && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    Máx {streak.best}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Tendencia semanal */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Tendencia semanal · últimas 8 semanas
            </h3>
            <TrendChart activeHabits={displayHabits} logsByDate={logsByDate} />
          </div>

          {/* Por día de semana */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Completitud por día · últimos 28 días
            </h3>
            <WeekdayChart activeHabits={displayHabits} logsByDate={logsByDate} />
          </div>

          {/* Heatmaps */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Consistencia · últimas 12 semanas
              <span className="ml-2 text-xs font-normal text-gray-400">
                {selectedHabit !== 'all' && '(filtrado)'}
              </span>
            </h3>
            {displayHabits.map(habit => (
              <div key={habit.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <HabitIcon name={habit.icon} color={habit.color} size="sm" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{habit.name}</span>
                </div>
                <HabitHeatmap habit={habit} logsByDate={logsByDate} />
              </div>
            ))}

            {/* Leyenda */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-400">Menos</span>
              <div className="flex gap-1">
                {[0.15, 0.35, 0.6, 0.85, 1].map((op, i) => (
                  <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: `rgba(99,102,241,${op})` }} />
                ))}
              </div>
              <span className="text-xs text-gray-400">Más</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
