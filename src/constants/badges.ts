import type { BadgeDefinition } from '@/types'

export const BADGES: BadgeDefinition[] = [
  {
    id: '7days',
    name: 'Primera semana',
    description: '7 días consecutivos completando un hábito',
    icon: 'Flame',
    threshold: 7,
    color: '#F97316',
  },
  {
    id: '21days',
    name: 'Hábito formado',
    description: '21 días — ya es parte de tu rutina',
    icon: 'Sparkles',
    threshold: 21,
    color: '#8B5CF6',
  },
  {
    id: '30days',
    name: 'Un mes sólido',
    description: '30 días de consistencia imparable',
    icon: 'Award',
    threshold: 30,
    color: '#6366F1',
  },
  {
    id: '66days',
    name: 'Automatismo',
    description: '66 días — la ciencia dice que ya es automático',
    icon: 'Zap',
    threshold: 66,
    color: '#10B981',
  },
  {
    id: '100days',
    name: 'Centurión',
    description: '100 días de pura disciplina',
    icon: 'Trophy',
    threshold: 100,
    color: '#F59E0B',
  },
  {
    id: '365days',
    name: 'Leyenda',
    description: 'Un año completo. Eres una leyenda.',
    icon: 'Star',
    threshold: 365,
    color: '#EC4899',
  },
]

export function getBadgesEarned(streak: number): BadgeDefinition[] {
  return BADGES.filter(b => streak >= b.threshold)
}

export function getNextBadge(streak: number): BadgeDefinition | null {
  return BADGES.find(b => streak < b.threshold) ?? null
}
