// ============================================================
// TIPOS GLOBALES DEL DOMINIO — HabitFlow
// ============================================================

// --- Enumeraciones ---

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export type CategoryId =
  | 'health'
  | 'nutrition'
  | 'mindfulness'
  | 'learning'
  | 'productivity'
  | 'relationships'
  | 'finance'
  | 'creativity'
  | 'sustainability'
  | 'custom'

export type Theme = 'light' | 'dark' | 'system'

// --- Modelos de dominio ---

export interface HabitGoal {
  frequency: Frequency
  count: number     // cuántas veces por período (ej: 3 veces por semana)
  period: number    // cada cuántos períodos (ej: cada 1 semana) — normalmente 1
}

export interface Habit {
  id: string                  // UUID v4
  name: string
  description?: string
  category: CategoryId
  icon: string                // nombre del icono lucide-react
  color: string               // hex color del hábito
  goal: HabitGoal
  isActive: boolean
  startDate: string           // ISO 8601 date YYYY-MM-DD
  endDate?: string            // ISO 8601 date YYYY-MM-DD
  sortOrder: number           // para reordenamiento manual
  createdAt: string           // ISO 8601 UTC
  updatedAt: string           // ISO 8601 UTC
}

export interface HabitLog {
  id: string                  // UUID v4
  habitId: string             // referencia a Habit.id
  date: string                // YYYY-MM-DD (fecha local del usuario)
  completed: boolean
  value?: number              // para hábitos cuantitativos (ej: 8 vasos de agua)
  notes?: string
  createdAt: string           // ISO 8601 UTC
  updatedAt: string           // ISO 8601 UTC
}

export interface Category {
  id: CategoryId
  name: string
  icon: string                // nombre del icono lucide-react
  color: string               // color representativo de la categoría
}

export interface AppSettings {
  id: 'singleton'             // solo hay un registro de settings
  theme: Theme
  weekStartsOn: 0 | 1        // 0 = domingo, 1 = lunes
  showArchivedHabits: boolean
  enableConfetti: boolean
  schemaVersion: number       // para migraciones de backup JSON
}

// --- KPIs y Analíticas ---

export interface HabitKPIs {
  habitId: string
  currentStreak: number
  bestStreak: number
  completionRate: number      // 0-100
  weeklyScore: number         // 0-100
  consistencyScore: number    // 0-100
  totalCompletions: number
  lastCompletedDate?: string
}

export interface DayProgress {
  date: string
  completed: number
  total: number
  percentage: number          // 0-100
}

export interface WeekSummary {
  weekStart: string           // lunes de la semana
  weekEnd: string             // domingo de la semana
  days: DayProgress[]
  overallPercentage: number
}

// --- DTOs para formularios ---

export type CreateHabitDTO = Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder' | 'isActive'>

export type UpdateHabitDTO = Partial<Omit<Habit, 'id' | 'createdAt'>>

export type CreateLogDTO = Omit<HabitLog, 'id' | 'createdAt' | 'updatedAt'>

// --- Tipos de UI ---

export interface StreakInfo {
  current: number
  best: number
  isOnStreak: boolean
  gracePeriodActive: boolean  // día de gracia activo
}

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  threshold: number           // días de streak necesarios
  color: string
}

export type BadgeId = '7days' | '21days' | '66days' | '100days' | '365days'
