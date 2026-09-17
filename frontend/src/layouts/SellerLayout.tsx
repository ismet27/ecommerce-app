import { LayoutDashboard, Package, ShoppingBag } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import type { NavItem } from '../components/Sidebar'

const navItems: NavItem[] = [
  { to: '/seller', label: 'Ana Sayfa', icon: <LayoutDashboard size={18} aria-hidden="true" />, end: true },
  { to: '/seller/products', label: 'Ürünler', icon: <Package size={18} aria-hidden="true" /> },
  { to: '/seller/orders', label: 'Siparişler', icon: <ShoppingBag size={18} aria-hidden="true" /> },
]

export function SellerLayout() {
  return <AppShell panelLabel="Satıcı Paneli" roleBadge="İş Yeri / Satıcı" navItems={navItems} />
}
