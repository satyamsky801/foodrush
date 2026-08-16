import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/constants';
import { uid } from '../utils/format';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Demo-only "Google" profile used by the simulated Google login.
const GOOGLE_DEMO_USER = { name: 'Aarav Mehta', email: 'aarav.mehta@gmail.com', phone: '9876543210' };

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage(STORAGE_KEYS.user, null);
  const [users, setUsers] = useLocalStorage(STORAGE_KEYS.users, []);
  const toast = useToast();

  const persistUser = useCallback(
    (u) => {
      setUsers((prev) => {
        const exists = prev.some((x) => x.id === u.id);
        return exists ? prev.map((x) => (x.id === u.id ? u : x)) : [...prev, u];
      });
      setUser({ id: u.id, name: u.name, email: u.email, phone: u.phone, provider: u.provider });
    },
    [setUser, setUsers]
  );

  const login = useCallback(
    (identifier, password) => {
      const id = String(identifier || '').trim().toLowerCase();
      const match = users.find(
        (u) => u.email.toLowerCase() === id || u.phone === id
      );
      if (!match) return { error: 'No account found with this email/phone.' };
      if (match.password !== password) return { error: 'Incorrect password. Please try again.' };
      persistUser({ ...match, password: undefined });
      toast(`Welcome back, ${match.name.split(' ')[0]}! 👋`);
      return { ok: true };
    },
    [users, persistUser, toast]
  );

  const signup = useCallback(
    ({ name, email, phone, password }) => {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { error: 'An account with this email already exists. Try logging in.' };
      }
      if (users.some((u) => u.phone === phone)) {
        return { error: 'An account with this phone number already exists.' };
      }
      const newUser = { id: uid('u_'), name: name.trim(), email: cleanEmail, phone, password, provider: 'email' };
      persistUser(newUser);
      toast(`Account created. Welcome to FoodRush, ${name.split(' ')[0]}! 🎉`);
      return { ok: true };
    },
    [users, persistUser, toast]
  );

  const googleLogin = useCallback(() => {
    const existing = users.find((u) => u.email === GOOGLE_DEMO_USER.email);
    persistUser(existing || { id: uid('u_'), ...GOOGLE_DEMO_USER, provider: 'google' });
    toast(`Signed in with Google — ${GOOGLE_DEMO_USER.name}`);
    return { ok: true };
  }, [users, persistUser, toast]);

  const logout = useCallback(() => {
    setUser(null);
    toast('You have been logged out.', 'info');
  }, [setUser, toast]);

  const updateProfile = useCallback(
    ({ name, phone }) => {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, name, phone };
        setUsers((all) => all.map((u) => (u.id === updated.id ? { ...u, name, phone } : u)));
        return updated;
      });
      toast('Profile updated');
    },
    [setUser, setUsers, toast]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      signup,
      googleLogin,
      logout,
      updateProfile,
    }),
    [user, login, signup, googleLogin, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
