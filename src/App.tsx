import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/providers/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { Spinner } from '@/components/ui'

// ─────────────────────────────────────────────────────────────
// Lazy-loaded pages for code splitting
// ─────────────────────────────────────────────────────────────

const LoginPage = lazy(() => import('@/features/authentication/LoginPage'))
const SignupPage = lazy(() => import('@/features/authentication/SignupPage'))
const ForgotPasswordPage = lazy(() => import('@/features/authentication/ForgotPasswordPage'))
const AuthCallbackPage = lazy(() => import('@/features/authentication/AuthCallbackPage'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const UploadPage = lazy(() => import('@/features/upload/UploadPage'))
const ProcessingDashboard = lazy(() => import('@/features/upload/ProcessingDashboard'))
const MemoriesPage = lazy(() => import('@/features/memories/MemoriesPage'))
const MemoryDetailPage = lazy(() => import('@/features/memories/MemoryDetailPage'))
const ResumeAnalyzerPage = lazy(() => import('@/features/assistant/ResumeAnalyzerPage'))
const TimelinePage = lazy(() => import('@/features/timeline/TimelinePage'))
const KnowledgeGraphPage = lazy(() => import('@/features/knowledge-graph/KnowledgeGraphPage'))
const SearchPage = lazy(() => import('@/features/search/SearchPage'))
const AssistantPage = lazy(() => import('@/features/assistant/AssistantPage'))
const RecommendationsPage = lazy(() => import('@/features/recommendations/RecommendationsPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'))
const ProfilePage = lazy(() => import('@/features/settings/ProfilePage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// ─────────────────────────────────────────────────────────────
// Page loader fallback
// ─────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TanStack Query client
// ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// ─────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  // Landing page (public)
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/signup',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SignupPage />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthCallbackPage />
      </Suspense>
    ),
  },

  // Protected routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <DashboardPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/upload',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <UploadPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/processing',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ProcessingDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/memories',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <MemoriesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/memories/:id',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <MemoryDetailPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/resume-analyzer',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ResumeAnalyzerPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/timeline',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <TimelinePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/knowledge-graph',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <KnowledgeGraphPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/search',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <SearchPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/assistant',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AssistantPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/recommendations',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <RecommendationsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/analytics',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AnalyticsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ProfilePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <SettingsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // 404
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
