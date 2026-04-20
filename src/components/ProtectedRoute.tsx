import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './UI'

interface Props {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user, loading, isDemoMode } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // In demo mode, always allow access
  if (isDemoMode) return <>{children}</>

  // Redirect to sign in if not authenticated
  if (!user) return <Navigate to="/signin" replace />

  return <>{children}</>
}
