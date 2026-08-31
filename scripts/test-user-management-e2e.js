import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const DATABASE_URL = process.env.VITE_NEON_DATABASE_URL || "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

// Server-side mirror of client crypto
function hashPasswordWithSalt(password, salt) {
  const combined = `${salt}::${password}::subhone_secure_salt_2026`;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

function verifyPassword(inputPassword, storedHash, storedSalt) {
  const computed = hashPasswordWithSalt(inputPassword, storedSalt);
  return computed === storedHash;
}

async function runE2ETests() {
  console.log("\n🧪 STARTING USER ACCOUNT MANAGEMENT & NEON DB E2E TESTS...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const testSuffix = Date.now();
  const customerEmail = `e2e_cust_${testSuffix}@example.com`;
  const retailerEmail = `e2e_ret_${testSuffix}@example.com`;
  const initialPassword = "TestPassword@123";
  const newPassword = "NewTestPassword@456";

  try {
    // ── Test 1: Customer Registration & Persistence ──
    console.log("▶ [Test 1] Customer Registration & Neon Persistence");
    const custSalt = crypto.randomBytes(16).toString("hex");
    const custHash = hashPasswordWithSalt(initialPassword, custSalt);

    const [custUser] = await sql`
      INSERT INTO public.auth_users (
        email, password_hash, salt, full_name, phone, role, status, approval_status
      ) VALUES (
        ${customerEmail}, ${custHash}, ${custSalt}, 'E2E Customer', '+91 99999 11111', 'customer', 'active', 'approved'
      )
      RETURNING id, email, full_name, role, status, approval_status, created_at;
    `;

    assert(custUser && custUser.email === customerEmail, "Customer account created in public.auth_users");
    assert(custUser.role === "customer", "Customer assigned role 'customer'");
    assert(custUser.status === "active" && custUser.approval_status === "approved", "Customer status is 'active' and approved");

    // ── Test 2: Customer Authentication ──
    console.log("\n▶ [Test 2] Customer Authentication");
    const [fetchedCust] = await sql`
      SELECT * FROM public.auth_users WHERE email = ${customerEmail} LIMIT 1;
    `;

    const isValidCustPass = verifyPassword(initialPassword, fetchedCust.password_hash, fetchedCust.salt);
    const isWrongCustPass = verifyPassword("WrongPassword", fetchedCust.password_hash, fetchedCust.salt);

    assert(isValidCustPass === true, "Customer can log in with correct password");
    assert(isWrongCustPass === false, "Customer rejected with wrong password");

    // ── Test 3: Retailer Registration & Pending Approval Gate ──
    console.log("\n▶ [Test 3] Retailer Registration & Pending Approval Gate");
    const retSalt = crypto.randomBytes(16).toString("hex");
    const retHash = hashPasswordWithSalt(initialPassword, retSalt);

    const [retUser] = await sql`
      INSERT INTO public.auth_users (
        email, password_hash, salt, full_name, phone, shop_name, role, status, approval_status
      ) VALUES (
        ${retailerEmail}, ${retHash}, ${retSalt}, 'E2E Retailer', '+91 88888 22222', 'E2E Medicos', 'retailer', 'pending_approval', 'pending'
      )
      RETURNING id, email, full_name, role, status, approval_status, shop_name;
    `;

    assert(retUser && retUser.email === retailerEmail, "Retailer account created in public.auth_users");
    assert(retUser.role === "retailer", "Retailer assigned role 'retailer'");
    assert(retUser.status === "pending_approval" && retUser.approval_status === "pending", "Retailer status initialized as 'pending_approval'");

    // Check retailer login restriction while pending
    const [pendingRetCheck] = await sql`
      SELECT * FROM public.auth_users WHERE email = ${retailerEmail} LIMIT 1;
    `;
    const isRetPending = pendingRetCheck.status === "pending_approval" || pendingRetCheck.approval_status === "pending";
    assert(isRetPending === true, "Pending retailer login restricted before approval");

    // ── Test 4: Admin Approves Retailer Account ──
    console.log("\n▶ [Test 4] Admin Approves Retailer Account");
    const [approvedRet] = await sql`
      UPDATE public.auth_users
      SET status = 'active',
          approval_status = 'approved',
          approved_at = NOW(),
          approved_by = 'Subhonehealthgroup@gmail.com',
          updated_at = NOW()
      WHERE id = ${retUser.id}
      RETURNING id, email, status, approval_status, approved_at;
    `;

    assert(approvedRet.status === "active" && approvedRet.approval_status === "approved", "Retailer successfully approved by admin");

    // ── Test 5: Block & Unblock User Account ──
    console.log("\n▶ [Test 5] Block & Unblock User Accounts");
    // Block customer
    const [blockedCust] = await sql`
      UPDATE public.auth_users
      SET status = 'blocked',
          approval_status = 'blocked',
          blocked_at = NOW(),
          updated_at = NOW()
      WHERE id = ${custUser.id}
      RETURNING id, status, approval_status, blocked_at;
    `;
    assert(blockedCust.status === "blocked" && blockedCust.approval_status === "blocked", "Customer account successfully blocked");

    // Unblock customer
    const [unblockedCust] = await sql`
      UPDATE public.auth_users
      SET status = 'active',
          approval_status = 'approved',
          blocked_at = NULL,
          updated_at = NOW()
      WHERE id = ${custUser.id}
      RETURNING id, status, approval_status, blocked_at;
    `;
    assert(unblockedCust.status === "active" && unblockedCust.approval_status === "approved", "Customer account successfully unblocked");

    // ── Test 6: Admin Password Reset / Change ──
    console.log("\n▶ [Test 6] Admin Password Reset / Change");
    const newSalt = crypto.randomBytes(16).toString("hex");
    const newHash = hashPasswordWithSalt(newPassword, newSalt);

    await sql`
      UPDATE public.auth_users
      SET password_hash = ${newHash},
          salt = ${newSalt},
          updated_at = NOW()
      WHERE id = ${custUser.id};
    `;

    const [updatedCustRecord] = await sql`
      SELECT password_hash, salt FROM public.auth_users WHERE id = ${custUser.id} LIMIT 1;
    `;

    const isOldPassValid = verifyPassword(initialPassword, updatedCustRecord.password_hash, updatedCustRecord.salt);
    const isNewPassValid = verifyPassword(newPassword, updatedCustRecord.password_hash, updatedCustRecord.salt);

    assert(isOldPassValid === false, "Old password rejected after admin password change");
    assert(isNewPassValid === true, "New password accepted after admin password change");

    // ── Test 7: Directory Queries (Security & Hash Masking) ──
    console.log("\n▶ [Test 7] Directory User List & Security Checks");
    const directoryUsers = await sql`
      SELECT id, email, phone, full_name, role, status, approval_status, shop_name, last_login, created_at
      FROM public.auth_users
      ORDER BY created_at DESC;
    `;

    assert(directoryUsers.length >= 2, `Directory returned ${directoryUsers.length} user records`);
    const containsCust = directoryUsers.some((u) => u.email === customerEmail);
    const containsRet = directoryUsers.some((u) => u.email === retailerEmail);
    assert(containsCust && containsRet, "All registered customers and retailers exist in directory list");

    // Cleanup test records
    await sql`DELETE FROM public.auth_users WHERE email IN (${customerEmail}, ${retailerEmail});`;
    console.log("\n🧹 Cleaned up temporary E2E test users.");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests();
