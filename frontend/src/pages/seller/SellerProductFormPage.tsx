import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star, Trash2, Upload } from 'lucide-react'
import {
  createSellerProduct,
  deleteProductImage,
  fetchSellerProduct,
  updateProductImage,
  updateSellerProduct,
  uploadProductImage,
} from '../../api/seller'
import { fetchCatalogCategories } from '../../api/catalog'
import type { Category, Product, ProductImage as ProductImageType } from '../../api/types'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageHeader } from '../../components/PageHeader'
import { ProductImage } from '../../components/ProductImage'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../context/ToastContext'

export function SellerProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = id !== undefined
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchCatalogCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!isEditing || !id) return
    setLoading(true)
    fetchSellerProduct(Number(id))
      .then((data) => {
        setProduct(data)
        setName(data.name)
        setCategoryId(data.category_id)
        setDescription(data.description ?? '')
        setPrice(data.price)
        setStock(String(data.stock))
        setIsActive(data.is_active)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    const payload = {
      category_id: Number(categoryId),
      name,
      description: description || null,
      price: Number(price),
      stock: Number(stock),
      is_active: isActive,
    }

    try {
      if (isEditing && product) {
        const updated = await updateSellerProduct(product.id, payload)
        setProduct(updated)
        showToast('Ürün güncellendi.', 'success')
      } else {
        const created = await createSellerProduct(payload)
        showToast('Ürün oluşturuldu.', 'success')
        navigate(`/seller/products/${created.id}`, { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setFieldErrors(getFieldErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner label="Ürün yükleniyor…" />

  return (
    <div className="seller-product-form-page">
      <Link to="/seller/products" className="btn btn--ghost btn--small">
        <ArrowLeft size={16} aria-hidden="true" /> Ürünlerime Dön
      </Link>

      <PageHeader title={isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün'} />

      <form onSubmit={handleSubmit} className="form form--card">
        <div className="form-field">
          <label htmlFor="name">Ürün Adı</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          {fieldErrors.name && <span className="form-field__error">{fieldErrors.name}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="category_id">Kategori</label>
          <select
            id="category_id"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Kategori seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldErrors.category_id && (
            <span className="form-field__error">{fieldErrors.category_id}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="description">Açıklama</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="price">Fiyat (TRY)</label>
            <input
              id="price"
              type="number"
              min={0}
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {fieldErrors.price && <span className="form-field__error">{fieldErrors.price}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="stock">Stok Adedi</label>
            <input
              id="stock"
              type="number"
              min={0}
              step="1"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
            {fieldErrors.stock && <span className="form-field__error">{fieldErrors.stock}</span>}
          </div>
        </div>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Ürün aktif (mağazada görünür)
        </label>

        {error && <ErrorAlert message={error} />}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Kaydediliyor…' : isEditing ? 'Güncelle' : 'Ürünü Oluştur'}
        </button>
      </form>

      {isEditing && product && (
        <ProductImagesManager
          product={product}
          onImagesChange={(images) => setProduct({ ...product, images })}
        />
      )}

      {!isEditing && (
        <p className="form-hint">
          Görsel eklemek için önce ürünü oluşturun; oluşturduktan sonra bu sayfada görsel
          yönetimi bölümü açılacaktır.
        </p>
      )}
    </div>
  )
}

function ProductImagesManager({
  product,
  onImagesChange,
}: {
  product: Product
  onImagesChange: (images: ProductImageType[]) => void
}) {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingDeleteImage, setPendingDeleteImage] = useState<ProductImageType | null>(null)

  function handleFileSelect(file: File | null) {
    setSelectedFile(file)
    setUploadError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setUploadError(null)

    try {
      const image = await uploadProductImage(product.id, selectedFile, altText || undefined)
      onImagesChange([...product.images, image])
      showToast('Görsel yüklendi.', 'success')
      handleFileSelect(null)
      setAltText('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleSetPrimary(image: ProductImageType) {
    try {
      await updateProductImage(product.id, image.id, { is_primary: true })
      onImagesChange(
        product.images.map((img) => ({ ...img, is_primary: img.id === image.id })),
      )
      showToast('Ana görsel güncellendi.', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  async function handleDeleteImage() {
    if (!pendingDeleteImage) return
    const deletingPrimary = pendingDeleteImage.is_primary

    try {
      await deleteProductImage(product.id, pendingDeleteImage.id)
      const remaining = product.images.filter((img) => img.id !== pendingDeleteImage.id)

      if (deletingPrimary && remaining.length > 0) {
        // Mirrors the backend's own promotion rule so the UI stays in sync
        // without a refetch: the next image (by sort order) becomes primary.
        const sorted = [...remaining].sort((a, b) => a.sort_order - b.sort_order)
        sorted[0].is_primary = true
        onImagesChange(sorted)
      } else {
        onImagesChange(remaining)
      }

      showToast('Görsel silindi.', 'success')
      setPendingDeleteImage(null)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <section className="image-manager">
      <h2>Ürün Görselleri</h2>

      {product.images.length === 0 ? (
        <p className="form-hint">Bu ürün için henüz görsel eklenmedi.</p>
      ) : (
        <div className="image-manager__grid">
          {product.images.map((image) => (
            <div key={image.id} className="image-manager__item">
              <ProductImage src={image.url} alt={image.alt_text ?? product.name} />
              {image.is_primary && (
                <span className="image-manager__primary-badge">
                  <Star size={14} aria-hidden="true" /> Ana Görsel
                </span>
              )}
              <div className="image-manager__item-actions">
                {!image.is_primary && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => handleSetPrimary(image)}
                  >
                    Ana Görsel Yap
                  </button>
                )}
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Görseli sil"
                  onClick={() => setPendingDeleteImage(image)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="image-manager__upload">
        <div className="form-field">
          <label htmlFor="image-file">Yeni Görsel Yükle</label>
          <input
            id="image-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
          <span className="form-hint">Desteklenen türler: JPG, JPEG, PNG, WEBP. Maksimum 5MB.</span>
        </div>

        {previewUrl && (
          <div className="image-manager__preview">
            <ProductImage src={previewUrl} alt="Yüklenecek görsel önizlemesi" />
          </div>
        )}

        <div className="form-field">
          <label htmlFor="alt-text">Alternatif Metin (opsiyonel)</label>
          <input
            id="alt-text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Görseli tanımlayan kısa bir metin"
          />
        </div>

        {uploadError && <ErrorAlert message={uploadError} />}

        <button
          type="button"
          className="btn btn--primary"
          disabled={!selectedFile || uploading}
          onClick={handleUpload}
        >
          <Upload size={16} aria-hidden="true" /> {uploading ? 'Yükleniyor…' : 'Görseli Yükle'}
        </button>
      </div>

      {pendingDeleteImage && (
        <ConfirmDialog
          title="Görseli Sil"
          message="Bu görseli silmek istediğinize emin misiniz?"
          confirmLabel="Sil"
          danger
          onConfirm={handleDeleteImage}
          onCancel={() => setPendingDeleteImage(null)}
        />
      )}
    </section>
  )
}
