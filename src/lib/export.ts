import * as XLSX from 'xlsx'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { IS_LOCAL_MODE } from './supabase'
import { LocalHabitsDb, LocalLogsDb } from './localDb'
import { db } from './db'
import type { Habit, HabitLog } from '@/types'

// ── Fuente de datos según modo ────────────────────────────────

async function getAllHabits(): Promise<Habit[]> {
  if (IS_LOCAL_MODE) return LocalHabitsDb.findAll()
  return db.habits.orderBy('sortOrder').toArray()
}

async function getAllLogs(): Promise<HabitLog[]> {
  if (IS_LOCAL_MODE) return LocalLogsDb.findAll()
  return db.habitLogs.orderBy('date').toArray()
}

// ============================================================
// EXPORTACIÓN EXCEL — SheetJS
// ============================================================

function freqLabel(f: Habit['goal']['frequency']) {
  return { DAILY: 'día', WEEKLY: 'semana', MONTHLY: 'mes', YEARLY: 'año' }[f]
}

function formatDate(d: string) {
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: es }) } catch { return d }
}

export async function exportToExcel(): Promise<void> {
  const habits = await getAllHabits()
  const logs   = await getAllLogs()
  const today  = format(new Date(), 'yyyy-MM-dd')

  const wb = XLSX.utils.book_new()

  // ── Hoja 1: Resumen por hábito ──────────────────────────────
  const summaryHeader = ['Hábito', 'Categoría', 'Meta', 'Estado', 'Total completados', 'Primer registro', 'Último registro']
  const summaryRows = habits.map(h => {
    const hLogs = logs.filter(l => l.habitId === h.id && l.completed)
    const dates  = hLogs.map(l => l.date).sort()
    return [
      h.name,
      h.category,
      `${h.goal.count}× por ${freqLabel(h.goal.frequency)}`,
      h.isActive ? 'Activo' : 'Archivado',
      hLogs.length,
      dates[0] ? formatDate(dates[0]) : '—',
      dates[dates.length - 1] ? formatDate(dates[dates.length - 1]) : '—',
    ]
  })
  const wsResumen = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryRows])
  wsResumen['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // ── Hoja 2: Logs detallados ─────────────────────────────────
  const logsHeader = ['Fecha', 'Hábito', 'Categoría', 'Completado', 'Notas']
  const habitMap = Object.fromEntries(habits.map(h => [h.id, h]))
  const logsRows = logs
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(l => {
      const h = habitMap[l.habitId]
      return [
        formatDate(l.date),
        h?.name ?? l.habitId,
        h?.category ?? '—',
        l.completed ? 'Sí' : 'No',
        l.notes ?? '',
      ]
    })
  const wsLogs = XLSX.utils.aoa_to_sheet([logsHeader, ...logsRows])
  wsLogs['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Logs Detallados')

  // ── Hoja 3: Estadísticas semanales (últimas 12 semanas) ─────
  const weekHeader = ['Semana', 'Inicio', 'Fin', 'Hábito', 'Completados', 'Esperados', '% Cumplimiento']
  const weekRows: (string | number)[][] = []

  for (let w = 0; w < 12; w++) {
    const wStart = new Date()
    wStart.setDate(wStart.getDate() - wStart.getDay() + 1 - w * 7)
    const wEnd = new Date(wStart)
    wEnd.setDate(wStart.getDate() + 6)

    const startStr = format(wStart, 'yyyy-MM-dd')
    const endStr   = format(wEnd, 'yyyy-MM-dd')
    const weekLabel = `Semana ${12 - w}`

    for (const h of habits.filter(hh => hh.isActive)) {
      const done = logs.filter(l =>
        l.habitId === h.id && l.completed &&
        l.date >= startStr && l.date <= endStr
      ).length
      const expected = h.goal.frequency === 'DAILY' ? 7
        : h.goal.frequency === 'WEEKLY' ? h.goal.count : 1
      weekRows.push([
        weekLabel,
        formatDate(startStr),
        formatDate(endStr),
        h.name,
        done,
        expected,
        expected > 0 ? Math.round((done / expected) * 100) : 0,
      ])
    }
  }

  const wsWeekly = XLSX.utils.aoa_to_sheet([weekHeader, ...weekRows])
  wsWeekly['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsWeekly, 'Estadísticas Semanales')

  XLSX.writeFile(wb, `habitflow-export-${today}.xlsx`)
}

// ============================================================
// BACKUP / RESTORE JSON
// ============================================================

interface BackupData {
  version: number
  exportedAt: string
  app: 'HabitFlow'
  data: {
    habits: Habit[]
    habitLogs: HabitLog[]
    settings: object[]
  }
}

export async function exportToJSON(): Promise<void> {
  const habits    = await getAllHabits()
  const habitLogs = await getAllLogs()
  const settings  = IS_LOCAL_MODE ? [] : await db.settings.toArray()

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'HabitFlow',
    data: { habits, habitLogs, settings },
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `habitflow-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFromJSON(file: File): Promise<{ habits: number; logs: number }> {
  const text   = await file.text()
  const backup = JSON.parse(text) as BackupData

  if (backup.app !== 'HabitFlow') throw new Error('Archivo no es un backup de HabitFlow')
  if (backup.version > 1)         throw new Error('Versión de backup no compatible')

  const { habits, habitLogs, settings } = backup.data

  if (IS_LOCAL_MODE) {
    habits.forEach(h => {
      if (!LocalHabitsDb.findById(h.id)) LocalHabitsDb.insert(h)
      else LocalHabitsDb.update(h.id, h)
    })
    habitLogs.forEach(l => {
      const existing = LocalLogsDb.findByHabitAndDate(l.habitId, l.date)
      if (!existing) LocalLogsDb.insert(l)
      else LocalLogsDb.update(existing.id, l)
    })
  } else {
    await db.transaction('rw', [db.habits, db.habitLogs, db.settings], async () => {
      await db.habits.bulkPut(habits)
      await db.habitLogs.bulkPut(habitLogs)
      if (settings?.length) await db.settings.bulkPut(settings as Parameters<typeof db.settings.bulkPut>[0])
    })
  }

  return { habits: habits.length, logs: habitLogs.length }
}
