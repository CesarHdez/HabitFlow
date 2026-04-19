import { describe, it, expect } from 'vitest'
import { getTodayString, getWeekDays } from '../dates'

describe('getTodayString', () => {
  it('retorna una cadena en formato YYYY-MM-DD', () => {
    const result = getTodayString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('coincide con la fecha actual', () => {
    const result = getTodayString()
    const today = new Date()
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(result).toBe(expected)
  })
})

describe('getWeekDays', () => {
  it('retorna exactamente 7 días', () => {
    const days = getWeekDays('2024-01-15', 1)
    expect(days).toHaveLength(7)
  })

  it('con weekStartsOn=1 empieza en lunes', () => {
    // 2024-01-15 es lunes
    const days = getWeekDays('2024-01-15', 1)
    expect(days[0]).toBe('2024-01-15')
    expect(days[6]).toBe('2024-01-21')
  })

  it('con weekStartsOn=0 empieza en domingo', () => {
    // 2024-01-14 es domingo
    const days = getWeekDays('2024-01-15', 0)
    expect(days[0]).toBe('2024-01-14')
    expect(days[6]).toBe('2024-01-20')
  })

  it('todos los días están en formato YYYY-MM-DD', () => {
    const days = getWeekDays('2024-01-15', 1)
    days.forEach(d => expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('los días son consecutivos', () => {
    const days = getWeekDays('2024-01-15', 1)
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1])
      const curr = new Date(days[i])
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      expect(diff).toBe(1)
    }
  })

  it('funciona en cambio de mes', () => {
    const days = getWeekDays('2024-01-29', 1)
    expect(days[0]).toBe('2024-01-29')
    expect(days[3]).toBe('2024-02-01')
  })

  it('funciona en cambio de año', () => {
    const days = getWeekDays('2024-01-01', 1)
    expect(days).toHaveLength(7)
    expect(days[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
