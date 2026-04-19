import '@testing-library/jest-dom'

// Silenciar errores de consola esperados en tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
