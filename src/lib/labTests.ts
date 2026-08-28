import { supabase } from "./supabase";

export interface DbLabPackage {
  id: string;
  name: string;
  category: string;
  badge: string;
  tests_count: number;
  tests_summary: string;
  included_tests: string[];
  features: string[];
  mrp: number;
  price: number;
  discount_percent: number;
  fasting_required: boolean;
  fasting_hours: number;
  sample_type: string;
  report_turnaround: string;
  created_at: string;
}

export interface DbLabBooking {
  id: string;
  booking_number: string;
  user_id: string;
  package_id: string | null;
  package_name: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_phone: string;
  collection_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  collection_date: string;
  collection_time_slot: string;
  fasting_confirmed: boolean;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: "Scheduled" | "Sample Collected" | "Processing" | "Report Generated" | "Completed" | "Cancelled";
  report_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLabBookingPayload {
  package_id?: string;
  package_name: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_phone: string;
  collection_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  collection_date: string;
  collection_time_slot: string;
  fasting_confirmed: boolean;
  total_amount: number;
  payment_method: string;
}

/**
 * Fetch all available diagnostic packages
 */
export async function fetchLabPackages(): Promise<DbLabPackage[]> {
  try {
    const { data, error } = await supabase
      .from("lab_packages")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      console.warn("fetchLabPackages error:", error.message);
      return [];
    }
    return (data as DbLabPackage[]) || [];
  } catch (err) {
    console.error("fetchLabPackages unexpected error:", err);
    return [];
  }
}

/**
 * Fetch lab bookings for the currently authenticated user
 */
export async function fetchUserLabBookings(): Promise<DbLabBooking[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("lab_bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchUserLabBookings error:", error.message);
      return [];
    }
    return (data as DbLabBooking[]) || [];
  } catch (err) {
    console.error("fetchUserLabBookings unexpected error:", err);
    return [];
  }
}

/**
 * Create a new home sample collection lab booking
 */
export async function createLabBooking(
  payload: CreateLabBookingPayload
): Promise<{ data: DbLabBooking | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Please log in to book a lab test" };

    const bookingNumber = `LAB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from("lab_bookings")
      .insert({
        booking_number: bookingNumber,
        user_id: user.id,
        package_id: payload.package_id || null,
        package_name: payload.package_name,
        patient_name: payload.patient_name,
        patient_age: payload.patient_age,
        patient_gender: payload.patient_gender,
        patient_phone: payload.patient_phone,
        collection_address: payload.collection_address,
        collection_date: payload.collection_date,
        collection_time_slot: payload.collection_time_slot,
        fasting_confirmed: payload.fasting_confirmed,
        total_amount: payload.total_amount,
        payment_method: payload.payment_method,
        payment_status: payload.payment_method.includes("Online") ? "Paid" : "Pending",
        status: "Scheduled",
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as DbLabBooking, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message || "An unexpected error occurred" };
  }
}

/**
 * Fetch all lab bookings across all users (Admin view)
 */
export async function fetchAllLabBookings(): Promise<DbLabBooking[]> {
  try {
    const { data, error } = await supabase
      .from("lab_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchAllLabBookings error:", error.message);
      return [];
    }
    return (data as DbLabBooking[]) || [];
  } catch (err) {
    console.error("fetchAllLabBookings unexpected error:", err);
    return [];
  }
}

/**
 * Update the status of a lab booking (Admin action)
 */
export async function updateLabBookingStatus(
  bookingId: string,
  status: DbLabBooking["status"]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from("lab_bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: (err as Error).message || "Update failed" };
  }
}
