import { ICON_MAP } from './habit-icon'
import { cn } from '@/lib/utils/cn'

interface IconPickerProps {
  value: string
  color: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, color, onChange }: IconPickerProps) {
  const icons = Object.keys(ICON_MAP)

  return (
    <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto pr-1">
      {icons.map((name) => {
        const Icon = ICON_MAP[name]
        const isSelected = value === name
        return (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onChange(name)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500',
              isSelected
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
            style={isSelected ? { backgroundColor: color } : undefined}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
