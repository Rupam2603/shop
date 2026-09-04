import { sql } from "./neon";
import { hashPasswordWithSalt } from "./users";

export interface DeliveryPartnerProfile {
  userId: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  weeklyOffDay?: string | null;
  profileCompleted: boolean;
  isOnDuty: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartnerItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  weeklyOffDay?: string | null;
  profileCompleted: boolean;
  isOnDuty: boolean;
  createdAt: string;
  todayAttendanceStatus?: "present" | "absent" | "on_leave";
  checkInAt?: string | null;
  checkOutAt?: string | null;
  activeOrdersCount?: number;
  completedOrdersCount?: number;
}

export interface DeliveryAttendanceRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: "present" | "absent" | "on_leave";
}

/**
 * Admin creates a delivery partner login credentials (email + password + full name).
 * Directly sets status='active', creates linked delivery_partner_profiles record.
 */
export async function adminCreateDeliveryPartner(opts: {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
}): Promise<{ success: boolean; partnerId?: string; error?: string }> {
  try {
    const cleanEmail = opts.email.trim().toLowerCase();
    const cleanName = opts.fullName.trim() || "Delivery Partner";
    const rawPass = opts.password || "Delivery@2026";

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM public.users WHERE LOWER(email) = ${cleanEmail} AND deleted_at IS NULL LIMIT 1
    `;
    if (existing && existing.length > 0) {
      return { success: false, error: "An account with this email already exists." };
    }

    const { hash } = await hashPasswordWithSalt(rawPass);

    // Insert user into public.users
    const userRes = await sql`
      INSERT INTO public.users (name, email, password_hash, role, status)
      VALUES (${cleanName}, ${cleanEmail}, ${hash}, 'delivery_partner', 'active')
      RETURNING id, created_at
    `;

    const newUserId = userRes[0].id;

    // Create empty profile record in public.delivery_partner_profiles
    await sql`
      INSERT INTO public.delivery_partner_profiles (user_id, phone, profile_completed, is_on_duty)
      VALUES (${newUserId}, ${opts.phone?.trim() || null}, false, false)
      ON CONFLICT (user_id) DO NOTHING
    `;

    return { success: true, partnerId: newUserId };
  } catch (err: any) {
    console.error("Error creating delivery partner:", err);
    return { success: false, error: err.message || "Failed to create delivery partner." };
  }
}

/**
 * Fetch all delivery partners for Admin Dashboard tab
 */
export async function fetchAllDeliveryPartners(): Promise<DeliveryPartnerItem[]> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const rows = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        p.phone,
        p.avatar_url,
        p.vehicle_type,
        p.vehicle_number,
        p.weekly_off_day,
        COALESCE(p.profile_completed, false) as profile_completed,
        COALESCE(p.is_on_duty, false) as is_on_duty,
        att.status as today_attendance,
        att.check_in_at,
        att.check_out_at,
        (SELECT COUNT(*) FROM public.orders o WHERE o.delivery_partner_id = u.id AND o.delivery_status IN ('accepted', 'picked_up')) as active_orders,
        (SELECT COUNT(*) FROM public.orders o WHERE o.delivery_partner_id = u.id AND (o.delivery_status = 'delivered' OR o.status = 'Delivered')) as completed_orders
      FROM public.users u
      LEFT JOIN public.delivery_partner_profiles p ON p.user_id = u.id
      LEFT JOIN public.delivery_attendance att ON att.user_id = u.id AND att.work_date = ${today}::date
      WHERE u.role = 'delivery_partner' AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `;

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: r.status,
      phone: r.phone,
      address: r.address,
      avatarUrl: r.avatar_url,
      vehicleType: r.vehicle_type,
      vehicleNumber: r.vehicle_number,
      weeklyOffDay: r.weekly_off_day || null,
      profileCompleted: Boolean(r.profile_completed),
      isOnDuty: Boolean(r.is_on_duty),
      createdAt: r.created_at,
      todayAttendanceStatus: r.today_attendance || (r.is_on_duty ? "present" : "absent"),
      checkInAt: r.check_in_at,
      checkOutAt: r.check_out_at,
      activeOrdersCount: Number(r.active_orders || 0),
      completedOrdersCount: Number(r.completed_orders || 0),
    }));
  } catch (err) {
    console.error("Error fetching delivery partners:", err);
    return [];
  }
}

/**
 * Get individual delivery partner profile by ID
 */
export async function getDeliveryPartnerById(userId: string): Promise<DeliveryPartnerItem | null> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const rows = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        p.phone,
        p.address,
        p.avatar_url,
        p.vehicle_type,
        p.vehicle_number,
        p.weekly_off_day,
        COALESCE(p.profile_completed, false) as profile_completed,
        COALESCE(p.is_on_duty, false) as is_on_duty,
        att.status as today_attendance,
        att.check_in_at,
        att.check_out_at,
        (SELECT COUNT(*) FROM public.orders o WHERE o.delivery_partner_id = u.id AND o.delivery_status IN ('accepted', 'picked_up')) as active_orders,
        (SELECT COUNT(*) FROM public.orders o WHERE o.delivery_partner_id = u.id AND (o.delivery_status = 'delivered' OR o.status = 'Delivered')) as completed_orders
      FROM public.users u
      LEFT JOIN public.delivery_partner_profiles p ON p.user_id = u.id
      LEFT JOIN public.delivery_attendance att ON att.user_id = u.id AND att.work_date = ${today}::date
      WHERE u.id = ${userId} AND u.deleted_at IS NULL
      LIMIT 1
    `;

    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: r.status,
      phone: r.phone,
      address: r.address,
      avatarUrl: r.avatar_url,
      vehicleType: r.vehicle_type,
      vehicleNumber: r.vehicle_number,
      weeklyOffDay: r.weekly_off_day || null,
      profileCompleted: Boolean(r.profile_completed),
      isOnDuty: Boolean(r.is_on_duty),
      createdAt: r.created_at,
      todayAttendanceStatus: r.today_attendance || (r.is_on_duty ? "present" : "absent"),
      checkInAt: r.check_in_at,
      checkOutAt: r.check_out_at,
      activeOrdersCount: Number(r.active_orders || 0),
      completedOrdersCount: Number(r.completed_orders || 0),
    };
  } catch (err) {
    console.error("Error fetching delivery partner by ID:", err);
    return null;
  }
}

/**
 * Complete delivery partner profile on first login
 */
export async function completeDeliveryPartnerProfile(
  userId: string,
  data: {
    phone: string;
    address: string;
    avatarUrl?: string | null;
    vehicleType?: string | null;
    vehicleNumber?: string | null;
    fullName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (data.fullName?.trim()) {
      await sql`
        UPDATE public.users
        SET name = ${data.fullName.trim()}, updated_at = NOW()
        WHERE id = ${userId}
      `;
    }

    await sql`
      INSERT INTO public.delivery_partner_profiles (
        user_id, phone, address, avatar_url, vehicle_type, vehicle_number, profile_completed, updated_at
      )
      VALUES (
        ${userId}, ${data.phone.trim()}, ${data.address.trim()}, ${data.avatarUrl || null},
        ${data.vehicleType || null}, ${data.vehicleNumber || null}, true, NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        avatar_url = COALESCE(EXCLUDED.avatar_url, delivery_partner_profiles.avatar_url),
        vehicle_type = COALESCE(EXCLUDED.vehicle_type, delivery_partner_profiles.vehicle_type),
        vehicle_number = COALESCE(EXCLUDED.vehicle_number, delivery_partner_profiles.vehicle_number),
        profile_completed = true,
        updated_at = NOW()
    `;

    return { success: true };
  } catch (err: any) {
    console.error("Error completing delivery partner profile:", err);
    return { success: false, error: err.message || "Failed to update profile." };
  }
}

/**
 * Toggle on-duty status & auto-manage attendance check-in / check-out
 */
export async function toggleDeliveryPartnerDuty(
  userId: string,
  isOnDuty: boolean
): Promise<{ success: boolean; isOnDuty: boolean; error?: string }> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Update delivery_partner_profiles
    await sql`
      INSERT INTO public.delivery_partner_profiles (user_id, is_on_duty, updated_at)
      VALUES (${userId}, ${isOnDuty}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        is_on_duty = ${isOnDuty},
        updated_at = NOW()
    `;

    // 2. Manage daily attendance
    if (isOnDuty) {
      await sql`
        INSERT INTO public.delivery_attendance (user_id, work_date, check_in_at, status)
        VALUES (${userId}, ${today}::date, NOW(), 'present')
        ON CONFLICT (user_id, work_date) DO UPDATE SET
          check_in_at = COALESCE(delivery_attendance.check_in_at, NOW()),
          status = 'present'
      `;
    } else {
      await sql`
        INSERT INTO public.delivery_attendance (user_id, work_date, check_out_at, status)
        VALUES (${userId}, ${today}::date, NOW(), 'present')
        ON CONFLICT (user_id, work_date) DO UPDATE SET
          check_out_at = NOW()
      `;
    }

    return { success: true, isOnDuty };
  } catch (err: any) {
    console.error("Error toggling delivery partner duty:", err);
    return { success: false, isOnDuty: !isOnDuty, error: err.message || "Failed to toggle duty status." };
  }
}

/**
 * Fetch delivery attendance log for Admin
 */
export async function fetchDeliveryAttendance(filters?: {
  workDate?: string;
  userId?: string;
}): Promise<DeliveryAttendanceRecord[]> {
  try {
    let query;
    if (filters?.workDate && filters?.userId) {
      query = sql`
        SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, a.work_date::text, a.check_in_at, a.check_out_at, a.status
        FROM public.delivery_attendance a
        JOIN public.users u ON u.id = a.user_id
        WHERE a.work_date = ${filters.workDate}::date AND a.user_id = ${filters.userId}
        ORDER BY a.check_in_at DESC NULLS LAST
      `;
    } else if (filters?.workDate) {
      query = sql`
        SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, a.work_date::text, a.check_in_at, a.check_out_at, a.status
        FROM public.delivery_attendance a
        JOIN public.users u ON u.id = a.user_id
        WHERE a.work_date = ${filters.workDate}::date
        ORDER BY a.check_in_at DESC NULLS LAST
      `;
    } else if (filters?.userId) {
      query = sql`
        SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, a.work_date::text, a.check_in_at, a.check_out_at, a.status
        FROM public.delivery_attendance a
        JOIN public.users u ON u.id = a.user_id
        WHERE a.user_id = ${filters.userId}
        ORDER BY a.work_date DESC, a.check_in_at DESC NULLS LAST
        LIMIT 60
      `;
    } else {
      query = sql`
        SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, a.work_date::text, a.check_in_at, a.check_out_at, a.status
        FROM public.delivery_attendance a
        JOIN public.users u ON u.id = a.user_id
        ORDER BY a.work_date DESC, a.check_in_at DESC NULLS LAST
        LIMIT 100
      `;
    }

    const rows = await query;
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      workDate: r.work_date,
      checkInAt: r.check_in_at,
      checkOutAt: r.check_out_at,
      status: r.status as any,
    }));
  } catch (err) {
    console.error("Error fetching delivery attendance:", err);
    return [];
  }
}

/**
 * Admin updates the weekly off day for a delivery partner
 */
export async function updateDeliveryPartnerWeeklyOff(
  userId: string,
  weeklyOffDay: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      INSERT INTO public.delivery_partner_profiles (user_id, weekly_off_day, updated_at)
      VALUES (${userId}, ${weeklyOffDay}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        weekly_off_day = ${weeklyOffDay},
        updated_at = NOW()
    `;
    return { success: true };
  } catch (err: any) {
    console.error("Error updating weekly off day:", err);
    return { success: false, error: err?.message || "Failed to update weekly off day." };
  }
}

export interface AttendanceReportRow {
  partnerId: string;
  name: string;
  mobile: string;
  date: string;           // YYYY-MM-DD
  checkInTime: string | null;  // formatted local time, or null
  checkOutTime: string | null;
  status: "Present" | "Absent" | "Week Off";
  weeklyOffDay: string | null; // e.g. "Sunday" or null
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Fetch comprehensive attendance report for weekly/monthly export.
 * Generates every calendar day in the range so missing days show as Absent (or Week Off).
 */
export async function fetchAttendanceReport(opts: {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  partnerId?: string; // omit or "all"
}): Promise<AttendanceReportRow[]> {
  try {
    const isSinglePartner = opts.partnerId && opts.partnerId !== "all";

    let rows: any[];
    if (isSinglePartner) {
      rows = await sql`
        SELECT
          u.id AS partner_id,
          u.name AS name,
          COALESCE(dpp.phone, '') AS mobile,
          d.work_date::text AS date,
          a.check_in_at,
          a.check_out_at,
          dpp.weekly_off_day
        FROM generate_series(${opts.startDate}::date, ${opts.endDate}::date, interval '1 day') AS d(work_date)
        CROSS JOIN public.users u
        LEFT JOIN public.delivery_partner_profiles dpp ON dpp.user_id = u.id
        LEFT JOIN public.delivery_attendance a
          ON a.user_id = u.id AND a.work_date = d.work_date::date
        WHERE u.role = 'delivery_partner'
          AND u.deleted_at IS NULL
          AND u.id = ${opts.partnerId}::uuid
        ORDER BY u.name, d.work_date;
      `;
    } else {
      rows = await sql`
        SELECT
          u.id AS partner_id,
          u.name AS name,
          COALESCE(dpp.phone, '') AS mobile,
          d.work_date::text AS date,
          a.check_in_at,
          a.check_out_at,
          dpp.weekly_off_day
        FROM generate_series(${opts.startDate}::date, ${opts.endDate}::date, interval '1 day') AS d(work_date)
        CROSS JOIN public.users u
        LEFT JOIN public.delivery_partner_profiles dpp ON dpp.user_id = u.id
        LEFT JOIN public.delivery_attendance a
          ON a.user_id = u.id AND a.work_date = d.work_date::date
        WHERE u.role = 'delivery_partner'
          AND u.deleted_at IS NULL
        ORDER BY u.name, d.work_date;
      `;
    }

    return rows.map((row: any) => {
      // Determine day name in local time
      const dateParts = row.date.split("-");
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const dateObj = new Date(year, month, day);
      const dayOfWeekName = WEEKDAY_NAMES[dateObj.getDay()];

      const isWeekOff = Boolean(
        row.weekly_off_day &&
        row.weekly_off_day.toLowerCase() === dayOfWeekName.toLowerCase()
      );

      let status: "Present" | "Absent" | "Week Off";
      if (row.check_in_at) {
        status = "Present";
      } else if (isWeekOff) {
        status = "Week Off";
      } else {
        status = "Absent";
      }

      const formatTime = (iso?: string | null) => {
        if (!iso) return null;
        try {
          return new Date(iso).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        } catch {
          return null;
        }
      };

      return {
        partnerId: row.partner_id,
        name: row.name || "Delivery Partner",
        mobile: row.mobile || "",
        date: row.date,
        checkInTime: formatTime(row.check_in_at),
        checkOutTime: formatTime(row.check_out_at),
        status,
        weeklyOffDay: row.weekly_off_day || null,
      };
    });
  } catch (err) {
    console.error("Error fetching attendance report:", err);
    return [];
  }
}
