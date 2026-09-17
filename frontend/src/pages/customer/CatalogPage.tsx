import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { fetchCatalogCategories, fetchCatalogProducts } from '../../api/catalog'
import type { CatalogProduct, Category, Paginated } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { ProductImage } from '../../components/ProductImage'
import { formatMoney } from '../../utils/money'

export function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<Paginated<CatalogProduct> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchCatalogCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetchCatalogProducts({
      search: search || undefined,
      category_id: categoryId || undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      in_stock: inStock || undefined,
      page,
      per_page: 12,
    })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [search, categoryId, minPrice, maxPrice, inStock, page])

  return (
    <div className="catalog-page">
      <div className="catalog-hero">
        <h1>Tekno Pazar'da Alışverişe Başla</h1>
        <p>Elektronik, bilgisayar, telefon ve aksesuar ürünlerini keşfedin.</p>
      </div>

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
          <label htmlFor="min-price">Min. Fiyat</label>
          <input
            id="min-price"
            type="number"
            min={0}
            value={minPrice}
            onChange={(event) => {
              setPage(1)
              setMinPrice(event.target.value)
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="max-price">Maks. Fiyat</label>
          <input
            id="max-price"
            type="number"
            min={0}
            value={maxPrice}
            onChange={(event) => {
              setPage(1)
              setMaxPrice(event.target.value)
            }}
          />
        </div>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => {
              setPage(1)
              setInStock(event.target.checked)
            }}
          />
          Sadece stokta olanlar
        </label>
      </div>

      {loading && <LoadingSpinner label="Ürünler yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="Ürün bulunamadı" description="Farklı filtreler deneyebilirsiniz." />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="product-grid">
            {result.data.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="product-card">
                <ProductImage
                  src={product.primary_image?.url}
                  alt={product.name}
                  className="product-card__image"
                />
                <div className="product-card__body">
                  {product.category && (
                    <span className="product-card__category">{product.category.name}</span>
                  )}
                  <h3 className="product-card__name">{product.name}</h3>
                  {product.business && (
                    <span className="product-card__business">{product.business.name}</span>
                  )}
                  <div className="product-card__footer">
                    <span className="product-card__price">{formatMoney(product.price)}</span>
                    {product.stock > 0 ? (
                      <span className="badge badge--success">Stokta</span>
                    ) : (
                      <span className="badge badge--neutral">Tükendi</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Pagination meta={result.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
