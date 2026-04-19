import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('@/features/auth/store', () => ({
  useAuthStore: () => ({ signIn: mockSignIn, signUp: mockSignUp }),
}))

import Login from '../Login'

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>)
}

/** Encuentra el botón de submit dentro del <form> (no el tab ni el ojo) */
function getSubmitButton() {
  const form = document.querySelector('form')!
  return within(form).getByRole('button', { name: /iniciar sesión|crear cuenta|procesando/i })
}

beforeEach(() => { vi.clearAllMocks() })

describe('Login — renderizado', () => {
  it('muestra el branding HabitFlow', () => {
    renderLogin()
    expect(screen.getByText('HabitFlow')).toBeInTheDocument()
  })

  it('muestra los tabs de Iniciar sesión y Crear cuenta', () => {
    renderLogin()
    // Los tabs están en el div con clase que contiene el flex gap-1 p-1
    const allLogin = screen.getAllByText('Iniciar sesión')
    const allCrear  = screen.getAllByText('Crear cuenta')
    expect(allLogin.length).toBeGreaterThanOrEqual(1)
    expect(allCrear.length).toBeGreaterThanOrEqual(1)
  })

  it('muestra el campo de email', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/correo/i)).toBeInTheDocument()
  })

  it('muestra el campo de contraseña', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument()
  })

  it('el campo de contraseña empieza oculto', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/contraseña/i)).toHaveAttribute('type', 'password')
  })
})

describe('Login — toggle contraseña', () => {
  it('muestra la contraseña al hacer clic en el botón del ojo', async () => {
    renderLogin()
    // El botón del ojo es el único dentro del contenedor de contraseña sin texto visible
    const pwContainer = screen.getByPlaceholderText(/contraseña/i).parentElement!
    const eyeBtn = within(pwContainer).getByRole('button')
    await userEvent.click(eyeBtn)
    expect(screen.getByPlaceholderText(/contraseña/i)).toHaveAttribute('type', 'text')
  })
})

describe('Login — validación de formulario', () => {
  it('muestra error si email y contraseña están vacíos', async () => {
    renderLogin()
    await userEvent.click(getSubmitButton())
    expect(await screen.findByText(/completa todos los campos/i)).toBeInTheDocument()
  })

  it('muestra error si la contraseña tiene menos de 6 caracteres', async () => {
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/correo/i), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText(/contraseña/i), '12345')
    await userEvent.click(getSubmitButton())
    expect(await screen.findByText(/6 caracteres/i)).toBeInTheDocument()
  })
})

describe('Login — flujo de inicio de sesión', () => {
  it('llama a signIn con las credenciales correctas', async () => {
    mockSignIn.mockResolvedValue(undefined)
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/correo/i), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText(/contraseña/i), 'password123')
    await userEvent.click(getSubmitButton())
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123')
    })
  })

  it('muestra error traducido cuando signIn falla por credenciales inválidas', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'))
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/correo/i), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText(/contraseña/i), 'wrongpassword')
    await userEvent.click(getSubmitButton())
    expect(await screen.findByText(/incorrectos/i)).toBeInTheDocument()
  })

  it('muestra error cuando el correo no está confirmado', async () => {
    mockSignIn.mockRejectedValue(new Error('Email not confirmed'))
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/correo/i), 'u@test.com')
    await userEvent.type(screen.getByPlaceholderText(/contraseña/i), 'pass123')
    await userEvent.click(getSubmitButton())
    expect(await screen.findByText(/confirma tu correo/i)).toBeInTheDocument()
  })
})

describe('Login — flujo de registro', () => {
  it('cambia a modo registro al hacer clic en el tab', async () => {
    renderLogin()
    await userEvent.click(screen.getByText('Crear cuenta'))
    // El submit button ahora debe decir "Crear cuenta"
    expect(getSubmitButton()).toHaveTextContent(/crear/i)
  })

  it('llama a signUp en modo registro', async () => {
    mockSignUp.mockResolvedValue(undefined)
    renderLogin()
    await userEvent.click(screen.getByText('Crear cuenta'))
    await userEvent.type(screen.getByPlaceholderText(/correo/i), 'nuevo@test.com')
    await userEvent.type(screen.getByPlaceholderText(/contraseña/i), 'password123')
    await userEvent.click(getSubmitButton())
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('nuevo@test.com', 'password123')
    })
  })

  it('muestra mensaje de éxito tras registro exitoso', async () => {
    mockSignUp.mockResolvedValue(undefined)
    renderLogin()
    await userEvent.click(screen.getByText('Crear cuenta'))
    await userEvent.type(screen.getByPlaceholderText(/correo/i), 'nuevo@test.com')
    await userEvent.type(screen.getByPlaceholderText(/contraseña/i), 'password123')
    await userEvent.click(getSubmitButton())
    expect(await screen.findByText(/cuenta creada/i)).toBeInTheDocument()
  })
})
