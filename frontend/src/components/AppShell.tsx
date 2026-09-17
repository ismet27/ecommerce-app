import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import type { NavItem } from './Sidebar'
import { Header } from './Header'

export function AppShell({
  panelLabel,
  roleBadge,
  navItems,
}: {
  panelLabel: string
  roleBadge: string
  navItems: NavItem[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="dashboard-shell">
      <Header
        panelLabel={panelLabel}
        roleBadge={roleBadge}
        onMenuToggle={() => setMenuOpen((open) => !open)}
      />
      <div className="dashboard-shell__body">
        <Sidebar navItems={navItems} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        {menuOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Menüyü kapat"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
