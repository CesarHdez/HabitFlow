import { useRef, useState, useEffect } from 'react'
import {
  Download, Upload, FileJson, FileSpreadsheet,
  Trash2, Moon, Sun, Monitor, Bell, BellOff, LogOut, User, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/useUIStore'
import { useHabitsStore } from '@/features/habits/store'
import { useAuthStore } from '@/features/auth/store'
import { exportToExcel, exportToJSON, importFromJSON } from '@/lib/export'
import { IS_LOCAL_MODE, supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { getReminderSettings, setReminderSettings } from '@/hooks/useReminders'
import type { Theme } from '@/types'
import { cn } from '@/lib/utils/cn'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">{children}</h3>
}

function SettingRow({ icon: Icon, label, description, children }: {
  icon: React.ElementType
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light',  label: 'Claro',   icon: Sun },
  { value: 'dark',   label: 'Oscuro',  icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export default function Settings() {
  const { theme, setTheme } = useUIStore()
  const { fetchHabits } = useHabitsStore()
  const { user, signOut } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [migrating, setMigrating] = useState(false)

  const handleMigrateLocalData = async () => {
    if (!confirm('¿Migrar los datos locales a Supabase? Esta acción hace upsert (no borra datos existentes en la nube).')) return
    setMigrating(true)
    try {
      const [localHabits, localLogs] = await Promise.all([db.habits.toArray(), db.habitLogs.toArray()])
      if (localHabits.length === 0) { toast.info('No hay datos locales para migrar'); return }

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('No autenticado')

      // Migrar hábitos
      const habitRows = localHabits.map(h => ({
        id: h.id, user_id: authUser.id, name: h.name, description: h.description ?? null,
        category: h.category, icon: h.icon, color: h.color,
        goal_frequency: h.goal.frequency, goal_count: h.goal.count, goal_period: h.goal.period,
        is_active: h.isActive, start_date: h.startDate, end_date: h.endDate ?? null,
        sort_order: h.sortOrder, created_at: h.createdAt, updated_at: h.updatedAt,
      }))
      const { error: hErr } = await supabase.from('habits').upsert(habitRows, { onConflict: 'id' })
      if (hErr) throw hErr

      // Migrar logs
      const logRows = localLogs.map(l => ({
        id: l.id, user_id: authUser.id, habit_id: l.habitId, date: l.date,
        completed: l.completed, value: l.value ?? null, notes: l.notes ?? null,
        created_at: l.createdAt, updated_at: l.updatedAt,
      }))
      if (logRows.length > 0) {
        const { error: lErr } = await supabase.from('habit_logs').upsert(logRows, { onConflict: 'id' })
        if (lErr) throw lErr
      }

      await fetchHabits()
      toast.success(`Migrados ${localHabits.length} hábitos y ${localLogs.length} registros`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error en la migración')
    } finally {
      setMigrating(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState<'excel' | 'json' | null>(null)

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('08:00')

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission)
    const s = getReminderSettings()
    setReminderEnabled(s.enabled)
    setReminderTime(s.time)
  }, [])

  const requestPermission = async () => {
    const result = await Notification.requestPermission()
    setNotifPermission(result)
    if (result === 'granted') toast.success('Notificaciones activadas')
    else toast.error('Permiso denegado por el navegador')
  }

  const handleReminderToggle = (enabled: boolean) => {
    setReminderEnabled(enabled)
    setReminderSettings(enabled, reminderTime)
  }

  const handleReminderTime = (time: string) => {
    setReminderTime(time)
    setReminderSettings(reminderEnabled, time)
  }

  const handleExportExcel = async () => {
    setExporting('excel')
    try {
      await exportToExcel()
      toast.success('Excel exportado correctamente')
    } catch (e) {
      toast.error('Error al exportar el Excel')
      console.error(e)
    } finally {
      setExporting(null)
    }
  }

  const handleExportJSON = async () => {
    setExporting('json')
    try {
      await exportToJSON()
      toast.success('Backup JSON exportado')
    } catch (e) {
      toast.error('Error al exportar el backup')
      console.error(e)
    } finally {
      setExporting(null)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const { habits, logs } = await importFromJSON(file)
      await fetchHabits()
      toast.success(`Importados: ${habits} hábitos y ${logs} registros`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al importar el archivo')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClearData = async () => {
    if (!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return
    if (!confirm('¿Estás seguro? Se eliminarán todos tus hábitos y registros.')) return
    try {
      if (IS_LOCAL_MODE) {
        localStorage.removeItem('habitflow_habits')
        localStorage.removeItem('habitflow_logs')
      } else {
        await db.transaction('rw', [db.habits, db.habitLogs], async () => {
          await db.habits.clear()
          await db.habitLogs.clear()
        })
      }
      await fetchHabits()
      toast.success('Todos los datos eliminados')
    } catch {
      toast.error('Error al eliminar los datos')
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ajustes</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configura tu experiencia en HabitFlow</p>
      </div>

      {/* Cuenta */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <SectionTitle>Cuenta</SectionTitle>
        <SettingRow icon={User} label="Usuario" description={user?.email ?? ''}>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </SettingRow>
        {!IS_LOCAL_MODE && (
          <SettingRow
            icon={RefreshCw}
            label="Migrar datos locales"
            description="Sube tus datos guardados en este dispositivo a Supabase"
          >
            <Button variant="outline" size="sm" onClick={handleMigrateLocalData} disabled={migrating}>
              <RefreshCw className={cn('h-4 w-4', migrating && 'animate-spin')} />
              {migrating ? 'Migrando...' : 'Migrar'}
            </Button>
          </SettingRow>
        )}
      </div>

      {/* Apariencia */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <SectionTitle>Apariencia</SectionTitle>
        <SettingRow icon={theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor} label="Tema" description="Elige el tema de la interfaz">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  theme === value
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </SettingRow>
      </div>

      {/* Recordatorios */}
      {'Notification' in window && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <SectionTitle>Recordatorios</SectionTitle>
          {notifPermission !== 'granted' ? (
            <SettingRow
              icon={Bell}
              label="Activar notificaciones"
              description="Permite que HabitFlow te recuerde tus hábitos"
            >
              <Button variant="outline" size="sm" onClick={requestPermission}>
                <Bell className="h-4 w-4" />
                Permitir
              </Button>
            </SettingRow>
          ) : (
            <>
              <SettingRow
                icon={reminderEnabled ? Bell : BellOff}
                label="Recordatorio diario"
                description="Recibe un aviso si tienes hábitos pendientes"
              >
                <button
                  role="switch"
                  aria-checked={reminderEnabled}
                  onClick={() => handleReminderToggle(!reminderEnabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                    reminderEnabled ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
                      reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </SettingRow>
              {reminderEnabled && (
                <SettingRow icon={Bell} label="Hora del recordatorio" description="Se mostrará si hay hábitos pendientes">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={e => handleReminderTime(e.target.value)}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </SettingRow>
              )}
            </>
          )}
        </div>
      )}

      {/* Exportación */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <SectionTitle>Exportar datos</SectionTitle>
        <SettingRow
          icon={FileSpreadsheet}
          label="Exportar a Excel"
          description="Descarga tus hábitos y registros en formato .xlsx"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exporting === 'excel'}
          >
            <Download className="h-4 w-4" />
            {exporting === 'excel' ? 'Exportando...' : 'Excel'}
          </Button>
        </SettingRow>
        <SettingRow
          icon={FileJson}
          label="Backup JSON"
          description="Exporta todos tus datos para hacer una copia de seguridad"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            disabled={exporting === 'json'}
          >
            <Download className="h-4 w-4" />
            {exporting === 'json' ? 'Exportando...' : 'JSON'}
          </Button>
        </SettingRow>
      </div>

      {/* Importación */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <SectionTitle>Importar datos</SectionTitle>
        <SettingRow
          icon={Upload}
          label="Restaurar backup"
          description="Importa un archivo .json exportado anteriormente (hace upsert, no borra)"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4" />
            {importing ? 'Importando...' : 'Importar'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </SettingRow>
      </div>

      {/* Zona de peligro */}
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900 p-4">
        <SectionTitle>Zona de peligro</SectionTitle>
        <SettingRow
          icon={Trash2}
          label="Borrar todos los datos"
          description="Elimina permanentemente todos los hábitos y registros"
        >
          <Button variant="destructive" size="sm" onClick={handleClearData}>
            <Trash2 className="h-4 w-4" />
            Borrar todo
          </Button>
        </SettingRow>
      </div>

      {/* Info versión */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
        HabitFlow v1.0 · Datos almacenados localmente en tu dispositivo
      </p>
    </div>
  )
}
