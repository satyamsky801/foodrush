import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/constants';
import { uid } from '../utils/format';
import { useToast } from './ToastContext';

const AddressContext = createContext(null);

export const useAddresses = () => useContext(AddressContext);

export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useLocalStorage(STORAGE_KEYS.addresses, []);
  const toast = useToast();

  const addAddress = useCallback(
    (data) => {
      const isFirst = addresses.length === 0;
      const address = {
        id: uid('addr_'),
        ...data,
        isDefault: Boolean(data.isDefault) || isFirst,
      };
      setAddresses((prev) => {
        const rest = address.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
        return [...rest, address];
      });
      toast('Address saved 📍');
      return address;
    },
    [addresses.length, setAddresses, toast]
  );

  const updateAddress = useCallback(
    (id, data) => {
      setAddresses((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const next = { ...a, ...data };
          if (next.isDefault) return next;
          return next;
        })
      );
      toast('Address updated');
    },
    [setAddresses, toast]
  );

  const deleteAddress = useCallback(
    (id) => {
      setAddresses((prev) => {
        const remaining = prev.filter((a) => a.id !== id);
        // If we deleted the default, promote the first remaining address.
        if (remaining.length && !remaining.some((a) => a.isDefault)) {
          remaining[0].isDefault = true;
        }
        return remaining;
      });
      toast('Address removed', 'info');
    },
    [setAddresses, toast]
  );

  const setDefault = useCallback(
    (id) => {
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      toast('Default address updated');
    },
    [setAddresses, toast]
  );

  const defaultAddress = useMemo(() => addresses.find((a) => a.isDefault) || addresses[0] || null, [addresses]);

  const value = useMemo(
    () => ({
      addresses,
      defaultAddress,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefault,
    }),
    [addresses, defaultAddress, addAddress, updateAddress, deleteAddress, setDefault]
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}
