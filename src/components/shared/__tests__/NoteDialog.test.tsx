import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteDialog } from '../NoteDialog'
import { makeHabit, makeLog } from '@/test/utils'

const habit   = makeHabit({ name: 'Meditación' })
const log     = makeLog({ notes: 'Nota existente' })
const onClose = vi.fn()
const onSave  = vi.fn().mockResolvedValue(undefined)

describe('NoteDialog', () => {
  it('no renderiza nada si habit es null', () => {
    const { container } = render(
      <NoteDialog open habit={null} log={null} onClose={onClose} onSave={onSave} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el nombre del hábito en el encabezado del dialog', () => {
    render(<NoteDialog open habit={habit} log={log} onClose={onClose} onSave={onSave} />)
    // El nombre aparece 2 veces (header del Dialog + tarjeta interna); usamos getAllByText
    const matches = screen.getAllByText('Meditación')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('muestra el título "Notas del día"', () => {
    render(<NoteDialog open habit={habit} log={log} onClose={onClose} onSave={onSave} />)
    expect(screen.getByText('Notas del día')).toBeInTheDocument()
  })

  it('pre-rellena la nota existente del log', () => {
    render(<NoteDialog open habit={habit} log={log} onClose={onClose} onSave={onSave} />)
    expect(screen.getByRole('textbox')).toHaveValue('Nota existente')
  })

  it('empieza vacío si el log no tiene notas', () => {
    render(<NoteDialog open habit={habit} log={makeLog({ notes: undefined })} onClose={onClose} onSave={onSave} />)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('actualiza el contador de caracteres al escribir', async () => {
    render(<NoteDialog open habit={habit} log={makeLog({ notes: undefined })} onClose={onClose} onSave={onSave} />)
    await userEvent.type(screen.getByRole('textbox'), 'Hola')
    expect(screen.getByText('4/300')).toBeInTheDocument()
  })

  it('el contador empieza con la longitud de la nota existente', () => {
    render(<NoteDialog open habit={habit} log={log} onClose={onClose} onSave={onSave} />)
    expect(screen.getByText('14/300')).toBeInTheDocument() // 'Nota existente'.length = 14
  })

  it('llama a onClose al hacer clic en Cancelar', async () => {
    const close = vi.fn()
    render(<NoteDialog open habit={habit} log={log} onClose={close} onSave={onSave} />)
    const panel = screen.getByRole('dialog')
    await userEvent.click(within(panel).getByRole('button', { name: /cancelar/i }))
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('llama a onSave con logId y texto al guardar', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<NoteDialog open habit={habit} log={log} onClose={onClose} onSave={save} />)
    const panel = screen.getByRole('dialog')
    const textarea = screen.getByRole('textbox')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'Nueva nota')
    await userEvent.click(within(panel).getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(save).toHaveBeenCalledWith('log-1', 'Nueva nota'))
  })

  it('no llama a onSave si el log es null', async () => {
    const save = vi.fn()
    render(<NoteDialog open habit={habit} log={null} onClose={onClose} onSave={save} />)
    const panel = screen.getByRole('dialog')
    await userEvent.click(within(panel).getByRole('button', { name: /guardar/i }))
    expect(save).not.toHaveBeenCalled()
  })

  it('muestra "Completado" cuando el log está completado', () => {
    render(<NoteDialog open habit={habit} log={makeLog({ completed: true })} onClose={onClose} onSave={onSave} />)
    expect(screen.getByText(/completado/i)).toBeInTheDocument()
  })

  it('muestra "Sin completar" cuando el log no está completado', () => {
    render(<NoteDialog open habit={habit} log={makeLog({ completed: false })} onClose={onClose} onSave={onSave} />)
    expect(screen.getByText(/sin completar/i)).toBeInTheDocument()
  })

  it('no renderiza cuando open=false', () => {
    render(<NoteDialog open={false} habit={habit} log={log} onClose={onClose} onSave={onSave} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
