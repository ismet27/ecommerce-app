import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import { createCategory, fetchAdminCategories, updateCategory } from '../../api/admin'
import type { Category, Paginated } from '../../api/types'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { ActiveBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { useToast } from '../../context/ToastContext'

export function AdminCategoriesPage() {
  const { showToast } = useToast()
  const [result, setResult] = useState<Paginated<Category> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(1)
  const [modalCategory, setModalCategory] = useState<Category | 'new' | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    fetchAdminCategories({
      search: search || undefined,
      is_active: status === '' ? undefined : status === 'active',
      page,
      per_page: 15,
    })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, status, page])

  async function toggleActive(category: Category) {
    try {
      await updateCategory(category.id, { is_active: !category.is_active })
      showToast(
        category.is_active ? 'Kategori pasif hale getirildi.' : 'Kategori aktif hale getirildi.',
        'success',
      )
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="admin-categories-page">
      <PageHeader
        title="Kategoriler"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setModalCategory('new')}>
            <Plus size={16} aria-hidden="true" /> Yeni Kategori
          </button>
        }
      />

      <div className="catalog-filters">
        <div className="form-field form-field--search">
          <label htmlFor="search" className="sr-only">
            Kategori ara
          </label>
          <Search size={18} aria-hidden="true" />
          <input
            id="search"
            type="search"
            placeholder="Kategori adı ara…"
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
              setStatus(e.target.value as '' | 'active' | 'inactive')
            }}
          >
            <option value="">Tümü</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner label="Kategoriler yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="Kategori bulunamadı" />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Slug</th>
                  <th>Durum</th>
                  <th aria-label="İşlemler" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>
                      <code>{category.slug}</code>
                    </td>
                    <td>
                      <ActiveBadge active={category.is_active} />
                    </td>
                    <td className="data-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => setModalCategory(category)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className={`btn btn--small ${category.is_active ? 'btn--danger' : 'btn--primary'}`}
                        onClick={() => toggleActive(category)}
                      >
                        {category.is_active ? 'Pasifleştir' : 'Aktifleştir'}
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

      {modalCategory && (
        <CategoryFormModal
          category={modalCategory === 'new' ? null : modalCategory}
          onClose={() => setModalCategory(null)}
          onSaved={() => {
            setModalCategory(null)
            showToast(
              modalCategory === 'new' ? 'Kategori oluşturuldu.' : 'Kategori güncellendi.',
              'success',
            )
            load()
          }}
        />
      )}
    </div>
  )
}

function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState(category?.is_active ?? true)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    const payload = {
      name,
      slug: slug || null,
      description: description || null,
      is_active: isActive,
    }

    try {
      if (category) {
        await updateCategory(category.id, payload)
      } else {
        await createCategory(payload)
      }
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
      setFieldErrors(getFieldErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={category ? 'Kategoriyi Düzenle' : 'Yeni Kategori'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-field">
          <label htmlFor="category-name">Ad</label>
          <input
            id="category-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {fieldErrors.name && <span className="form-field__error">{fieldErrors.name}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="category-slug">Slug (opsiyonel)</label>
          <input
            id="category-slug"
            value={slug ?? ''}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Boş bırakılırsa isimden otomatik oluşturulur"
          />
          {fieldErrors.slug && <span className="form-field__error">{fieldErrors.slug}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="category-description">Açıklama</label>
          <textarea
            id="category-description"
            rows={3}
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Kategori aktif
        </label>

        {error && <ErrorAlert message={error} />}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </Modal>
  )
}
