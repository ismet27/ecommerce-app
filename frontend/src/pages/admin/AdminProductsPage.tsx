import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { fetchAdminCategories, fetchAdminProducts, fetchBusinesses } from '../../api/admin'
import type { Business, Category, Paginated, Product } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { ActiveBadge } from '../../components/StatusBadge'
import { ProductImage } from '../../components/ProductImage'
import { Modal } from '../../components/Modal'
import { formatMoney } from '../../utils/money'

export function AdminProductsPage() {
  const [result, setResult] = useState<Paginated<Product> | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [businessId, setBusinessId] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [withTrashed, setWithTrashed] = useState(false)
  const [page, setPage] = useState(1)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchBusinesses({ per_page: 100 }).then((r) => setBusinesses(r.data)).catch(() => setBusinesses([]))
    fetchAdminCategories({ per_page: 100 }).then((r) => setCategories(r.data)).catch(() => setCategories([]))
  }, [])

  function load() {
    setLoading(true)
    setError(null)
    fetchAdminProducts({
      search: search || undefined,
      business_id: businessId || undefined,
      category_id: categoryId || undefined,
      is_active: status === '' ? undefined : status === 'active',
      with_trashed: withTrashed || undefined,
      page,
      per_page: 15,
    })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, businessId, categoryId, status, withTrashed, page])

  return (
    <div className="admin-products-page">
      <PageHeader title="Ürünler" description="Tüm iş yerlerine ait ürünleri inceleyin." />

      <div className="catalog-filters">
        <div className="form-field form-field--search">
          <label htmlFor="search" className="sr-only">
            Ürün ara
          </label>
          <Search size={18} aria-hidden="true" />
          <input
            id="search"
            type="search"
            placeholder="Ürün adı veya açıklama ara…"
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
          />
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
          <label htmlFor="category">Kategori</label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => {
              setPage(1)
              setCategoryId(e.target.value ? Number(e.target.value) : '')
            }}
          >
            <option value="">Tümü</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="status">Durum</label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value as '' | 'active' | 'inactive')
            }}
          >
            <option value="">Tümü</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </div>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={withTrashed}
            onChange={(e) => {
              setPage(1)
              setWithTrashed(e.target.checked)
            }}
          />
          Silinenleri de göster
        </label>
      </div>

      {loading && <LoadingSpinner label="Ürünler yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="Ürün bulunamadı" />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th aria-label="Görsel" />
                  <th>Ürün</th>
                  <th>İş Yeri</th>
                  <th>Kategori</th>
                  <th>Fiyat</th>
                  <th>Stok</th>
                  <th>Durum</th>
                  <th aria-label="İşlemler" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <ProductImage
                        src={product.primary_image?.url}
                        alt={product.name}
                        className="data-table__thumb"
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.business?.name ?? '—'}</td>
                    <td>{product.category?.name ?? '—'}</td>
                    <td>{formatMoney(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      {product.deleted_at ? (
                        <span className="badge badge--danger">Silinmiş</span>
                      ) : (
                        <ActiveBadge active={product.is_active} />
                      )}
                    </td>
                    <td className="data-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => setDetailProduct(product)}
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

      {detailProduct && (
        <Modal title={detailProduct.name} onClose={() => setDetailProduct(null)}>
          <div className="product-admin-detail">
            <ProductImage
              src={detailProduct.primary_image?.url}
              alt={detailProduct.name}
              className="product-admin-detail__image"
            />
            <dl className="detail-list">
              <div>
                <dt>İş Yeri</dt>
                <dd>{detailProduct.business?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Kategori</dt>
                <dd>{detailProduct.category?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Fiyat</dt>
                <dd>{formatMoney(detailProduct.price)}</dd>
              </div>
              <div>
                <dt>Stok</dt>
                <dd>{detailProduct.stock}</dd>
              </div>
              <div>
                <dt>Açıklama</dt>
                <dd>{detailProduct.description ?? '—'}</dd>
              </div>
              <div>
                <dt>Görsel Sayısı</dt>
                <dd>{detailProduct.images.length}</dd>
              </div>
            </dl>
          </div>
        </Modal>
      )}
    </div>
  )
}
