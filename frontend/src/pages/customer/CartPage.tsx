import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { createOrder } from '../../api/customerOrders'
import { getErrorMessage } from '../../api/client'
import { ProductImage } from '../../components/ProductImage'
import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { formatMoney, estimateLineTotal } from '../../utils/money'
import { useToast } from '../../context/ToastContext'

export function CartPage() {
  const { items, increment, decrement, remove, clear, subtotal } = useCart()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <EmptyState
        title="Sepetiniz boş"
        description="Alışverişe başlamak için ürünler sayfasına göz atın."
        action={
          <Link to="/" className="btn btn--primary">
            Ürünlere Göz At
          </Link>
        }
      />
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const order = await createOrder({
        items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        customer_note: note || undefined,
      })
      clear()
      showToast('Sipariş alındı.', 'success')
      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="cart-page">
      <h1>Sepetim</h1>

      <div className="cart-page__grid">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.productId} className="cart-item">
              <ProductImage src={item.imageUrl} alt={item.name} className="cart-item__image" />
              <div className="cart-item__info">
                <p className="cart-item__name">{item.name}</p>
                <p className="cart-item__price">{formatMoney(item.unitPrice)} / adet</p>
              </div>

              <div className="quantity-stepper">
                <button
                  type="button"
                  aria-label="Adedi azalt"
                  disabled={item.quantity <= 1}
                  onClick={() => decrement(item.productId)}
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Adedi artır"
                  disabled={item.quantity >= item.availableStock}
                  onClick={() => increment(item.productId)}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>

              <p className="cart-item__line-total">
                {formatMoney(estimateLineTotal(item.unitPrice, item.quantity))}
              </p>

              <button
                type="button"
                className="icon-btn"
                aria-label={`${item.name} ürününü sepetten çıkar`}
                onClick={() => remove(item.productId)}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          ))}

          <button type="button" className="btn btn--ghost btn--small" onClick={clear}>
            Sepeti Temizle
          </button>
        </div>

        <div className="cart-summary">
          <h2>Sipariş Özeti</h2>
          <div className="cart-summary__row">
            <span>Tahmini Ara Toplam</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          <p className="cart-summary__note">
            Bu tutar tahmini bir gösterimdir. Kesin fiyat ve toplam, sipariş oluşturulurken sunucu
            tarafında hesaplanır.
          </p>

          <p className="cart-summary__disclaimer">
            Bu projede ödeme ve kargo entegrasyonu bulunmamaktadır.
          </p>

          {!user && (
            <p className="cart-summary__note">
              Sipariş oluşturmak için <Link to="/giris">giriş yapmalısınız</Link>.
            </p>
          )}

          {user && user.role !== 'customer' && (
            <div className="alert alert--error">
              Sipariş oluşturma yalnızca müşteri hesapları için kullanılabilir.
            </div>
          )}

          {user && user.role === 'customer' && (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-field">
                <label htmlFor="note">Sipariş Notu (opsiyonel)</label>
                <textarea
                  id="note"
                  rows={3}
                  maxLength={1000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Örn: Kapıcıya teslim edilebilir."
                />
              </div>

              {error && <ErrorAlert message={error} />}

              <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                {submitting ? 'Sipariş oluşturuluyor…' : 'Siparişi Oluştur'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
