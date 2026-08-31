const fs = require('fs');
let adminCode = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
adminCode = adminCode.split('targetStatus: "approved"').join('targetStatus: "active"');
fs.writeFileSync('src/pages/AdminDashboard.tsx', adminCode);
