const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Replace the stray brace block
const badBlock = `<div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {
                    <div`;

const goodBlock = `<div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div`;

code = code.replace(badBlock, goodBlock);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
