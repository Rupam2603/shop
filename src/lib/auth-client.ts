import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client Instance
 * Configured with dynamic origin and base URL support for Neon Auth / Better Auth
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? (import.meta.env.VITE_BETTER_AUTH_URL || window.location.origin)
      : "https://shop-phi-plum.vercel.app",
});

export const { signIn: betterSignIn, signUp: betterSignUp, signOut: betterSignOut, useSession: useBetterSession } = authClient;
