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
        ${payload.auto_reorder},
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
 * Fetches admin profile permanently from Neon database with fallback to localStorage
 */
export async function fetchAdminProfileFromDb(
  email?: string,
  userId?: string
): Promise<{ fullName: string; phone: string; avatarUrl: string } | null> {
  const cleanEmail = (email || "").trim().toLowerCase();
  try {
    let rows: any[] = [];
    if (cleanEmail) {
      rows = await sql`
        SELECT full_name, phone, avatar_url, role 
        FROM profiles 
        WHERE LOWER(email) = ${cleanEmail} 
        LIMIT 1
      `;
    }
    if ((!rows || rows.length === 0) && userId && !userId.includes("00000000")) {
      rows = await sql`
        SELECT full_name, phone, avatar_url, role 
        FROM profiles 
        WHERE id = ${userId} 
        LIMIT 1
      `;
    }
    if (!rows || rows.length === 0) {
      rows = await sql`
        SELECT full_name, phone, avatar_url, role 
        FROM profiles 
        WHERE role = 'admin' 
        ORDER BY updated_at DESC NULLS LAST 
        LIMIT 1
      `;
    }

    if (rows && rows.length > 0) {
      const p = rows[0];
      const result = {
        fullName: p.full_name || "Store Administrator",
        phone: p.phone || "+91 98765 43210",
        avatarUrl: p.avatar_url || "",
      };
      try {
        localStorage.setItem("subhone_admin_profile", JSON.stringify(result));
      } catch {}
      return result;
    }
  } catch (err) {
    console.warn("Notice loading admin profile from Neon DB:", err);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem("subhone_admin_profile");
    if (saved) return JSON.parse(saved);
  } catch {}

  return null;
}

/**
 * Updates admin profile picture and details permanently in Neon database
 */
export async function updateAdminProfileInDb(
  userId: string,
  email: string,
  updates: { fullName?: string; phone?: string; avatarUrl?: string }
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    const cleanEmail = (email || "subhonehealthgroup@gmail.com").trim().toLowerCase();
    let finalAvatarUrl = updates.avatarUrl;

    if (finalAvatarUrl && finalAvatarUrl.startsWith("data:")) {
      try {
        const { uploadImageToSupabase } = await import("./storage");
        const { url: uploadedUrl } = await uploadImageToSupabase(finalAvatarUrl, "avatars");
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
        }
      } catch (uploadErr) {
        console.warn("Avatar cloud upload warning, storing image directly:", uploadErr);
      }
    }

    const targetUserId = userId && !userId.includes("00000000") ? userId : null;
    const fullName = updates.fullName?.trim() || "Store Administrator";
    const phone = updates.phone?.trim() || "+91 98765 43210";
    const now = new Date().toISOString();

    // 1. Update profiles table
    let updatedRows: any[] = [];
    if (targetUserId) {
      updatedRows = await sql`
        UPDATE profiles
        SET 
          full_name = ${fullName},
          phone = ${phone},
          avatar_url = ${finalAvatarUrl ?? null},
          updated_at = ${now}
        WHERE id = ${targetUserId} OR LOWER(email) = ${cleanEmail}
        RETURNING id, email, full_name, phone, avatar_url
      `;
    } else {
      updatedRows = await sql`
        UPDATE profiles
        SET 
          full_name = ${fullName},
          phone = ${phone},
          avatar_url = ${finalAvatarUrl ?? null},
          updated_at = ${now}
        WHERE LOWER(email) = ${cleanEmail} OR role = 'admin'
        RETURNING id, email, full_name, phone, avatar_url
      `;
    }

    // If no row existed, insert a new record into profiles
    if (!updatedRows || updatedRows.length === 0) {
      const newId = targetUserId || `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
      await sql`
        INSERT INTO profiles (id, email, full_name, role, phone, avatar_url, approval_status, created_at, updated_at)
        VALUES (${newId}, ${cleanEmail}, ${fullName}, 'admin', ${phone}, ${finalAvatarUrl ?? null}, 'approved', ${now}, ${now})
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = EXCLUDED.updated_at
      `;
    }

    // 2. Also update public.users table if it exists
    try {
      await sql`
        UPDATE public.users 
        SET name = ${fullName}, updated_at = ${now}
        WHERE LOWER(email) = ${cleanEmail} OR role = 'admin'
      `;
    } catch {}

    // 3. Also update auth_users table if it exists
    try {
      await sql`
        UPDATE auth_users
        SET full_name = ${fullName}, phone = ${phone}, updated_at = ${now}
        WHERE LOWER(email) = ${cleanEmail} OR role = 'admin'
      `;
    } catch {}

    // 4. Update store_settings phone if phone is updated
    try {
      await sql`
        UPDATE store_settings
        SET phone = ${phone}, updated_at = ${now}
        WHERE id = 'default_settings'
      `;
    } catch {}

    // 5. Update auth user_metadata if active session exists
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
          avatar_url: finalAvatarUrl,
        },
      });
    } catch {}

    // 6. Cache locally for instant availability
    try {
      localStorage.setItem(
        "subhone_admin_profile",
        JSON.stringify({
          fullName,
          phone,
          avatarUrl: finalAvatarUrl || "",
        })
      );
    } catch {}

    return { success: true, avatarUrl: finalAvatarUrl };
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
