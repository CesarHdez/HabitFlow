import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
