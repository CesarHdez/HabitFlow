import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ColorPicker } from '@/components/shared/color-picker'
import { IconPicker } from '@/components/shared/icon-picker'
import { HabitIcon } from '@/components/shared/habit-icon'
import { DEFAULT_CATEGORIES } from '@/constants/categories'
import { DEFAULT_HABIT_COLOR } from '@/constants/colors'
import { DEFAULT_HABIT_ICON } from '@/constants/icons'
import type { Habit, CreateHabitDTO } from '@/types'

const habitSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres'),
  description: z.string().max(200, 'Máximo 200 caracteres').optional(),
  category: z.enum([
    'health', 'nutrition', 'mindfulness', 'learning',
    'productivity', 'relationships', 'finance', 'creativity',
    'sustainability', 'custom',
  ]),
  icon: z.string(),
  color: z.string(),
  goal: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    count: z.coerce.number().int().min(1, 'Mínimo 1').max(365),
    period: z.number().int().min(1).default(1),
  }),
  startDate: z.string(),
})

type HabitFormValues = z.infer<typeof habitSchema>

const FREQUENCY_LABELS = {
  DAILY:   'por día',
  WEEKLY:  'por semana',
  MONTHLY: 'por mes',
  YEARLY:  'por año',
}

interface HabitFormProps {
  initialData?: Habit
  onSubmit: (data: CreateHabitDTO) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function HabitForm({ initialData, onSubmit, onCancel, isSubmitting }: HabitFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<HabitFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(habitSchema) as any,
    defaultValues: {
      name:        initialData?.name ?? '',
      description: initialData?.description ?? '',
      category:    initialData?.category ?? 'health',
      icon:        initialData?.icon ?? DEFAULT_HABIT_ICON,
      color:       initialData?.color ?? DEFAULT_HABIT_COLOR,
      goal: {
        frequency: initialData?.goal.frequency ?? 'DAILY',
        count:     initialData?.goal.count ?? 1,
        period:    1,
      },
      startDate: initialData?.startDate ?? today,
    },
  })

  const watchColor = watch('color')
  const watchIcon  = watch('icon')
  const watchFreq  = watch('goal.frequency')

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit((values: any) => onSubmit(values as CreateHabitDTO))} className="space-y-5">
      {/* Preview del hábito */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
        <HabitIcon name={watchIcon} color={watchColor} size="lg" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {watch('name') || 'Nombre del hábito'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vista previa</p>
        </div>
      </div>

      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          placeholder="ej. Meditar 10 minutos"
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción <span className="text-gray-400 font-normal">(opcional)</span></Label>
        <Textarea
          id="description"
          placeholder="¿Para qué quieres establecer este hábito?"
          rows={2}
          {...register('description')}
        />
      </div>

      {/* Categoría */}
      <div className="space-y-1.5">
        <Label htmlFor="category">Categoría</Label>
        <Select id="category" {...register('category')}>
          {DEFAULT_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <Label>Color</Label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <ColorPicker value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Icono */}
      <div className="space-y-1.5">
        <Label>Icono</Label>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <IconPicker value={field.value} color={watchColor} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Meta */}
      <div className="space-y-3">
        <Label>Meta</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={365}
            className="w-20"
            {...register('goal.count')}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">vez/veces</span>
          <Controller
            control={control}
            name="goal.frequency"
            render={({ field }) => (
              <Select value={field.value} onChange={field.onChange} className="flex-1">
                <option value="DAILY">por día</option>
                <option value="WEEKLY">por semana</option>
                <option value="MONTHLY">por mes</option>
                <option value="YEARLY">por año</option>
              </Select>
            )}
          />
        </div>
        {errors.goal?.count && (
          <p className="text-xs text-red-500">{errors.goal.count.message}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Meta: {watch('goal.count') || 1} {watch('goal.count') === 1 ? 'vez' : 'veces'} {FREQUENCY_LABELS[watchFreq]}
        </p>
      </div>

      {/* Fecha de inicio */}
      <div className="space-y-1.5">
        <Label htmlFor="startDate">Fecha de inicio</Label>
        <Input type="date" id="startDate" {...register('startDate')} />
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear hábito'}
        </Button>
      </div>
    </form>
  )
}
