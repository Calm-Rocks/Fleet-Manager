import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './UI'

interface Props {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user, loading, isDemoMode } = useAuth()
  const [showTimeout, setShowTimeout] = useState(false)

  // If still loading after 7s, show a manual redirect link
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setShowTimeout(true), 7000)
    return () => clearTimeout(t)
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center flex-col gap-4">
        <Spinner />
        {showTimeout && (
          <div className="text-center">
            <p className="text-[13px] text-[#6B6860] mb-3">Taking longer than expected…</p>
            <a
              href="/signin"
              className="text-[13px] text-[#2563EB] font-medium hover:underline"
            >
              Go to sign in →
            </a>
          </div>
        )}
      </div>
    )
  }

  if (isDemoMode) return <>{children}</>
  if (!user) return <Navigate to="/signin" replace />
  return <>{children}</>
}
