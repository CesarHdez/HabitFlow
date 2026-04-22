import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, CalendarDays, LayoutGrid } from 'lucide-react'
import { format, parseISO, isFuture, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useHabitsStore } from '@/features/habits/store'
import { TrackingRowSkeleton } from '@/components/shared/SkeletonCard'
import { useTrackingStore } from '@/features/tracking/store'
import { useUIStore } from '@/store/useUIStore'
import { HabitIcon } from '@/components/shared/habit-icon'
import { Button } from '@/components/ui/button'
import { fireCheckInConfetti } from '@/lib/utils/confetti'
import { getWeekDays, getTodayString } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import type { Habit } from '@/types'

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// ── Vista mensual ─────────────────────────────────────────────

function MonthCalendar({
  monthDate,
  activeHabits,
  today,
  isHabitCompletedOnDate,
}: {
  monthDate: Date
  activeHabits: Habit[]
  today: string
  isHabitCompletedOnDate: (habitId: string, date: string) => boolean
}) {
  const navigate = useNavigate()

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = addDays(gridStart, 41) // always 6 weeks × 7

    return eachDayOfInterval({ start: gridStart, end: gridEnd }).map(d => ({
      date: format(d, 'yyyy-MM-dd'),
      inMonth: d >= monthStart && d <= monthEnd,
      isToday: format(d, 'yyyy-MM-dd') === today,
      isFuture: format(d, 'yyyy-MM-dd') > today,
    }))
  }, [monthDate, today])

  const handleDayClick = (date: string, inMonth: boolean, isFut: boolean) => {
    if (isFut || !inMonth) return
    navigate(`/tracking/${date}`)
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
        {DAY_LETTERS.map(l => (
          <div key={l} className="py-2 text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500">{l}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, inMonth, isToday: isTod, isFuture: isFut }, idx) => {
          const completedHabits = activeHabits.filter(h => isHabitCompletedOnDate(h.id, date))
          const completedCount = completedHabits.length
          const totalCount = activeHabits.length
          const canNavigate = inMonth && !isFut

          return (
            <button
              key={date}
              onClick={() => handleDayClick(date, inMonth, isFut)}
              disabled={!canNavigate}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2 px-1 border-b border-r border-gray-50 dark:border-gray-800/60 min-h-[60px] transition-colors',
                idx % 7 === 6 && 'border-r-0',
                canNavigate && 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer',
                !inMonth && 'opacity-25',
                isFut && 'cursor-default',
              )}
            >
              <span className={cn(
                'text-xs font-semibold leading-none w-5 h-5 flex items-center justify-center rounded-full',
                isTod ? 'bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300'
              )}>
                {format(parseISO(date), 'd')}
              </span>

              {/* Completion indicator */}
              {inMonth && !isFut && totalCount > 0 && (
                <div className="flex flex-col items-center gap-0.5 w-full px-1">
                  {/* Progress micro-bar */}
                  <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(completedCount / totalCount) * 100}%`,
                        backgroundColor: completedCount === totalCount && totalCount > 0
                          ? '#10B981'
                          : '#6366F1',
                      }}
                    />
                  </div>
                  {/* Habit dots (max 4) */}
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {activeHabits.slice(0, 4).map(h => (
                      <div
                        key={h.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: isHabitCompletedOnDate(h.id, date) ? h.color : '#E5E7EB',
                        }}
                      />
                    ))}
                    {activeHabits.length > 4 && (
                      <span className="text-[8px] text-gray-400">+{activeHabits.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      {activeHabits.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex-wrap">
          {activeHabits.slice(0, 6).map(h => (
            <div key={h.id} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: h.color }} />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[70px]">{h.name}</span>
            </div>
          ))}
          {activeHabits.length > 6 && (
            <span className="text-[10px] text-gray-400">+{activeHabits.length - 6} más</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function Tracking() {
  const navigate = useNavigate()
  const { selectedDate, setSelectedDate } = useUIStore()
  const { habits, isLoading, fetchHabits } = useHabitsStore()
  const { fetchLogsForRange, toggleHabit, isHabitCompletedOnDate } = useTrackingStore()
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')

  const today = getTodayString()
  const weekDays = useMemo(() => getWeekDays(selectedDate, 1), [selectedDate])
  const activeHabits = useMemo(() => habits.filter(h => h.isActive), [habits])

  // Month date derived from selectedDate
  const monthDate = useMemo(() => parseISO(selectedDate), [selectedDate])
  const monthStart = useMemo(() => format(startOfMonth(monthDate), 'yyyy-MM-dd'), [monthDate])
  const monthEnd   = useMemo(() => format(endOfMonth(monthDate), 'yyyy-MM-dd'), [monthDate])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  useEffect(() => {
    if (viewMode === 'week' && weekDays.length > 0) {
      fetchLogsForRange(weekDays[0], weekDays[6])
    }
  }, [weekDays, fetchLogsForRange, viewMode])

  useEffect(() => {
    if (viewMode === 'month') {
      fetchLogsForRange(monthStart, monthEnd)
    }
  }, [monthStart, monthEnd, fetchLogsForRange, viewMode])

  const prevWeek  = () => setSelectedDate(format(subDays(parseISO(weekDays[0]), 1), 'yyyy-MM-dd'))
  const nextWeek  = () => setSelectedDate(format(addDays(parseISO(weekDays[6]), 1), 'yyyy-MM-dd'))
  const prevMonth = () => setSelectedDate(format(subMonths(monthDate, 1), 'yyyy-MM-dd'))
  const nextMonth = () => setSelectedDate(format(addMonths(monthDate, 1), 'yyyy-MM-dd'))
  const goToday   = () => setSelectedDate(today)

  const handleToggle = async (habitId: string, date: string) => {
    if (isFuture(parseISO(date)) && date !== today) return
    const wasDone = isHabitCompletedOnDate(habitId, date)
    try {
      await toggleHabit(habitId, date)
      if (!wasDone) fireCheckInConfetti()
    } catch {
      toast.error('Error al registrar el hábito')
    }
  }

  const focusDate = weekDays.includes(today) ? today : weekDays[3]
  const completedFocus = activeHabits.filter(h => isHabitCompletedOnDate(h.id, focusDate)).length

  const weekRange = weekDays.length > 0
    ? `${format(parseISO(weekDays[0]), 'd MMM', { locale: es })} – ${format(parseISO(weekDays[6]), 'd MMM yyyy', { locale: es })}`
    : ''

  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: es })
  const isCurrentMonth = format(monthDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
  const isCurrentWeek = weekDays.includes(today)

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* View mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'week'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'month'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Mes
          </button>
        </div>

        {/* Navigation header */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={viewMode === 'week' ? prevWeek : prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[140px]">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {viewMode === 'week' ? weekRange : monthLabel}
            </p>
            {((viewMode === 'week' && !isCurrentWeek) || (viewMode === 'month' && !isCurrentMonth)) && (
              <button onClick={goToday} className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium">
                Ir a hoy
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={viewMode === 'week' ? nextWeek : nextMonth}
            disabled={
              (viewMode === 'week' && weekDays[6] >= today) ||
              (viewMode === 'month' && isCurrentMonth)
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month view */}
      {viewMode === 'month' && (
        <MonthCalendar
          monthDate={monthDate}
          activeHabits={activeHabits}
          today={today}
          isHabitCompletedOnDate={isHabitCompletedOnDate}
        />
      )}

      {/* Week view */}
      {viewMode === 'week' && (
        <>
          {/* Progress bar del día actual */}
          {weekDays.includes(today) && activeHabits.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso de hoy</span>
                <span className="text-sm font-bold text-indigo-500">
                  {completedFocus}/{activeHabits.length}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${(completedFocus / activeHabits.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Header días */}
            <div className="grid" style={{ gridTemplateColumns: '1fr repeat(7, 44px)' }}>
              <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 font-medium">Hábito</div>
              {weekDays.map((day, i) => {
                const isCurrentDay = day === today
                const isPast = day < today
                return (
                  <button
                    key={day}
                    onClick={() => (isPast || isCurrentDay) && navigate(`/tracking/${day}`)}
                    disabled={!isPast && !isCurrentDay}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 border-b border-l border-gray-100 dark:border-gray-800 transition-colors',
                      isCurrentDay && 'bg-indigo-50 dark:bg-indigo-900/20',
                      (isPast || isCurrentDay) && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
                    )}
                    title={format(parseISO(day), 'EEEE d MMMM', { locale: es })}
                  >
                    <span className={cn(
                      'text-[10px] font-medium',
                      isCurrentDay ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                    )}>
                      {DAY_LETTERS[i]}
                    </span>
                    <span className={cn(
                      'text-sm font-bold leading-none mt-0.5',
                      isCurrentDay ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                    )}>
                      {format(parseISO(day), 'd')}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Filas */}
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <TrackingRowSkeleton key={i} />)
            ) : activeHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Sin hábitos activos</p>
                <button
                  onClick={() => navigate('/habits/new')}
                  className="mt-2 text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  Crear un hábito →
                </button>
              </div>
            ) : (
              activeHabits.map((habit, habitIdx) => (
                <div
                  key={habit.id}
                  className={cn(
                    'grid items-center',
                    habitIdx < activeHabits.length - 1 && 'border-b border-gray-100 dark:border-gray-800'
                  )}
                  style={{ gridTemplateColumns: '1fr repeat(7, 44px)' }}
                >
                  <button
                    className="flex items-center gap-2 px-3 py-3 min-w-0 text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    onClick={() => navigate(`/habits/${habit.id}`)}
                  >
                    <HabitIcon name={habit.icon} color={habit.color} size="sm" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{habit.name}</span>
                  </button>

                  {weekDays.map((day) => {
                    const completed = isHabitCompletedOnDate(habit.id, day)
                    const future = isFuture(parseISO(day)) && day !== today
                    const isCurrentDay = day === today

                    return (
                      <div
                        key={day}
                        className={cn(
                          'flex items-center justify-center border-l border-gray-100 dark:border-gray-800 h-full py-3',
                          isCurrentDay && 'bg-indigo-50 dark:bg-indigo-900/20'
                        )}
                      >
                        <button
                          onClick={() => !future && handleToggle(habit.id, day)}
                          disabled={future}
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                            future ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95',
                          )}
                          style={completed ? { backgroundColor: habit.color } : undefined}
                          aria-label={`${habit.name} – ${day}`}
                        >
                          {completed
                            ? <CheckCircle2 className="h-5 w-5 text-white" />
                            : <Circle className={cn('h-5 w-5', future ? 'text-gray-200 dark:text-gray-700' : 'text-gray-300 dark:text-gray-600')} />
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Toca un día pasado para ver el detalle · Toca un círculo para marcar/desmarcar
          </p>
        </>
      )}
    </div>
  )
}
