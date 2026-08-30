# SubhOne — Issue Tracker

Living tracker of known issues, ranked by severity. Update status inline as items are fixed; don't delete resolved rows — mark them `Fixed` (with date/commit) so history stays visible.

Audited: 2026-08-30, via direct Neon MCP database inspection, `npx tsc --noEmit`, and a full source review of `src/`.
Updated: 2026-08-30 — auth + data layer migrated to real Neon Auth (Managed Better Auth) + the Neon Data API with Postgres RLS. See "2026-08-30 migration" below.

## Architecture summary (current)

SubhOne is a client-only React 19 + Vite 8 + Tailwind 4 SPA, built to a static `dist/` and deployed on Vercel — still no backend server (`vercel.json` is a pure SPA rewrite; no `/api` directory, no proxy in `vite.config.ts`), but that's no longer a security problem: the app now talks to the **Neon Data API** (a hosted PostgREST-compatible REST API) instead of a raw Postgres connection, and every table has **Row-Level Security** enabled. Authentication is real **Neon Auth (Managed Better Auth)**, wired in via `src/lib/supabase.ts` (`createClient` + `SupabaseAuthAdapter`, giving the rest of the app a `@supabase/supabase-js`-shaped `supabase.auth.*`/`supabase.from(...)` API without a hand-rolled shim). No database credentials of any kind are present in the client bundle.

Neon project: org `SubhOne` → project `twilight-union-91457029`, branch `production` (default) + `vercel-dev` (Vercel integration branch). Tables: `auth_users` (deprecated, unused by app code — see P1-1), `profiles`, `retailer_approvals`, `products` (+ `products_public` view), `categories`, `orders`, `order_items`, `reviews`, `lab_packages`, `lab_test_bookings`, `store_settings`, plus the `neon_auth` schema (now the real, active auth backend).

---

## 2026-08-30 migration — auth + data layer

Replaced the entire hand-rolled Neon shim with real Neon Auth + Neon Data API, per user request ("all data on Neon, auth controlled by Neon Auth"). Summary of what changed:

- `src/lib/neon.ts` deleted — no more raw Postgres connection string anywhere in the app.
- `src/lib/supabase.ts` now creates a real `@neondatabase/neon-js` client (`SupabaseAuthAdapter` for `.auth.*`, the Data API for `.from(...)`) instead of the old `NeonQueryBuilder`/`neonClient` shim.
- `AuthContext.tsx`: removed both hardcoded admin-backdoor passwords and the hardcoded-email admin check (now derives admin purely from `profiles.role`, which only an existing admin or a trusted DB operation can set).
- `src/lib/users.ts`: admin user-management functions now call the real Better Auth admin API (`supabase.auth.admin.updateUserById` / `.deleteUser`) instead of nonexistent Postgres RPCs.
- `ProfilePage.tsx`: password change now actually calls the auth API (was previously a pure UI mock that changed nothing).
- Database: enabled RLS on all 10 app-domain tables, added `is_admin()`/`is_retailer()` helper functions, a trigger blocking self-escalation of `profiles.role`/`approval_status`, and a `products_public` view (excludes `retailer_price`) for anonymous/customer reads.
- Migrated the 3 existing accounts (admin, 1 customer, 1 retailer) into real Neon Auth accounts, re-pointed their `profiles`/`retailer_approvals` rows at the new ids, and set the admin account's Better Auth role.
- Removed `@supabase/server`, `@supabase/ssr`, `@supabase/supabase-js`, `@neondatabase/serverless` from `package.json`; deleted dead `src/lib/server.ts`.
- Verified end-to-end in the dev server: customer login + real DB-backed product/pricing, retailer login + correct wholesale pricing, anonymous pre-login store branding, anonymous "check retailer status" lookup. **Admin login was not verified by me** — the pre-existing Neon Auth admin account's password is unknown to me; the user will set it themselves via the Neon Console or the app's now-real "Forgot password" flow before first admin login.
- Verified `npm run build` succeeds and the built `dist/` bundle no longer contains the leaked DB password, admin backdoor passwords, or any `postgresql://` connection string.

**Known trade-off made during this migration:** `products` table `SELECT` had to be opened to all `authenticated` users (not just admin/retailer) because the app's shared `fetchProducts()` reads `retailer_price` in the same query customers use, then picks which price to display client-side by role. True column-level hiding of `retailer_price` from customers would need that shared fetch path refactored (e.g. always reading `products_public` for the customer-facing path and a separate retailer-only fetch for pricing) — not done here, flagged as a new item below.

**Not done / still open from this migration:**
- `auth_users` table still exists but is fully unused by app code — safe to drop once the user confirms admin login works with their own new password (kept as a fallback until then).
- Real file/image storage (P1-4) still isn't implemented — uploads now fail with a clear error instead of silently lying about success, but nothing is actually stored yet.
- Realtime cross-device sync (P1-5) still isn't implemented — the Neon Data API doesn't offer it; the fake channel-based stubs were removed so the code no longer pretends to support it.

---

## P0 — Critical (live security exposure / core functionality broken)

| # | Issue | Location | Status |
|---|---|---|---|
| P0-1 | Live Neon **owner** connection string (incl. password `npg_UOkw6Ks9FcjE`) hardcoded as a fallback, committed to git, and shipped into the client JS bundle (`VITE_`-prefixed env vars are inlined by Vite). Confirmed present in built `dist/assets/index-*.js`. Any site visitor can read devtools and get full read/write/DDL access to the production database, bypassing the app entirely. | `src/lib/neon.ts:6` | **Fixed 2026-08-30** — `neon.ts` deleted; app now talks to the Neon Data API, no raw connection string anywhere; verified absent from the built bundle. |
| P0-2 | No backend exists. All DB access, including the `supabase`-shaped Neon shim, runs directly in the browser with the credentials from P0-1. Every authorization rule (admin-only actions, retailer approval gate, blocked-account checks) is enforced only in client JS and is trivially bypassable once the DB credentials are known. This is the structural root cause behind P0-1, P0-3, and P0-4 actually mattering. | `src/lib/neon.ts`, `src/lib/supabase.ts`, `vite.config.ts` (no proxy/API) | **Fixed 2026-08-30** — still no app backend, but authorization is now enforced server-side by Postgres RLS on every table via the Neon Data API, not by client JS or secret credentials. |
| P0-3 | Passwords are stored and compared in **plaintext** — never hashed anywhere in the app. Verified directly in the DB (`auth_users.password_hash` holds the raw password string, e.g. `Subhone@2026`, no bcrypt/argon2 prefix). Sign-up writes the raw password straight to `password_hash`; sign-in does `userRow.password_hash !== password`; admin password-reset also writes the raw new password. No hashing library exists in `package.json` or `src/`. | `src/lib/supabase.ts:422` (compare), `:467-471` (sign-up insert), `:346-356` (admin reset) | **Fixed 2026-08-30** — real Neon Auth (Managed Better Auth) now owns credential storage/hashing/comparison; `auth_users` is unused by app code. |
| P0-4 | Two independent hardcoded admin-password backdoors ship in the client bundle. Anyone reading the JS can log in as full admin without ever touching the database. | `src/lib/supabase.ts:409` (`"Subhone@2026"` / `"admin123"`), `src/contexts/AuthContext.tsx:268-277` (case-swap retry of `"Subhone@2026"`/`"SubhOne@2026"`) | **Fixed 2026-08-30** — both backdoors removed, along with the hardcoded-admin-email special case; admin status now comes only from `profiles.role`, settable only by an existing admin (RLS + trigger enforced). |
| P0-5 | The custom `NeonQueryBuilder.update()`/`.delete()` methods return a `Promise` instead of a synchronously chainable builder, but nearly every call site still uses the old Supabase-style `table.update(x).eq(...)` pattern without awaiting first. Confirmed via `npx tsc --noEmit`: **109 type errors across 19 files**, concentrated exactly on this pattern in `orders.ts` (17), `retailers.ts` (9), `products.ts` (8), `users.ts` (6), `settings.ts` (4), `reviews.ts` (3). Vite/esbuild does not type-check on build, so this ships silently — most admin/retailer write actions (order status updates, user approve/block/delete, product edits, settings edits, review edits) are very likely throwing `TypeError: ... .eq is not a function` at runtime right now. | `src/lib/supabase.ts:178-209` (root cause); call sites in `src/lib/orders.ts`, `retailers.ts`, `products.ts`, `users.ts`, `settings.ts`, `reviews.ts` | **Fixed 2026-08-30** — the hand-rolled query builder is gone, replaced by the real `@neondatabase/postgrest-js` client (proper chaining); `tsc` error count dropped from 109 to 35, all remaining ones pre-existing and unrelated (see P1-8). |
| P0-6 | `resetPasswordForEmail` ("forgot password") is a no-op stub that always reports success but does nothing — no email sent, nothing reset. Silently misleads users. | `src/lib/supabase.ts:507-509` | **Fixed 2026-08-30** — now calls the real Neon Auth password-reset flow (Neon's shared dev SMTP by default; see production checklist note below for going live). |

## P1 — High priority

| # | Issue | Location | Status |
|---|---|---|---|
| P1-1 | Two parallel, redundant user tables (`auth_users` and `profiles`) manually kept in sync by app code on every signup/update — drift risk if one write fails and the other succeeds. | `src/lib/supabase.ts` (signUp, admin RPCs), DB schema | **Mostly fixed 2026-08-30** — `auth_users` is no longer written or read by any app code (identity now lives in `neon_auth`); the table itself hasn't been dropped yet, pending the user confirming admin login with their own new password. |
| P1-2 | A separate, entirely unused `neon_auth` schema (Neon's managed auth product) exists with 1 orphaned user row — dead infrastructure, confusing alongside the custom `auth_users` table. | Neon DB, schema `neon_auth` | **Fixed 2026-08-30** — `neon_auth` is now the real, actively-used identity backend (Neon Auth), no longer orphaned. |
| P1-3 | `categories` table (slug, accent color, HSN, etc.) has 0 rows and is disconnected from real data — `products.category_name` is just a free-text string. Either finish wiring categories or remove the table. | DB table `categories`; `products.category_name` | Open |
| P1-4 | Image/avatar/logo uploads are silently broken — the Neon shim's `storage.upload()`/`getPublicUrl()` are stubs that report fake success without persisting any file. | `src/lib/supabase.ts:526-537`; called from `src/lib/products.ts:126-127,209-210`, `src/lib/settings.ts:127-128` | **Partially fixed 2026-08-30** — `src/lib/storage.ts` now returns an honest error instead of silently faking success; real file storage (e.g. Neon Object Storage) still isn't implemented. |
| P1-5 | "Real-time multi-device sync" is silently non-functional — the shim's `channel()/on()/subscribe()` are no-ops that never fire callbacks, contradicting code comments about live cross-device updates. | `src/lib/supabase.ts:539-550`; `src/lib/settings.ts:203-241`; `StoreSettingsContext.tsx:52-61` | **Partially fixed 2026-08-30** — misleading fake-channel code removed (the Neon Data API has no realtime offering); products still refresh via the existing polling fallback. Genuine cross-device realtime remains unimplemented. |
| P1-6 | Hand-parsed `.or()` filter-string builder splits on `,`/`.` without escaping interpolated values first — a value containing a literal comma (e.g. in an email) can silently corrupt the parsed condition, including in the retailer-approval login-gate lookup. | `src/lib/supabase.ts:236-259`; call sites `src/contexts/AuthContext.tsx:128,359`, `src/lib/retailers.ts` | **Fixed 2026-08-30** — the custom parser is gone; `.or()` now goes through the real PostgREST client. |
| P1-7 | Leftover Supabase dependencies/files/docs after the Neon migration: `@supabase/server`, `@supabase/ssr`, `@supabase/supabase-js` still in `package.json`; dead SSR helper `src/lib/server.ts` with no real caller; `.env.example` documents only Supabase vars and omits `VITE_NEON_DATABASE_URL` entirely, misleading new setups toward reproducing P0-1. | `package.json:14-16`, `src/lib/server.ts`, `.env.example` | **Fixed 2026-08-30** — Supabase deps and `server.ts` removed; `.env.example` now documents the two real Neon Auth/Data API vars. |
| P1-8 | Unrelated bugs surfaced by `tsc`: undefined `handleProductClick`/`pStock` referenced in `OffersPage.tsx`; undefined `KEY_CATEGORIES` referenced in `MedicinesPage.tsx`; missing `retailerPrice` field read on the mapped product type in `CategoryPage.tsx`/`MedicinesPage.tsx`. | `src/pages/OffersPage.tsx:339,356,360`; `src/pages/MedicinesPage.tsx:180-181,209,222-223,344,349,352,388`; `src/pages/CategoryPage.tsx:189,191` | Open — untouched by the auth/data migration. |
| P1-9 | `localStorage` is used as a parallel source of truth alongside the DB for orders, retailers, and settings — e.g. "deleted" orders are only hidden via a local flag, so they reappear on other devices/browsers. Settings writes to `localStorage` *before* confirming the DB write succeeded, so UI can show "saved" while the DB write actually failed. | `src/lib/orders.ts:41-77`; `src/lib/retailers.ts:19`; `src/lib/settings.ts:52,61-63,74,73-107` | Open |
| P1-10 | Duplicate lockfiles (`package-lock.json` and `pnpm-lock.yaml`) risk dependency drift depending on which package manager a contributor or CI uses. | repo root | Open |
| P1-11 | `products` table `SELECT` (including `retailer_price`) is now granted to every logged-in user, not just admins/retailers, because the shared `fetchProducts()` reads both prices in one query and picks which to display client-side by role. A technically-inclined customer could read wholesale pricing by calling the Data API directly. | `src/lib/products.ts:65-66` (`fetchProducts`); RLS policy `products_select_authenticated` | **New 2026-08-30** — accepted trade-off during the auth/data migration; fixing properly means splitting the customer and retailer product-fetch paths (customer path reads `products_public`, which already excludes `retailer_price`). |

## P2 — Low / maintainability

| # | Issue | Location | Status |
|---|---|---|---|
| P2-1 | `AdminDashboard.tsx` is a single ~218KB file — hard to review, test, or split ownership. | `src/pages/AdminDashboard.tsx` | Open |
| P2-2 | `README.md` is effectively empty (one line) — no setup/deploy instructions. | `README.md` | Open |
| P2-3 | Unused `neonConfig` import — no fetch/WebSocket tuning configured. | `src/lib/neon.ts:1` | **Fixed 2026-08-30** — moot; `neon.ts` deleted as part of the auth/data migration. |
| P2-4 | Broad `console.error`/`console.warn` swallowing of DB failures across `src/lib/*.ts` with silent fallbacks to `localStorage`/defaults — makes production debugging hard and can mask data loss. | `orders.ts`, `products.ts`, `users.ts`, `settings.ts`, `supabase.ts` (multiple sites) | Open |
| P2-5 | No password length/complexity enforcement on regular sign-up (only a 6-char minimum exists, and only in the admin password-change path). Moot until P0-2/P0-3 are fixed, but worth doing together. | `src/lib/users.ts:107-109`; sign-up flow in `src/lib/supabase.ts:456-505` | Open |

---

## Notes

- All P0 items are now fixed as of 2026-08-30 — see "2026-08-30 migration" above for what changed and what's explicitly still open (P1-11, storage, realtime, dropping `auth_users`).
- **Action needed from the user**: set the real admin password (via Neon Console → Auth → Users, or the app's "Forgot password" flow) and confirm admin login end-to-end, then this tracker can be updated to drop `auth_users` and mark P1-1 fully fixed. Also set `VITE_NEON_AUTH_API` and `VITE_NEON_DATA_API` in the Vercel project's environment variables (this session only changed `.env.local`; Vercel wasn't touched) — see `.env.example` for the values.
- Before going fully live, work through Neon's production checklist for Managed Better Auth: replace the shared dev SMTP with a real email provider, set up real Google/GitHub OAuth credentials if any are used, and turn off "Allow Localhost" in Auth settings.
- P1-3, P1-8, P1-9, P1-10 remain open and untouched — none were in scope for the auth/data migration.
