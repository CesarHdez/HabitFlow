import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renderiza el texto correctamente', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('llama al onClick al hacer clic', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clic</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('no llama al onClick cuando está deshabilitado', async () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Deshabilitado</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('aplica la variante destructive', () => {
    render(<Button variant="destructive">Eliminar</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-red')
  })

  it('aplica la variante outline', () => {
    render(<Button variant="outline">Cancelar</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('border')
  })

  it('aplica size sm', () => {
    render(<Button size="sm">Pequeño</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('h-8')
  })

  it('renderiza como tipo submit cuando se especifica', () => {
    render(<Button type="submit">Enviar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('aplica className adicional', () => {
    render(<Button className="w-full">Ancho completo</Button>)
    expect(screen.getByRole('button').className).toContain('w-full')
  })
})
