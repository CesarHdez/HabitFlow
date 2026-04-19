import { describe, it, expect } from 'vitest'
import { calculateStreaks } from '../streaks'
import { makeHabit, makeLog, makeDailyLogs } from '@/test/utils'

const TODAY = '2024-01-15'
const habit  = makeHabit()

describe('calculateStreaks — DAILY', () => {
  it('retorna ceros cuando no hay logs', () => {
    expect(calculateStreaks(habit, [], TODAY)).toEqual({
      current: 0, best: 0, isOnStreak: false, gracePeriodActive: false,
    })
  })

  it('streak de 1 cuando solo se completó hoy', () => {
    const logs = [makeLog({ date: TODAY, completed: true })]
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.current).toBe(1)
    expect(r.isOnStreak).toBe(true)
  })

  it('log no completado no suma al streak', () => {
    const logs = [makeLog({ date: TODAY, completed: false })]
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.current).toBe(0)
    expect(r.isOnStreak).toBe(false)
  })

  it('calcula streak de 5 días consecutivos', () => {
    const logs = makeDailyLogs('habit-1', TODAY, 5)
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.current).toBe(5)
    expect(r.best).toBe(5)
  })

  it('calcula streak de 30 días consecutivos', () => {
    const logs = makeDailyLogs('habit-1', TODAY, 30)
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.current).toBe(30)
    expect(r.best).toBe(30)
  })

  it('activa el período de gracia cuando hoy no está completado pero ayer sí', () => {
    // ayer (14) y anteayer (13) completados, hoy (15) sin log
    const logs = [
      makeLog({ id: 'l1', date: '2024-01-14', completed: true }),
      makeLog({ id: 'l2', date: '2024-01-13', completed: true }),
    ]
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.gracePeriodActive).toBe(true)
    expect(r.current).toBe(2) // racha de ayer + anteayer
  })

  it('NO activa gracia si ayer tampoco está completado', () => {
    const logs = [makeLog({ id: 'l1', date: '2024-01-13', completed: true })]
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.gracePeriodActive).toBe(false)
    expect(r.current).toBe(0)
  })

  it('rompe el streak ante un hueco de 2+ días', () => {
    const logs = [
      makeLog({ id: 'l1', date: TODAY,        completed: true }),
      makeLog({ id: 'l2', date: '2024-01-12', completed: true }), // hueco en 13 y 14
    ]
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.current).toBe(1)
    expect(r.best).toBe(1)
  })

  it('rastrea correctamente el mejor streak histórico', () => {
    // Racha de 3 días (8–10) luego brecha, luego hoy solo (15)
    const logs = [
      makeLog({ id: 'l1', date: TODAY,        completed: true }),
      makeLog({ id: 'l2', date: '2024-01-10', completed: true }),
      makeLog({ id: 'l3', date: '2024-01-09', completed: true }),
      makeLog({ id: 'l4', date: '2024-01-08', completed: true }),
    ]
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.current).toBe(1)  // solo hoy
    expect(r.best).toBe(3)     // 8+9+10
  })

  it('el mejor streak es igual al actual cuando es continuo', () => {
    const logs = makeDailyLogs('habit-1', TODAY, 7)
    const r = calculateStreaks(habit, logs, TODAY)
    expect(r.best).toBe(r.current)
  })
})

describe('calculateStreaks — WEEKLY', () => {
  const weeklyHabit = makeHabit({ goal: { frequency: 'WEEKLY', count: 3, period: 1 } })

  it('streak de 1 cuando la semana actual cumple la meta', () => {
    const logs = [
      makeLog({ id: 'l1', date: '2024-01-08', completed: true }),
      makeLog({ id: 'l2', date: '2024-01-10', completed: true }),
      makeLog({ id: 'l3', date: '2024-01-12', completed: true }),
    ]
    const r = calculateStreaks(weeklyHabit, logs, TODAY)
    expect(r.current).toBeGreaterThan(0)
    expect(r.isOnStreak).toBe(true)
  })

  it('semana incompleta no cuenta como streak', () => {
    // Solo 1 completion cuando se necesitan 3
    const logs = [makeLog({ id: 'l1', date: '2024-01-08', completed: true })]
    const r = calculateStreaks(weeklyHabit, logs, TODAY)
    expect(r.current).toBe(0)
  })
})
