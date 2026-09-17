import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CatalogProduct } from '../api/types'
import { estimateLineTotal } from '../utils/money'

export interface CartItem {
  productId: number
  name: string
  imageUrl: string | null
  unitPrice: string
  quantity: number
  availableStock: number
}

interface CartContextValue {
  items: CartItem[]
  addItem: (product: CatalogProduct, quantity?: number) => void
  increment: (productId: number) => void
  decrement: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
  /** Display-only estimate. The backend recalculates the real total. */
  subtotal: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = 'ecommerce_cart'

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((product: CatalogProduct, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id)
      const cap = Math.max(product.stock, 0)

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, cap || existing.quantity)
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: nextQuantity } : item,
        )
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          imageUrl: product.primary_image?.url ?? null,
          unitPrice: product.price,
          quantity: Math.min(Math.max(quantity, 1), cap || quantity),
          availableStock: product.stock,
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item
        const bounded = Math.min(Math.max(quantity, 1), Math.max(item.availableStock, 1))
        return { ...item, quantity: bounded }
      }),
    )
  }, [])

  const increment = useCallback(
    (productId: number) => {
      const item = items.find((entry) => entry.productId === productId)
      if (item) setQuantity(productId, item.quantity + 1)
    },
    [items, setQuantity],
  )

  const decrement = useCallback(
    (productId: number) => {
      const item = items.find((entry) => entry.productId === productId)
      if (item) setQuantity(productId, item.quantity - 1)
    },
    [items, setQuantity],
  )

  const remove = useCallback((productId: number) => {
    setItems((current) => current.filter((item) => item.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + estimateLineTotal(item.unitPrice, item.quantity), 0),
    [items],
  )

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  const value = useMemo(
    () => ({ items, addItem, increment, decrement, setQuantity, remove, clear, subtotal, itemCount }),
    [items, addItem, increment, decrement, setQuantity, remove, clear, subtotal, itemCount],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
