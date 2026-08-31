import { supabase } from "./supabase";
import { sql } from "./neon";

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
    const rows = await sql`SELECT * FROM store_settings WHERE id = 'default_settings' LIMIT 1`;
    const data = rows[0];

    if (data) {
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
    console.error("Error loading store settings from Neon:", err);
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

    // 2. Perform UPSERT via raw SQL
    await sql`
      INSERT INTO store_settings (
        id, store_name, phone, email, address, low_threshold, default_disc, email_alerts, sms_alerts, auto_reorder, updated_at
      ) VALUES (
        'default_settings', 
        ${payload.store_name}, 
        ${payload.phone}, 
        ${payload.email}, 
        ${payload.address}, 
        ${payload.low_threshold}, 
        ${payload.default_disc}, 
        ${payload.email_alerts}, 
        ${payload.sms_alerts}, 
        ${payload.updated_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        address = EXCLUDED.address,
        low_threshold = EXCLUDED.low_threshold,
        default_disc = EXCLUDED.default_disc,
        email_alerts = EXCLUDED.email_alerts,
        sms_alerts = EXCLUDED.sms_alerts,
        auto_reorder = EXCLUDED.auto_reorder,
        updated_at = EXCLUDED.updated_at
    `;

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
      const rows = await sql`SELECT id FROM profiles WHERE role = 'admin' LIMIT 1`;
      if (rows.length > 0) {
        targetUserId = rows[0].id;
      }
    }

    // 2. Update profiles table
    if (targetUserId && !targetUserId.includes("00000000")) {
      if (updates.fullName !== undefined && updates.phone !== undefined && finalAvatarUrl !== undefined) {
        await sql`UPDATE profiles SET full_name = ${payload.full_name}, phone = ${payload.phone}, avatar_url = ${payload.avatar_url}, updated_at = ${payload.updated_at} WHERE id = ${targetUserId}`;
      } else if (updates.fullName !== undefined && updates.phone !== undefined) {
        await sql`UPDATE profiles SET full_name = ${payload.full_name}, phone = ${payload.phone}, updated_at = ${payload.updated_at} WHERE id = ${targetUserId}`;
      } else if (updates.fullName !== undefined) {
        await sql`UPDATE profiles SET full_name = ${payload.full_name}, updated_at = ${payload.updated_at} WHERE id = ${targetUserId}`;
      }
    } else {
      // Update by admin role if exact ID isn't found
      if (updates.fullName !== undefined && updates.phone !== undefined && finalAvatarUrl !== undefined) {
        await sql`UPDATE profiles SET full_name = ${payload.full_name}, phone = ${payload.phone}, avatar_url = ${payload.avatar_url}, updated_at = ${payload.updated_at} WHERE role = 'admin'`;
      } else if (updates.fullName !== undefined && updates.phone !== undefined) {
        await sql`UPDATE profiles SET full_name = ${payload.full_name}, phone = ${payload.phone}, updated_at = ${payload.updated_at} WHERE role = 'admin'`;
      } else if (updates.fullName !== undefined) {
        await sql`UPDATE profiles SET full_name = ${payload.full_name}, updated_at = ${payload.updated_at} WHERE role = 'admin'`;
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
