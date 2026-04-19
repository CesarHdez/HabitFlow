import { useNavigate } from 'react-router-dom'
import { Flame, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="h-16 w-16 rounded-2xl bg-indigo-500 flex items-center justify-center mb-6 shadow-lg">
        <Flame className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        Esta página no existe. Quizás fue un mal hábito venir aquí.
      </p>
      <Button onClick={() => navigate('/dashboard')}>
        <Home className="h-4 w-4" /> Volver al inicio
      </Button>
    </div>
  )
}
