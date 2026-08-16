import { ToastProvider } from './ToastContext';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { FavoritesProvider } from './FavoritesContext';
import { OrdersProvider } from './OrdersContext';
import { AddressProvider } from './AddressContext';
import { SettingsProvider } from './SettingsContext';

export function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <OrdersProvider>
              <AddressProvider>
                <SettingsProvider>{children}</SettingsProvider>
              </AddressProvider>
            </OrdersProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
