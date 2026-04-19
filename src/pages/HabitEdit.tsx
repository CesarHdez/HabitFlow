import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useHabitsStore } from '@/features/habits/store'
import { HabitForm } from '@/features/habits/HabitForm'
import { Button } from '@/components/ui/button'
import type { CreateHabitDTO } from '@/types'

export default function HabitEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getHabitById, updateHabit, fetchHabits, habits } = useHabitsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (habits.length === 0) fetchHabits()
  }, [habits.length, fetchHabits])

  if (!id) return <Navigate to="/habits" replace />

  const habit = getHabitById(id)

  if (habits.length > 0 && !habit) return <Navigate to="/habits" replace />

  if (!habit) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  const handleSubmit = async (data: CreateHabitDTO) => {
    setIsSubmitting(true)
    try {
      await updateHabit(id, data)
      toast.success('Hábito actualizado')
      navigate('/habits')
    } catch {
      toast.error('Error al actualizar el hábito')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar hábito</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{habit.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <HabitForm
          initialData={habit}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/habits')}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
