import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/client'
import { homePathForRole } from '../utils/roleHome'

const DEMO_PASSWORD = 'Password123!'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@shop.local' },
  { label: 'İş Yeri', email: 'seller@shop.local' },
  { label: 'Müşteri', email: 'customer@shop.local' },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) {
    const state = location.state as { from?: { pathname?: string } } | null
    const redirectTo = state?.from?.pathname
    return <Navigate to={redirectTo || homePathForRole(user.role)} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const loggedInUser = await login(email, password)
      navigate(homePathForRole(loggedInUser.role), { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <Store size={28} aria-hidden="true" />
          <span>Tekno Pazar</span>
        </div>

        <h1 className="login-card__title">Giriş Yap</h1>
        <p className="login-card__subtitle">Hesabınıza erişmek için bilgilerinizi girin.</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-field">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>

        <div className="login-card__demo">
          <p className="login-card__demo-title">Demo hesaplar (geliştirme amaçlıdır):</p>
          <div className="login-card__demo-buttons">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => setEmail(account.email)}
              >
                {account.label}
              </button>
            ))}
          </div>
          <p className="login-card__demo-hint">
            Bir hesap seçin, ardından şifreyi girin: <code>{DEMO_PASSWORD}</code>
          </p>
          <p className="login-card__demo-warning">
            Bu hesaplar yalnızca geliştirme/demo amaçlıdır, gerçek bir sistemde kullanılmamalıdır.
          </p>
        </div>
      </div>
    </div>
  )
}
