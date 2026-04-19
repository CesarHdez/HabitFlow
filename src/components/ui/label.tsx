import { cn } from '@/lib/utils/cn'

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium text-gray-700 dark:text-gray-300', className)}
      {...props}
    />
  )
}

export { Label }
