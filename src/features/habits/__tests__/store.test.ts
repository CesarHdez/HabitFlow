import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHabitsStore } from '../store'
import { makeHabit } from '@/test/utils'
import type { Habit } from '@/types'

// Mock del repositorio — la store no sabe de Supabase ni Dexie
vi.mock('@/features/habits/repository', () => ({
  HabitsRepository: {
    findAll:         vi.fn(),
    create:          vi.fn(),
    update:          vi.fn(),
    archive:         vi.fn(),
    restore:         vi.fn(),
    delete:          vi.fn(),
    updateSortOrder: vi.fn(),
  },
}))

import { HabitsRepository } from '../repository'

const mockHabits: Habit[] = [
  makeHabit({ id: 'h1', name: 'Ejercicio',  sortOrder: 0 }),
  makeHabit({ id: 'h2', name: 'Meditación', sortOrder: 1 }),
]

beforeEach(() => {
  vi.clearAllMocks()
  // Reset store state between tests
  useHabitsStore.setState({ habits: [], isLoading: false, error: null })
})

describe('useHabitsStore — fetchHabits', () => {
  it('carga los hábitos del repositorio y los almacena', async () => {
    vi.mocked(HabitsRepository.findAll).mockResolvedValue(mockHabits)
    await useHabitsStore.getState().fetchHabits()
    expect(useHabitsStore.getState().habits).toEqual(mockHabits)
    expect(useHabitsStore.getState().isLoading).toBe(false)
  })

  it('establece isLoading en true durante la carga', async () => {
    let capturedLoading = false
    vi.mocked(HabitsRepository.findAll).mockImplementation(async () => {
      capturedLoading = useHabitsStore.getState().isLoading
      return mockHabits
    })
    await useHabitsStore.getState().fetchHabits()
    expect(capturedLoading).toBe(true)
  })

  it('guarda el error si el repositorio lanza una excepción', async () => {
    vi.mocked(HabitsRepository.findAll).mockRejectedValue(new Error('DB error'))
    await useHabitsStore.getState().fetchHabits()
    expect(useHabitsStore.getState().error).toBeTruthy()
    expect(useHabitsStore.getState().isLoading).toBe(false)
  })
})

describe('useHabitsStore — createHabit', () => {
  it('añade el nuevo hábito al estado', async () => {
    const newHabit = makeHabit({ id: 'h3', name: 'Nuevo' })
    vi.mocked(HabitsRepository.create).mockResolvedValue(newHabit)
    await useHabitsStore.getState().createHabit({
      name: 'Nuevo', category: 'health', icon: 'Heart', color: '#f00',
      goal: { frequency: 'DAILY', count: 1, period: 1 }, startDate: '2024-01-01',
    })
    expect(useHabitsStore.getState().habits).toContainEqual(newHabit)
  })
})

describe('useHabitsStore — archiveHabit / restoreHabit', () => {
  it('archiva un hábito (isActive → false)', async () => {
    useHabitsStore.setState({ habits: [makeHabit({ id: 'h1', isActive: true })] })
    vi.mocked(HabitsRepository.archive).mockResolvedValue()
    await useHabitsStore.getState().archiveHabit('h1')
    const habit = useHabitsStore.getState().habits.find(h => h.id === 'h1')
    expect(habit?.isActive).toBe(false)
  })

  it('restaura un hábito (isActive → true)', async () => {
    useHabitsStore.setState({ habits: [makeHabit({ id: 'h1', isActive: false })] })
    vi.mocked(HabitsRepository.restore).mockResolvedValue()
    await useHabitsStore.getState().restoreHabit('h1')
    const habit = useHabitsStore.getState().habits.find(h => h.id === 'h1')
    expect(habit?.isActive).toBe(true)
  })
})

describe('useHabitsStore — deleteHabit', () => {
  it('elimina el hábito del estado', async () => {
    useHabitsStore.setState({ habits: mockHabits })
    vi.mocked(HabitsRepository.delete).mockResolvedValue()
    await useHabitsStore.getState().deleteHabit('h1')
    const ids = useHabitsStore.getState().habits.map(h => h.id)
    expect(ids).not.toContain('h1')
    expect(ids).toContain('h2')
  })
})

describe('useHabitsStore — reorderHabits', () => {
  it('reordena los hábitos según los IDs proporcionados', async () => {
    useHabitsStore.setState({ habits: mockHabits })
    vi.mocked(HabitsRepository.updateSortOrder).mockResolvedValue()
    await useHabitsStore.getState().reorderHabits(['h2', 'h1'])
    const names = useHabitsStore.getState().habits.map(h => h.name)
    expect(names[0]).toBe('Meditación')
    expect(names[1]).toBe('Ejercicio')
  })
})

describe('useHabitsStore — selectores', () => {
  it('getActiveHabits filtra solo los activos', () => {
    useHabitsStore.setState({
      habits: [
        makeHabit({ id: 'h1', isActive: true }),
        makeHabit({ id: 'h2', isActive: false }),
      ],
    })
    const active = useHabitsStore.getState().getActiveHabits()
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe('h1')
  })

  it('getHabitById encuentra el hábito correcto', () => {
    useHabitsStore.setState({ habits: mockHabits })
    const found = useHabitsStore.getState().getHabitById('h2')
    expect(found?.name).toBe('Meditación')
  })

  it('getHabitById retorna undefined si no existe', () => {
    useHabitsStore.setState({ habits: mockHabits })
    expect(useHabitsStore.getState().getHabitById('no-existe')).toBeUndefined()
  })
})
