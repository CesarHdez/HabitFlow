import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Flame, Trophy, TrendingUp, CheckCircle2 } from 'lucide-react'
import { format, parseISO, subDays, startOfWeek, addDays, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useHabitsStore } from '@/features/habits/store'
import { useTrackingStore } from '@/features/tracking/store'
import { HabitIcon } from '@/components/shared/habit-icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { calculateStreaks } from '@/lib/utils/streaks'
import { calcConsistencyScore, scoreColor, scoreLabel } from '@/lib/utils/consistency'
import { getTodayString } from '@/lib/utils/dates'
import { DEFAULT_CATEGORIES } from '@/constants/categories'
import { cn } from '@/lib/utils/cn'
import type { HabitLog } from '@/types'

// ── Mini stat card ────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 flex flex-col items-center gap-1 text-center">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{value}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{label}</p>
    </div>
  )
}

// ── Heatmap de 12 semanas ─────────────────────────────────────

function MiniHeatmap({ habitId, color, logs }: { habitId: string; color: string; logs: HabitLog[] }) {
  const today = getTodayString()
  const todayDate = parseISO(today)
  const completedDates = useMemo(
    () => new Set(logs.filter(l => l.habitId === habitId && l.completed).map(l => l.date)),
    [logs, habitId]
  )

  const startDate = startOfWeek(subDays(todayDate, 83), { weekStartsOn: 1 })
  const weeks = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = format(addDays(startDate, w * 7 + d), 'yyyy-MM-dd')
      return { date, done: completedDates.has(date), future: date > today }
    })
  )

  const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-0.5">
          {DAY_LABELS.map(d => (
            <span key={d} className="h-3 text-[8px] text-gray-400 leading-3">{d}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(({ date, done, future }) => (
              <div
                key={date}
                title={format(parseISO(date), 'EEE d MMM', { locale: es })}
                className={cn(
                  'h-3 w-3 rounded-sm flex-shrink-0',
                  future ? 'opacity-0' : done ? '' : 'bg-gray-100 dark:bg-gray-800'
                )}
                style={!future && done ? { backgroundColor: color } : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { habits, fetchHabits } = useHabitsStore()
  const { fetchLogsForRange, logsByDate } = useTrackingStore()

  const today = getTodayString()

  useEffect(() => { fetchHabits() }, [fetchHabits])

  const startRange = useMemo(() => format(subDays(parseISO(today), 83), 'yyyy-MM-dd'), [today])
  useEffect(() => { fetchLogsForRange(startRange, today) }, [startRange, today, fetchLogsForRange])

  const habit = habits.find(h => h.id === id)
  if (habits.length > 0 && !habit) return <Navigate to="/habits" replace />

  const allLogs = useMemo(
    () => Object.values(logsByDate).flat().filter(l => l.habitId === id),
    [logsByDate, id]
  )

  const streak = useMemo(
    () => (habit ? calculateStreaks(habit, allLogs, today) : { current: 0, best: 0, isOnStreak: false, gracePeriodActive: false }),
    [habit, allLogs, today]
  )

  const consistency = useMemo(
    () => (habit ? calcConsistencyScore(habit, allLogs, today) : 0),
    [habit, allLogs, today]
  )

  const totalCompletions = useMemo(() => allLogs.filter(l => l.completed).length, [allLogs])

  // Weekday distribution (Mon=0 … Sun=6 in our display, Mon=1 in getDay)
  const weekdayData = useMemo(() => {
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    // getDay: 0=Sun,1=Mon,...,6=Sat → reindex Mon=0..Sun=6
    const counts = Array(7).fill(0)
    const totals = Array(7).fill(0)

    const range = Array.from({ length: 84 }, (_, i) => format(subDays(parseISO(today), i), 'yyyy-MM-dd'))
    range.forEach(date => {
      const jsDay = getDay(parseISO(date)) // 0=Sun
      const idx = jsDay === 0 ? 6 : jsDay - 1 // Mon=0..Sun=6
      totals[idx]++
      if (allLogs.some(l => l.date === date && l.completed)) counts[idx]++
    })
    return labels.map((name, i) => ({
      name,
      pct: totals[i] > 0 ? Math.round((counts[i] / totals[i]) * 100) : 0,
    }))
  }, [allLogs, today])

  const recentLogs = useMemo(() => {
    const last30 = Array.from({ length: 30 }, (_, i) => format(subDays(parseISO(today), i), 'yyyy-MM-dd'))
    return last30
      .map(date => ({
        date,
        log: allLogs.find(l => l.date === date),
        done: allLogs.some(l => l.date === date && l.completed),
      }))
      .filter(({ done, log }) => done || log?.notes)
  }, [allLogs, today])

  const category = DEFAULT_CATEGORIES.find(c => c.id === habit?.category)

  if (!habit) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const freqLabel = { DAILY: 'día', WEEKLY: 'semana', MONTHLY: 'mes', YEARLY: 'año' }[habit.goal.frequency]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <HabitIcon name={habit.icon} color={habit.color} size="lg" />
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{habit.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {category && <Badge variant="secondary">{category.name}</Badge>}
              <span className="text-xs text-gray-400">{habit.goal.count}× por {freqLabel}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/habits/${habit.id}/edit`)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      {habit.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 px-1">{habit.description}</p>
      )}

      {/* KPIs */}
      <div className="flex gap-2">
        <StatCard icon={Flame}      label="Racha actual"   value={streak.current}    color="#F97316" />
        <StatCard icon={Trophy}     label="Mejor racha"    value={streak.best}       color="#F59E0B" />
        <StatCard icon={TrendingUp} label="Consistencia"   value={`${consistency}%`} color={scoreColor(consistency)} />
        <StatCard icon={CheckCircle2} label="Total logros" value={totalCompletions}  color="#10B981" />
      </div>

      {/* Consistency label */}
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{ backgroundColor: `${scoreColor(consistency)}10` }}
      >
        <div
          className="h-2.5 flex-1 rounded-full overflow-hidden"
          style={{ backgroundColor: `${scoreColor(consistency)}25` }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${consistency}%`, backgroundColor: scoreColor(consistency) }}
          />
        </div>
        <span className="text-xs font-semibold flex-shrink-0" style={{ color: scoreColor(consistency) }}>
          {scoreLabel(consistency)} ({consistency}%)
        </span>
      </div>

      {/* Heatmap */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
          Últimas 12 semanas
        </p>
        <div className="overflow-x-auto">
          <MiniHeatmap habitId={habit.id} color={habit.color} logs={allLogs} />
        </div>
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-gray-400">Menos</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="h-2.5 w-2.5 rounded-sm opacity-40" style={{ backgroundColor: habit.color }} />
          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: habit.color }} />
          <span className="text-[10px] text-gray-400">Más</span>
        </div>
      </div>

      {/* Distribución por día de semana */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
          Tasa de éxito por día (últimas 12 sem.)
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weekdayData} barSize={28} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip
              formatter={(v) => [`${v}%`, 'Completado']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
              cursor={{ fill: 'rgba(99,102,241,0.06)' }}
            />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {weekdayData.map((entry, i) => (
                <Cell key={i} fill={entry.pct >= 70 ? habit.color : `${habit.color}55`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Historial reciente con notas */}
      {recentLogs.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Registros recientes
          </p>
          <div className="space-y-2">
            {recentLogs.map(({ date, done, log }) => (
              <div key={date} className="flex items-start gap-3">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: done ? `${habit.color}20` : undefined }}
                >
                  {done
                    ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: habit.color }} />
                    : <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-200 dark:border-gray-700" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {format(parseISO(date), "EEE d 'de' MMMM", { locale: es })}
                  </p>
                  {log?.notes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">"{log.notes}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fecha inicio */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        Hábito iniciado el {format(parseISO(habit.startDate), "d 'de' MMMM yyyy", { locale: es })}
      </p>
    </div>
  )
}
