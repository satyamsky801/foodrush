import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileNavbar from './components/MobileNavbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RestaurantListingPage from './pages/RestaurantListingPage';
import RestaurantDetailsPage from './pages/RestaurantDetailsPage';
import FoodDetailsPage from './pages/FoodDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRestaurantsPage from './pages/admin/AdminRestaurantsPage';
import AdminFoodsPage from './pages/admin/AdminFoodsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import RestaurantLayout from './pages/restaurant/RestaurantLayout';
import RestaurantDashboardPage from './pages/restaurant/RestaurantDashboardPage';
import RestaurantOrdersPage from './pages/restaurant/RestaurantOrdersPage';
import RestaurantFoodsPage from './pages/restaurant/RestaurantFoodsPage';
import RestaurantProfilePage from './pages/restaurant/RestaurantProfilePage';
import RestaurantReviewsPage from './pages/restaurant/RestaurantReviewsPage';
import RestaurantAnalyticsPage from './pages/restaurant/RestaurantAnalyticsPage';
import { useAuth } from './context/AuthContext';
import { Skeleton } from './components/LoadingSkeleton';

/** Guards a route so only users with one of the given roles can enter. */
function RoleRoute({ roles, children }) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

/** Scrolls to the top on every route change (keeps back/forward sane). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Routes location={location}>
        {/* Admin dashboard — own layout, no customer chrome */}
        {/* Restaurant dashboard — own layout, no customer chrome */}
        <Route
          path="/restaurant"
          element={
            <RoleRoute roles={['restaurant']}>
              <RestaurantLayout />
            </RoleRoute>
          }
        >
          <Route index element={<RestaurantDashboardPage />} />
          <Route path="orders" element={<RestaurantOrdersPage />} />
          <Route path="foods" element={<RestaurantFoodsPage />} />
          <Route path="profile" element={<RestaurantProfilePage />} />
          <Route path="reviews" element={<RestaurantReviewsPage />} />
          <Route path="analytics" element={<RestaurantAnalyticsPage />} />
        </Route>

        {/* Admin dashboard — own layout, no customer chrome */}
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin']}>
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="restaurants" element={<AdminRestaurantsPage />} />
          <Route path="foods" element={<AdminFoodsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
        </Route>

        {/* Customer app */}
        <Route
          path="/*"
          element={
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 pb-20 md:pb-0">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/restaurants" element={<RestaurantListingPage />} />
                  <Route path="/restaurant/:id" element={<RestaurantDetailsPage />} />
                  <Route path="/food/:restaurantId/:foodId" element={<FoodDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order/:id" element={<OrderTrackingPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
              <MobileNavbar />
            </div>
          }
        />
      </Routes>
    </div>
  );
}
