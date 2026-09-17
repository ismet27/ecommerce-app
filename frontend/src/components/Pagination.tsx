import type { PaginationMeta } from '../api/types'

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}) {
  if (meta.last_page <= 1) return null

  return (
    <nav className="pagination" aria-label="Sayfalama">
      <button
        type="button"
        className="btn btn--ghost"
        disabled={meta.current_page <= 1}
        onClick={() => onPageChange(meta.current_page - 1)}
      >
        Önceki
      </button>
      <span className="pagination__info">
        Sayfa {meta.current_page} / {meta.last_page}
        {' · '}
        {meta.total} kayıt
      </span>
      <button
        type="button"
        className="btn btn--ghost"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPageChange(meta.current_page + 1)}
      >
        Sonraki
      </button>
    </nav>
  )
}
