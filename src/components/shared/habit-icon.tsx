import {
  Heart, Dumbbell, Bike, PersonStanding, Footprints,
  Apple, Coffee, Droplets, UtensilsCrossed,
  Brain, Moon, Sun, Wind, Smile,
  BookOpen, GraduationCap, Pencil, Code2, Languages,
  Zap, Target, CheckCircle2, Calendar, Clock,
  Users, MessageCircle, Phone, Mail,
  PiggyBank, TrendingUp, DollarSign, Wallet, BarChart2,
  Palette, Music, Camera, Mic, Brush,
  Leaf, Recycle, TreePine, Globe, Flower2,
  Star, Award, Flame, Sparkles, Trophy,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const ICON_MAP: Record<string, LucideIcon> = {
  Heart, Dumbbell, Bike, PersonStanding, Footprints,
  Apple, Coffee, Droplets, UtensilsCrossed,
  Brain, Moon, Sun, Wind, Smile,
  BookOpen, GraduationCap, Pencil, Code2, Languages,
  Zap, Target, CheckCircle2, Calendar, Clock,
  Users, MessageCircle, Phone, Mail,
  PiggyBank, TrendingUp, DollarSign, Wallet, BarChart2,
  Palette, Music, Camera, Mic, Brush,
  Leaf, Recycle, TreePine, Globe, Flower2,
  Star, Award, Flame, Sparkles, Trophy,
}

interface HabitIconProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { container: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { container: 'h-10 w-10', icon: 'h-5 w-5' },
  lg: { container: 'h-12 w-12', icon: 'h-6 w-6' },
}

export function HabitIcon({ name, color, size = 'md', className }: HabitIconProps) {
  const Icon = ICON_MAP[name] ?? Star
  const { container, icon } = sizeMap[size]

  return (
    <div
      className={cn('flex items-center justify-center rounded-xl flex-shrink-0', container, className)}
      style={{ backgroundColor: color }}
    >
      <Icon className={cn('text-white', icon)} />
    </div>
  )
}
