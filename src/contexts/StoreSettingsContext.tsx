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

    // Safety: never hang — resolve loading in max 2 seconds regardless
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    // 1. Initial database fetch (with catch so it never throws)
    fetchStoreSettings()
      .then((loaded) => {
        if (isMounted && loaded) {
          setSettings(loaded);
        }
      })
      .catch((err) => {
        console.warn("StoreSettings fetch failed, using defaults:", err);
      })
      .finally(() => {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      });

    // 2. Real-time multi-device sync (wrapped in try-catch)
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToStoreSettingsRealtime((updated) => {
        if (isMounted && updated) {
          setSettings(updated);
        }
      });
    } catch (err) {
      console.warn("Realtime subscription failed:", err);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe?.();
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
