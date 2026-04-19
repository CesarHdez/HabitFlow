import { cn } from '@/lib/utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    secondary:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    success:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    warning:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    destructive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
