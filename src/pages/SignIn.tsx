import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SignIn() {
  const { signIn, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error); return }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-[#1A3A5C] rounded-lg flex items-center justify-center text-white text-[13px] font-bold">
            FM
          </div>
          <span className="text-[17px] font-semibold text-[#1A3A5C] tracking-[-0.3px]">
            Fleet Manager
          </span>
        </div>

        <div className="bg-white border border-[#E5E3DD] rounded-2xl p-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.4px] mb-1">Sign in</h1>
          <p className="text-[13px] text-[#6B6860] mb-6">Welcome back to your fleet dashboard</p>

          {isDemoMode && (
            <div className="bg-[#EBF2FC] border border-[#B5D4F4] rounded-lg p-3 mb-5 text-[12px] text-[#185FA5]">
              <p className="font-semibold mb-0.5">Running in demo mode</p>
              <p>Add Supabase credentials to your <code className="bg-[#dbeafe] px-1 rounded">.env</code> file to enable real auth.</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3.5">
              <label className="fm-label">Email address</label>
              <input
                className="fm-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required={!isDemoMode}
              />
            </div>
            <div className="mb-5">
              <label className="fm-label">Password</label>
              <input
                className="fm-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required={!isDemoMode}
              />
            </div>

            {error && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 mb-4 text-[13px] text-[#991B1B]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full justify-center py-2.5"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#6B6860] mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#2563EB] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
