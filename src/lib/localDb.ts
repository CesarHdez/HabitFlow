import type { Habit, HabitLog } from '@/types'

const HABITS_KEY = 'habitflow_habits'
const LOGS_KEY   = 'habitflow_logs'

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') }
  catch { return [] }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const LocalHabitsDb = {
  findAll(): Habit[] {
    return load<Habit>(HABITS_KEY)
  },

  findActive(): Habit[] {
    return load<Habit>(HABITS_KEY).filter(h => h.isActive)
  },

  findById(id: string): Habit | undefined {
    return load<Habit>(HABITS_KEY).find(h => h.id === id)
  },

  insert(habit: Habit): void {
    const all = load<Habit>(HABITS_KEY)
    all.push(habit)
    save(HABITS_KEY, all)
  },

  update(id: string, updates: Partial<Habit>): Habit {
    const all = load<Habit>(HABITS_KEY)
    const idx = all.findIndex(h => h.id === id)
    if (idx === -1) throw new Error(`Habit ${id} not found`)
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
    save(HABITS_KEY, all)
    return all[idx]
  },

  delete(id: string): void {
    save(HABITS_KEY, load<Habit>(HABITS_KEY).filter(h => h.id !== id))
  },

  reorder(orderedIds: string[]): void {
    const all = load<Habit>(HABITS_KEY)
    orderedIds.forEach((id, i) => {
      const h = all.find(h => h.id === id)
      if (h) h.sortOrder = i
    })
    save(HABITS_KEY, all)
  },
}

export const LocalLogsDb = {
  findAll(): HabitLog[] {
    return load<HabitLog>(LOGS_KEY)
  },

  findByDate(date: string): HabitLog[] {
    return load<HabitLog>(LOGS_KEY).filter(l => l.date === date)
  },

  findByHabitAndDate(habitId: string, date: string): HabitLog | undefined {
    return load<HabitLog>(LOGS_KEY).find(l => l.habitId === habitId && l.date === date)
  },

  findByDateRange(start: string, end: string): HabitLog[] {
    return load<HabitLog>(LOGS_KEY).filter(l => l.date >= start && l.date <= end)
  },

  insert(log: HabitLog): void {
    const all = load<HabitLog>(LOGS_KEY)
    all.push(log)
    save(LOGS_KEY, all)
  },

  update(id: string, updates: Partial<HabitLog>): HabitLog {
    const all = load<HabitLog>(LOGS_KEY)
    const idx = all.findIndex(l => l.id === id)
    if (idx === -1) throw new Error(`Log ${id} not found`)
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
    save(LOGS_KEY, all)
    return all[idx]
  },
}
