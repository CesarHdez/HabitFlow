// 12 colores disponibles para asignar a hábitos
export const HABIT_COLORS = [
  { name: 'Indigo',   value: '#6366F1' },
  { name: 'Violet',   value: '#8B5CF6' },
  { name: 'Rose',     value: '#F43F5E' },
  { name: 'Orange',   value: '#F97316' },
  { name: 'Amber',    value: '#F59E0B' },
  { name: 'Emerald',  value: '#10B981' },
  { name: 'Teal',     value: '#14B8A6' },
  { name: 'Sky',      value: '#0EA5E9' },
  { name: 'Blue',     value: '#3B82F6' },
  { name: 'Pink',     value: '#EC4899' },
  { name: 'Slate',    value: '#64748B' },
  { name: 'Red',      value: '#EF4444' },
] as const

export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0].value
