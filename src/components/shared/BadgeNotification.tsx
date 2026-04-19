import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ICON_MAP } from './habit-icon'
import { Star } from 'lucide-react'
import { fireBadgeConfetti } from '@/lib/utils/confetti'
import type { BadgeDefinition } from '@/types'

interface BadgeNotificationProps {
  badge: BadgeDefinition | null
  onDismiss: () => void
}

export function BadgeNotification({ badge, onDismiss }: BadgeNotificationProps) {
  useEffect(() => {
    if (!badge) return
    fireBadgeConfetti()
    const timer = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timer)
  }, [badge, onDismiss])

  if (!badge) return null

  const Icon = ICON_MAP[badge.icon] ?? Star

  return (
    <AnimatePresence>
      <motion.div
        key={badge.id}
        initial={{ y: -100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
      >
        <div
          className="flex items-center gap-3 rounded-2xl p-4 shadow-xl text-white"
          style={{ background: `linear-gradient(135deg, ${badge.color}, ${badge.color}cc)` }}
        >
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium opacity-80">¡Nuevo logro desbloqueado!</p>
            <p className="text-base font-bold leading-tight">{badge.name}</p>
            <p className="text-xs opacity-80 mt-0.5 truncate">{badge.description}</p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 rounded-lg p-1.5 hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
