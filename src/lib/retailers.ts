import { supabase } from "./supabase";

export interface RetailerAccount {
  id: string; // User ID / Clerk ID / DB ID
  fullName: string;
  email: string;
  phone?: string | null;
  shopName: string;
  role: "retailer";
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  clerkId?: string | null;
}

const RETAILERS_STORAGE_KEY = "subhone_retailers_registry_v2";

const DEFAULT_RETAILERS: RetailerAccount[] = [
  {
    id: "ret_001",
    fullName: "Subhasis Chakraborty",
    email: "chakrabortysubhasis18@gmail.com",
    phone: "+91 98360 00000",
    shopName: "Subho Medical & Surgical Store",
    role: "retailer",
    approvalStatus: "approved",
    createdAt: "2026-08-20T10:00:00.000Z",
    updatedAt: "2026-08-20T10:00:00.000Z",
    approvedAt: "2026-08-20T10:05:00.000Z",
  },
  {
    id: "ret_002",
    fullName: "Ramesh Sharma",
    email: "sharma.medicals@gmail.com",
    phone: "+91 87654 32109",
    shopName: "Sharma Medical & Surgical",
    role: "retailer",
    approvalStatus: "approved",
    createdAt: "2026-08-22T08:30:00.000Z",
    updatedAt: "2026-08-22T08:30:00.000Z",
    approvedAt: "2026-08-22T09:00:00.000Z",
  },
  {
    id: "ret_003",
    fullName: "Vikram Mehta",
    email: "apex.pharma.kol@gmail.com",
    phone: "+91 65432 10987",
    shopName: "Apex Pharma Distributors",
    role: "retailer",
    approvalStatus: "pending",
    createdAt: "2026-08-28T14:20:00.000Z",
    updatedAt: "2026-08-28T14:20:00.000Z",
  },
  {
    id: "ret_004",
    fullName: "Dr. Arvind Gupta",
    email: "gupta.health.care@gmail.com",
    phone: "+91 99887 76655",
    shopName: "Gupta Health Pharmacy",
    role: "retailer",
    approvalStatus: "pending",
    createdAt: "2026-08-29T09:15:00.000Z",
    updatedAt: "2026-08-29T09:15:00.000Z",
  },
];

/**
 * Get local retailers registry cache
 */
export function getLocalRetailers(): RetailerAccount[] {
  try {
    const raw = localStorage.getItem(RETAILERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read local retailers registry:", err);
  }
  // Initialize default
  try {
    localStorage.setItem(RETAILERS_STORAGE_KEY, JSON.stringify(DEFAULT_RETAILERS));
  } catch {}
  return DEFAULT_RETAILERS;
}

/**
 * Save retailer to local registry cache
 */
export function saveLocalRetailers(retailers: RetailerAccount[]): void {
  try {
    localStorage.setItem(RETAILERS_STORAGE_KEY, JSON.stringify(retailers));
  } catch (err) {
    console.warn("Could not save local retailers registry:", err);
  }
}

/**
 * Fetch all registered retailers across database and local registry
 */
export async function fetchAllRetailers(): Promise<RetailerAccount[]> {
  const localList = getLocalRetailers();
  const map = new Map<string, RetailerAccount>();

  // Seed with local list
  for (const r of localList) {
    map.set(r.email.toLowerCase(), r);
    map.set(r.id, r);
  }

  try {
    // 1. Fetch from Supabase retailer_approvals table
    const { data: dbApprovals, error: appErr } = await supabase
      .from("retailer_approvals")
      .select("*")
      .order("created_at", { ascending: false });

    if (!appErr && dbApprovals && dbApprovals.length > 0) {
      for (const row of dbApprovals) {
        const status = (row.approval_status as "pending" | "approved" | "rejected") || "pending";
        const emailKey = (row.email || "").toLowerCase();
        const rec: RetailerAccount = {
          id: row.id || row.user_id || emailKey,
          fullName: row.full_name || "Retailer Partner",
          email: row.email,
          phone: row.phone || null,
          shopName: row.shop_name || "Medical Store",
          role: "retailer",
          approvalStatus: status,
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          approvedAt: row.approved_at || (status === "approved" ? row.created_at : null),
          clerkId: row.clerk_id || null,
        };
        map.set(rec.id, rec);
        if (emailKey) map.set(emailKey, rec);
      }
    }

    // 2. Fetch from Supabase profiles (if any)
    const { data: dbProfiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "retailer")
      .order("created_at", { ascending: false });

    if (!error && dbProfiles && dbProfiles.length > 0) {
      for (const p of dbProfiles) {
        const emailKey = (p as any).email ? (p as any).email.toLowerCase() : "";
        const existing = map.get(p.id) || (emailKey ? map.get(emailKey) : null);
        const status: "pending" | "approved" | "rejected" =
          (p as any).approval_status || existing?.approvalStatus || "pending";

        const rec: RetailerAccount = {
          id: p.id,
          fullName: p.full_name || existing?.fullName || "Retailer Partner",
          email: (p as any).email || existing?.email || "retailer@subhone.com",
          phone: p.phone || existing?.phone || null,
          shopName: p.shop_name || existing?.shopName || "Medical Store",
          role: "retailer",
          approvalStatus: status,
          createdAt: p.created_at || existing?.createdAt || new Date().toISOString(),
          updatedAt: p.updated_at || existing?.updatedAt || new Date().toISOString(),
          approvedAt: status === "approved" ? existing?.approvedAt || p.created_at : null,
          clerkId: (p as any).clerk_id || existing?.clerkId || null,
        };

        map.set(p.id, rec);
        if (rec.email) map.set(rec.email.toLowerCase(), rec);
      }
    }
  } catch (err) {
    console.warn("Notice fetching database retailers:", err);
  }

  // De-duplicate unique by ID
  const uniqueRetailers = Array.from(
    new Map(Array.from(map.values()).map((r) => [r.id, r])).values()
  );

  // Sort: pending first, then by date descending
  uniqueRetailers.sort((a, b) => {
    if (a.approvalStatus === "pending" && b.approvalStatus !== "pending") return -1;
    if (a.approvalStatus !== "pending" && b.approvalStatus === "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  saveLocalRetailers(uniqueRetailers);
  return uniqueRetailers;
}

/**
 * Register or update a retailer in both DB and local cache
 */
export async function registerOrUpdateRetailer(data: {
  id?: string;
  fullName: string;
  email: string;
  phone?: string | null;
  shopName: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  clerkId?: string | null;
}): Promise<RetailerAccount> {
  const localList = getLocalRetailers();
  const emailKey = data.email.toLowerCase().trim();
  const existing = localList.find(
    (r) => r.id === data.id || r.email.toLowerCase() === emailKey
  );

  const finalId = data.id || existing?.id || `ret_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const status = data.approvalStatus || existing?.approvalStatus || "pending";

  const updatedRec: RetailerAccount = {
    id: finalId,
    fullName: data.fullName.trim(),
    email: emailKey,
    phone: data.phone || existing?.phone || null,
    shopName: data.shopName.trim() || `${data.fullName.trim()}'s Store`,
    role: "retailer",
    approvalStatus: status,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: status === "approved" ? existing?.approvedAt || new Date().toISOString() : null,
    clerkId: data.clerkId || existing?.clerkId || null,
  };

  // 1. Update local registry
  const filtered = localList.filter(
    (r) => r.id !== finalId && r.email.toLowerCase() !== emailKey
  );
  saveLocalRetailers([updatedRec, ...filtered]);

  // 2. Persist to Supabase retailer_approvals table
  try {
    const { error: appErr } = await supabase.from("retailer_approvals").upsert({
      id: finalId,
      user_id: finalId,
      email: emailKey,
      full_name: data.fullName.trim(),
      phone: data.phone || null,
      shop_name: updatedRec.shopName,
      approval_status: status,
      clerk_id: data.clerkId || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (appErr) {
      console.warn("Notice upserting to retailer_approvals:", appErr.message);
    }
  } catch (err) {
    console.warn("Could not upsert retailer to retailer_approvals table:", err);
  }

  // 3. Persist to Supabase profiles table if valid UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalId);
  if (isUuid) {
    try {
      await supabase.from("profiles").upsert({
        id: finalId,
        full_name: data.fullName.trim(),
        role: "retailer",
        phone: data.phone || null,
        shop_name: updatedRec.shopName,
        approval_status: status,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Could not upsert retailer to profiles table:", err);
    }
  }

  return updatedRec;
}

/**
 * Update retailer approval status in real-time (Admin action)
 */
export async function updateRetailerApprovalStatus(
  retailerId: string,
  newStatus: "pending" | "approved" | "rejected"
): Promise<{ success: boolean; retailer: RetailerAccount | null }> {
  const localList = getLocalRetailers();
  const searchKey = retailerId.toLowerCase();
  let target = localList.find((r) => r.id === retailerId || r.email.toLowerCase() === searchKey);

  if (!target) {
    target = {
      id: retailerId,
      fullName: "Retailer Partner",
      email: retailerId.includes("@") ? retailerId : "retailer@subhone.com",
      phone: null,
      shopName: "Medical Store",
      role: "retailer",
      approvalStatus: newStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: newStatus === "approved" ? new Date().toISOString() : null,
    };
  }

  const updatedRec: RetailerAccount = {
    ...target,
    approvalStatus: newStatus,
    updatedAt: new Date().toISOString(),
    approvedAt: newStatus === "approved" ? new Date().toISOString() : null,
  };

  // 1. Update local cache
  const nextList = localList.map((r) =>
    r.id === retailerId || r.email.toLowerCase() === searchKey ? updatedRec : r
  );
  if (!nextList.some((r) => r.id === target?.id)) {
    nextList.unshift(updatedRec);
  }
  saveLocalRetailers(nextList);

  // 2. Persist update to Supabase retailer_approvals
  try {
    await supabase
      .from("retailer_approvals")
      .update({
        approval_status: newStatus,
        approved_at: newStatus === "approved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${retailerId},email.eq.${searchKey}`);
  } catch (err) {
    console.warn("Could not update retailer_approvals table:", err);
  }

  // 3. Persist update to Supabase profiles (if UUID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(retailerId);
  if (isUuid) {
    try {
      await supabase
        .from("profiles")
        .update({
          approval_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", retailerId);
    } catch (err) {
      console.warn("Could not update profiles table:", err);
    }
  }

  return { success: true, retailer: updatedRec };
}

/**
 * Delete a single retailer from DB and local cache
 */
export async function deleteRetailer(retailerId: string): Promise<{ success: boolean; error?: string }> {
  const localList = getLocalRetailers();
  const searchKey = retailerId.toLowerCase();
  const target = localList.find((r) => r.id === retailerId || r.email.toLowerCase() === searchKey);
  const targetEmail = target?.email?.toLowerCase() || (retailerId.includes("@") ? searchKey : "");

  // 1. Remove from local cache
  const nextList = localList.filter((r) => r.id !== retailerId && r.email.toLowerCase() !== searchKey && (targetEmail ? r.email.toLowerCase() !== targetEmail : true));
  saveLocalRetailers(nextList);

  // 2. Delete from Supabase retailer_approvals
  try {
    let q = supabase.from("retailer_approvals").delete();
    if (targetEmail) {
      q = q.or(`id.eq.${retailerId},email.eq.${targetEmail}`);
    } else {
      q = q.eq("id", retailerId);
    }
    await q;
  } catch (err) {
    console.warn("Could not delete from retailer_approvals:", err);
  }

  // 3. Delete from Supabase profiles (if matching UUID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(retailerId);
  if (isUuid) {
    try {
      await supabase.from("profiles").delete().eq("id", retailerId);
    } catch (err) {
      console.warn("Could not delete from profiles:", err);
    }
  }

  return { success: true };
}

/**
 * Delete multiple retailers in bulk
 */
export async function deleteMultipleRetailers(retailerIds: string[]): Promise<{ success: boolean; deletedCount: number }> {
  if (!retailerIds || retailerIds.length === 0) return { success: true, deletedCount: 0 };

  const idSet = new Set(retailerIds.map((id) => id.toLowerCase()));
  const localList = getLocalRetailers();

  // Find all emails corresponding to these IDs
  const emailsToDelete = new Set<string>();
  for (const r of localList) {
    if (idSet.has(r.id.toLowerCase()) || idSet.has(r.email.toLowerCase())) {
      emailsToDelete.add(r.email.toLowerCase());
      idSet.add(r.id.toLowerCase());
    }
  }

  // 1. Update local cache
  const nextList = localList.filter(
    (r) => !idSet.has(r.id.toLowerCase()) && !emailsToDelete.has(r.email.toLowerCase())
  );
  saveLocalRetailers(nextList);

  // 2. Delete from Supabase retailer_approvals
  try {
    await supabase
      .from("retailer_approvals")
      .delete()
      .in("id", retailerIds);

    if (emailsToDelete.size > 0) {
      await supabase
        .from("retailer_approvals")
        .delete()
        .in("email", Array.from(emailsToDelete));
    }
  } catch (err) {
    console.warn("Could not bulk delete from retailer_approvals:", err);
  }

  return { success: true, deletedCount: retailerIds.length };
}

/**
 * Bulk update approval status for multiple retailers
 */
export async function bulkUpdateRetailerApprovalStatus(
  retailerIds: string[],
  newStatus: "pending" | "approved" | "rejected"
): Promise<{ success: boolean; count: number }> {
  if (!retailerIds || retailerIds.length === 0) return { success: true, count: 0 };

  for (const id of retailerIds) {
    await updateRetailerApprovalStatus(id, newStatus);
  }
  return { success: true, count: retailerIds.length };
}

/**
 * Check if a retailer email or ID is approved
 */
export function checkRetailerApprovalStatus(emailOrId: string): "pending" | "approved" | "rejected" | null {
  if (!emailOrId) return null;
  const key = emailOrId.toLowerCase().trim();

  // Admin always has access
  if (key === "admin@subhone.com") return "approved";

  const list = getLocalRetailers();
  const found = list.find((r) => r.id === emailOrId || r.email.toLowerCase() === key);
  return found ? found.approvalStatus : null;
}

/**
 * Live lookup for any retailer to check their approval status by email or phone
 */
export async function lookupRetailerApprovalStatus(
  query: string
): Promise<{ found: boolean; retailer: RetailerAccount | null }> {
  const clean = query.trim().toLowerCase();
  if (!clean) return { found: false, retailer: null };

  // 1. Try Supabase retailer_approvals table
  try {
    const isEmail = clean.includes("@");
    let req = supabase.from("retailer_approvals").select("*");
    if (isEmail) {
      req = req.ilike("email", clean);
    } else {
      req = req.or(`phone.ilike.%${clean}%,email.ilike.%${clean}%`);
    }

    const { data, error } = await req.limit(1).maybeSingle();
    if (!error && data) {
      const status = (data.approval_status as "pending" | "approved" | "rejected") || "pending";
      const rec: RetailerAccount = {
        id: data.id || data.user_id || data.email,
        fullName: data.full_name || "Retailer Partner",
        email: data.email,
        phone: data.phone || null,
        shopName: data.shop_name || "Medical Store",
        role: "retailer",
        approvalStatus: status,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
        approvedAt: data.approved_at || null,
        clerkId: data.clerk_id || null,
      };
      return { found: true, retailer: rec };
    }
  } catch (err) {
    console.warn("DB lookup error:", err);
  }

  // 2. Check local registry
  const list = getLocalRetailers();
  const match = list.find(
    (r) =>
      r.email.toLowerCase() === clean ||
      (r.phone && r.phone.replace(/\D/g, "").includes(clean.replace(/\D/g, "")))
  );

  if (match) {
    return { found: true, retailer: match };
  }

  return { found: false, retailer: null };
}

/**
 * Real-time Supabase subscription for retailer approvals
 */
export function subscribeToRetailersRealtime(
  callback: (payload: { eventType: string; new?: any; old?: any }) => void
) {
  try {
    const channel = supabase
      .channel("realtime:retailer_approvals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "retailer_approvals" },
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Could not subscribe to retailer approvals realtime:", err);
    return () => {};
  }
}
