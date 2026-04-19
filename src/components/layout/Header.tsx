import { useLocation } from 'react-router-dom'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import type { Theme } from '@/types'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/tracking':   'Seguimiento',
  '/habits':     'Mis Hábitos',
  '/habits/new': 'Nuevo Hábito',
  '/analytics':  'Analíticas',
  '/logros':     'Logros',
  '/settings':   'Ajustes',
}

const THEME_ICONS: Record<Theme, React.ElementType> = {
  light:  Sun,
  dark:   Moon,
  system: Monitor,
}

const NEXT_THEME: Record<Theme, Theme> = {
  light:  'dark',
  dark:   'system',
  system: 'light',
}

export default function Header() {
  const { pathname } = useLocation()
  const { theme, setTheme } = useUIStore()

  const title = ROUTE_TITLES[pathname] ?? 'HabitFlow'
  const ThemeIcon = THEME_ICONS[theme]

  const handleToggleTheme = () => {
    setTheme(NEXT_THEME[theme])
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-6">
      <h1 className="text-lg font-semibold">{title}</h1>

      {/* Toggle de tema */}
      <button
        onClick={handleToggleTheme}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label={`Tema actual: ${theme}. Click para cambiar.`}
        title={`Tema: ${theme}`}
      >
        <ThemeIcon className="h-4 w-4" />
      </button>
    </header>
  )
}
