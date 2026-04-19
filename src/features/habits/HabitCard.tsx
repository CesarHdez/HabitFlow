import { MoreVertical, Archive, ArchiveRestore, Trash2, Pencil } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HabitIcon } from '@/components/shared/habit-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DEFAULT_CATEGORIES } from '@/constants/categories'
import type { Habit } from '@/types'
import { cn } from '@/lib/utils/cn'

interface HabitCardProps {
  habit: Habit
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}

export function HabitCard({ habit, onArchive, onRestore, onDelete }: HabitCardProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const category = DEFAULT_CATEGORIES.find(c => c.id === habit.category)

  const freqLabel = {
    DAILY:   'día',
    WEEKLY:  'semana',
    MONTHLY: 'mes',
    YEARLY:  'año',
  }[habit.goal.frequency]

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 transition-shadow hover:shadow-sm',
        !habit.isActive && 'opacity-60'
      )}
    >
      {/* Accent bar */}
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />

      {/* Icon */}
      <HabitIcon name={habit.icon} color={habit.color} size="md" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/habits/${habit.id}`)}
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
          >
            {habit.name}
          </button>
          {!habit.isActive && (
            <Badge variant="secondary" className="text-xs">Archivado</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {category && (
            <Badge variant="secondary">{category.name}</Badge>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {habit.goal.count}× por {freqLabel}
          </span>
        </div>
        {habit.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{habit.description}</p>
        )}
      </div>

      {/* Menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Opciones"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => { navigate(`/habits/${habit.id}/edit`); setMenuOpen(false) }}
            >
              <Pencil className="h-4 w-4" /> Editar
            </button>
            {habit.isActive ? (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => { onArchive(habit.id); setMenuOpen(false) }}
              >
                <Archive className="h-4 w-4" /> Archivar
              </button>
            ) : (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => { onRestore(habit.id); setMenuOpen(false) }}
              >
                <ArchiveRestore className="h-4 w-4" /> Restaurar
              </button>
            )}
            <hr className="my-1 border-gray-100 dark:border-gray-800" />
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => { onDelete(habit.id); setMenuOpen(false) }}
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
