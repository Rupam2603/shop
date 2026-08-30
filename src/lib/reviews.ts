import { supabase } from "./supabase";

export interface DbReview {
  id: string;
  product_id?: string | null;
  product_numeric_id?: number | null;
  user_id?: string | null;
  user_name: string;
  user_role: "customer" | "retailer" | string;
  rating: number; // 1 - 5
  title?: string | null;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface ReviewInput {
  product_id?: string | null;
  product_numeric_id?: number | null;
  user_id?: string | null;
  user_name: string;
  user_role: "customer" | "retailer" | string;
  rating: number;
  title?: string;
  comment: string;
  verified_purchase?: boolean;
}

/**
 * Fetch reviews from Supabase for a specific product
 */
export async function fetchProductReviews(
  productNumericId?: number,
  productUuid?: string
): Promise<DbReview[]> {
  try {
    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });

    if (productUuid) {
      query = query.eq("product_id", productUuid);
    } else if (productNumericId) {
      query = query.eq("product_numeric_id", productNumericId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("Could not fetch reviews from Supabase:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("fetchProductReviews error:", err);
    return [];
  }
}

/**
 * Fetch reviews written by a specific user
 */
export async function fetchUserReviews(userId?: string): Promise<DbReview[]> {
  try {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch user reviews:", error.message);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Submit a new review to Supabase
 */
export async function submitReview(input: ReviewInput): Promise<{ data: DbReview | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: input.product_id || null,
        product_numeric_id: input.product_numeric_id || null,
        user_id: input.user_id || null,
        user_name: input.user_name || "Customer",
        user_role: input.user_role || "customer",
        rating: Math.max(1, Math.min(5, input.rating)),
        title: input.title?.trim() || null,
        comment: input.comment.trim(),
        verified_purchase: input.verified_purchase ?? true,
        helpful_count: 0,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to submit review" };
  }
}

/**
 * Upvote a review as helpful
 */
export async function markReviewHelpful(reviewId: string): Promise<boolean> {
  try {
    const { data: current } = await supabase.from("reviews").select("helpful_count").eq("id", reviewId).single();
    const newCount = (current?.helpful_count || 0) + 1;

    const { error } = await supabase
      .from("reviews")
      .update({ helpful_count: newCount })
      .eq("id", reviewId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Realtime subscriptions are not offered by the Neon Data API — kept as a
 * no-op (the old Supabase-shim "realtime" never actually fired either); use
 * `fetchProductReviews()` to get fresh data.
 */
export function subscribeToReviewsRealtime(
  _productNumericId: number | undefined,
  _productUuid: string | undefined,
  _onPayload: (payload: { eventType: string; new?: DbReview; old?: { id: string } }) => void
) {
  return () => {};
}
