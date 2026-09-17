import { ImageOff } from 'lucide-react'

export function ProductImage({
  src,
  alt,
  className = '',
}: {
  src: string | null | undefined
  alt: string
  className?: string
}) {
  if (!src) {
    return (
      <div className={`product-image product-image--placeholder ${className}`}>
        <ImageOff size={28} aria-hidden="true" />
      </div>
    )
  }

  return <img src={src} alt={alt} className={`product-image ${className}`} loading="lazy" />
}
