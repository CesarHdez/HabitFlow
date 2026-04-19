import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En producción aquí iría un servicio de logging (Sentry, etc.)
    console.error('ErrorBoundary capturó un error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-semibold">Algo salió mal</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {this.state.error?.message ?? 'Error inesperado'}
          </p>
          <button
            className="text-sm text-primary underline"
            onClick={() => this.setState({ hasError: false })}
          >
            Intentar de nuevo
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
