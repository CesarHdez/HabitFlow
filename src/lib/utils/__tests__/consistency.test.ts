import { describe, it, expect } from 'vitest'
import { calcConsistencyScore, scoreColor, scoreLabel } from '../consistency'
import { makeHabit, makeLog, makeDailyLogs } from '@/test/utils'

const TODAY = '2024-01-15'
const habit  = makeHabit()

describe('calcConsistencyScore', () => {
  it('retorna 0 cuando no hay logs', () => {
    expect(calcConsistencyScore(habit, [], TODAY)).toBe(0)
  })

  it('retorna 100 cuando todos los días de la ventana están completados', () => {
    const logs = makeDailyLogs('habit-1', TODAY, 30)
    expect(calcConsistencyScore(habit, logs, TODAY, 30)).toBe(100)
  })

  it('retorna ~50 cuando la mitad de los días están completados', () => {
    // 15 de 30 días completados
    const logs = makeDailyLogs('habit-1', TODAY, 15)
    const score = calcConsistencyScore(habit, logs, TODAY, 30)
    expect(score).toBe(50)
  })

  it('ignora logs no completados', () => {
    const logs = [
      makeLog({ date: TODAY, completed: false }),
      makeLog({ id: 'l2', date: '2024-01-14', completed: false }),
    ]
    expect(calcConsistencyScore(habit, logs, TODAY)).toBe(0)
  })

  it('ventana configurable de 7 días', () => {
    const logs = makeDailyLogs('habit-1', TODAY, 7)
    expect(calcConsistencyScore(habit, logs, TODAY, 7)).toBe(100)
  })

  it('hábito semanal: 100% cuando todas las semanas cumplieron la meta', () => {
    const weeklyHabit = makeHabit({
      goal: { frequency: 'WEEKLY', count: 2, period: 1 },
    })
    // 2 semanas completas dentro de la ventana (semana en curso excluida):
    // W02 (Jan 8–14): Jan 8 + Jan 13 = 2 ✓  |  W01 (Jan 2–7): Jan 4 + Jan 6 = 2 ✓
    const logs = [
      makeLog({ id: 'l1', date: '2024-01-15', completed: true }), // semana en curso, ignorada
      makeLog({ id: 'l2', date: '2024-01-13', completed: true }),
      makeLog({ id: 'l3', date: '2024-01-08', completed: true }),
      makeLog({ id: 'l4', date: '2024-01-06', completed: true }),
      makeLog({ id: 'l5', date: '2024-01-04', completed: true }),
    ]
    const score = calcConsistencyScore(weeklyHabit, logs, TODAY, 14)
    expect(score).toBe(100)
  })

  it('hábito semanal: 0% cuando ninguna semana cumplió la meta', () => {
    const weeklyHabit = makeHabit({
      goal: { frequency: 'WEEKLY', count: 3, period: 1 },
    })
    const logs = [makeLog({ id: 'l1', date: TODAY, completed: true })]
    const score = calcConsistencyScore(weeklyHabit, logs, TODAY, 14)
    expect(score).toBe(0)
  })
})

describe('scoreColor', () => {
  it('verde para score >= 80', () => {
    expect(scoreColor(80)).toBe('#10B981')
    expect(scoreColor(100)).toBe('#10B981')
  })

  it('índigo para score 50–79', () => {
    expect(scoreColor(50)).toBe('#6366F1')
    expect(scoreColor(79)).toBe('#6366F1')
  })

  it('ámbar para score 25–49', () => {
    expect(scoreColor(25)).toBe('#F59E0B')
    expect(scoreColor(49)).toBe('#F59E0B')
  })

  it('rojo para score < 25', () => {
    expect(scoreColor(0)).toBe('#EF4444')
    expect(scoreColor(24)).toBe('#EF4444')
  })
})

describe('scoreLabel', () => {
  it('etiqueta correcta en cada rango', () => {
    expect(scoreLabel(100)).toBe('Excelente')
    expect(scoreLabel(80)).toBe('Excelente')
    expect(scoreLabel(60)).toBe('Muy bueno')
    expect(scoreLabel(40)).toBe('Regular')
    expect(scoreLabel(20)).toBe('Bajo')
    expect(scoreLabel(0)).toBe('Inicial')
  })
})
