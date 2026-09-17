import { useEffect, useState } from 'react'
import { fetchAdminOrders, fetchAdminProducts, fetchBusinesses, fetchUsers, fetchAdminCategories } from '../../api/admin'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageHeader } from '../../components/PageHeader'
import { getErrorMessage } from '../../api/client'

interface Counts {
  users: number
  businesses: number
  categories: number
  products: number
  orders: number
}

export function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      fetchUsers({ per_page: 1 }),
      fetchBusinesses({ per_page: 1 }),
      fetchAdminCategories({ per_page: 1 }),
      fetchAdminProducts({ per_page: 1 }),
      fetchAdminOrders({ per_page: 1 }),
    ])
      .then(([users, businesses, categories, products, orders]) => {
        setCounts({
          users: users.meta.total,
          businesses: businesses.meta.total,
          categories: categories.meta.total,
          products: products.meta.total,
          orders: orders.meta.total,
        })
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard-page">
      <PageHeader title="Yönetim Paneli" description="Sistem genelinde özet bilgiler." />

      {loading && <LoadingSpinner label="Panel yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && counts && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-card__label">Kullanıcılar</span>
            <span className="stat-card__value">{counts.users}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">İş Yerleri</span>
            <span className="stat-card__value">{counts.businesses}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Kategoriler</span>
            <span className="stat-card__value">{counts.categories}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Ürünler</span>
            <span className="stat-card__value">{counts.products}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Siparişler</span>
            <span className="stat-card__value">{counts.orders}</span>
          </div>
        </div>
      )}
    </div>
  )
}
