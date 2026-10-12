const fs = require('fs');
let t = fs.readFileSync('app/dashboard/actions.ts', 'utf8');
t = t.replace(/'Mock Project' \)\)/g, "'Mock Project' } }))");
t = t.replace(/'Mock Project' \}\)\)/g, "'Mock Project' } }))");
fs.writeFileSync('app/dashboard/actions.ts', t);
