// Iconos disponibles para hábitos (deben coincidir con ICON_MAP en habit-icon.tsx)
export const HABIT_ICONS = [
  'Heart', 'Dumbbell', 'Bike', 'PersonStanding', 'Footprints',
  'Apple', 'Coffee', 'Droplets', 'UtensilsCrossed',
  'Brain', 'Moon', 'Sun', 'Wind', 'Smile',
  'BookOpen', 'GraduationCap', 'Pencil', 'Code2', 'Languages',
  'Zap', 'Target', 'CheckCircle2', 'Calendar', 'Clock',
  'Users', 'MessageCircle', 'Phone', 'Mail',
  'PiggyBank', 'TrendingUp', 'DollarSign', 'Wallet', 'BarChart2',
  'Palette', 'Music', 'Camera', 'Mic', 'Brush',
  'Leaf', 'Recycle', 'TreePine', 'Globe', 'Flower2',
  'Star', 'Award', 'Flame', 'Sparkles', 'Trophy',
] as const

export type HabitIconName = typeof HABIT_ICONS[number]

export const DEFAULT_HABIT_ICON = 'Star'
