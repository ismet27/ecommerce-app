export function LoadingSpinner({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <div className="loading-spinner" role="status">
      <span className="loading-spinner__circle" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
