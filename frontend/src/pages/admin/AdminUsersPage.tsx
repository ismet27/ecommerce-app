import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import { createUser, fetchBusinesses, fetchUsers, updateUser } from '../../api/admin'
import type { Business, Paginated, Role, User } from '../../api/types'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { ActiveBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { ROLE_LABELS } from '../../utils/labels'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export function AdminUsersPage() {
  const { showToast } = useToast()
  const [result, setResult] = useState<Paginated<User> | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(1)

  const [modalUser, setModalUser] = useState<User | 'new' | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    fetchUsers({
      search: search || undefined,
      role: role || undefined,
      is_active: status === '' ? undefined : status === 'active',
      page,
      per_page: 15,
    })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBusinesses({ per_page: 100 }).then((r) => setBusinesses(r.data)).catch(() => setBusinesses([]))
  }, [])

  useEffect(load, [search, role, status, page])

  function businessName(businessId: number | null): string {
    if (!businessId) return '—'
    return businesses.find((b) => b.id === businessId)?.name ?? `#${businessId}`
  }

  return (
    <div className="admin-users-page">
      <PageHeader
        title="Kullanıcılar"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setModalUser('new')}>
            <Plus size={16} aria-hidden="true" /> Yeni Kullanıcı
          </button>
        }
      />

      <div className="catalog-filters">
        <div className="form-field form-field--search">
          <label htmlFor="search" className="sr-only">
            Kullanıcı ara
          </label>
          <Search size={18} aria-hidden="true" />
          <input
            id="search"
            type="search"
            placeholder="Ad veya e-posta ara…"
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="role">Rol</label>
          <select
            id="role"
            value={role}
            onChange={(e) => {
              setPage(1)
              setRole(e.target.value as Role | '')
            }}
          >
            <option value="">Tümü</option>
            <option value="admin">Yönetici</option>
            <option value="seller">İş Yeri / Satıcı</option>
            <option value="customer">Müşteri</option>
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
      </div>

      {loading && <LoadingSpinner label="Kullanıcılar yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="Kullanıcı bulunamadı" />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>E-posta</th>
                  <th>Rol</th>
                  <th>İş Yeri</th>
                  <th>Durum</th>
                  <th aria-label="İşlemler" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{ROLE_LABELS[user.role]}</td>
                    <td>{user.role === 'seller' ? businessName(user.business_id) : '—'}</td>
                    <td>
                      <ActiveBadge active={user.is_active} />
                    </td>
                    <td className="data-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => setModalUser(user)}
                      >
                        Düzenle
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

      {modalUser && (
        <UserFormModal
          user={modalUser === 'new' ? null : modalUser}
          businesses={businesses}
          onClose={() => setModalUser(null)}
          onSaved={() => {
            setModalUser(null)
            showToast(modalUser === 'new' ? 'Kullanıcı oluşturuldu.' : 'Kullanıcı güncellendi.', 'success')
            load()
          }}
        />
      )}
    </div>
  )
}

function UserFormModal({
  user,
  businesses,
  onClose,
  onSaved,
}: {
  user: User | null
  businesses: Business[]
  onClose: () => void
  onSaved: () => void
}) {
  const { user: currentAdmin } = useAuth()
  const isEditingSelf = user !== null && currentAdmin !== null && user.id === currentAdmin.id
  const activeBusinesses = businesses.filter((b) => b.is_active)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState<Role>(user?.role ?? 'customer')
  const [businessId, setBusinessId] = useState<number | ''>(user?.business_id ?? '')
  const [isActive, setIsActive] = useState(user?.is_active ?? true)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      if (user) {
        await updateUser(user.id, {
          name,
          email,
          role,
          business_id: role === 'seller' ? businessId || null : null,
          is_active: isActive,
          ...(password ? { password, password_confirmation: passwordConfirmation } : {}),
        })
      } else {
        await createUser({
          name,
          email,
          role,
          business_id: role === 'seller' ? businessId || null : null,
          is_active: isActive,
          password,
          password_confirmation: passwordConfirmation,
        })
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
    <Modal title={user ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-field">
          <label htmlFor="user-name">Ad Soyad</label>
          <input id="user-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-field">
          <label htmlFor="user-email">E-posta</label>
          <input
            id="user-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldErrors.email && <span className="form-field__error">{fieldErrors.email}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="user-role">Rol</label>
          <select
            id="user-role"
            value={role}
            disabled={isEditingSelf}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="admin">Yönetici</option>
            <option value="seller">İş Yeri / Satıcı</option>
            <option value="customer">Müşteri</option>
          </select>
          {isEditingSelf && (
            <span className="form-hint">Kendi rolünüzü değiştiremezsiniz.</span>
          )}
        </div>

        {role === 'seller' && (
          <div className="form-field">
            <label htmlFor="user-business">İş Yeri</label>
            <select
              id="user-business"
              required
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">İş yeri seçin</option>
              {activeBusinesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            {fieldErrors.business_id && (
              <span className="form-field__error">{fieldErrors.business_id}</span>
            )}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="user-password">
            {user ? 'Yeni Şifre (opsiyonel)' : 'Şifre'}
          </label>
          <input
            id="user-password"
            type="password"
            required={!user}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {(password || !user) && (
          <div className="form-field">
            <label htmlFor="user-password-confirmation">Şifre (Tekrar)</label>
            <input
              id="user-password-confirmation"
              type="password"
              required={!user || !!password}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </div>
        )}

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={isActive}
            disabled={isEditingSelf}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Hesap aktif
        </label>
        {isEditingSelf && (
          <span className="form-hint">Kendi hesabınızı pasif hale getiremezsiniz.</span>
        )}

        {error && <ErrorAlert message={error} />}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </Modal>
  )
}
