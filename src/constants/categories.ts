import type { Category } from '@/types'

export const DEFAULT_CATEGORIES: Category[] = [
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
