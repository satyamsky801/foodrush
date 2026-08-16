import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/constants';

const SettingsContext = createContext(null);

export const useSettings = () => useContext(SettingsContext);

const DEFAULT_SETTINGS = {
  vegMode: false, // hide non-veg restaurants & dishes when on
  theme: null, // 'light' | 'dark' | null (null = follow system preference)
  notifications: { email: true, sms: false, push: true },
  showOrderStats: true,
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function SettingsProvider({ children }) {
  // Store the raw value and merge with defaults on read, so stale or partial
  // localStorage (e.g. from an older version of the app) can never crash a page.
  const [stored, setSettings] = useLocalStorage(STORAGE_KEYS.settings, {});
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...(stored || {}) }), [stored]);

  const updateSetting = useCallback(
    (key, value) => {
      setSettings((prev) => ({ ...(prev || {}), [key]: value }));
    },
    [setSettings]
  );

  const toggleNotification = useCallback(
    (key) => {
      setSettings((prev) => ({
        ...(prev || {}),
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(prev?.notifications || {}),
          [key]: !(prev?.notifications?.[key] ?? DEFAULT_SETTINGS.notifications[key]),
        },
      }));
    },
    [setSettings]
  );

  /** The theme actually in effect ('light' | 'dark'). */
  const effectiveTheme = useMemo(() => {
    if (settings.theme === 'light' || settings.theme === 'dark') return settings.theme;
    return systemPrefersDark() ? 'dark' : 'light';
  }, [settings.theme]);

  const toggleTheme = useCallback(() => {
    updateSetting('theme', effectiveTheme === 'dark' ? 'light' : 'dark');
  }, [effectiveTheme, updateSetting]);

  // Apply the theme class to <html> and keep the meta theme-color in sync.
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const dark = settings.theme ? settings.theme === 'dark' : media.matches;
      root.classList.toggle('dark', dark);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#09090b' : '#ff5a1f');
    };

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.theme]);

  const value = useMemo(
    () => ({
      settings,
      effectiveTheme,
      toggleTheme,
      updateSetting,
      toggleNotification,
    }),
    [settings, effectiveTheme, toggleTheme, updateSetting, toggleNotification]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
