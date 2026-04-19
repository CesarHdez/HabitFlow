import { IS_LOCAL_MODE, supabase, getUserId } from '@/lib/supabase'
import { LocalLogsDb } from '@/lib/localDb'
import type { HabitLog } from '@/types'

// ── Tipos internos de Supabase ────────────────────────────────

interface LogRow {
  id: string
  user_id: string
  habit_id: string
  date: string
  completed: boolean
  value: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ── Mapper ────────────────────────────────────────────────────

function fromRow(row: LogRow): HabitLog {
  return {
    id:        row.id,
    habitId:   row.habit_id,
    date:      row.date,
    completed: row.completed,
    value:     row.value ?? undefined,
    notes:     row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── Implementación Supabase ───────────────────────────────────

const SupabaseTrackingRepository = {
  async findByDate(date: string): Promise<HabitLog[]> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
    if (error) throw error
    return (data as LogRow[]).map(fromRow)
  },

  async findByHabitAndDate(habitId: string, date: string): Promise<HabitLog | undefined> {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data ? fromRow(data as LogRow) : undefined
  },

  async findByDateRange(startDate: string, endDate: string): Promise<HabitLog[]> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return (data as LogRow[]).map(fromRow)
  },

  async toggle(habitId: string, date: string): Promise<HabitLog> {
    const userId = await getUserId()
    const existing = await this.findByHabitAndDate(habitId, date)
    if (existing) {
      const { data, error } = await supabase
        .from('habit_logs')
        .update({ completed: !existing.completed })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return fromRow(data as LogRow)
    } else {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({ user_id: userId, habit_id: habitId, date, completed: true })
        .select()
        .single()
      if (error) throw error
      return fromRow(data as LogRow)
    }
  },

  async updateNotes(logId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('habit_logs')
      .update({ notes: notes || null })
      .eq('id', logId)
    if (error) throw error
  },

  async getAll(): Promise<HabitLog[]> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return (data as LogRow[]).map(fromRow)
  },
}

// ── Implementación Local (localStorage) ──────────────────────

const LocalTrackingRepository = {
  async findByDate(date: string): Promise<HabitLog[]> {
    return LocalLogsDb.findByDate(date)
  },

  async findByHabitAndDate(habitId: string, date: string): Promise<HabitLog | undefined> {
    return LocalLogsDb.findByHabitAndDate(habitId, date)
  },

  async findByDateRange(startDate: string, endDate: string): Promise<HabitLog[]> {
    return LocalLogsDb.findByDateRange(startDate, endDate)
  },

  async toggle(habitId: string, date: string): Promise<HabitLog> {
    const existing = LocalLogsDb.findByHabitAndDate(habitId, date)
    if (existing) {
      return LocalLogsDb.update(existing.id, { completed: !existing.completed })
    }
    const now = new Date().toISOString()
    const log: HabitLog = {
      id:        crypto.randomUUID(),
      habitId,
      date,
      completed: true,
      createdAt: now,
      updatedAt: now,
    }
    LocalLogsDb.insert(log)
    return log
  },

  async updateNotes(logId: string, notes: string): Promise<void> {
    LocalLogsDb.update(logId, { notes: notes || undefined })
  },

  async getAll(): Promise<HabitLog[]> {
    return LocalLogsDb.findAll()
  },
}

// ── Exportación según modo ────────────────────────────────────

export const TrackingRepository = IS_LOCAL_MODE
  ? LocalTrackingRepository
  : SupabaseTrackingRepository
