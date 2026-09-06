import { sql } from "./neon";
import { supabase } from "./supabase";

export interface DbAddress {
  id: string;
  user_id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type AddressInput = Omit<DbAddress, "id" | "user_id" | "created_at" | "updated_at">;

/**
 * Get effective user ID across active session, Supabase auth, or persistent local storage
 */
export async function getEffectiveUserId(explicitUserId?: string): Promise<string> {
  if (explicitUserId && explicitUserId.trim()) return explicitUserId.trim();

  try {
    const userSession = localStorage.getItem("subhone_active_user_session");
    if (userSession) {
      const parsed = JSON.parse(userSession);
      if (parsed?.id) return parsed.id;
    }
  } catch {}

  try {
    const adminSession = sessionStorage.getItem("subhone_active_admin_session");
    if (adminSession) {
      const parsed = JSON.parse(adminSession);
      if (parsed?.id) return parsed.id;
    }
  } catch {}

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {}

  const stored = localStorage.getItem("subhone_user_id");
  if (stored) return stored;

  const fallback = `user_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem("subhone_user_id", fallback);
  return fallback;
}

/**
 * Fetch all addresses for the user permanently from Neon Database
 */
export async function fetchUserAddresses(explicitUserId?: string): Promise<DbAddress[]> {
  const uid = await getEffectiveUserId(explicitUserId);
  try {
    const rows = await sql`
      SELECT 
        id, user_id, label, name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at
      FROM public.addresses
      WHERE user_id = ${uid}
      ORDER BY is_default DESC, created_at ASC
    `;

    const addresses: DbAddress[] = rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      label: r.label || "Home",
      name: r.name || "",
      phone: r.phone || "",
      line1: r.line1 || "",
      line2: r.line2 || null,
      city: r.city || "",
      state: r.state || "",
      pincode: r.pincode || "",
      is_default: Boolean(r.is_default),
      created_at: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
      updated_at: typeof r.updated_at === "string" ? r.updated_at : new Date(r.updated_at).toISOString(),
    }));

    try {
      localStorage.setItem(`subhone_cached_addresses_${uid}`, JSON.stringify(addresses));
    } catch {}

    return addresses;
  } catch (err: any) {
    console.warn("Notice fetching addresses from Neon DB:", err?.message);
    try {
      const cached = localStorage.getItem(`subhone_cached_addresses_${uid}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  }
}

/**
 * Create an address for the user permanently in Neon Database
 */
export async function createAddress(
  input: AddressInput,
  explicitUserId?: string
): Promise<{ data: DbAddress | null; error: string | null }> {
  const uid = await getEffectiveUserId(explicitUserId);
  const newId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  try {
    // If this address is set as default, reset all other addresses for this user
    if (input.is_default) {
      try {
        await sql`
          UPDATE public.addresses
          SET is_default = false, updated_at = ${now}
          WHERE user_id = ${uid}
        `;
      } catch (err) {
        console.warn("Notice resetting default addresses:", err);
      }
    }

    const rows = await sql`
      INSERT INTO public.addresses (
        id, user_id, label, name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at
      ) VALUES (
        ${newId},
        ${uid},
        ${input.label || "Home"},
        ${input.name.trim()},
        ${input.phone?.trim() || ""},
        ${input.line1.trim()},
        ${input.line2 ? input.line2.trim() : null},
        ${input.city.trim()},
        ${input.state.trim()},
        ${input.pincode.trim()},
        ${Boolean(input.is_default)},
        ${now},
        ${now}
      )
      RETURNING id, user_id, label, name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at
    `;

    const r = rows[0];
    const created: DbAddress = {
      id: r.id,
      user_id: r.user_id,
      label: r.label,
      name: r.name,
      phone: r.phone,
      line1: r.line1,
      line2: r.line2,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      is_default: Boolean(r.is_default),
      created_at: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
      updated_at: typeof r.updated_at === "string" ? r.updated_at : new Date(r.updated_at).toISOString(),
    };

    // Update local cache
    try {
      const current = await fetchUserAddresses(uid);
      localStorage.setItem(`subhone_cached_addresses_${uid}`, JSON.stringify(current));
    } catch {}

    return { data: created, error: null };
  } catch (err: any) {
    console.error("Failed to create address in Neon DB:", err);
    // Offline local fallback
    const localAddress: DbAddress = {
      id: newId,
      user_id: uid,
      ...input,
      line2: input.line2 || null,
      created_at: now,
      updated_at: now,
    };
    return { data: localAddress, error: err?.message || "Failed to create address in database" };
  }
}

/**
 * Update an existing address permanently in Neon Database
 */
export async function updateAddress(
  id: string,
  input: Partial<AddressInput>,
  explicitUserId?: string
): Promise<{ data: DbAddress | null; error: string | null }> {
  const uid = await getEffectiveUserId(explicitUserId);
  const now = new Date().toISOString();

  try {
    if (input.is_default) {
      try {
        await sql`
          UPDATE public.addresses
          SET is_default = false, updated_at = ${now}
          WHERE user_id = ${uid}
        `;
      } catch (err) {
        console.warn("Notice resetting default addresses:", err);
      }
    }

    const rows = await sql`
      UPDATE public.addresses
      SET 
        label = COALESCE(${input.label}, label),
        name = COALESCE(${input.name?.trim()}, name),
        phone = COALESCE(${input.phone?.trim()}, phone),
        line1 = COALESCE(${input.line1?.trim()}, line1),
        line2 = CASE WHEN ${input.line2 !== undefined} THEN ${input.line2?.trim() || null} ELSE line2 END,
        city = COALESCE(${input.city?.trim()}, city),
        state = COALESCE(${input.state?.trim()}, state),
        pincode = COALESCE(${input.pincode?.trim()}, pincode),
        is_default = COALESCE(${input.is_default !== undefined ? Boolean(input.is_default) : null}, is_default),
        updated_at = ${now}
      WHERE id = ${id} AND user_id = ${uid}
      RETURNING id, user_id, label, name, phone, line1, line2, city, state, pincode, is_default, created_at, updated_at
    `;

    if (!rows || rows.length === 0) {
      return { data: null, error: "Address not found or unauthorized" };
    }

    const r = rows[0];
    const updated: DbAddress = {
      id: r.id,
      user_id: r.user_id,
      label: r.label,
      name: r.name,
      phone: r.phone,
      line1: r.line1,
      line2: r.line2,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      is_default: Boolean(r.is_default),
      created_at: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
      updated_at: typeof r.updated_at === "string" ? r.updated_at : new Date(r.updated_at).toISOString(),
    };

    try {
      const current = await fetchUserAddresses(uid);
      localStorage.setItem(`subhone_cached_addresses_${uid}`, JSON.stringify(current));
    } catch {}

    return { data: updated, error: null };
  } catch (err: any) {
    console.error("Failed to update address in Neon DB:", err);
    return { data: null, error: err?.message || "Failed to update address in database" };
  }
}

/**
 * Delete an address permanently from Neon Database
 */
export async function deleteAddress(id: string, explicitUserId?: string): Promise<{ error: string | null }> {
  const uid = await getEffectiveUserId(explicitUserId);
  try {
    await sql`
      DELETE FROM public.addresses
      WHERE id = ${id} AND user_id = ${uid}
    `;

    try {
      const current = await fetchUserAddresses(uid);
      localStorage.setItem(`subhone_cached_addresses_${uid}`, JSON.stringify(current));
    } catch {}

    return { error: null };
  } catch (err: any) {
    console.error("Failed to delete address from Neon DB:", err);
    return { error: err?.message || "Failed to delete address" };
  }
}

/**
 * Set an address as default permanently in Neon Database
 */
export async function setDefaultAddress(id: string, explicitUserId?: string): Promise<{ error: string | null }> {
  const uid = await getEffectiveUserId(explicitUserId);
  const now = new Date().toISOString();

  try {
    await sql`
      UPDATE public.addresses
      SET is_default = false, updated_at = ${now}
      WHERE user_id = ${uid}
    `;

    await sql`
      UPDATE public.addresses
      SET is_default = true, updated_at = ${now}
      WHERE id = ${id} AND user_id = ${uid}
    `;

    try {
      const current = await fetchUserAddresses(uid);
      localStorage.setItem(`subhone_cached_addresses_${uid}`, JSON.stringify(current));
    } catch {}

    return { error: null };
  } catch (err: any) {
    console.error("Failed to set default address in Neon DB:", err);
    return { error: err?.message || "Failed to set default address" };
  }
}
