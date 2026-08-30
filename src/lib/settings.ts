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

    const payload = {
      id: "default_settings",
      store_name: settings.storeName || DEFAULT_STORE_SETTINGS.storeName,
      phone: settings.phone || DEFAULT_STORE_SETTINGS.phone,
      email: settings.email || DEFAULT_STORE_SETTINGS.email,
      address: settings.address || DEFAULT_STORE_SETTINGS.address,
      low_threshold: String(settings.lowThreshold || DEFAULT_STORE_SETTINGS.lowThreshold),
      default_disc: String(settings.defaultDisc || DEFAULT_STORE_SETTINGS.defaultDisc),
      email_alerts: Boolean(settings.emailAlerts),
      sms_alerts: Boolean(settings.smsAlerts),
      auto_reorder: Boolean(settings.autoReorder),
      updated_at: new Date().toISOString(),
    };

    // 2. Try upsert first
    const { error: upsertError } = await supabase
      .from("store_settings")
      .upsert(payload, { onConflict: "id" });

    if (upsertError) {
      console.warn("Notice during upsert store_settings, trying update:", upsertError.message);
      // Fallback: try update directly
      const { error: updateError } = await supabase
        .from("store_settings")
        .update(payload)
        .eq("id", "default_settings");

      if (updateError) {
        console.error("Failed to update store_settings in Supabase:", updateError);
        return { success: false, error: updateError.message };
      }
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
    let finalAvatarUrl = updates.avatarUrl;
    if (finalAvatarUrl && finalAvatarUrl.startsWith("data:")) {
      const { uploadImageToSupabase } = await import("./storage");
      const { url: uploadedUrl } = await uploadImageToSupabase(finalAvatarUrl, "avatars");
      if (uploadedUrl) {
        finalAvatarUrl = uploadedUrl;
      }
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (finalAvatarUrl !== undefined) payload.avatar_url = finalAvatarUrl;

    // 1. Resolve actual Admin user ID if userId is missing or placeholder
    let targetUserId = userId;
    if (!targetUserId || targetUserId.includes("00000000")) {
      const { data: adminRow } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      if (adminRow?.id) {
        targetUserId = adminRow.id;
      }
    }

    // 2. Update profiles table
    if (targetUserId && !targetUserId.includes("00000000")) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", targetUserId);

      if (profileError) {
        console.warn("Could not update profile by ID:", profileError.message);
      }
    } else {
      // Upsert by admin role
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .maybeSingle();

      if (adminProfile?.id) {
        await supabase
          .from("profiles")
          .update(payload)
          .eq("id", adminProfile.id);
      }
    }

    // 3. Update auth user_metadata if active session
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          phone: updates.phone,
          avatar_url: finalAvatarUrl,
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
 * Realtime subscriptions are not offered by the Neon Data API — kept as a
 * no-op (the old Supabase-shim "realtime" never actually fired either); use
 * `fetchStoreSettingsFromDb()` to get fresh data.
 */
export function subscribeToStoreSettingsRealtime(
  _callback: (settings: StoreSettings) => void
) {
  return () => {};
}
