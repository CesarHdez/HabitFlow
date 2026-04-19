import Dexie, { type EntityTable } from 'dexie'
import type { Habit, HabitLog, Category, AppSettings } from '@/types'

// ============================================================
// SCHEMA DE BASE DE DATOS — Dexie.js (IndexedDB)
// ============================================================

class HabitFlowDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  categories!: EntityTable<Category, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('HabitFlowDB')

    this.version(1).stores({
      // Sintaxis Dexie: primer campo = primary key, resto = índices
      habits:    'id, category, isActive, createdAt, sortOrder',
      habitLogs: 'id, habitId, date, [habitId+date], completed',
      categories:'id, name',
      settings:  'id',
    })
  }
}

export const db = new HabitFlowDB()

// ============================================================
// SEED INICIAL — se ejecuta en el primer arranque
// ============================================================

export async function seedDatabase(): Promise<void> {
  const settingsCount = await db.settings.count()

  // Solo hacer seed si la DB está vacía (primer arranque)
  if (settingsCount > 0) return

  // Seed de settings por defecto
  await db.settings.add({
    id: 'singleton',
    theme: 'system',
    weekStartsOn: 1,           // semana empieza el lunes
    showArchivedHabits: false,
    enableConfetti: true,
    schemaVersion: 1,
  })

  // Seed de categorías predefinidas
  const defaultCategories: import('@/types').Category[] = [
    { id: 'health',         name: 'Salud física',       icon: 'Heart',        color: '#EF4444' },
    { id: 'nutrition',      name: 'Nutrición',           icon: 'Apple',        color: '#F97316' },
    { id: 'mindfulness',    name: 'Mente & Bienestar',   icon: 'Brain',        color: '#8B5CF6' },
    { id: 'learning',       name: 'Aprendizaje',         icon: 'BookOpen',     color: '#3B82F6' },
    { id: 'productivity',   name: 'Productividad',       icon: 'Zap',          color: '#F59E0B' },
    { id: 'relationships',  name: 'Relaciones',          icon: 'Users',        color: '#EC4899' },
    { id: 'finance',        name: 'Finanzas',            icon: 'TrendingUp',   color: '#10B981' },
    { id: 'creativity',     name: 'Creatividad',         icon: 'Palette',      color: '#6366F1' },
    { id: 'sustainability', name: 'Sostenibilidad',      icon: 'Leaf',         color: '#22C55E' },
    { id: 'custom',         name: 'Personalizado',       icon: 'Star',         color: '#64748B' },
  ]

  await db.categories.bulkAdd(defaultCategories)
}
