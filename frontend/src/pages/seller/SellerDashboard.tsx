import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Package, ShoppingBag } from 'lucide-react'
import { fetchSellerOrders, fetchSellerProducts } from '../../api/seller'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageHeader } from '../../components/PageHeader'
import { getErrorMessage } from '../../api/client'

interface Stats {
  totalProducts: number
  activeProducts: number
  outOfStock: number
  totalOrders: number
  ordersNeedingAttention: number
}

export function SellerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      fetchSellerProducts({ per_page: 100 }),
      fetchSellerOrders({ per_page: 100 }),
    ])
      .then(([products, orders]) => {
        setStats({
          totalProducts: products.meta.total,
          activeProducts: products.data.filter((p) => p.is_active).length,
          outOfStock: products.data.filter((p) => p.stock === 0).length,
          totalOrders: orders.meta.total,
          ordersNeedingAttention: orders.data.filter((o) =>
            o.items.some((item) => item.status === 'received' || item.status === 'preparing'),
          ).length,
        })
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard-page">
      <PageHeader
        title={`Merhaba, ${user?.name ?? ''}`}
        description="İş yerinizin ürün ve sipariş durumuna genel bakış."
      />

      {loading && <LoadingSpinner label="Panel yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && stats && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__label">Toplam Ürün</span>
              <span className="stat-card__value">{stats.totalProducts}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Aktif Ürün</span>
              <span className="stat-card__value">{stats.activeProducts}</span>
            </div>
            <div className="stat-card stat-card--warning">
              <span className="stat-card__label">Stokta Olmayan</span>
              <span className="stat-card__value">{stats.outOfStock}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Toplam Sipariş</span>
              <span className="stat-card__value">{stats.totalOrders}</span>
            </div>
          </div>

          {stats.ordersNeedingAttention > 0 && (
            <div className="alert alert--info">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>
                {stats.ordersNeedingAttention} siparişte işleminizi bekleyen ürün var. Siparişler
                sayfasından kontrol edin.
              </span>
            </div>
          )}

          <div className="quick-links">
            <Link to="/seller/products" className="quick-link-card">
              <Package size={22} aria-hidden="true" />
              <div>
                <strong>Ürünlerim</strong>
                <p>Ürün ekle, düzenle, görsellerini yönet.</p>
              </div>
            </Link>
            <Link to="/seller/orders" className="quick-link-card">
              <ShoppingBag size={22} aria-hidden="true" />
              <div>
                <strong>Siparişler</strong>
                <p>İş yerinize ait sipariş kalemlerini yönet.</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
