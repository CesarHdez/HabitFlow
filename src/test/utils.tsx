import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import type { Habit, HabitLog } from '@/types'

// ── Render helper con router ──────────────────────────────────

function AllProviders({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

export function renderWithRouter(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// ── Factories de datos de test ────────────────────────────────

export function makeHabit(overrides?: Partial<Habit>): Habit {
  return {
    id: 'habit-1',
    name: 'Test Habit',
    description: undefined,
    category: 'health',
    icon: 'Heart',
    color: '#EF4444',
    goal: { frequency: 'DAILY', count: 1, period: 1 },
    isActive: true,
    startDate: '2024-01-01',
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeLog(overrides?: Partial<HabitLog>): HabitLog {
  return {
    id: 'log-1',
    habitId: 'habit-1',
    date: '2024-01-15',
    completed: true,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  }
}

/** Genera N logs diarios completados hacia atrás desde una fecha */
export function makeDailyLogs(habitId: string, fromDate: string, days: number): HabitLog[] {
  const base = new Date(fromDate)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const date = d.toISOString().split('T')[0]
    return makeLog({ id: `log-${i}`, habitId, date, completed: true })
  })
}
