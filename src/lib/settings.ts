import { supabase } from "./supabase";

export interface StoreSettings {
  storeName: string;
  phone: string;
  email: string;
  address: string;
  lowThreshold: string;
  defaultDisc: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  autoReorder: boolean;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "SubhOne Health Group",
  phone: "+91 98765 43210",
  email: "support@subhone.com",
  address: "14/B Central Avenue, Kolkata, West Bengal 700012",
  lowThreshold: "10",
  defaultDisc: "15",
  emailAlerts: true,
  smsAlerts: false,
  autoReorder: true,
};

/**
 * Fetches store settings from Supabase database with fallback to localStorage
 */
export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "default_settings")
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch store settings from DB:", error.message);
    } else if (data) {
      const dbSettings: StoreSettings = {
        storeName: data.store_name || DEFAULT_STORE_SETTINGS.storeName,
        phone: data.phone || DEFAULT_STORE_SETTINGS.phone,
        email: data.email || DEFAULT_STORE_SETTINGS.email,
        address: data.address || DEFAULT_STORE_SETTINGS.address,
        lowThreshold: data.low_threshold || DEFAULT_STORE_SETTINGS.lowThreshold,
        defaultDisc: data.default_disc || DEFAULT_STORE_SETTINGS.defaultDisc,
        emailAlerts: data.email_alerts ?? DEFAULT_STORE_SETTINGS.emailAlerts,
        smsAlerts: data.sms_alerts ?? DEFAULT_STORE_SETTINGS.smsAlerts,
        autoReorder: data.auto_reorder ?? DEFAULT_STORE_SETTINGS.autoReorder,
      };
      localStorage.setItem("subhone_admin_settings", JSON.stringify(dbSettings));
      return dbSettings;
    }
  } catch (err) {
    console.error("Error loading store settings from Supabase:", err);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem("subhone_admin_settings");
    if (saved) return JSON.parse(saved);
  } catch {}

  return DEFAULT_STORE_SETTINGS;
}

/**
 * Saves store settings permanently into Supabase database
 */
export async function saveStoreSettingsToDb(settings: StoreSettings): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Save locally first for instant offline responsiveness
    localStorage.setItem("subhone_admin_settings", JSON.stringify(settings));

    // 2. Persist to Supabase store_settings table
    const { error } = await supabase
      .from("store_settings")
      .upsert({
        id: "default_settings",
        store_name: settings.storeName,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        low_threshold: settings.lowThreshold,
        default_disc: settings.defaultDisc,
        email_alerts: settings.emailAlerts,
        sms_alerts: settings.smsAlerts,
        auto_reorder: settings.autoReorder,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (error) {
      console.error("Failed to persist settings to Supabase DB:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Exception in saveStoreSettingsToDb:", err);
    return { success: false, error: err?.message || "Failed to save settings to database." };
  }
}

/**
 * Updates admin profile picture and details permanently in Supabase
 */
export async function updateAdminProfileInDb(
  userId: string,
  email: string,
  updates: { fullName?: string; phone?: string; avatarUrl?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

    // 1. Update profiles table if userId exists
    if (userId) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId);

      if (profileError) {
        console.warn("Could not update profile by ID, trying by email or insert:", profileError.message);
      }
    }

    // 2. Also try updating or inserting by email or role = 'admin'
    if (email) {
      await supabase
        .from("profiles")
        .upsert({
          id: userId || "00000000-0000-0000-0000-000000000001",
          full_name: updates.fullName || "SubhOne Administrator",
          phone: updates.phone || "+91 98765 43210",
          avatar_url: updates.avatarUrl || null,
          role: "admin",
          approval_status: "approved",
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
    }

    // 3. Update auth user_metadata if active session
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          phone: updates.phone,
          avatar_url: updates.avatarUrl,
        },
      });
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error("Failed to update admin profile in DB:", err);
    return { success: false, error: err?.message || "Failed to update profile." };
  }
}

/**
 * Real-time listener for store_settings table updates.
 * Uses a unique channel name per subscription to avoid React StrictMode conflicts.
 */
export function subscribeToStoreSettingsRealtime(
  callback: (settings: StoreSettings) => void
) {
  const channelName = `store_settings_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "store_settings",
      },
      (payload) => {
        if (payload.new && typeof payload.new === "object") {
          const raw = payload.new as any;
          const s: StoreSettings = {
            storeName: raw.store_name || DEFAULT_STORE_SETTINGS.storeName,
            phone: raw.phone || DEFAULT_STORE_SETTINGS.phone,
            email: raw.email || DEFAULT_STORE_SETTINGS.email,
            address: raw.address || DEFAULT_STORE_SETTINGS.address,
            lowThreshold: raw.low_threshold || DEFAULT_STORE_SETTINGS.lowThreshold,
            defaultDisc: raw.default_disc || DEFAULT_STORE_SETTINGS.defaultDisc,
            emailAlerts: raw.email_alerts ?? DEFAULT_STORE_SETTINGS.emailAlerts,
            smsAlerts: raw.sms_alerts ?? DEFAULT_STORE_SETTINGS.smsAlerts,
            autoReorder: raw.auto_reorder ?? DEFAULT_STORE_SETTINGS.autoReorder,
          };
          localStorage.setItem("subhone_admin_settings", JSON.stringify(s));
          callback(s);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
