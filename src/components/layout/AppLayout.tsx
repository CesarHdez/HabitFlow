import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Header from './Header'
import { PageTransition } from './PageTransition'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { OnboardingWizard } from '@/components/shared/OnboardingWizard'
import { useHabitsStore } from '@/features/habits/store'

export default function AppLayout() {
  const location = useLocation()
  const { habits, isLoading } = useHabitsStore()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (isLoading) return
    const done = localStorage.getItem('onboarding_complete') === 'true'
    if (!done && habits.length === 0) setShowOnboarding(true)
  }, [isLoading, habits.length])

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_complete', 'true')
    setShowOnboarding(false)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950 text-foreground">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <ErrorBoundary>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      <BottomNav />

      {showOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}
    </div>
  )
}
