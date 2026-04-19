import { IS_LOCAL_MODE, supabase, getUserId } from '@/lib/supabase'
import { LocalHabitsDb } from '@/lib/localDb'
import type { Habit, CreateHabitDTO, UpdateHabitDTO, CategoryId, Frequency } from '@/types'

// ── Tipos internos de Supabase (snake_case) ───────────────────

interface HabitRow {
  id: string
  user_id: string
  name: string
  description: string | null
  category: string
  icon: string
  color: string
  goal_frequency: string
  goal_count: number
  goal_period: number
  is_active: boolean
  start_date: string
  end_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// ── Mappers ───────────────────────────────────────────────────

function fromRow(row: HabitRow): Habit {
  return {
    id:          row.id,
    name:        row.name,
    description: row.description ?? undefined,
    category:    row.category as CategoryId,
    icon:        row.icon,
    color:       row.color,
    goal: {
      frequency: row.goal_frequency as Frequency,
      count:     row.goal_count,
      period:    row.goal_period,
    },
    isActive:    row.is_active,
    startDate:   row.start_date,
    endDate:     row.end_date ?? undefined,
    sortOrder:   row.sort_order,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  }
}

function toInsertRow(dto: CreateHabitDTO, userId: string, sortOrder: number) {
  return {
    user_id:        userId,
    name:           dto.name,
    description:    dto.description ?? null,
    category:       dto.category,
    icon:           dto.icon,
    color:          dto.color,
    goal_frequency: dto.goal.frequency,
    goal_count:     dto.goal.count,
    goal_period:    dto.goal.period,
    is_active:      true,
    start_date:     dto.startDate,
    end_date:       dto.endDate ?? null,
    sort_order:     sortOrder,
  }
}

// ── Implementación Supabase ───────────────────────────────────

const SupabaseHabitsRepository = {
  async findAll(): Promise<Habit[]> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return (data as HabitRow[]).map(fromRow)
  },

  async findById(id: string): Promise<Habit | undefined> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? fromRow(data as HabitRow) : undefined
  },

  async create(dto: CreateHabitDTO): Promise<Habit> {
    const userId = await getUserId()
    const { count } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    const row = toInsertRow(dto, userId, count ?? 0)
    const { data, error } = await supabase
      .from('habits')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return fromRow(data as HabitRow)
  },

  async update(id: string, dto: UpdateHabitDTO): Promise<Habit> {
    const updates: Record<string, unknown> = {}
    if (dto.name        !== undefined) updates.name           = dto.name
    if (dto.description !== undefined) updates.description    = dto.description ?? null
    if (dto.category    !== undefined) updates.category       = dto.category
    if (dto.icon        !== undefined) updates.icon           = dto.icon
    if (dto.color       !== undefined) updates.color          = dto.color
    if (dto.isActive    !== undefined) updates.is_active      = dto.isActive
    if (dto.startDate   !== undefined) updates.start_date     = dto.startDate
    if (dto.endDate     !== undefined) updates.end_date       = dto.endDate ?? null
    if (dto.sortOrder   !== undefined) updates.sort_order     = dto.sortOrder
    if (dto.goal) {
      if (dto.goal.frequency !== undefined) updates.goal_frequency = dto.goal.frequency
      if (dto.goal.count     !== undefined) updates.goal_count     = dto.goal.count
      if (dto.goal.period    !== undefined) updates.goal_period    = dto.goal.period
    }
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return fromRow(data as HabitRow)
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id)
    if (error) throw error
  },

  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: true })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async updateSortOrder(orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase.from('habits').update({ sort_order: i }).eq('id', id)
      )
    )
  },
}

// ── Implementación Local (localStorage) ──────────────────────

const LocalHabitsRepository = {
  async findAll(): Promise<Habit[]> {
    return LocalHabitsDb.findActive().sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async findById(id: string): Promise<Habit | undefined> {
    return LocalHabitsDb.findById(id)
  },

  async create(dto: CreateHabitDTO): Promise<Habit> {
    const now = new Date().toISOString()
    const habit: Habit = {
      id:          crypto.randomUUID(),
      name:        dto.name,
      description: dto.description,
      category:    dto.category,
      icon:        dto.icon,
      color:       dto.color,
      goal:        dto.goal,
      isActive:    true,
      startDate:   dto.startDate,
      endDate:     dto.endDate,
      sortOrder:   LocalHabitsDb.findAll().length,
      createdAt:   now,
      updatedAt:   now,
    }
    LocalHabitsDb.insert(habit)
    return habit
  },

  async update(id: string, dto: UpdateHabitDTO): Promise<Habit> {
    const existing = LocalHabitsDb.findById(id)
    if (!existing) throw new Error('Habit not found')
    return LocalHabitsDb.update(id, {
      ...dto,
      goal: dto.goal ? { ...existing.goal, ...dto.goal } : existing.goal,
    })
  },

  async archive(id: string): Promise<void> {
    LocalHabitsDb.update(id, { isActive: false })
  },

  async restore(id: string): Promise<void> {
    LocalHabitsDb.update(id, { isActive: true })
  },

  async delete(id: string): Promise<void> {
    LocalHabitsDb.delete(id)
  },

  async updateSortOrder(orderedIds: string[]): Promise<void> {
    LocalHabitsDb.reorder(orderedIds)
  },
}

// ── Exportación según modo ────────────────────────────────────

export const HabitsRepository = IS_LOCAL_MODE
  ? LocalHabitsRepository
  : SupabaseHabitsRepository
