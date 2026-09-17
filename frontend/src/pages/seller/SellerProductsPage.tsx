import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { deleteSellerProduct, fetchSellerProducts } from '../../api/seller'
import { fetchCatalogCategories } from '../../api/catalog'
import type { Category, Paginated, Product } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { ActiveBadge } from '../../components/StatusBadge'
import { ProductImage } from '../../components/ProductImage'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { formatMoney } from '../../utils/money'
import { useToast } from '../../context/ToastContext'

export function SellerProductsPage() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    fetchSellerProducts({
      search: search || undefined,
      category_id: categoryId || undefined,
      is_active: status === '' ? undefined : status === 'active',
      page,
      per_page: 15,
    })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCatalogCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(load, [search, categoryId, status, page])

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteSellerProduct(pendingDelete.id)
      showToast('Ürün silindi.', 'success')
      setPendingDelete(null)
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="seller-products-page">
      <PageHeader
        title="Ürünlerim"
        actions={
          <Link to="/seller/products/yeni" className="btn btn--primary">
            <Plus size={16} aria-hidden="true" /> Yeni Ürün
          </Link>
        }
      />

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
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="category">Kategori</label>
          <select
            id="category"
            value={categoryId}
            onChange={(event) => {
              setPage(1)
              setCategoryId(event.target.value ? Number(event.target.value) : '')
            }}
          >
            <option value="">Tüm kategoriler</option>
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
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as '' | 'active' | 'inactive')
            }}
          >
            <option value="">Tümü</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner label="Ürünler yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState
          title="Ürün bulunamadı"
          description="Yeni bir ürün ekleyerek başlayabilirsiniz."
          action={
            <Link to="/seller/products/yeni" className="btn btn--primary">
              Yeni Ürün Ekle
            </Link>
          }
        />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th aria-label="Görsel" />
                  <th>Ürün</th>
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
                    <td>{product.category?.name ?? '—'}</td>
                    <td>{formatMoney(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <ActiveBadge active={product.is_active} />
                    </td>
                    <td className="data-table__actions">
                      <Link
                        to={`/seller/products/${product.id}`}
                        className="btn btn--ghost btn--small"
                      >
                        Düzenle
                      </Link>
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        onClick={() => setPendingDelete(product)}
                      >
                        Sil
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

      {pendingDelete && (
        <ConfirmDialog
          title="Ürünü Sil"
          message={`"${pendingDelete.name}" ürününü silmek istediğinize emin misiniz?`}
          confirmLabel="Sil"
          danger
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
