import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/constants';
import { authApi } from '../api/authApi';
import { setToken, getToken } from '../api/apiClient';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Demo "Continue with Google" account. There is no real OAuth provider wired
// up, so the button registers/logs into this account via the API on first use.
const GOOGLE_DEMO_EMAIL = 'aarav.mehta@gmail.com';
const GOOGLE_DEMO_PHONE = '9876543210';
const GOOGLE_DEMO_PASSWORD = 'google123';

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage(STORAGE_KEYS.user, null);
  const [initializing, setInitializing] = useState(true);
  const toast = useToast();

  // Restore the session after a refresh: validate the stored JWT via /auth/me.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) {
        if (!cancelled) setInitializing(false);
        return;
      }
      try {
        const { user: me } = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        // Token invalid/expired — the api client already cleared it.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  // Any API 401 (expired token mid-session) logs the user out app-wide.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('foodrush:unauthorized', onUnauthorized);
    return () => window.removeEventListener('foodrush:unauthorized', onUnauthorized);
  }, [setUser]);

  const login = useCallback(
    async (identifier, password) => {
      try {
        const { token, user: loggedIn } = await authApi.login(identifier, password);
        setToken(token);
        setUser(loggedIn);
        toast(`Welcome back, ${loggedIn.name.split(' ')[0]}! 👋`);
        return { ok: true };
      } catch (e) {
        return { error: e.message };
      }
    },
    [setUser, toast]
  );

  const signup = useCallback(
    async ({ name, email, phone, password }) => {
      try {
        const { token, user: created } = await authApi.register({
          name,
          email,
          phone,
          password,
        });
        setToken(token);
        setUser(created);
        toast(`Account created. Welcome to FoodRush, ${created.name.split(' ')[0]}! 🎉`);
        return { ok: true };
      } catch (e) {
        return { error: e.message };
      }
    },
    [setUser, toast]
  );

  /** Demo Google sign-in — provisions the demo account on first use. */
  const googleLogin = useCallback(async () => {
    try {
      const res = await authApi.login(GOOGLE_DEMO_EMAIL, GOOGLE_DEMO_PASSWORD);
      setToken(res.token);
      setUser(res.user);
      toast(`Signed in with Google — ${res.user.name}`);
      return { ok: true };
    } catch {
      // Account doesn't exist yet — create it, then sign in.
      try {
        const res = await authApi.register({
          name: 'Aarav Mehta',
          email: GOOGLE_DEMO_EMAIL,
          phone: GOOGLE_DEMO_PHONE,
          password: GOOGLE_DEMO_PASSWORD,
        });
        setToken(res.token);
        setUser(res.user);
        toast(`Signed in with Google — ${res.user.name}`);
        return { ok: true };
      } catch (e) {
        return { error: e.message };
      }
    }
  }, [setUser, toast]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    toast('You have been logged out.', 'info');
  }, [setUser, toast]);

  const updateProfile = useCallback(
    async ({ name, phone }) => {
      try {
        const { user: updated } = await authApi.updateProfile({ name, phone });
        setUser(updated);
        toast('Profile updated');
        return { ok: true };
      } catch (e) {
        toast(e.message, 'error');
        return { error: e.message };
      }
    },
    [setUser, toast]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      initializing,
      login,
      signup,
      googleLogin,
      logout,
      updateProfile,
    }),
    [user, initializing, login, signup, googleLogin, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
