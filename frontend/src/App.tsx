import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { RoleRoute } from './routes/RoleRoute'
import { LoginPage } from './pages/LoginPage'
import { CustomerLayout } from './layouts/CustomerLayout'
import { CatalogPage } from './pages/customer/CatalogPage'
import { ProductDetailPage } from './pages/customer/ProductDetailPage'
import { CartPage } from './pages/customer/CartPage'
import { OrdersPage } from './pages/customer/OrdersPage'
import { OrderDetailPage } from './pages/customer/OrderDetailPage'
import { SellerLayout } from './layouts/SellerLayout'
import { SellerDashboard } from './pages/seller/SellerDashboard'
import { SellerProductsPage } from './pages/seller/SellerProductsPage'
import { SellerProductFormPage } from './pages/seller/SellerProductFormPage'
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminBusinessesPage } from './pages/admin/AdminBusinessesPage'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/giris" element={<LoginPage />} />

              <Route element={<CustomerLayout />}>
                <Route path="/" element={<CatalogPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />

                <Route element={<RoleRoute allow={['customer']} />}>
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                </Route>
              </Route>

              <Route element={<RoleRoute allow={['seller']} />}>
                <Route element={<SellerLayout />}>
                  <Route path="/seller" element={<SellerDashboard />} />
                  <Route path="/seller/products" element={<SellerProductsPage />} />
                  <Route path="/seller/products/yeni" element={<SellerProductFormPage />} />
                  <Route path="/seller/products/:id" element={<SellerProductFormPage />} />
                  <Route path="/seller/orders" element={<SellerOrdersPage />} />
                </Route>
              </Route>

              <Route element={<RoleRoute allow={['admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
                  <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="/admin/products" element={<AdminProductsPage />} />
                  <Route path="/admin/orders" element={<AdminOrdersPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
