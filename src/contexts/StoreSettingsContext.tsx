import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  StoreSettings,
  DEFAULT_STORE_SETTINGS,
  fetchStoreSettings,
  saveStoreSettingsToDb,
  subscribeToStoreSettingsRealtime,
} from "../lib/settings";

interface StoreSettingsContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: StoreSettings) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: DEFAULT_STORE_SETTINGS,
  updateSettings: async () => ({ success: true }),
  loading: false,
});

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial database fetch
    fetchStoreSettings().then((loaded) => {
      if (isMounted && loaded) {
        setSettings(loaded);
        setLoading(false);
      }
    });

    // 2. Real-time multi-device sync
    const unsubscribe = subscribeToStoreSettingsRealtime((updated) => {
      if (isMounted && updated) {
        setSettings(updated);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const updateSettings = async (newSettings: StoreSettings) => {
    setSettings(newSettings);
    return await saveStoreSettingsToDb(newSettings);
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
