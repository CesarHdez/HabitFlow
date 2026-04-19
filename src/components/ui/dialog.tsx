import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from './button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-xl',
          'max-h-[90vh] overflow-y-auto',
          className
        )}
        role="dialog"
        aria-modal
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0 -mt-0.5 -mr-1">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
