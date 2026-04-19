import { create } from 'zustand'
import type { Habit, CreateHabitDTO, UpdateHabitDTO } from '@/types'
import { HabitsRepository } from './repository'

interface HabitsState {
  habits: Habit[]
  isLoading: boolean
  error: string | null

  // Acciones
  fetchHabits: () => Promise<void>
  createHabit: (dto: CreateHabitDTO) => Promise<Habit>
  updateHabit: (id: string, dto: UpdateHabitDTO) => Promise<void>
  archiveHabit: (id: string) => Promise<void>
  restoreHabit: (id: string) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  reorderHabits: (orderedIds: string[]) => Promise<void>

  // Selectors (computados)
  getActiveHabits: () => Habit[]
  getArchivedHabits: () => Habit[]
  getHabitById: (id: string) => Habit | undefined
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null })
    try {
      const habits = await HabitsRepository.findAll()
      set({ habits, isLoading: false })
    } catch (err) {
      set({ error: 'Error al cargar los hábitos', isLoading: false })
    }
  },

  createHabit: async (dto) => {
    const habit = await HabitsRepository.create(dto)
    set((state) => ({ habits: [...state.habits, habit] }))
    return habit
  },

  updateHabit: async (id, dto) => {
    const updated = await HabitsRepository.update(id, dto)
    set((state) => ({
      habits: state.habits.map(h => h.id === id ? updated : h),
    }))
  },

  archiveHabit: async (id) => {
    await HabitsRepository.archive(id)
    set((state) => ({
      habits: state.habits.map(h =>
        h.id === id ? { ...h, isActive: false } : h
      ),
    }))
  },

  restoreHabit: async (id) => {
    await HabitsRepository.restore(id)
    set((state) => ({
      habits: state.habits.map(h =>
        h.id === id ? { ...h, isActive: true } : h
      ),
    }))
  },

  deleteHabit: async (id) => {
    await HabitsRepository.delete(id)
    set((state) => ({
      habits: state.habits.filter(h => h.id !== id),
    }))
  },

  reorderHabits: async (orderedIds) => {
    await HabitsRepository.updateSortOrder(orderedIds)
    // Reordenar en el store local
    const { habits } = get()
    const reordered = orderedIds
      .map(id => habits.find(h => h.id === id))
      .filter(Boolean) as Habit[]
    set({ habits: reordered })
  },

  // Selectors
  getActiveHabits: () => get().habits.filter(h => h.isActive),
  getArchivedHabits: () => get().habits.filter(h => !h.isActive),
  getHabitById: (id) => get().habits.find(h => h.id === id),
}))
