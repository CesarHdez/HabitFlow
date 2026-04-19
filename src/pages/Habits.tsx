import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ListChecks, Search, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useHabitsStore } from '@/features/habits/store'
import { HabitCard } from '@/features/habits/HabitCard'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/shared/EmptyState'
import { HabitCardSkeleton } from '@/components/shared/SkeletonCard'
import { DEFAULT_CATEGORIES } from '@/constants/categories'
import type { Habit } from '@/types'

interface SortableCardProps {
  habit: Habit
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}

function SortableHabitCard({ habit, onArchive, onRestore, onDelete }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-1"
    >
      <button
        {...listeners}
        {...attributes}
        className="flex-shrink-0 p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <HabitCard
          habit={habit}
          onArchive={onArchive}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

export default function Habits() {
  const navigate = useNavigate()
  const { habits, isLoading, fetchHabits, archiveHabit, restoreHabit, deleteHabit, reorderHabits } = useHabitsStore()
  const [showArchived, setShowArchived] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { fetchHabits() }, [fetchHabits])

  const active   = habits.filter(h => h.isActive)
  const archived = habits.filter(h => !h.isActive)

  const displayed = useMemo(() => {
    let list = showArchived ? archived : active
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(h => h.name.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q))
    }
    if (categoryFilter) {
      list = list.filter(h => h.category === categoryFilter)
    }
    return list
  }, [showArchived, archived, active, search, categoryFilter])

  const usedCategories = useMemo(() => {
    const src = showArchived ? archived : active
    const ids = new Set(src.map(h => h.category))
    return DEFAULT_CATEGORIES.filter(c => ids.has(c.id))
  }, [showArchived, archived, active])

  const handleDelete = async (id: string) => {
    const habit = habits.find(h => h.id === id)
    if (!confirm(`¿Eliminar "${habit?.name}"? Se borrarán también todos sus registros.`)) return
    await deleteHabit(id)
    toast.success('Hábito eliminado')
  }

  const handleArchive = async (id: string) => {
    await archiveHabit(id)
    toast.success('Hábito archivado')
  }

  const handleRestore = async (id: string) => {
    await restoreHabit(id)
    toast.success('Hábito restaurado')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event
    if (!over || dragActive.id === over.id) return
    const src = showArchived ? archived : active
    const oldIndex = src.findIndex(h => h.id === dragActive.id)
    const newIndex = src.findIndex(h => h.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(src, oldIndex, newIndex)
    reorderHabits(reordered.map(h => h.id))
  }

  const isFiltering = search.trim() !== '' || categoryFilter !== null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mis Hábitos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {active.length} activo{active.length !== 1 ? 's' : ''} · {archived.length} archivado{archived.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/habits/new')}>
          <Plus className="h-4 w-4" />
          Nuevo hábito
        </Button>
      </div>

      {/* Tabs activos / archivados */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => { setShowArchived(false); setCategoryFilter(null) }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !showArchived
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Activos ({active.length})
        </button>
        <button
          onClick={() => { setShowArchived(true); setCategoryFilter(null) }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showArchived
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Archivados ({archived.length})
        </button>
      </div>

      {/* Search + Category Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar hábitos..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        {usedCategories.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {usedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  categoryFilter === cat.id
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
                style={categoryFilter === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <HabitCardSkeleton key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-10 w-10" />}
          title={
            isFiltering ? 'Sin resultados' :
            showArchived ? 'Sin hábitos archivados' : 'Aún no tienes hábitos'
          }
          description={
            isFiltering ? 'Prueba con otro término o categoría.' :
            showArchived ? 'Los hábitos que archives aparecerán aquí.' : 'Crea tu primer hábito para empezar a construir tu rutina.'
          }
          action={
            !showArchived && !isFiltering
              ? <Button onClick={() => navigate('/habits/new')}><Plus className="h-4 w-4" />Crear primer hábito</Button>
              : undefined
          }
        />
      ) : showArchived || isFiltering ? (
        <div className="space-y-2">
          {displayed.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayed.map(h => h.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {displayed.map(habit => (
                <SortableHabitCard
                  key={habit.id}
                  habit={habit}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
