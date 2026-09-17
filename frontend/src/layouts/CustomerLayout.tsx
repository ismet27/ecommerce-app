import { NavLink, Outlet } from 'react-router-dom'
import { ShoppingCart, Store, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export function CustomerLayout() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()

  return (
    <div className="customer-shell">
      <header className="customer-header">
        <div className="customer-header__inner">
          <NavLink to="/" className="brand">
            <Store size={22} aria-hidden="true" />
            <span>Tekno Pazar</span>
          </NavLink>

          <nav className="customer-nav" aria-label="Ana gezinme">
            <NavLink to="/" end>
              Ürünler
            </NavLink>
            {user?.role === 'customer' && <NavLink to="/orders">Siparişlerim</NavLink>}
          </nav>

          <div className="customer-header__actions">
            <NavLink to="/cart" className="cart-link" aria-label="Sepet">
              <ShoppingCart size={20} aria-hidden="true" />
              {itemCount > 0 && <span className="cart-link__badge">{itemCount}</span>}
            </NavLink>

            {user ? (
              <div className="account-menu">
                <span className="account-menu__name">
                  <User size={16} aria-hidden="true" /> {user.name}
                </span>
                <button type="button" className="btn btn--ghost btn--small" onClick={logout}>
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <NavLink to="/giris" className="btn btn--primary btn--small">
                Giriş Yap
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="customer-main">
        <Outlet />
      </main>

      <footer className="customer-footer">
        <p>Tekno Pazar — üniversite projesi demo mağazası.</p>
        <p>Bu projede ödeme ve kargo entegrasyonu bulunmamaktadır.</p>
      </footer>
    </div>
  )
}
