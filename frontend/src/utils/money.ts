const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
})

/**
 * Formats a backend decimal-string price (e.g. "199.90") for display.
 * The backend value is trusted as-is — this never recomputes a total.
 */
export function formatMoney(value: string | number): string {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value
  if (Number.isNaN(amount)) {
    return currencyFormatter.format(0)
  }
  return currencyFormatter.format(amount)
}

/** Display-only estimate for the cart (backend recalculates on order creation). */
export function estimateLineTotal(unitPrice: string, quantity: number): number {
  return Number.parseFloat(unitPrice) * quantity
}
