import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { fetchCatalogProduct } from '../../api/catalog'
import type { CatalogProduct } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { ProductImage } from '../../components/ProductImage'
import { formatMoney } from '../../utils/money'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)

    fetchCatalogProduct(Number(id))
      .then((data) => {
        setProduct(data)
        setActiveImage(data.primary_image?.url ?? data.images[0]?.url ?? null)
        setQuantity(1)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner label="Ürün yükleniyor…" />
  if (error) return <ErrorAlert message={error} />
  if (!product) return null

  const outOfStock = product.stock <= 0

  function handleAddToCart() {
    if (!product) return
    addItem(product, quantity)
    showToast(`${product.name} sepete eklendi.`, 'success')
  }

  return (
    <div className="product-detail">
      <button type="button" className="btn btn--ghost btn--small" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} aria-hidden="true" /> Geri
      </button>

      <div className="product-detail__grid">
        <div className="product-detail__gallery">
          <ProductImage
            src={activeImage}
            alt={product.name}
            className="product-detail__main-image"
          />
          {product.images.length > 1 && (
            <div className="product-detail__thumbnails">
              {product.images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  className={`product-detail__thumb ${
                    activeImage === image.url ? 'product-detail__thumb--active' : ''
                  }`}
                  onClick={() => setActiveImage(image.url)}
                  aria-label={image.alt_text ?? product.name}
                >
                  <ProductImage src={image.url} alt={image.alt_text ?? product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail__info">
          {product.category && (
            <Link
              to={`/?category_id=${product.category.id}`}
              className="product-detail__category"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="product-detail__name">{product.name}</h1>
          {product.business && (
            <p className="product-detail__business">Satıcı: {product.business.name}</p>
          )}

          <p className="product-detail__price">{formatMoney(product.price)}</p>

          {outOfStock ? (
            <span className="badge badge--neutral">Stokta yok</span>
          ) : (
            <span className="badge badge--success">Stokta: {product.stock} adet</span>
          )}

          {product.description && (
            <p className="product-detail__description">{product.description}</p>
          )}

          <div className="product-detail__purchase">
            <div className="quantity-stepper">
              <button
                type="button"
                aria-label="Adedi azalt"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                aria-label="Adedi artır"
                disabled={outOfStock || quantity >= product.stock}
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              className="btn btn--primary"
              disabled={outOfStock}
              onClick={handleAddToCart}
            >
              {outOfStock ? 'Stokta Yok' : 'Sepete Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
