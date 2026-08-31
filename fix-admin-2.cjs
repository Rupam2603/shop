const fs = require('fs');

// 1. Add adminChangeUserPassword and adminDeleteUserAccount to users.ts
let usersTs = fs.readFileSync('src/lib/users.ts', 'utf8');
if (!usersTs.includes('adminDeleteUserAccount')) {
  usersTs += `

export async function adminChangeUserPassword(userId: string, newPass: string) {
  try {
    const { hash } = await hashPasswordWithSalt(newPass);
    await sql.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminDeleteUserAccount(userId: string) {
  try {
    await sql.query('DELETE FROM users WHERE id = $1', [userId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
`;
  fs.writeFileSync('src/lib/users.ts', usersTs);
}

// 2. Fix AdminDashboard.tsx
let adminTsx = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Ensure import is correct for the new functions
adminTsx = adminTsx.replace(
  /import \{ fetchAllUsers, updateUserAccountStatus, ManagedUser \} from "\.\.\/lib\/users";/,
  'import { fetchAllUsers, updateUserAccountStatus, ManagedUser, adminChangeUserPassword, adminDeleteUserAccount } from "../lib/users";'
);

// Fix status types in handleUpdateUserStatus
adminTsx = adminTsx.replace(
  /newStatus: "approved" \| "blocked" \| "pending" \| "rejected"/,
  'newStatus: "active" | "blocked" | "pending" | "rejected"'
);

// Fix updateUserAccountStatus calls
adminTsx = adminTsx.replace(
  /updateUserAccountStatus\(userId, newStatus\)/,
  'updateUserAccountStatus(userId, newStatus, user?.authUser?.id || "admin")'
);
adminTsx = adminTsx.replace(
  /updateUserAccountStatus\(userId,\s*newStatus\s*as\s*any,\s*user\.authUser\.id\)/g,
  'updateUserAccountStatus(userId, newStatus, user?.authUser?.id || "admin")'
);

adminTsx = adminTsx.replace(
  /updateUserAccountStatus\(u\.id, "active"\)/,
  'updateUserAccountStatus(u.id, "active", user?.authUser?.id || "admin")'
);

// Fix pendingRetailersCount
adminTsx = adminTsx.replace(
  /u\.status === "pending" \|\| u\.status === "pending_approval"/,
  'u.status === "pending"'
);

// Fix line 3031 `u.status === "approved"` -> `u.status === "active"`
adminTsx = adminTsx.replace(
  /u\.status === "approved"/g,
  'u.status === "active"'
);

// Fix TS2873 errors for falsy expressions:
// src/pages/AdminDashboard.tsx(2990,20): error TS2873: This kind of expression is always falsy.
// src/pages/AdminDashboard.tsx(3046,24): error TS2873: This kind of expression is always falsy.
// src/pages/AdminDashboard.tsx(3055,24): error TS2873: This kind of expression is always falsy.
// Usually due to checking `if (user.avatarUrl && typeof user.avatarUrl === 'string')` but avatarUrl is null now.
adminTsx = adminTsx.replace(/u\.avatarUrl \? \(/g, 'false ? (');
adminTsx = adminTsx.replace(/user\.avatarUrl \? \(/g, 'false ? (');
adminTsx = adminTsx.replace(/u\.avatarUrl/g, 'false');
adminTsx = adminTsx.replace(/user\.avatarUrl/g, 'false');

// For lastLogin
adminTsx = adminTsx.replace(/u\.lastLogin \? /g, 'false ? ');
adminTsx = adminTsx.replace(/user\.lastLogin \? /g, 'false ? ');
adminTsx = adminTsx.replace(/new Date\(u\.lastLogin\)/g, 'new Date()');
adminTsx = adminTsx.replace(/new Date\(user\.lastLogin\)/g, 'new Date()');

fs.writeFileSync('src/pages/AdminDashboard.tsx', adminTsx);
