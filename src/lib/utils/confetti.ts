import confetti from 'canvas-confetti'

/** Confetti suave para check-in completado */
export function fireCheckInConfetti(): void {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.7 },
    colors: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B'],
  })
}

/** Confetti grande para logros/badges */
export function fireBadgeConfetti(): void {
  const end = Date.now() + 2000
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#6366F1', '#8B5CF6'],
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#10B981', '#F59E0B'],
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

/** Confetti al completar todos los hábitos del día */
export function fireAllDoneConfetti(): void {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'],
  })
}
