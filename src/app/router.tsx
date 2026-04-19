import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { AuthGate } from '@/components/layout/AuthGate'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

const Login       = lazy(() => import('@/pages/Login'))
const Dashboard   = lazy(() => import('@/pages/Dashboard'))
const Tracking    = lazy(() => import('@/pages/Tracking'))
const TrackingDay = lazy(() => import('@/pages/TrackingDay'))
const Habits      = lazy(() => import('@/pages/Habits'))
const HabitNew    = lazy(() => import('@/pages/HabitNew'))
const HabitEdit   = lazy(() => import('@/pages/HabitEdit'))
const HabitDetail = lazy(() => import('@/pages/HabitDetail'))
const Analytics   = lazy(() => import('@/pages/Analytics'))
const Logros      = lazy(() => import('@/pages/Logros'))
const Settings    = lazy(() => import('@/pages/Settings'))
const NotFound    = lazy(() => import('@/pages/NotFound'))

const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <LoadingSpinner />
  </div>
)

const wrap = (C: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}><C /></Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthGate>{wrap(Login)}</AuthGate>,
  },
  {
    path: '/',
    element: <AuthGate><AppLayout /></AuthGate>,
    children: [
      { index: true,             element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',       element: wrap(Dashboard) },
      { path: 'tracking',        element: wrap(Tracking) },
      { path: 'tracking/:date',  element: wrap(TrackingDay) },
      { path: 'habits',          element: wrap(Habits) },
      { path: 'habits/new',      element: wrap(HabitNew) },
      { path: 'habits/:id',      element: wrap(HabitDetail) },
      { path: 'habits/:id/edit', element: wrap(HabitEdit) },
      { path: 'analytics',       element: wrap(Analytics) },
      { path: 'logros',          element: wrap(Logros) },
      { path: 'settings',        element: wrap(Settings) },
    ],
  },
  { path: '*', element: wrap(NotFound) },
])
