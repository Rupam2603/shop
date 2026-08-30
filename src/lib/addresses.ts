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
 * Get effective user ID across Supabase auth or persistent local storage
 */
export async function getEffectiveUserId(explicitUserId?: string): Promise<string> {
  if (explicitUserId && explicitUserId.trim()) return explicitUserId.trim();
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
 * Fetch all addresses for the user
 */
export async function fetchUserAddresses(explicitUserId?: string): Promise<DbAddress[]> {
  try {
    const uid = await getEffectiveUserId(explicitUserId);
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", uid)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Notice fetching addresses:", error.message);
      return [];
    }
    return (data || []) as DbAddress[];
  } catch {
    return [];
  }
}

/**
 * Create an address for the user
 */
export async function createAddress(
  input: AddressInput,
  explicitUserId?: string
): Promise<{ data: DbAddress | null; error: string | null }> {
  try {
    const uid = await getEffectiveUserId(explicitUserId);

    // If this address is set as default, reset all other addresses
    if (input.is_default) {
      try {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", uid);
      } catch {}
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert([{ ...input, user_id: uid }])
      .select()
      .single();

    if (error) {
      console.warn("Could not save to addresses table, returning local address:", error.message);
      const localAddress: DbAddress = {
        id: `addr_${Date.now()}`,
        user_id: uid,
        ...input,
        line2: input.line2 || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: localAddress, error: null };
    }
    return { data: data as DbAddress, error: null };
  } catch (err) {
    const uid = await getEffectiveUserId(explicitUserId);
    const localAddress: DbAddress = {
      id: `addr_${Date.now()}`,
      user_id: uid,
      ...input,
      line2: input.line2 || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { data: localAddress, error: null };
  }
}

/**
 * Update an existing address
 */
export async function updateAddress(
  id: string,
  input: Partial<AddressInput>,
  explicitUserId?: string
): Promise<{ data: DbAddress | null; error: string | null }> {
  const uid = await getEffectiveUserId(explicitUserId);

  if (input.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", uid);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update(input)
    .eq("id", id)
    .eq("user_id", uid)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as DbAddress, error: null };
}

/**
 * Delete an address
 */
export async function deleteAddress(id: string, explicitUserId?: string): Promise<{ error: string | null }> {
  const uid = await getEffectiveUserId(explicitUserId);

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", uid);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(id: string, explicitUserId?: string): Promise<{ error: string | null }> {
  const uid = await getEffectiveUserId(explicitUserId);

  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", uid);

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", uid);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
