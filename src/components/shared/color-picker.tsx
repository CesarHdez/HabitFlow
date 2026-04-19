import { Check } from 'lucide-react'
import { HABIT_COLORS } from '@/constants/colors'
import { cn } from '@/lib/utils/cn'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {HABIT_COLORS.map(({ name, value: color }) => (
        <button
          key={color}
          type="button"
          title={name}
          onClick={() => onChange(color)}
          className={cn(
            'h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            value === color && 'ring-2 ring-offset-2 ring-gray-700 dark:ring-gray-200'
          )}
          style={{ backgroundColor: color }}
        >
          {value === color && (
            <Check className="h-4 w-4 text-white mx-auto" />
          )}
        </button>
      ))}
    </div>
  )
}
