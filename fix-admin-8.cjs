const fs = require('fs');

let adminCode = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

adminCode = adminCode.replace(
  /targetStatus: "approved" \| "blocked" \| "pending" \| "rejected"/g,
  'targetStatus: "active" | "blocked" | "pending" | "rejected"'
);

// Remove the Last Sign In block entirely
const lastSignInBlock = `{null && (
                <div className="flex justify-between py-1.5 border-b border-[#edf3ee]">
                  <span className="text-[#657969]">Last Sign In:</span>
                  <span>{new Date(null).toLocaleString("en-IN")}</span>
                </div>
              )}`;

adminCode = adminCode.replace(lastSignInBlock, '');

fs.writeFileSync('src/pages/AdminDashboard.tsx', adminCode);
