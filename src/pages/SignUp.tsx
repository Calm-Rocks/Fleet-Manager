import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SignUp() {
  const { signUp, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.fullName, form.companyName)
    setLoading(false)

    if (error) { setError(error); return }

    if (isDemoMode) {
      navigate('/')
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#E5E3DD] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h2 className="text-[18px] font-semibold mb-2">Check your email</h2>
            <p className="text-[13px] text-[#6B6860] mb-5">
              We've sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.
            </p>
            <Link to="/signin" className="btn btn-primary w-full justify-center">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-[20px] font-semibold tracking-[-0.4px] mb-1">Create your account</h1>
          <p className="text-[13px] text-[#6B6860] mb-6">Get your fleet up and running in minutes</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3.5">
              <label className="fm-label">Your full name</label>
              <input
                className="fm-input"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="mb-3.5">
              <label className="fm-label">Company name</label>
              <input
                className="fm-input"
                type="text"
                autoComplete="organization"
                value={form.companyName}
                onChange={set('companyName')}
                placeholder="Smith Logistics Ltd"
                required
              />
            </div>
            <div className="mb-3.5">
              <label className="fm-label">Email address</label>
              <input
                className="fm-input"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="jane@smithlogistics.co.uk"
                required
              />
            </div>
            <div className="mb-3.5">
              <label className="fm-label">Password</label>
              <input
                className="fm-input"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                placeholder="8+ characters"
                required
              />
            </div>
            <div className="mb-5">
              <label className="fm-label">Confirm password</label>
              <input
                className="fm-input"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="••••••••"
                required
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#6B6860] mt-5">
            Already have an account?{' '}
            <Link to="/signin" className="text-[#2563EB] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
