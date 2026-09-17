import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { fetchAdminOrder, fetchAdminOrders, fetchBusinesses } from '../../api/admin'
import type { Business, Order, OrderStatus, Paginated } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { formatMoney } from '../../utils/money'
import { formatDate } from '../../utils/labels'

export function AdminOrdersPage() {
  const [result, setResult] = useState<Paginated<Order> | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [businessId, setBusinessId] = useState<number | ''>('')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')
  const [page, setPage] = useState(1)

  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchBusinesses({ per_page: 100 }).then((r) => setBusinesses(r.data)).catch(() => setBusinesses([]))
  }, [])

  function load() {
    setLoading(true)
    setError(null)
    fetchAdminOrders({
      search: search || undefined,
      status: status || undefined,
      business_id: businessId || undefined,
      min_total: minTotal ? Number(minTotal) : undefined,
      max_total: maxTotal ? Number(maxTotal) : undefined,
      page,
      per_page: 15,
    })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, status, businessId, minTotal, maxTotal, page])

  async function openDetail(orderId: number) {
    setDetailLoading(true)
    try {
      const order = await fetchAdminOrder(orderId)
      setDetailOrder(order)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="admin-orders-page">
      <PageHeader title="Siparişler" description="Tüm müşteri siparişlerini inceleyin." />

      <div className="catalog-filters">
        <div className="form-field form-field--search">
          <label htmlFor="search" className="sr-only">
            Müşteri ara
          </label>
          <Search size={18} aria-hidden="true" />
          <input
            id="search"
            type="search"
            placeholder="Müşteri adı veya e-posta ara…"
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="status">Durum</label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value as OrderStatus | '')
            }}
          >
            <option value="">Tümü</option>
            <option value="received">Sipariş Alındı</option>
            <option value="preparing">Hazırlanıyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="business">İş Yeri</label>
          <select
            id="business"
            value={businessId}
            onChange={(e) => {
              setPage(1)
              setBusinessId(e.target.value ? Number(e.target.value) : '')
            }}
          >
            <option value="">Tümü</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="min-total">Min. Toplam</label>
          <input
            id="min-total"
            type="number"
            min={0}
            value={minTotal}
            onChange={(e) => {
              setPage(1)
              setMinTotal(e.target.value)
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="max-total">Maks. Toplam</label>
          <input
            id="max-total"
            type="number"
            min={0}
            value={maxTotal}
            onChange={(e) => {
              setPage(1)
              setMaxTotal(e.target.value)
            }}
          />
        </div>
      </div>

      {loading && <LoadingSpinner label="Siparişler yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="Sipariş bulunamadı" />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Müşteri</th>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th>Toplam</th>
                  <th aria-label="İşlemler" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer?.name ?? '—'}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>{formatMoney(order.total_amount)}</td>
                    <td className="data-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={detailLoading}
                        onClick={() => openDetail(order.id)}
                      >
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination meta={result.meta} onPageChange={setPage} />
        </>
      )}

      {detailOrder && (
        <Modal title={`Sipariş #${detailOrder.id}`} onClose={() => setDetailOrder(null)} width="lg">
          <div className="order-detail-modal">
            <dl className="detail-list">
              <div>
                <dt>Müşteri</dt>
                <dd>
                  {detailOrder.customer?.name} ({detailOrder.customer?.email})
                </dd>
              </div>
              <div>
                <dt>Tarih</dt>
                <dd>{formatDate(detailOrder.created_at)}</dd>
              </div>
              <div>
                <dt>Durum</dt>
                <dd>
                  <StatusBadge status={detailOrder.status} />
                </dd>
              </div>
              {detailOrder.customer_note && (
                <div>
                  <dt>Sipariş Notu</dt>
                  <dd>{detailOrder.customer_note}</dd>
                </div>
              )}
            </dl>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>İş Yeri</th>
                    <th>Adet</th>
                    <th>Birim Fiyat</th>
                    <th>Ara Toplam</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {detailOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name_snapshot}</td>
                      <td>{item.business?.name ?? '—'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.unit_price_snapshot)}</td>
                      <td>{formatMoney(item.line_total)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="data-table__total-label">
                      Genel Toplam
                    </td>
                    <td colSpan={2} className="data-table__total-value">
                      {formatMoney(detailOrder.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
