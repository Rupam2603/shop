const fs = require('fs');

let adminCode = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Admin 2990-2996 avatar fallback replacement
adminCode = adminCode.replace(
  /\{null \?\s*\([\s\S]*?\)\s*:\s*\(([\s\S]*?)\)\}/,
  '{$1}'
);

// Admin 3046
adminCode = adminCode.replace(/\{"" \? ` · 📞 \$\{""\}` : ""\}/, '');

// Admin 3055
adminCode = adminCode.replace(/\{null \? ` · Last Active: \$\{new Date\(null\)\.toLocaleDateString\("en-IN", \{ day: "numeric", month: "short" \}\)\}` : ""\}/, '');

// Admin 3349
adminCode = adminCode.replace(/<span className="font-mono">\{"" \|\| "Not provided"\}<\/span>/, '<span className="font-mono">Not provided</span>');

// Admin 3369-3375
adminCode = adminCode.replace(
  /\{null && \(\s*<div className="flex items-center gap-2">\s*<Icons\.Calendar className="w-4 h-4 text-gray-500" \/>\s*<span className="text-gray-500 w-32">Last Active:<\/span>\s*<span>\{new Date\(null\)\.toLocaleString\("en-IN"\)}<\/span>\s*<\/div>\s*\)\}/,
  ''
);

// Admin 2812: `targetStatus` might be `"approved"` in some ModalState typing.
adminCode = adminCode.replace(
  /targetStatus: "approved" \| "blocked" \| "pending" \| "rejected";/,
  'targetStatus: "active" | "blocked" | "pending" | "rejected";'
);
adminCode = adminCode.replace(
  /setTargetStatus\("approved"\)/g,
  'setTargetStatus("active")'
);
adminCode = adminCode.replace(
  /targetStatus === "approved"/g,
  'targetStatus === "active"'
);
adminCode = adminCode.replace(
  /\{statusModal\.targetStatus === "approved" \? "Approve User" :/g,
  '{statusModal.targetStatus === "active" ? "Approve User" :'
);


fs.writeFileSync('src/pages/AdminDashboard.tsx', adminCode);

let authCode = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
// Fix Auth 556
authCode = authCode.replace(/await neonSignUp\(cleanEmail, cleanPass\);/g, 'await neonSignUp(cleanEmail, cleanPass, opts.fullName.trim());');
authCode = authCode.replace(/async function neonSignUp\(email: string, password: string\)/g, 'async function neonSignUp(email: string, password: string, fullName: string)');
// Revert createNeonUser call in neonSignUp to use fullName argument instead of opts.fullName
authCode = authCode.replace(/fullName: opts\.fullName\.trim\(\),/g, 'fullName,');

fs.writeFileSync('src/contexts/AuthContext.tsx', authCode);
