const fs = require('fs');

let adminCode = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Fix 2812
adminCode = adminCode.replace(/await onUpdateStatus\(statusModal\.user\.id, statusModal\.targetStatus\);/, 'await onUpdateStatus(statusModal.user.id, statusModal.targetStatus as any);');

// Fix 3233, 3237, 3261 (MOCK_REQUESTS status type)
adminCode = adminCode.replace(/status: "pending" \| "approved" \| "rejected"/g, 'status: "pending" | "active" | "rejected"');

// Fix 3361, 3364 (null && ...)
adminCode = adminCode.replace(
  /\{null && \(\s*<div className="flex items-center gap-2">\s*<Icons\.Calendar className="w-4 h-4 text-gray-500" \/>\s*<span className="text-gray-500 w-32">Last Active:<\/span>\s*<span>\{new Date\(null\)\.toLocaleString\("en-IN"\)}<\/span>\s*<\/div>\s*\)\}/g,
  ''
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', adminCode);

let authCode = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
authCode = authCode.replace(/fullName,/g, 'fullName: opts.fullName.trim(),');
fs.writeFileSync('src/contexts/AuthContext.tsx', authCode);
