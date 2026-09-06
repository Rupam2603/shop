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
- **Authoritative Admin-Only Catalog & Direct Neon SQL Fetching (`src/lib/products.ts`)**:
  - `fetchProducts()` and `fetchCategories()` rewritten to query Neon Postgres directly via `@neondatabase/serverless` `sql` with auto-casting, eliminating anonymous HTTP 400 errors from the PostgREST Data API.
  - Added indexed `is_listed` boolean column (`products.is_listed` and `inventory_products.is_listed`) in Neon Postgres.
  - Storefront queries (`fetchProducts()`) strictly filter by `WHERE is_listed = true`, ensuring only products explicitly published/listed by the administrator appear to customers and retailers.
  - Admin portal queries with `includeUnlisted: true` (`fetchProducts({ includeUnlisted: true })`), displaying all products along with `● Listed` / `○ Draft (Hidden)` indicators, a visibility filter, a Product Modal switch, and 1-click publishing toggle (`toggleProductListing`).
  - Removed all hardcoded/fake product catalogs (`ALL_PRODUCTS` ~80 items, `FLASH` ~4 items, `bestSellers`, and static `ALL_CATEGORIES.products`) across all storefront views.
  - Dynamically computes brands, category counts, and discounts directly from active database products.
- **Footer Phone Removal & Cross-Device Cache Invalidation**:
  - Removed phone number section from `src/components/Footer.tsx` for both Customer and Retailer portals across all viewport sizes.
  - Added strict `no-cache, no-store, must-revalidate` headers for `/index.html` in `vercel.json` and `<meta http-equiv="Cache-Control">` in `index.html` to prevent stale caches on desktop browsers while keeping hashed static assets immutable.
- **Bulk Excel Product Upload & Unified Discount Calculation (Active)**:
  - Installed SheetJS (`xlsx`) and `lucide-react` for client-side Excel parsing and file handling.
  - Implemented `src/lib/pricing.ts`: Single source of truth for MRP-baseline customer and retailer discount percentages, offer margin calculations, and pricing validation warnings used by both manual product form and bulk import.
  - Implemented `src/lib/productExcelImport.ts`: Robust Excel importer that scans rows to auto-locate headers, maps standard product master sheet columns, computes customer/retailer discounts dynamically, and surfaces validation errors/warnings.
  - Implemented `src/lib/bulkInsertProducts.ts`: Batched database writes (chunks of 10) that safely call `createProduct` from `src/lib/products.ts`, creating records across Neon Postgres `products` and `inventory_products` tables with sequential IDs and category resolution.
  - Implemented `src/components/BulkProductUploadModal.tsx`: Interactive drag-and-drop modal featuring file drop zone, downloadable sample `.xlsx` template, live preview table with calculated pricing, validation status flags, and real-time batch upload progress.
  - Integrated "Upload Excel" action buttons in `AdminDashboard.tsx` (top navigation bar and product filter toolbar), enabling seamless 1-click bulk imports.
- **Key Category Alignment Across Admin Panel & Storefront (Active)**:
  - Canonical product categories synchronized via `KEY_PRODUCT_CATEGORIES` in `src/lib/keyCategories.ts`: "Skin Care & Ointments", "Pain Relief & Muscle Care", "Weight Loss & Metabolism", "Daily Wellness & Immunity", "Monsoon Health & Antiseptics", "Baby Care & Infant Nutrition", "Women's Health & Hygiene", "Men's Health & Vitality", "Diet & Digestive Health", "Hair Care & Scalp Therapy", "Vaccines & Medical Disposables", and "Medical Supplies & Devices".
  - Admin Panel Add Product form (`ProductModal` in `AdminDashboard.tsx`) category dropdown aligned directly with the storefront Key Categories, defaulting to "Skin Care & Ointments".
  - Updated `KeyCategoriesBar.tsx` `filterCat` mappings so clicking categories instantly filters corresponding products for both retail customers and wholesale retailers.
  - Updated `MedicinesPage.tsx` sidebar filter list (`CATEGORY_LIST`) and category matching logic to reflect canonical Key Categories while preserving backward compatibility for legacy names.
- **Highly Functional Product Search & Similar Products Engine (Active)**:
  - Created `src/lib/productSearch.ts`: Multi-pass tokenization and relevance scoring algorithm. Matches exact and partial substrings in name and brand, splits into words for word-order invariance, and emphasizes similar products from the same brand, matching name tokens, and same categories when exact matches are few or zero.
  - Created `src/pages/SearchPage.tsx`: Dedicated full-featured Search Results Page with real-time query updates, exact vs similar match breakdown badges, smart fallback banner when showing similar products, brand pills, in-stock filter, sort dropdown (Relevance, Price, Discount), customer vs retailer dynamic pricing, and cart quantity steppers.
  - Upgraded global search in `src/components/NavBar.tsx`: Form submission on Enter or search icon click immediately routes to `/search?q=...` (`#search?q=...`), with a live smart dropdown showing top items, brand matches, and a "View all results" button.
- **Checkout "Cart Total Changed" Error Resolution (Active)**:
  - Fixed client-side double-discounting issue in `ProductModal.tsx` where `retailerPrice(product.price)` re-multiplied an already discounted `retailer_price` (₹9) by 0.85 (yielding ₹8), causing server-side authoritative total discrepancy (`Math.abs(suppliedTotal - authoritativeTotal) > 0.01` in `api/create-order.ts`).
  - Passed canonical `dbId`, `numeric_id`, `customer_price`, and `retailer_price` in `addToCart` payloads across `ProductModal.tsx`, `HomePage.tsx`, `CategoryPage.tsx`, `MedicinesPage.tsx`, `OffersPage.tsx`, and `SearchPage.tsx`.
  - Updated `retailerPrice` helper in `ProductModal.tsx` to directly return exact `explicitRetailerPrice` when provided.
  - Updated `CartContext.tsx` to default `userRole` to `"retailer"` and prioritize `product.retailer_price`, ensuring items stored in local state and sent to `placeOrder` match Neon Postgres database rates exactly.
- **Mobile Drawer Menu Pruning (Sep 2026):** Streamlined mobile navigation drawer to only show "Home" and "Track Order" with icons and extraneous menu links removed as requested.
- **Mobile Scroll Lagging Optimization (Sep 2026):**
  - Resolved mobile browser scrolling stutter/lag by replacing `background-attachment: fixed` on `body` with `background-attachment: scroll` on mobile viewports (`fixed` forced the mobile GPU to continuously invalidate and re-render full background tiles during scroll).
  - Overrode heavy `backdrop-filter: blur(...)` effects on repeated product cards & badges for mobile screens (`max-width: 768px`).
  - Added `-webkit-overflow-scrolling: touch` and `content-visibility: auto` on offscreen product sections to drastically reduce offscreen paint and achieve silky smooth 60/120fps scrolling.
- **Full Delivery Partner Module & Live GPS Fleet Tracking (Sep 2026)**:
  - **Data Model (Neon Postgres)**:
    - Extended `public.user_role` enum with `'delivery_partner'`.
    - Created `public.delivery_partner_profiles` (user_id UUID PK, phone, address, avatar_url, vehicle_type, vehicle_number, profile_completed, is_on_duty, created_at, updated_at).
    - Created `public.delivery_locations` (user_id UUID PK, order_id TEXT, lat, lng, accuracy_m, updated_at) with index `idx_delivery_locations_order`.
    - Created `public.delivery_attendance` (id UUID PK, user_id UUID, work_date DATE, check_in_at, check_out_at, status, UNIQUE(user_id, work_date)).
    - Altered `public.orders` with `delivery_partner_id UUID REFERENCES users(id)`, `delivery_accepted_at TIMESTAMPTZ`, and `delivery_status TEXT DEFAULT 'unassigned'`.
  - **Data Service & API Layers**:
    - `src/lib/deliveryPartners.ts`: `adminCreateDeliveryPartner`, `fetchAllDeliveryPartners`, `getDeliveryPartnerById`, `completeDeliveryPartnerProfile`, `toggleDeliveryPartnerDuty`, `fetchDeliveryAttendance`.
    - `src/lib/deliveryOrders.ts`: `fetchAvailableOrdersForPartners`, atomic conditional `acceptOrderForDelivery` (`WHERE delivery_status = 'unassigned'`), `fetchOrdersForPartner`, `markOrderPickedUp`, `markOrderDelivered`.
    - `src/lib/deliveryLocation.ts` & `api/delivery-location.ts`: High-performance throttled location pushing (10-15s) and order-scoped location reads for retailers.
  - **UI & Routing**:
    - `src/pages/DeliveryPartnerDashboard.tsx`: Dedicated delivery partner app view with compulsory first-time profile completion, live on-duty toggle with continuous GPS `watchPosition`, incoming orders feed with race-condition handling, active delivery controls ("Mark Picked Up", "Mark Delivered", "View Map"), past delivery history, and retailer approval verification.
    - `src/components/LiveDeliveryMap.tsx`: Live GPS map supporting official Google Maps API (`VITE_GOOGLE_MAP_API` / `VITE_GOOGLE_MAPS_API_KEY`) with automatic OpenStreetMap/Leaflet fallback. Features single-order delivery tracking (with "Order is on the way / Arriving in 15–25 mins" banner, partner avatar, vehicle number, and instant phone call button) and Admin fleet view (all active on-duty partners with live pings).
    - `src/components/OrderTrackingModal.tsx`: Embedded `<LiveDeliveryMap />` whenever an order has been accepted or picked up by a delivery partner, falling back to simulated pipeline for unassigned orders.
    - `src/pages/AdminDashboard.tsx`: Added "Delivery Partners" navigation tab with KPI stats, new partner creation modal, detailed profile inspection, fleet map, and attendance log table.
    - `src/pages/LoginPage.tsx` & `src/contexts/AuthContext.tsx`: Unified Admin and Delivery Partner entry point under a single "Admin / Delivery Partner" tab (`expectedRole="staff"`). Actual account role is resolved strictly from database on authentication, auto-routing to `AdminDashboard` or `DeliveryPartnerDashboard` while preserving strict isolation from Customer and Retailer roles. Remember-role supports `delivery_partner` sessions.
- **Delivery Partner Attendance Excel Export & Weekly Off Day (Sep 2026)**:
  - **Data Model**: Added `weekly_off_day TEXT` column to `public.delivery_partner_profiles` (stores e.g. "Sunday", "Monday", ..., or null if no fixed off day).
  - **Admin Control**: Added weekday dropdown ("None (Works 7 Days)", "Sunday" through "Saturday") in `AdminDashboard.tsx` under the partner inspection details modal, saving immediately to Neon Postgres via `updateDeliveryPartnerWeeklyOff`.
  - **Full-Range Attendance Query**: Implemented `fetchAttendanceReport({ startDate, endDate, partnerId })` in `src/lib/deliveryPartners.ts`. Uses `generate_series(startDate::date, endDate::date, interval '1 day')` to generate every single calendar day in the requested week/month across partners (including days with zero attendance activity).
  - **Smart Status Resolution**:
    - Evaluates calendar day's weekday name in local time.
    - If partner checked in (`check_in_at`), status is `Present`.
    - If partner has no check-in and the day matches their assigned `weekly_off_day`, status is automatically excused as `Week Off`.
    - Otherwise, marked `Absent`.
    - Historical active partners are retained across ranges; partners with no assigned off-day display `Not Set` in the `Week Off` column.
  - **Client-Side Excel Generator**: Implemented `src/lib/attendanceExcelExport.ts` using SheetJS (`xlsx`). Generates formatted `.xlsx` files with exact columns: `Sl. No.`, `Name`, `Mobile Number`, `Date`, `Check In`, `Check Out`, `Status`, `Week Off`, with human-readable local times (e.g. `09:14 AM` / `—`) and custom column widths (`worksheet["!cols"]`).
  - **UI Integration**: Added "📊 Attendance Reports" sub-tab in `DeliveryPartnersTab` (`AdminDashboard.tsx`) with:
    - Range type toggle: `Weekly Report` vs `Monthly Report`.
    - Week picker (pick any day to derive Monday–Sunday with resolved human date text) and Month/Year picker.
    - Scope filter: "All Delivery Partners" or specific partner selection.
    - Download Excel button with progress spinner and feedback alerts.
- **Delivery Partner Visibility in Retailer Order Tracking (Sep 2026)**:
  - **Data Layer & Joins**:
    - Extended `DbOrder` in `src/lib/orders.ts` with `delivery_partner_phone?: string | null`.
    - Updated `/api/orders` to `LEFT JOIN users dp ON dp.id = o.delivery_partner_id` and `LEFT JOIN delivery_partner_profiles dpp ON dpp.user_id = o.delivery_partner_id`, populating `delivery_partner_name` and `delivery_partner_phone` directly on order retrieval.
    - Added fallback partner lookup enrichment in `fetchUserOrders` and `fetchOrderByNumber` in `src/lib/orders.ts` to ensure joined name and phone are always present even when running against Supabase client fallback.
  - **Profile Page Order Cards (`src/pages/ProfilePage.tsx`)**:
    - Added delivery partner strip directly on the order card when `deliveryPartnerId` is present: shows *"Picked up by {deliveryPartnerName}"* (or *"Assigned to"*) with partner name and direct clickable `tel:` call button icon.
    - Completely absent when order has not yet been accepted by a partner, preserving standard appearance for unassigned/processing orders.
    - Automatically covers both retail customers and wholesale pharmacy retailers since `ProfilePage.tsx` order history is shared.
  - **Order Tracking Modal (`src/components/OrderTrackingModal.tsx`)**:
    - Embedded `LiveDeliveryMap` with live moving GPS pin, partner phone, and delivery address whenever `delivery_status` is `"accepted"` or `"picked_up"`.
    - Once marked `"delivered"` or if still `"unassigned"`, safely switches back to static status timeline without leaving stale or frozen location coordinates.
    - Added parallel **Delivery Executive Card** in the tracking detail view showing partner name (*"I'm your delivery partner, {name}"*), partner avatar, delivery status tag, and prominent `tel:` call button.
    - Added reactive 10-second polling interval to auto-refresh active order status and instantly display newly assigned delivery partners or reassignments without closing the modal.
- **Storefront & Database Key Category Synchronization (Sep 2026)**:
  - Synchronized and populated all 12 canonical Key Categories ("Skin Care & Ointments", "Pain Relief & Muscle Care", "Weight Loss & Metabolism", "Daily Wellness & Immunity", "Monsoon Health & Antiseptics", "Baby Care & Infant Nutrition", "Women's Health & Hygiene", "Men's Health & Vitality", "Diet & Digestive Health", "Hair Care & Scalp Therapy", "Vaccines & Medical Disposables", "Medical Supplies & Devices") into Neon Postgres `categories` table.
  - Normalized all products across `products` and `inventory_products` tables, migrating similar/redundant category strings (e.g. "Skin Care, Powders & Ointments" → "Skin Care & Ointments", "Pain Relief & Balms" → "Pain Relief & Muscle Care", "Energy, Hydration & Supplements" → "Daily Wellness & Immunity", "First Aid & Antiseptics" → "Monsoon Health & Antiseptics", "Antacids, Digestion & Laxatives" → "Diet & Digestive Health", "Baby Care" → "Baby Care & Infant Nutrition", "Medical Supplies & General" → "Medical Supplies & Devices", and "Personal Care > Men's Care > *" → "Men's Health & Vitality").
  - Linked products to corresponding `category_id` and structured sub-categories ("Deodorant", "Face Wash", "Shaving Foam", "Shaving Gel").
  - Cleaned up `INITIAL_CATEGORIES` in `AdminDashboard.tsx`, `CATEGORY_FEATURES` and `CATEGORY_DESCRIPTIONS` in `ProductModal.tsx`, and removed legacy category artifacts.
- **Strict Category Matching & Cross-Category Leakage Elimination (Sep 2026)**:
  - Replaced overly broad keyword regex matching (`/oil/`, `/gel/`, `/powder/`, `/balm/`, `/spray/`, etc.) in `src/lib/keyCategories.ts` with `isProductInCategory(productCat, targetCatIdOrName)`.
  - Products now strictly belong to their assigned category without false-positive keyword matching (e.g., shaving gel no longer leaks into Skin Care, face wash containing "oil" no longer leaks into Hair Care or Pain Relief, pain relief gels/sprays no longer leak into Men's Health).
  - Synchronized `src/pages/HomePage.tsx`, `src/pages/MedicinesPage.tsx`, and `src/pages/CategoryPage.tsx` with `isProductInCategory`.
- **Sub-Category Visibility in Product Description & Single Stock Count Fix (Sep 2026)**:
  - **Sub-Category Visibility**:
    - Extended `PopupProduct` in `src/components/ProductModal.tsx` with `subCat?: string`.
    - Added a `Sub-Category` pill in the product modal sidebar metadata grid under Category.
    - Added a `Sub-Category: {product.subCat}` badge in the Description section header as well as an explicit `Category: {product.cat} • Sub-Category: {product.subCat}` strip within the description block.
    - Added sub-category pill tags alongside subtitle (`sub`) on product cards across `HomePage.tsx`, `CategoryPage.tsx`, `MedicinesPage.tsx`, `SearchPage.tsx`, and `OffersPage.tsx`.
    - Mapped `subCat: p.sub_category_name || ""` across database query pipelines and search result payloads so sub-category is accurately populated from Neon Postgres `products` and `inventory_products`.
  - **Single Stock Count Enforcement**:
    - Removed duplicate stock count display across storefront product cards.
    - Cards previously showed a top-right corner image badge (`📦 {stock} units` / `{stock} in stock`) AND a second indicator below the title/subtitle (`● {stock} in stock` or `{stock} available`).
- **Admin Category Taxonomy Cleanse & Safe Deletion Workflow (Sep 2026)**:
  - Removed all legacy existing categories from the Neon Postgres database (`categories` and `sub_categories` tables).
  - Unlinked products safely from old `category_id` and `sub_category_id` foreign references without deleting the products themselves.
  - Enhanced `deleteCategory` and `deleteSubCategory` in `src/lib/categories.ts` to automatically unlink products before deleting, preventing foreign key constraint errors.
  - Replaced static `INITIAL_CATEGORIES` with fully dynamic database-driven categories in `AdminDashboard.tsx`, allowing admins to create, select, and delete categories on demand.
  - Added delete buttons (`✕`) directly on category tags in `SettingsTab` and inside the `ProductModal` category picker.
- **Storefront Category Normalization & Miscellaneous Placement Fix (Sep 2026)**:
  - **Database Category & Sub-Category Normalization (Neon Postgres)**:
    - Synchronized all 12 canonical Key Categories into `public.categories` and created active sub-categories in `public.sub_categories`.
    - Removed obsolete and abbreviated category records (`Monsoon`, `Pain Relief`).
    - Normalized all 49 products across both `public.products` and `public.inventory_products` tables with canonical `category_name`, `sub_category_name`, `category_id`, and `sub_category_id`:
      - Replaced abbreviated `"Men's"` with canonical `"Men's Health & Vitality"` across 27 Park Avenue products.
      - Populated structured sub-categories for all 27 Park Avenue products (`Deodorant`, `Perfume`, `Shaving Foam`, `Soap`, `Grooming Kit`), resolving missing sub-category tags and enabling full sub-category filtering on `CategoryPage.tsx`.
      - Moved `Park Avenue Damage Free Beer Shampoo` from `"Men's"` to `"Hair Care & Scalp Therapy"` (sub-category `"Shampoo & Scalp Care"`), giving the Hair Care category genuine live catalog representation.
      - Moved `Bengal Cotton 400 gm` from `"Skin Care & Ointments"` to `"Medical Supplies & Devices"` (sub-category `"Surgical Cotton & Dressings"`), eliminating cotton appearing under skincare creams/powders.
      - Moved `surgical mask` from `"Vaccines & Medical Disposables"` to `"Medical Supplies & Devices"` (sub-category `"Surgical Masks & Disposables"`), ensuring medical protective supplies are visible in product listings rather than hidden behind vaccine appointment flows.
      - Updated `Dettol Antiseptic Liquid 250ml` category from `"Monsoon"` to `"Monsoon Health & Antiseptics"` and sub-category from `"Monsoon Health"` to `"Antiseptic Liquid"`.
      - Updated `Amrutanjan Strong Pain Balm 44g` category to `"Pain Relief & Muscle Care"` and sub-category from `"Gel"` to `"Pain Relief Balm"`.
      - Updated `Volini Pain Relief Gel 15g` category to `"Pain Relief & Muscle Care"` and sub-category to `"Pain Relief Gel"`.
      - Populated sub-categories for Daily Wellness items (`Ayurvedic & Immunity`, `Energy & Electrolytes`, `Nutrition & Health Drink`, `Nutrition & Protein`) and Diet items (`Antacids & Digestion`).
  - **Storefront Category Alignment (`CategoryPage.tsx`)**:
    - Enhanced `categoryMeta` lookup in `src/pages/CategoryPage.tsx` to match against `c.name` in addition to `c.id` and `c.short`, ensuring that routing by canonical name or ID accurately resolves colors, taglines, sub-categories, and filtering rules.
- **Storefront Product Listing Restoration & Resilience Fix (Sep 2026)**:
  - **Root Cause Resolution**: `fetchProducts()` previously failed silently because SQL queries specified non-existent columns (`retailer_discount_percent`, `web_image_url`) on `public.products`, resulting in `NeonDbError: column "retailer_discount_percent" does not exist` and an empty array `[]` fallback across all storefront and catalog views.
  - **Database Schema Normalization (Neon Postgres)**: Added missing columns `is_listed` (BOOLEAN DEFAULT true), `retailer_discount_percent` (NUMERIC DEFAULT 0), and `web_image_url` (TEXT) across `public.products` and `public.inventory_products` tables on active clusters.
  - **Resilient Querying (`src/lib/products.ts`)**: Streamlined SQL queries to `SELECT * FROM products WHERE is_listed IS NOT FALSE ORDER BY numeric_id ASC`. Dynamically calculates `retailer_discount_percent` from `(mrp - retailer_price) / mrp` whenever missing, safely strips sensitive `purchase_price` for non-admin viewers, and hardens PostgREST fallback.
  - **Loading & Empty State UX (`HomePage.tsx`)**: Added dedicated loading spinner while catalog data is resolving and refined empty message display so active category names are explicitly rendered when a specific key category has 0 items.
- **Delivery Record Excel Export Totals & Bold Placement (Sep 2026)**:
  - **Explicit Summary Labels & Placement**: Updated `src/lib/deliveryRecordExcelExport.ts`. The headings `Total Purchase Price`, `Total Sell Price`, and `Total Profit` are now placed directly in the cell immediately preceding each calculated total amount (`Total Purchase Price` in Column H before Column I, and `Total Sell Price` and `Total Profit` merged across Columns H–I before Column J) with right alignment.
  - **Bold Styling**: Integrated `xlsx-js-style` to apply genuine font styling (`{ font: { bold: true } }`) across table headers and summary headings/totals.
- **Admin Profile Identity & Avatar Forever Persistence Fix (Sep 2026)**:
  - **Multi-Layer Authoritative Persistence (`src/lib/settings.ts`)**:
    - Re-architected `updateAdminProfileInDb` to target the active administrator record by email (`subhonehealthgroup@gmail.com` / `admin@subhone.com`) and ID in `public.profiles` using raw SQL with upsert resilience.
    - Synchronized profile updates across `public.profiles`, `public.users`, `public.auth_users`, and `store_settings` tables in Neon Lakebase Postgres.
    - Implemented `fetchAdminProfileFromDb(email, userId)` using direct Neon SQL queries, bypassing client-side PostgREST RLS limitations when reading profile details on admin dashboard mount.
  - **In-Browser Image Optimization & Storage Fallback (`AdminDashboard.tsx`)**:
    - Built-in canvas image resizer (max 360x360, 0.88 quality JPEG) for photo uploads and camera capture, ensuring lightweight, high-fidelity avatar data that stores seamlessly in Neon Postgres `text` columns without hitting network timeout or storage limits.
    - Uploads to CDN/Vercel Blob via `uploadImageToSupabase` when available, gracefully falling back to persistent optimized image storage in Postgres.
  - **Session & Local Cache Synchronization (`AuthContext.tsx` & `AdminDashboard.tsx`)**:
    - Updated `getStoredUser` and `signIn` in `AuthContext.tsx` to read persisted avatar, phone, and name from `sessionStorage` and `localStorage` (`subhone_admin_profile`) rather than resetting avatar to `null` or using hardcoded placeholder strings on refresh.
    - Added global event listener `subhone_admin_profile_updated` in `AuthContext.tsx` and dispatched upon clicking "Save All Changes Forever", reactively updating header avatars and user metadata in real time without requiring a manual page refresh.
- **Retailer & Customer Delivery Address & Personal Details Forever Persistence (Sep 2026)**:
  - **Root Cause Resolution**:
    - There was no `public.addresses` table in the active Neon Lakebase Postgres database cluster.
    - `src/lib/addresses.ts` was attempting to query Supabase PostgREST, silently failing on missing tables and falling back to temporary in-memory objects (`addr_${Date.now()}`) that disappeared on refresh.
    - Personal detail updates in `AuthContext.tsx` (`updateProfile`) executed PostgREST `.update()` calls that were blocked by missing session JWTs / RLS, and never touched the authoritative Neon SQL database or updated `public.auth_users`, `public.retailer_approvals`, or `public.users`.
  - **Authoritative Database Schema (`public.addresses` in Neon Postgres)**:
    - Created `public.addresses` table: `id TEXT PRIMARY KEY`, `user_id TEXT NOT NULL`, `label TEXT`, `name TEXT`, `phone TEXT`, `line1 TEXT NOT NULL`, `line2 TEXT`, `city TEXT NOT NULL`, `state TEXT NOT NULL`, `pincode TEXT NOT NULL`, `is_default BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
    - Added index `idx_addresses_user_id` on `public.addresses(user_id)`.
    - Added auto-migration `migrateCreateAddressesTable()` to `src/lib/migrations.ts` and wired into startup migrations to ensure all database branches maintain this schema.
  - **Direct Neon SQL Address Service (`src/lib/addresses.ts`)**:
    - Re-implemented `fetchUserAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, and `setDefaultAddress` using direct Neon `sql` template queries with transaction-like default switching.
    - Added robust multi-source user ID resolution (`getEffectiveUserId`) that checks `explicitUserId`, `localStorage["subhone_active_user_session"]`, `sessionStorage["subhone_active_admin_session"]`, and local caches.
  - **Multi-Table User Profile Persistence (`src/lib/users.ts`)**:
    - Implemented `saveUserProfileToDb({ userId, email, fullName, phone, shopName, avatarUrl })`.
    - Updates `public.profiles` via upsert, `public.auth_users` by ID or email, `public.retailer_approvals` by phone or shop name, and `public.users` safely via `LOWER(email)` avoiding UUID syntax errors on custom text IDs.
    - Synchronizes `localStorage["subhone_active_user_session"]`.
  - **AuthContext & Profile UI Hardening (`AuthContext.tsx` & `ProfilePage.tsx`)**:
    - `updateProfile` in `AuthContext.tsx` now calls `saveUserProfileToDb` to guarantee database persistence before mutating React state.
    - Added image canvas resizing (max 360x360, 0.88 JPEG) in `ProfilePage.tsx` for photo uploads.
    - Added async database saving status (`savingProfile`), status feedback message, and loading spinners on "Save Changes" button.
    - Added address modal validation, inline error alerts (`addrError`), and loading indicator (`addrSaving ? "Saving to Database…" : "Save Changes"`).
- **Streamlined Add to Cart (No Auto-Opening Cart Drawer) (Sep 2026)**:
  - **Cart Context Update (`src/contexts/CartContext.tsx`)**:
    - Removed intrusive automatic opening of the cart drawer (`setIsCartOpen(true)`) upon adding new products.
    - Updated `addToCart` with an optional `autoOpen?: boolean` parameter defaulting to `false`.
    - Added floating bottom-right toast notification (`cartToast`) displaying "Added to cart: {name}" with a quick "View Cart" CTA button, auto-dismissing after 2.5 seconds.
    - Allows retailers and customers to continuously browse and add multiple items without interruption, while the top bar cart counter updates in real time.
- **Platform-Wide Real-Time Order & Dashboard Auto-Refresh System (Sep 2026)**:
  - **The Problem**:
    - Previously, both Administrators and Delivery Partners (as well as Retailers/Customers) had to manually reload the page (F5 / browser refresh) to see newly placed orders, status updates, partner assignments, and delivery completions.
    - Serverless API endpoints (`/api/orders`, `/api/create-order`) lacked strict no-cache headers, causing browsers and CDNs to serve stale or 304 Not Modified responses even during automated polling.
    - Order retrieval functions lacked cache-busting timestamps.
    - `DeliveryPartnerDashboard.tsx` had a slow 10-second interval that flickered the UI with `setLoadingOrders(true)` on every tick and lacked focus/visibility triggers.
    - `ProfilePage.tsx` fetched orders only once upon component mount.
  - **Real-Time Cross-Tab & In-App Event Bus (`src/lib/orderEvents.ts`)**:
    - Built a robust event distribution bus utilizing `BroadcastChannel("subhone_orders_channel")`, window `CustomEvent("subhone_order_event")`, and `localStorage` storage pulse fallback.
    - Dispatches typed notifications: `"created"`, `"status_changed"`, `"assigned"`, `"picked_up"`, `"delivered"`, `"deleted"`.
    - Offers `notifyOrderEvent(type, { orderId, orderNumber, status, partnerId })` and `subscribeToOrderEvents(callback)` with automatic teardown.
  - **API & Client-Side Cache Elimination**:
    - `api/orders.ts` & `api/create-order.ts`: Enforced strict HTTP headers: `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`, `Pragma: no-cache`, `Expires: 0`, and `Surrogate-Control: no-store`.
    - `src/lib/orders.ts`: Attached unique cache-busting parameter `&_t=${Date.now()}` and `{ cache: "no-store" }` to `fetchAllOrders()`, `fetchUserOrders()`, and `fetchOrderByNumber()`.
    - Dispatched `notifyOrderEvent` inside `placeOrder()`, `updateOrderStatus()`, and `deleteOrder()`.
    - Connected `subscribeToOrdersRealtime()` and `subscribeToUserOrdersRealtime()` directly to the event bus.
  - **Delivery Partner Order Management Hardening (`src/lib/deliveryOrders.ts`)**:
    - Added `notifyOrderEvent` triggers to `acceptOrderForDelivery`, `markOrderPickedUp`, and `markOrderDelivered`.
    - Fixed PostgreSQL casting bugs by comparing `o.delivery_partner_id::text = ${cleanId}` instead of unsafe `${partnerId}::uuid` casts.
  - **Admin Dashboard Real-Time Synchronization (`src/pages/AdminDashboard.tsx`)**:
    - High-frequency 3.5s silent background polling loop (slows to 12s when browser tab is inactive to preserve resources).
    - Instant refresh triggers on `visibilitychange` (when tab becomes active) and `window.focus`.
    - Zero-latency (0ms) instant updates via `subscribeToOrderEvents`.
  - **Delivery Partner Dashboard Live Sync (`src/pages/DeliveryPartnerDashboard.tsx`)**:
    - Silent background polling loop every 3.5s without disruptive loading flickers (`loadOrders(isSilent = true)`).
    - Instant updates on window focus and tab visibility.
    - Real-time `subscribeToOrderEvents` subscription.
    - Visual "Live Sync" pulsing status badge and 1-click immediate manual refresh button in header.
  - **User Profile & Order Tracking Synchronization (`ProfilePage.tsx` & `OrderTrackingModal.tsx`)**:
    - `ProfilePage.tsx`: Added 5s polling loop, `visibilitychange`/`window.focus` triggers, and `subscribeToOrderEvents` listener for instant order status progression.
    - `OrderTrackingModal.tsx`: Polling optimized to 3.5s with tab focus listeners and real-time live pulse badge.


