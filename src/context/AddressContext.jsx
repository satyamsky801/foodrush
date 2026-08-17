import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addressApi } from '../api/addressApi';
import { mapAddress } from '../api/normalizers';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const AddressContext = createContext(null);

export const useAddresses = () => useContext(AddressContext);

/**
 * Addresses are owned by the backend (per user) — the server is the source of
 * truth. The context caches them and refetches after every mutation so the
 * list is always consistent with MongoDB.
 */
export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setAddresses([]);
      return;
    }
    try {
      const { addresses: list } = await addressApi.list();
      setAddresses(list.map(mapAddress));
    } catch {
      // Silent on load — pages render their own empty/error states.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addAddress = useCallback(
    async (data) => {
      try {
        const { address } = await addressApi.create(data);
        setAddresses((prev) => {
          const rest = address.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
          return [...rest, mapAddress(address)];
        });
        toast('Address saved 📍');
        return { ok: true, address: mapAddress(address) };
      } catch (e) {
        toast(e.message, 'error');
        return { error: e.message };
      }
    },
    [toast]
  );

  const updateAddress = useCallback(
    async (id, data) => {
      try {
        const { address } = await addressApi.update(id, data);
        setAddresses((prev) =>
          prev.map((a) => {
            const next = mapAddress(address);
            if (address.isDefault) return { ...a, ...next, isDefault: true };
            return a.id === id ? { ...a, ...next } : a;
          })
        );
        toast('Address updated');
        return { ok: true };
      } catch (e) {
        toast(e.message, 'error');
        return { error: e.message };
      }
    },
    [toast]
  );

  const deleteAddress = useCallback(
    async (id) => {
      try {
        await addressApi.remove(id);
        setAddresses((prev) => {
          const remaining = prev.filter((a) => a.id !== id);
          // Promote the first remaining address when the default was deleted.
          if (remaining.length && !remaining.some((a) => a.isDefault)) {
            remaining[0].isDefault = true;
          }
          return remaining;
        });
        toast('Address removed', 'info');
        return { ok: true };
      } catch (e) {
        toast(e.message, 'error');
        return { error: e.message };
      }
    },
    [toast]
  );

  const setDefault = useCallback(
    async (id) => {
      const target = addresses.find((a) => a.id === id);
      if (!target) return { error: 'Address not found.' };
      const res = await updateAddress(id, { ...target, isDefault: true });
      if (res.ok) toast('Default address updated');
      return res;
    },
    [addresses, updateAddress, toast]
  );

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) || addresses[0] || null,
    [addresses]
  );

  const value = useMemo(
    () => ({
      addresses,
      defaultAddress,
      loading,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefault,
      refresh,
    }),
    [addresses, defaultAddress, loading, addAddress, updateAddress, deleteAddress, setDefault, refresh]
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}
