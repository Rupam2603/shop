import { neon, neonConfig } from "@neondatabase/serverless";

// Neon credentials provided by user
export const NEON_CONNECTION_STRING =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const NEON_DATA_API =
  import.meta.env.VITE_NEON_DATA_API ||
  "https://ep-falling-cell-azm5qjrf.apirest.c-3.ap-southeast-1.aws.neon.tech/neondb/rest/v1";

export const NEON_AUTH_API =
  import.meta.env.VITE_NEON_AUTH_API ||
  "https://ep-falling-cell-azm5qjrf.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth";

export const NEON_JWKS_URL =
  import.meta.env.VITE_NEON_JWKS_URL ||
  "https://ep-falling-cell-azm5qjrf.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json";

// Configure neon HTTP driver
export const sql = neon(NEON_CONNECTION_STRING);

// Test query
export async function testNeonConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log("Neon Postgres connected:", result);
    return true;
  } catch (err) {
    console.error("Neon Postgres connection error:", err);
    return false;
  }
}
