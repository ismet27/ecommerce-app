import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../api/types'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { homePathForRole } from '../utils/roleHome'

/**
 * Restricts a route subtree to the given roles. This is a UX convenience
 * only (redirects a customer away from /admin, say) — the backend remains
 * the real security boundary for every request.
 */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="full-page-loading">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/giris" replace />
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return <Outlet />
}
