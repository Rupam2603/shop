# Project Brain Context (brain.md)

> **CRITICAL INSTRUCTION FOR ALL AI AGENTS & MODELS:**
> 1. **Read this `brain.md` file FIRST** at the beginning of every session to quickly understand the project architecture, tech stack, database integration, conventions, and status without consuming unnecessary tokens or re-exploring the entire repo.
> 2. **Update this `brain.md` file** whenever you make significant architectural changes, add new features, adjust endpoints/database schemas, or fix key issues.

---

## 1. Project Overview & Identity
- **Name:** Store / Pharma & Healthcare E-commerce & Delivery Platform (`figma-make-app`)
- **Repository:** `https://github.com/Rupam2603/shop.git`
- **Live Deployment:** [https://shop-phi-plum.vercel.app](https://shop-phi-plum.vercel.app)
- **Primary Framework:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4

---

## 2. Core Architecture & Stack
- **Frontend Framework:** React 19 (`react`, `react-dom`)
- **Build Tooling:** Vite 8, TypeScript 5.7, `@vitejs/plugin-react`
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`, `@import 'tailwindcss';` in `src/index.css`)
- **Backend / Database:** Neon Lakebase Postgres (Data API + Neon Auth via `@neondatabase/neon-js` and `src/lib/neonAuth.ts`)
- **Package Manager:** `pnpm` (with `pnpm-lock.yaml` synced for Vercel builds) and `npm`

---

## 3. Directory Layout
```
├── src/
│   ├── main.tsx              # React entrypoint
│   ├── App.tsx               # Primary app component, global routing/views, modal management
│   ├── index.css             # Tailwind v4 import & global styles / theme definitions
│   ├── components/           # Reusable UI components (Navbar, Footer, Cart, Checkout, Modals, etc.)
│   ├── contexts/             # React Contexts (AuthContext.tsx, etc.)
│   ├── pages/                # Main views/pages
│   │   ├── HomePage.tsx          # Store landing page, banners, featured categories/products
│   │   ├── AdminDashboard.tsx    # Admin portal (Products, Orders, Retailers, Users, Analytics, Settings)
│   │   ├── MedicinesPage.tsx     # Pharmacy & medicine catalog
│   │   ├── LabTestsPage.tsx      # Diagnostic lab test booking
│   │   ├── InsurancePage.tsx     # Health insurance browsing
│   │   ├── VaccinesPage.tsx      # Vaccine appointment booking
│   │   ├── CategoryPage.tsx      # Category-specific product view
│   │   ├── OffersPage.tsx        # Promo & discount listings
│   │   ├── ProfilePage.tsx       # User profile, past orders, saved addresses
│   │   └── LoginPage.tsx         # User & admin authentication modal/page
│   └── lib/                  # Data service layers & helpers
│       ├── supabase.ts       # Supabase REST client (supabaseFetch helper)
│       ├── products.ts       # Product queries & mutations (CRUD)
│       ├── orders.ts         # Order management, status updates, invoice linkage
│       ├── retailers.ts      # Retailer management & partner onboarding
│       ├── reviews.ts        # Customer review operations
│       ├── settings.ts       # Platform settings, fees, payment configs
│       ├── storage.ts        # Image and document upload handling to Supabase Storage
│       ├── users.ts          # Profile & customer records
│       ├── addresses.ts      # User address book operations
│       └── invoiceGenerator.ts # PDF/HTML invoice generation for customer orders
```

---

## 4. Key Configurations & Environment Variables
The application reads configuration through `import.meta.env` (defined in `.env` / Vercel Environment Variables):
- `VITE_SUPABASE_URL` : Supabase project URL (e.g., `https://<ref>.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` : Supabase public anon key for direct REST requests
- `VITE_APP_NAME` / `VITE_DEV_MODE` : App branding & mock mode toggles

---

## 5. Coding & Contribution Rules
- **Component Style:** Default export for components. Use Tailwind utility classes directly in JSX.
- **Quotes & Apostrophes:** Use double quotes `"` or escape single quotes (`"We're here"`) to avoid build breaks.
- **Async & Data Layer:** Keep database interactions inside `src/lib/*`. Use graceful fallback error handling and optimistic UI where applicable.
- **Git & Deployment Flow:**
  1. Test build: `npm run build`
  2. Commit and push: `git add . && git commit -m "<msg>" && git push origin main`
  3. Deploy to Vercel: `npx vercel --prod --yes` (or automated via GitHub integration)

---

## 6. Recent Updates & Current State
- **Neon Auth Integration (Active)**:
  - Infrastructure declared in `neon.ts` (`auth: true`, `dataApi: true`) and deployed via `npx neon deploy`.
  - Neon Auth (`neon_auth` schema) active with Better Auth backend endpoints (`/sign-in/email`, `/sign-up/email`).
  - Trusted domains registered: `localhost`, `https://shop-phi-plum.vercel.app`.
  - Direct client implemented in `src/lib/neonAuth.ts` and integrated in `src/contexts/AuthContext.tsx`.
- **Admin Authentication**: Primary admin account `subhonehealthgroup@gmail.com` (`Subhone@2026`) with 1-click autofill and instant routing to Admin Dashboard (`src/pages/AdminDashboard.tsx`).
- **Inventory Products Database Table (Neon Postgres)**:
  - New table `public.inventory_products` created in Neon Lakebase Postgres storing complete product data along with product web images (`image_url`, `web_image_url`, `gallery_images`), pricing, stock levels, unit, dosage form, batch, and SKU.
  - CRUD operations in `src/lib/products.ts` synchronized with `public.inventory_products` and `public.products`.
- **Email & Password Authentication (Neon Postgres + Better Auth)**:
  - Streamlined, unified authentication system for Customers, Retailers, and Administrators using verified Email and Password credentials.
  - Dedicated role switches with tailored access tiers, credential autofill for admin operations, and complete password reset mechanisms.
- **User Account Management & Admin Approval System (Neon Postgres)**:
  - Table `public.auth_users` created in Neon Lakebase Postgres storing user accounts (`id`, `email`, `phone`, `password_hash`, `salt`, `full_name`, `role`, `status`, `approval_status`, `shop_name`, `avatar_url`, `last_login`, `approved_at`, `approved_by`, `blocked_at`, `created_at`, `updated_at`, `token_version`, `deleted_at`).
  - **Soft Delete**: `adminDeleteUserAccount` now soft-deletes users by stamping `deleted_at`. Deleted users cannot sign in.
  - **Session Invalidation**: Uses `token_version` in `auth_users` to immediately invalidate sessions when a user is blocked or deleted.
  - **Audit Logging**: `public.auth_login_logs` table records all login attempts (success, failed, blocked_attempt) with timestamps, IPs, and user agents. Exposed in Admin Dashboard via Login Logs sub-tab.
  - Table `public.profiles` synchronized with Neon database.
  - **Cryptographic Security**: Passwords hashed with SHA-256 and unique random salts (`src/lib/users.ts`). Plaintext passwords and hashes are never exposed.
  - **Customer Registration**: Role `customer`, status `active`, approval_status `approved`. Instant login upon registration.
  - **Retailer Registration & Approval Gate**: Role `retailer`, status `pending_approval`, approval_status `pending`. Login restricted with clear notice: *"Your retailer account is awaiting admin approval. You will be able to sign in once an administrator approves your account."*
  - **Admin Approval Controls**: One-click **Approve** (`pending_approval` → `active`), **Reject**, **Block**, and **Unblock** actions in **Admin Dashboard → User Accounts**.
  - **Account Blocking**: Blocked users cannot sign in (*"Your account has been blocked by an administrator. Please contact support."*). Unblocking immediately restores access.
  - **Admin Password Management**: Direct password reset/change tool in Admin Dashboard with salted SHA-256 re-hashing and instant activation.
- **Production URL:** `https://shop-phi-plum.vercel.app` (Live and verified).
- **Better Auth MCP & Client Integration**:
  - Better Auth client configured in `src/lib/auth-client.ts` (`createAuthClient` from `better-auth/react`).
  - `better-auth` installed with full TypeScript support, session management, and auth hooks.
  - Seamlessly integrated with Neon Auth Better Auth cloud endpoints and local database authentication fallback.
- **Full Responsiveness & Mobile-First Tightening (Latest)**: Comprehensive mobile-first polish applied across storefront and admin portal:
  - `src/index.css`: iOS safe-area support (`env(safe-area-inset-*)`), `min-h-[100dvh]`, `text-size-adjust: 100%`, iOS input zoom prevention (`font-size: max(16px, 1em)`), `text-wrap: balance` for `h1, h2, h3, h4`.
  - `NavBar.tsx`: Added `safe-top` to sticky header with backdrop blur; fixed mobile topbar spacing so Brand Logo truncates gracefully and Cart, Profile Avatar, and Logout buttons fit side-by-side without overflowing or being clipped on small screens (360px–390px); added Sign In / Register button in mobile drawer for guest users.
  - `ProductModal.tsx` & `AdminDashboard.tsx` modals: Responsive bottom-sheet pattern on mobile (`flex items-end sm:items-center`, `rounded-t-3xl sm:rounded-3xl`, `max-h-[90dvh] sm:max-h-[92vh]`).
  - `CartDrawer.tsx`: Full-width on phones, `h-[100dvh]`, and `safe-bottom pb-6 sm:pb-5` checkout CTA drawer.
  - `AdminDashboard.tsx`: Top bar uses `safe-top` and accessible 44px hamburger menu button; KPI stat cards stack flexibly (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`); user stats stack cleanly (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`).
  - `HomePage.tsx`: Product cards feature `lg:w-auto` for seamless grid layout while preserving horizontal snap scroll on mobile.
- **Order Management & Exact Invoices (Neon Postgres & Serverless)**:
  - Database schema migrated across Neon database clusters (`ep-falling-cell-azm5qjrf` and `ep-divine-scene-az33au23`): Added `mrp NUMERIC`, `sku TEXT`, `variant TEXT`, `batch_no TEXT`, `expiry_date TEXT`, and `image_url TEXT` to `public.order_items`.
  - Added `idempotency_key`, `user_role`, `shop_name`, `customer_name`, `customer_phone`, `payment_method`, `payment_status`, `status`, `total_amount`, and `shipping_address` to `public.orders`.
  - Order creation handled atomically via `@neondatabase/serverless` API routes (`/api/create-order` and `/api/webhook-payment`), eliminating checkout failure (`column "mrp" of relation "order_items" does not exist`).
  - Added dedicated Serverless Orders API route (`/api/orders.ts`) supporting `GET`, `PATCH`, and `DELETE`. Bypasses browser PostgREST JWT restrictions so `fetchAllOrders` and `fetchUserOrders` retrieve live authoritative orders directly from Neon PostgreSQL.
  - Strict invoice synchronization implemented across all platforms:
    - `src/lib/invoiceGenerator.ts`: Renders exact product name, SKU, batch number, expiry date, quantity, MRP, unit rate, and line totals for both retail customers and wholesale retailers.
    - `src/pages/AdminDashboard.tsx`: Order inspection dialog and PDF/print invoice generation reflect full item snapshots.
    - `src/pages/ProfilePage.tsx`: Downloadable invoice bill PDF for both customers and retailers matches the placed order items.
    - `src/components/OrderTrackingModal.tsx`: Real-time order tracking details and invoice bill reflect exact database-stored items without simulated fallbacks.
- **Infinity Loop Glowing Loader**:
  - Implemented `src/components/InfinityLoader.tsx` featuring a pure SVG/CSS animated infinity symbol (lemniscate `∞`) with a luminous glowing beam and trailing comet effect.
  - Non-black background requirement strictly adhered to (rendered on clean transparent / translucent glassmorphic light backdrops).
  - Integrated into initial app auth resolution (`LoadingScreen`), order tracking search modal (`OrderTrackingModal`), and order placement checkout overlay (`CheckoutModal`).
- **24/7 Customer Support Chatbot (`src/components/SupportChatbot.tsx`)**:
  - In-app responsive 24/7 live assistance widget floating in bottom right.
  - Quick-reply carousel: delivery time/charges, serviceable pincodes, prescription policy, order tracking, wholesale inquiry, and human support.
  - Keyword-intelligent assistant with instant answers, WhatsApp click-to-chat, direct phone calling (`tel:+919876543210`), and deep links to Order Tracking.
- **Simplified Authentication UI/UX (`src/pages/LoginPage.tsx`)**:
  - Redesigned into a clean, modern, centered card on soft healthcare gradient backdrop.
  - Intuitive segmented controls for mode switching (`[ Sign In | Create Account ]`) and account type (`[ Customer | Retailer | Admin ]`).
  - Streamlined input fields with clear labels, password visibility toggle, remember-me support, and dedicated retailer status check modal.



