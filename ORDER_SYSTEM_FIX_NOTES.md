# Order System Fix

## What was fixed

1. **Order creation is now atomic.** The API resolves products, validates stock, inserts the order and every order item, and decrements stock inside one database transaction. If anything fails, the whole transaction rolls back.
2. **Product identity is no longer guessed from `item.id` or product name.** The API uses the stored product UUID or numeric product ID and reads the authoritative product row.
3. **Prices are server-authoritative.** Customer orders use `customer_price`; retailer orders use `retailer_price`. The server recalculates the subtotal and delivery fee and rejects a stale/mismatched client total.
4. **Retailer cart pricing is corrected.** Newly added items now use retailer pricing when the signed-in role is retailer.
5. **Idempotency is preserved.** Retrying the same checkout request returns the already-created order instead of creating another order.
6. **Admin order visibility is automatic.** Because the current Neon Data API layer does not provide the old Supabase realtime channel, the admin dashboard polls the authoritative orders table every 5 seconds.
7. **Order identity is historical.** Admin display now prioritizes the role/shop snapshot saved on the order instead of allowing a later profile edit to change old orders.
8. **Invoices no longer fabricate order data.** Invoice item names, quantities, prices, line totals, customer, address, payment method/status and grand total come from the saved order snapshot. Fake GST, fake MRP/discount, fake batch/expiry, fake product fallback, and hardcoded UPI were removed.
9. **Invoice item snapshots were extended** with `mrp`, `batch_no`, and `expiry_date` columns so future invoices can preserve those values.
10. **Customer order-history invoices now use the actual database order**, not the current user's profile and a hardcoded UPI payment method.

## Database migration

Run `scripts/fix_order_system.sql` once against the production Neon database before deploying the updated application.

The migration adds the invoice snapshot columns and the indexes required for reliable order lookup.

## Validation

`npx tsc --noEmit` passes after the changes.

The local Vite build could not be executed because the uploaded dependency tree is missing Vite/Rolldown's native Linux optional binding. This is an environment/dependency-installation issue, not a TypeScript error in the modified code. A normal clean dependency install on the deployment/CI environment should regenerate the native optional dependency.

## Important security note

The original uploaded project contained database/auth credentials in local environment files and a login text file. Those files are intentionally excluded from the fixed source archive. Any credentials that have been committed to a repository or shared outside a secure environment should be rotated.
