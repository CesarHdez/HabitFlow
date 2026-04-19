import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '@/types'
import { getTodayString } from '@/lib/utils/dates'

interface UIState {
  // Tema
  theme: Theme
  setTheme: (theme: Theme) => void

  // Fecha seleccionada en la vista de tracking
  selectedDate: string
  setSelectedDate: (date: string) => void

  // Sidebar (desktop)
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Modal de hábito
  habitModalOpen: boolean
  editingHabitId: string | null
  openHabitModal: (habitId?: string) => void
  closeHabitModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      selectedDate: getTodayString(),
      setSelectedDate: (date) => set({ selectedDate: date }),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      habitModalOpen: false,
      editingHabitId: null,
      openHabitModal: (habitId) => set({
        habitModalOpen: true,
        editingHabitId: habitId ?? null,
      }),
      closeHabitModal: () => set({
        habitModalOpen: false,
        editingHabitId: null,
      }),
    }),
    {
      name: 'habitflow-ui',
      // Solo persistir tema y preferencia de sidebar
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
