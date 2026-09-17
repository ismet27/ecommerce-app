import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import { createBusiness, fetchBusinesses, updateBusiness } from '../../api/admin'
import type { Business, Paginated } from '../../api/types'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { ActiveBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { useToast } from '../../context/ToastContext'

export function AdminBusinessesPage() {
  const { showToast } = useToast()
  const [result, setResult] = useState<Paginated<Business> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(1)
  const [modalBusiness, setModalBusiness] = useState<Business | 'new' | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    fetchBusinesses({
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

  async function toggleActive(business: Business) {
    try {
      await updateBusiness(business.id, { is_active: !business.is_active })
      showToast(business.is_active ? 'İş yeri pasif hale getirildi.' : 'İş yeri aktif hale getirildi.', 'success')
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div className="admin-businesses-page">
      <PageHeader
        title="İş Yerleri"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setModalBusiness('new')}>
            <Plus size={16} aria-hidden="true" /> Yeni İş Yeri
          </button>
        }
      />

      <div className="catalog-filters">
        <div className="form-field form-field--search">
          <label htmlFor="search" className="sr-only">
            İş yeri ara
          </label>
          <Search size={18} aria-hidden="true" />
          <input
            id="search"
            type="search"
            placeholder="İsim, e-posta veya telefon ara…"
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

      {loading && <LoadingSpinner label="İş yerleri yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="İş yeri bulunamadı" />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Durum</th>
                  <th aria-label="İşlemler" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((business) => (
                  <tr key={business.id}>
                    <td>{business.name}</td>
                    <td>{business.phone ?? '—'}</td>
                    <td>{business.email ?? '—'}</td>
                    <td>
                      <ActiveBadge active={business.is_active} />
                    </td>
                    <td className="data-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => setModalBusiness(business)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className={`btn btn--small ${business.is_active ? 'btn--danger' : 'btn--primary'}`}
                        onClick={() => toggleActive(business)}
                      >
                        {business.is_active ? 'Pasifleştir' : 'Aktifleştir'}
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

      {modalBusiness && (
        <BusinessFormModal
          business={modalBusiness === 'new' ? null : modalBusiness}
          onClose={() => setModalBusiness(null)}
          onSaved={() => {
            setModalBusiness(null)
            showToast(modalBusiness === 'new' ? 'İş yeri oluşturuldu.' : 'İş yeri güncellendi.', 'success')
            load()
          }}
        />
      )}
    </div>
  )
}

function BusinessFormModal({
  business,
  onClose,
  onSaved,
}: {
  business: Business | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(business?.name ?? '')
  const [description, setDescription] = useState(business?.description ?? '')
  const [phone, setPhone] = useState(business?.phone ?? '')
  const [email, setEmail] = useState(business?.email ?? '')
  const [isActive, setIsActive] = useState(business?.is_active ?? true)

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
      description: description || null,
      phone: phone || null,
      email: email || null,
      is_active: isActive,
    }

    try {
      if (business) {
        await updateBusiness(business.id, payload)
      } else {
        await createBusiness(payload)
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
    <Modal title={business ? 'İş Yerini Düzenle' : 'Yeni İş Yeri'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-field">
          <label htmlFor="business-name">Ad</label>
          <input
            id="business-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {fieldErrors.name && <span className="form-field__error">{fieldErrors.name}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="business-description">Açıklama</label>
          <textarea
            id="business-description"
            rows={3}
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="business-phone">Telefon</label>
            <input
              id="business-phone"
              value={phone ?? ''}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="business-email">E-posta</label>
            <input
              id="business-email"
              type="email"
              value={email ?? ''}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && <span className="form-field__error">{fieldErrors.email}</span>}
          </div>
        </div>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          İş yeri aktif
        </label>

        {error && <ErrorAlert message={error} />}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </Modal>
  )
}
