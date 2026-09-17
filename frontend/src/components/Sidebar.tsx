import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

export function Sidebar({
  navItems,
  open,
  onNavigate,
}: {
  navItems: NavItem[]
  open: boolean
  onNavigate: () => void
}) {
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <nav aria-label="Panel gezinme">
        <ul className="sidebar__list">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
