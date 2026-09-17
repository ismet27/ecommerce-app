import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="full-page-loading">
        <LoadingSpinner label="Oturum kontrol ediliyor…" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/giris" state={{ from: location }} replace />
  }

  return <Outlet />
}
