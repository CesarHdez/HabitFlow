import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useHabitsStore } from '@/features/habits/store'
import { HabitForm } from '@/features/habits/HabitForm'
import { Button } from '@/components/ui/button'
import type { CreateHabitDTO } from '@/types'

export default function HabitNew() {
  const navigate = useNavigate()
  const { createHabit } = useHabitsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: CreateHabitDTO) => {
    setIsSubmitting(true)
    try {
      await createHabit(data)
      toast.success(`¡Hábito "${data.name}" creado!`)
      navigate('/habits')
    } catch {
      toast.error('Error al crear el hábito')
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nuevo hábito</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configura tu nuevo hábito</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <HabitForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/habits')}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
