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
 * Fetch all addresses for the authenticated user
 */
export async function fetchUserAddresses(): Promise<DbAddress[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching addresses:", error.message);
    return [];
  }
  return data as DbAddress[];
}

/**
 * Create an address for the authenticated user
 */
export async function createAddress(
  input: AddressInput
): Promise<{ data: DbAddress | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // If this address is set as default, reset all other addresses
  if (input.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert([{ ...input, user_id: user.id }])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as DbAddress, error: null };
}

/**
 * Update an existing address
 */
export async function updateAddress(
  id: string,
  input: Partial<AddressInput>
): Promise<{ data: DbAddress | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (input.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id)
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
export async function deleteAddress(id: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(id: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
