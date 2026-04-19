import { useEffect, useMemo, useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, MessageSquare } from 'lucide-react'
import { format, parseISO, isFuture } from 'date-fns'
import { es } from 'date-fns/locale'
import { useHabitsStore } from '@/features/habits/store'
import { useTrackingStore } from '@/features/tracking/store'
import { HabitIcon } from '@/components/shared/habit-icon'
import { NoteDialog } from '@/components/shared/NoteDialog'
import { Button } from '@/components/ui/button'
import { fireCheckInConfetti } from '@/lib/utils/confetti'
import { getTodayString } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import type { Habit, HabitLog } from '@/types'

export default function TrackingDay() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { habits, fetchHabits } = useHabitsStore()
  const { fetchLogsForDate, toggleHabit, isHabitCompletedOnDate, getLogForHabitAndDate, updateNotes } = useTrackingStore()
  const today = getTodayString()

  const [noteTarget, setNoteTarget] = useState<{ habit: Habit; log: HabitLog | null } | null>(null)

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return <Navigate to="/tracking" replace />
  if (isFuture(parseISO(date)) && date !== today) return <Navigate to="/tracking" replace />

  const activeHabits = useMemo(() => habits.filter(h => h.isActive), [habits])
  const completedCount = activeHabits.filter(h => isHabitCompletedOnDate(h.id, date)).length

  useEffect(() => { fetchHabits() }, [fetchHabits])
  useEffect(() => { fetchLogsForDate(date) }, [date, fetchLogsForDate])

  const handleToggle = async (habitId: string) => {
    const wasCompleted = isHabitCompletedOnDate(habitId, date)
    await toggleHabit(habitId, date)
    if (!wasCompleted) fireCheckInConfetti()
  }

  const handleOpenNote = (e: React.MouseEvent, habit: Habit) => {
    e.stopPropagation()
    const log = getLogForHabitAndDate(habit.id, date!) ?? null
    setNoteTarget({ habit, log })
  }

  const handleSaveNote = async (logId: string, notes: string) => {
    await updateNotes(logId, date!, notes)
  }

  const dateLabel = format(parseISO(date), "EEEE d 'de' MMMM yyyy", { locale: es })
  const isToday = date === today

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">{dateLabel}</h2>
          {isToday && <p className="text-xs text-indigo-500 font-medium">Hoy</p>}
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {completedCount} de {activeHabits.length} completados
          </span>
          <span className="text-sm font-bold text-indigo-500">
            {activeHabits.length > 0 ? Math.round((completedCount / activeHabits.length) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: activeHabits.length > 0 ? `${(completedCount / activeHabits.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {activeHabits.map(habit => {
          const done = isHabitCompletedOnDate(habit.id, date)
          const log = getLogForHabitAndDate(habit.id, date)
          const hasNote = !!log?.notes
          return (
            <div
              key={habit.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm',
                done ? 'border-transparent' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              )}
              style={done ? { backgroundColor: `${habit.color}12`, borderColor: `${habit.color}35` } : undefined}
            >
              <button
                className="flex items-center gap-3 flex-1 min-w-0 text-left active:scale-[0.99]"
                onClick={() => handleToggle(habit.id)}
              >
                <HabitIcon name={habit.icon} color={habit.color} size="md" />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                  )}>
                    {habit.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {habit.goal.count}× por {habit.goal.frequency === 'DAILY' ? 'día' : 'semana'}
                  </p>
                </div>
              </button>
              <button
                onClick={(e) => handleOpenNote(e, habit)}
                className={cn(
                  'flex-shrink-0 p-1.5 rounded-lg transition-colors',
                  hasNote
                    ? 'text-indigo-500'
                    : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'
                )}
                aria-label="Añadir nota"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button
                className="flex-shrink-0 active:scale-95 transition-transform"
                onClick={() => handleToggle(habit.id)}
              >
                {done
                  ? <CheckCircle2 className="h-6 w-6" style={{ color: habit.color }} />
                  : <Circle className="h-6 w-6 text-gray-300 dark:text-gray-700" />
                }
              </button>
            </div>
          )
        })}
      </div>

      <NoteDialog
        open={!!noteTarget}
        habit={noteTarget?.habit ?? null}
        log={noteTarget?.log ?? null}
        onClose={() => setNoteTarget(null)}
        onSave={handleSaveNote}
      />
    </div>
  )
}
