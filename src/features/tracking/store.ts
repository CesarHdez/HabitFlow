import { create } from 'zustand'
import type { HabitLog } from '@/types'
import { TrackingRepository } from './repository'

interface TrackingState {
  // Cache de logs por fecha: { 'YYYY-MM-DD': HabitLog[] }
  logsByDate: Record<string, HabitLog[]>
  isLoading: boolean
  error: string | null

  // Acciones
  fetchLogsForDate: (date: string) => Promise<void>
  fetchLogsForRange: (startDate: string, endDate: string) => Promise<void>
  toggleHabit: (habitId: string, date: string) => Promise<HabitLog>
  updateNotes: (logId: string, date: string, notes: string) => Promise<void>

  // Selectors
  getLogsForDate: (date: string) => HabitLog[]
  getLogForHabitAndDate: (habitId: string, date: string) => HabitLog | undefined
  isHabitCompletedOnDate: (habitId: string, date: string) => boolean
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  logsByDate: {},
  isLoading: false,
  error: null,

  fetchLogsForDate: async (date) => {
    // Evitar fetch si ya tenemos los datos en caché
    if (get().logsByDate[date]) return

    set({ isLoading: true })
    try {
      const logs = await TrackingRepository.findByDate(date)
      set((state) => ({
        logsByDate: { ...state.logsByDate, [date]: logs },
        isLoading: false,
      }))
    } catch {
      set({ error: 'Error al cargar los registros', isLoading: false })
    }
  },

  fetchLogsForRange: async (startDate, endDate) => {
    set({ isLoading: true })
    try {
      const logs = await TrackingRepository.findByDateRange(startDate, endDate)
      // Agrupar por fecha
      const grouped: Record<string, HabitLog[]> = {}
      for (const log of logs) {
        if (!grouped[log.date]) grouped[log.date] = []
        grouped[log.date].push(log)
      }
      set((state) => ({
        logsByDate: { ...state.logsByDate, ...grouped },
        isLoading: false,
      }))
    } catch {
      set({ error: 'Error al cargar los registros', isLoading: false })
    }
  },

  toggleHabit: async (habitId, date) => {
    const updatedLog = await TrackingRepository.toggle(habitId, date)
    set((state) => {
      const existingLogs = state.logsByDate[date] ?? []
      const existingIndex = existingLogs.findIndex(l => l.id === updatedLog.id)
      const newLogs =
        existingIndex >= 0
          ? existingLogs.map((l, i) => (i === existingIndex ? updatedLog : l))
          : [...existingLogs, updatedLog]
      return {
        logsByDate: { ...state.logsByDate, [date]: newLogs },
      }
    })
    return updatedLog
  },

  updateNotes: async (logId, date, notes) => {
    await TrackingRepository.updateNotes(logId, notes)
    set((state) => {
      const logs = state.logsByDate[date] ?? []
      return {
        logsByDate: {
          ...state.logsByDate,
          [date]: logs.map(l => l.id === logId ? { ...l, notes } : l),
        },
      }
    })
  },

  // Selectors
  getLogsForDate: (date) => get().logsByDate[date] ?? [],
  getLogForHabitAndDate: (habitId, date) =>
    (get().logsByDate[date] ?? []).find(l => l.habitId === habitId),
  isHabitCompletedOnDate: (habitId, date) => {
    const log = (get().logsByDate[date] ?? []).find(l => l.habitId === habitId)
    return log?.completed ?? false
  },
}))
