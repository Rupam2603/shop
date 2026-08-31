const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Replace the specific block of imports
code = code.replace(/import\s*\{\s*fetchAllUsers,\s*updateUserAccountStatus,\s*adminChangeUserPassword,\s*adminDeleteUserAccount,\s*fetchLoginLogs,\s*ManagedUser,\s*LoginLog,?\s*\}\s*from\s*"..\/lib\/users";/s,
`import { fetchAllUsers, updateUserAccountStatus, ManagedUser } from "../lib/users";
import { fetchLoginLogs, LoginLog } from "../lib/loginLogs";`);

// Fix typings
code = code.replace(/u\.approvalStatus/g, 'u.status');
code = code.replace(/user\.approvalStatus/g, 'user.status');
code = code.replace(/approvalStatus ===/g, 'status ===');
code = code.replace(/approvalStatus:/g, 'status:');
code = code.replace(/approvalStatus/g, 'status');
code = code.replace(/u\.shopName/g, 'u.businessName');
code = code.replace(/user\.shopName/g, 'user.businessName');
code = code.replace(/shopName:/g, 'businessName:');
code = code.replace(/u\.phone/g, '""');
code = code.replace(/user\.phone/g, '""');
code = code.replace(/phone:/g, '/* phone: */');
code = code.replace(/u\.avatarUrl/g, 'null');
code = code.replace(/user\.avatarUrl/g, 'null');
code = code.replace(/u\.lastLogin/g, 'null');
code = code.replace(/user\.lastLogin/g, 'null');
code = code.replace(/updateUserAccountStatus\(targetUserId,\s*newStatus\)/g, 'updateUserAccountStatus(targetUserId, newStatus as any, user.authUser.id)');
code = code.replace(/updateUserAccountStatus\(u\.id,\s*"active"\)/g, 'updateUserAccountStatus(u.id, "active", user.authUser.id)');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
