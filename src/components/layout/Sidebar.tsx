import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, ListChecks,
  BarChart3, Trophy, Settings2, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/tracking',  label: 'Seguimiento', icon: CheckSquare },
  { to: '/habits',    label: 'Hábitos',     icon: ListChecks },
  { to: '/analytics', label: 'Analíticas',  icon: BarChart3 },
  { to: '/logros',    label: 'Logros',      icon: Trophy },
] as const

const BOTTOM_ITEMS = [
  { to: '/settings', label: 'Ajustes', icon: Settings2 },
] as const

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-indigo-500 text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
        )
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 flex-shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm">
          <Flame className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">HabitFlow</span>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
        {BOTTOM_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
        <p className="px-3 pt-2 text-xs text-gray-400 dark:text-gray-600">HabitFlow v1.0</p>
      </div>
    </aside>
  )
}
