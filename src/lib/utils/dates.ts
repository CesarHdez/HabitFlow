import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isFuture,
  isPast,
  differenceInDays,
  addDays,
  subDays,
} from 'date-fns'
import { es } from 'date-fns/locale'

// ============================================================
// HELPERS DE FECHAS — usando date-fns v3
// ============================================================

/** Retorna la fecha de hoy en formato YYYY-MM-DD (hora local) */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Convierte una fecha ISO string a Date */
export function parseDate(dateStr: string): Date {
  return parseISO(dateStr)
}

/** Formatea una fecha para mostrar al usuario */
export function formatDisplayDate(dateStr: string, pattern = 'PPP'): string {
  return format(parseISO(dateStr), pattern, { locale: es })
}

/** Retorna los 7 días de la semana que contiene la fecha dada */
export function getWeekDays(dateStr: string, weekStartsOn: 0 | 1 = 1): string[] {
  const date = parseISO(dateStr)
  const start = startOfWeek(date, { weekStartsOn })
  const end = endOfWeek(date, { weekStartsOn })
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
}

export { isToday, isFuture, isPast, differenceInDays, addDays, subDays, format }
