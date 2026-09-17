import { Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Header({
  panelLabel,
  roleBadge,
  onMenuToggle,
}: {
  panelLabel: string
  roleBadge: string
  onMenuToggle: () => void
}) {
  const { user, logout } = useAuth()

  return (
    <header className="dashboard-header">
      <button
        type="button"
        className="dashboard-header__menu-btn"
        aria-label="Menüyü aç/kapat"
        onClick={onMenuToggle}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="dashboard-header__title">
        <strong>{panelLabel}</strong>
      </div>

      <div className="dashboard-header__account">
        <div className="dashboard-header__user">
          <span className="dashboard-header__name">{user?.name}</span>
          <span className="badge badge--info">{roleBadge}</span>
        </div>
        <button type="button" className="btn btn--ghost btn--small" onClick={logout}>
          Çıkış Yap
        </button>
      </div>
    </header>
  )
}
