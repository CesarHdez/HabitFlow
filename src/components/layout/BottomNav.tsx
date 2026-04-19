import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, ListChecks, Trophy, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio',   icon: LayoutDashboard },
  { to: '/tracking',  label: 'Hoy',      icon: CheckSquare },
  { to: '/habits',    label: 'Hábitos',  icon: ListChecks },
  { to: '/logros',    label: 'Logros',   icon: Trophy },
  { to: '/settings',  label: 'Ajustes',  icon: Settings2 },
] as const

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-indigo-500 dark:text-indigo-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110 text-indigo-500 dark:text-indigo-400')} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
