import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { HabitIcon } from './habit-icon'
import type { Habit, HabitLog } from '@/types'

interface NoteDialogProps {
  open: boolean
  habit: Habit | null
  log: HabitLog | null
  onClose: () => void
  onSave: (logId: string, notes: string) => Promise<void>
}

export function NoteDialog({ open, habit, log, onClose, onSave }: NoteDialogProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setText(log?.notes ?? '')
  }, [open, log])

  const handleSave = async () => {
    if (!log) return
    setSaving(true)
    try {
      await onSave(log.id, text)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!habit) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Notas del día"
      description={habit.name}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
          <HabitIcon name={habit.icon} color={habit.color} size="md" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{habit.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {log?.completed ? '✓ Completado' : '— Sin completar'}
            </p>
          </div>
        </div>

        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="¿Cómo te fue hoy con este hábito? Añade una reflexión..."
          rows={4}
          autoFocus
          maxLength={300}
        />
        <p className="text-xs text-gray-400 text-right">{text.length}/300</p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar nota'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
