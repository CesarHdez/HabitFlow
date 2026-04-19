import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HabitIcon } from './habit-icon'
import { useHabitsStore } from '@/features/habits/store'
import { getTodayString } from '@/lib/utils/dates'

const TEMPLATES = [
  { icon: 'Dumbbell',      color: '#EF4444', name: 'Ejercicio',      category: 'health'       as const, goal: { frequency: 'DAILY' as const, count: 1, period: 1 } },
  { icon: 'Brain',         color: '#8B5CF6', name: 'Meditación',     category: 'mindfulness'  as const, goal: { frequency: 'DAILY' as const, count: 1, period: 1 } },
  { icon: 'BookOpen',      color: '#3B82F6', name: 'Lectura',        category: 'learning'     as const, goal: { frequency: 'DAILY' as const, count: 1, period: 1 } },
  { icon: 'Droplets',      color: '#06B6D4', name: 'Beber agua',     category: 'health'       as const, goal: { frequency: 'DAILY' as const, count: 8, period: 1 } },
  { icon: 'Moon',          color: '#6366F1', name: 'Dormir 8 horas', category: 'health'       as const, goal: { frequency: 'DAILY' as const, count: 1, period: 1 } },
  { icon: 'Apple',         color: '#F97316', name: 'Comer sano',     category: 'nutrition'    as const, goal: { frequency: 'DAILY' as const, count: 1, period: 1 } },
  { icon: 'PersonStanding',color: '#10B981', name: 'Caminar',        category: 'health'       as const, goal: { frequency: 'DAILY' as const, count: 1, period: 1 } },
  { icon: 'Zap',           color: '#F59E0B', name: 'Planificar día', category: 'productivity' as const, goal: { frequency: 'DAILY' as const, count: 1, period: 1 } },
]

const STEPS = ['Bienvenida', 'Plantillas', 'Listo']

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate()
  const { createHabit } = useHabitsStore()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [creating, setCreating] = useState(false)

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleCreateTemplates = async () => {
    if (selected.size === 0) { setStep(2); return }
    setCreating(true)
    const today = getTodayString()
    try {
      for (const i of selected) {
        const t = TEMPLATES[i]
        await createHabit({ ...t, startDate: today, description: '' })
      }
    } finally {
      setCreating(false)
      setStep(2)
    }
  }

  const handleFinish = (createNew: boolean) => {
    onComplete()
    if (createNew) navigate('/habits/new')
    else navigate('/dashboard')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
      >
        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{ backgroundColor: i <= step ? '#6366F1' : '#E5E7EB' }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-5"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-3xl mx-auto"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">¡Bienvenido a HabitFlow!</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Construye hábitos poderosos con seguimiento diario, rachas, logros y analíticas visuales.
                  Te guiaremos en los primeros pasos.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { emoji: '📅', label: 'Seguimiento diario' },
                  { emoji: '🔥', label: 'Rachas y logros' },
                  { emoji: '📊', label: 'Analíticas' },
                ].map(({ emoji, label }) => (
                  <div key={label} className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <div className="text-2xl mb-1">{emoji}</div>
                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setStep(1)}>
                Empezar <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Elige plantillas</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Selecciona hábitos para empezar de inmediato (puedes editarlos después).
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {TEMPLATES.map((t, i) => {
                  const active = selected.has(i)
                  return (
                    <button
                      key={i}
                      onClick={() => toggle(i)}
                      className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all"
                      style={active
                        ? { borderColor: t.color, backgroundColor: `${t.color}10` }
                        : { borderColor: '#E5E7EB' }
                      }
                    >
                      <HabitIcon name={t.icon} color={t.color} size="sm" />
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 flex-1 leading-tight">{t.name}</span>
                      {active && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: t.color }} />}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Saltar
                </Button>
                <Button className="flex-1" onClick={handleCreateTemplates} disabled={creating}>
                  {creating ? 'Creando...' : `Crear ${selected.size > 0 ? `(${selected.size})` : ''}`}
                  {!creating && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-5 text-center"
            >
              <div className="flex items-center justify-center h-20 w-20 rounded-3xl mx-auto bg-emerald-50 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">¡Todo listo!</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {selected.size > 0
                    ? `Se crearon ${selected.size} hábito${selected.size !== 1 ? 's' : ''}. ¿Quieres añadir uno personalizado?`
                    : '¿Quieres crear tu primer hábito personalizado ahora?'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => handleFinish(true)}>
                  Crear hábito personalizado
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => handleFinish(false)}>
                  Ir al dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
