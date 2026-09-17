import { Layers, LayoutDashboard, Package, ShoppingBag, Store, Users } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import type { NavItem } from '../components/Sidebar'

const navItems: NavItem[] = [
  { to: '/admin', label: 'Ana Sayfa', icon: <LayoutDashboard size={18} aria-hidden="true" />, end: true },
  { to: '/admin/users', label: 'Kullanıcılar', icon: <Users size={18} aria-hidden="true" /> },
  { to: '/admin/businesses', label: 'İş Yerleri', icon: <Store size={18} aria-hidden="true" /> },
  { to: '/admin/categories', label: 'Kategoriler', icon: <Layers size={18} aria-hidden="true" /> },
  { to: '/admin/products', label: 'Ürünler', icon: <Package size={18} aria-hidden="true" /> },
  { to: '/admin/orders', label: 'Siparişler', icon: <ShoppingBag size={18} aria-hidden="true" /> },
]

export function AdminLayout() {
  return <AppShell panelLabel="Yönetim Paneli" roleBadge="Yönetici" navItems={navItems} />
}
