/**
 * Neon Auth Direct Client (Managed Better Auth)
 * Base URL: https://ep-divine-scene-az33au23.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth
 */

const NEON_AUTH_BASE =
  import.meta.env.VITE_NEON_AUTH_API ||
  import.meta.env.NEON_AUTH_BASE_URL ||
  "https://ep-divine-scene-az33au23.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth";

export interface NeonAuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  image?: string | null;
  emailVerified?: boolean;
}

export interface NeonAuthSession {
  token: string;
  user: NeonAuthUser;
}

export interface NeonAuthResponse {
  data: {
    user: NeonAuthUser | null;
    session: NeonAuthSession | null;
    token?: string;
  } | null;
  error: {
    message: string;
    code?: string;
  } | null;
}

/**
 * Sign in with email and password directly to Neon Auth (Better Auth)
 */
export async function neonSignInWithPassword(
  email: string,
  password: string
): Promise<NeonAuthResponse> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://shop-phi-plum.vercel.app";
    const res = await fetch(`${NEON_AUTH_BASE}/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        callbackURL: origin,
      }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: null,
        error: {
          message: body?.message || body?.error || "Invalid login credentials",
          code: body?.code,
        },
      };
    }

    if (body?.user) {
      const token = body.token || body.session?.token || "";
      if (token && typeof window !== "undefined") {
        try {
          localStorage.setItem("subhone_neon_auth_token", token);
          localStorage.setItem("subhone_neon_auth_user", JSON.stringify(body.user));
        } catch {}
      }

      return {
        data: {
          user: body.user,
          session: {
            token,
            user: body.user,
          },
          token,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: { message: "Failed to sign in. Please check your credentials." },
    };
  } catch (err: any) {
    return {
      data: null,
      error: { message: err?.message || "Network connection error." },
    };
  }
}

/**
 * Sign up with email and password directly to Neon Auth (Better Auth)
 */
export async function neonSignUp(
  email: string,
  password: string,
  name: string
): Promise<NeonAuthResponse> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://shop-phi-plum.vercel.app";
    const res = await fetch(`${NEON_AUTH_BASE}/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        callbackURL: origin,
      }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: null,
        error: {
          message: body?.message || body?.error || "Registration failed",
          code: body?.code,
        },
      };
    }

    if (body?.user) {
      const token = body.token || "";
      if (token && typeof window !== "undefined") {
        try {
          localStorage.setItem("subhone_neon_auth_token", token);
          localStorage.setItem("subhone_neon_auth_user", JSON.stringify(body.user));
        } catch {}
      }

      return {
        data: {
          user: body.user,
          session: {
            token,
            user: body.user,
          },
          token,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: { message: "Account created but failed to get session." },
    };
  } catch (err: any) {
    return {
      data: null,
      error: { message: err?.message || "Network connection error." },
    };
  }
}

/**
 * Get active session from Neon Auth
 */
export async function neonGetSession(): Promise<NeonAuthUser | null> {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("subhone_neon_auth_user");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
}

/**
 * Sign out from Neon Auth
 */
export async function neonSignOut(): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("subhone_neon_auth_token");
      localStorage.removeItem("subhone_neon_auth_user");
    } catch {}
  }
}
