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
    // 1. Fetch from Supabase profiles
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
          (p as any).approval_status || existing?.approvalStatus || "approved";

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
  const emailKey = data.email.toLowerCase();
  const existing = localList.find(
    (r) => r.id === data.id || r.email.toLowerCase() === emailKey
  );

  const finalId = data.id || existing?.id || `ret_${Date.now()}`;
  const status = data.approvalStatus || existing?.approvalStatus || "pending";

  const updatedRec: RetailerAccount = {
    id: finalId,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || existing?.phone || null,
    shopName: data.shopName,
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

  // 2. Persist to Supabase profiles
  try {
    await supabase.from("profiles").upsert({
      id: finalId,
      full_name: data.fullName,
      role: "retailer",
      phone: data.phone || null,
      shop_name: data.shopName,
      approval_status: status,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Could not upsert retailer to profiles table:", err);
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
  let target = localList.find((r) => r.id === retailerId || r.email.toLowerCase() === retailerId.toLowerCase());

  if (!target) {
    target = {
      id: retailerId,
      fullName: "Retailer Partner",
      email: retailerId.includes("@") ? retailerId : "retailer@subhone.com",
      shopName: "Medical Store",
      role: "retailer",
      approvalStatus: newStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const updatedTarget: RetailerAccount = {
    ...target,
    approvalStatus: newStatus,
    updatedAt: new Date().toISOString(),
    approvedAt: newStatus === "approved" ? new Date().toISOString() : null,
  };

  const updatedList = localList.map((r) => (r.id === target!.id || r.email.toLowerCase() === target!.email.toLowerCase() ? updatedTarget : r));
  if (!updatedList.some((r) => r.id === target!.id)) {
    updatedList.unshift(updatedTarget);
  }
  saveLocalRetailers(updatedList);

  // Update in Supabase
  try {
    await supabase
      .from("profiles")
      .update({
        approval_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", target.id);
  } catch (e) {
    console.warn("Could not update approval status in database:", e);
  }

  return { success: true, retailer: updatedTarget };
}

/**
 * Check if a retailer is approved to log in
 */
export function checkRetailerApprovalStatus(emailOrId: string): "approved" | "pending" | "rejected" {
  const list = getLocalRetailers();
  const normalized = emailOrId.toLowerCase();
  const found = list.find(
    (r) => r.id.toLowerCase() === normalized || r.email.toLowerCase() === normalized
  );

  if (!found) {
    // By default for new retailer signup without approval, it is pending
    return "pending";
  }
  return found.approvalStatus;
}
