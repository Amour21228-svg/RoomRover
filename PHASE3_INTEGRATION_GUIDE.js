/**
 * 🚀 PHASE 3 INTEGRATION INSTRUCTIONS
 * How to add Phase 3 routes to server.js
 */

// ============================================================
// FILE: server.js (EXISTING)
// ============================================================

// STEP 1: Locate where to add the import
// Find line that says: "const db = require('./lib/database');"
// Add AFTER that line (around line 11):

const stripeService = require('./lib/stripe-service');
const flutterwaveService = require('./lib/flutterwave-service');
const twoFactorService = require('./lib/2fa-service');

// ============================================================

// STEP 2: Locate where to add the routes
// Find the line: "app.listen(port, () => {"
// This is typically around line 410-415

// ADD THIS BEFORE app.listen():

// ==================== PHASE 3 ROUTES ====================
const phase3Routes = require('./lib/phase3-routes');
app.use('/api', phase3Routes);

console.log('✅ Phase 3 Routes loaded:');
console.log('   - Stripe Payment Service');
console.log('   - Flutterwave Mobile Money Service');
console.log('   - 2FA (TOTP) Authentication Service');
console.log('   - Admin API Endpoints');

// ============================================================

// STEP 3: What the final section should look like:

/*
// Existing routes...
app.use('/api/auth', authRoutes);

// ==================== PHASE 3 ROUTES ====================
const phase3Routes = require('./lib/phase3-routes');
app.use('/api', phase3Routes);

console.log('✅ Phase 3 Routes loaded:');
console.log('   - Stripe Payment Service');
console.log('   - Flutterwave Mobile Money Service');
console.log('   - 2FA (TOTP) Authentication Service');
console.log('   - Admin API Endpoints');

// ==================== SERVER STARTUP ====================
app.listen(port, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   🎯 RoomRover Production Server        ║`);
  console.log(`║   📍 http://localhost:${port}              ║`);
  console.log(`║   🔐 Security: Enabled                 ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});
*/

// ============================================================
// VERIFICATION CHECKLIST
// ============================================================

/*
After integrating, verify:

1. Check imports added (line ~11):
   ✓ const stripeService = require('./lib/stripe-service');
   ✓ const flutterwaveService = require('./lib/flutterwave-service');
   ✓ const twoFactorService = require('./lib/2fa-service');

2. Check routes added (before app.listen()):
   ✓ const phase3Routes = require('./lib/phase3-routes');
   ✓ app.use('/api', phase3Routes);

3. Verify no syntax errors:
   node -c server.js
   (Should output: "Syntax OK" or similar)

4. Test startup:
   npm start
   (Should see banner without errors)

5. Test endpoints:
   curl http://localhost:8080/api/admin/stats \
     -H "Authorization: Bearer ADMIN_TOKEN"
   (Should return JSON stats)

*/

// ============================================================
// TROUBLESHOOTING
// ============================================================

/*
If you get errors:

ERROR: "Cannot find module './lib/phase3-routes'"
→ Check file exists: ls lib/phase3-routes.js
→ Check spelling and path

ERROR: "stripeService is not defined"
→ Check imports at top of server.js
→ Verify line: const stripeService = require('./lib/stripe-service');

ERROR: "app.use is not a function"
→ app.use() must come BEFORE app.listen()
→ Check ordering in server.js

ERROR: "Syntax Error: Unexpected token"
→ Check for missing commas or semicolons
→ Use: node -c server.js to validate syntax

*/

// ============================================================
// FILE STRUCTURE AFTER INTEGRATION
// ============================================================

/*
project-root/
├── server.js (MODIFIED - add Phase 3 routes)
├── lib/
│   ├── stripe-service.js (NEW ✅)
│   ├── flutterwave-service.js (NEW ✅)
│   ├── 2fa-service.js (NEW ✅)
│   ├── phase3-routes.js (NEW ✅)
│   ├── database.js (EXISTING)
│   └── auth.js (EXISTING)
├── pages/
│   └── payment.html (NEW ✅)
├── test-phase3.js (NEW ✅)
└── PHASE3_*.md (Documentation)
*/

// ============================================================
// EXPECTED OUTPUT AFTER INTEGRATION
// ============================================================

/*
When you run: npm start

Expected output:
─────────────────────────────────────────────
> node server.js

✅ Phase 3 Routes loaded:
   - Stripe Payment Service
   - Flutterwave Mobile Money Service
   - 2FA (TOTP) Authentication Service
   - Admin API Endpoints

╔════════════════════════════════════════╗
║   🎯 RoomRover Production Server        ║
║   📍 http://localhost:8080              ║
║   🔐 Security: Enabled                 ║
╚════════════════════════════════════════╝
─────────────────────────────────────────────

Server is now running and all Phase 3 endpoints are available!
*/

// ============================================================
// QUICK INTEGRATION SCRIPT (OPTIONAL)
// ============================================================

/*
If you prefer, use this script to auto-integrate:

// save as: integrate-phase3.js

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Add imports after "const auth = require('./lib/auth');"
content = content.replace(
  "const auth = require('./lib/auth');",
  `const auth = require('./lib/auth');
const stripeService = require('./lib/stripe-service');
const flutterwaveService = require('./lib/flutterwave-service');
const twoFactorService = require('./lib/2fa-service');`
);

// Add routes before app.listen
content = content.replace(
  'app.listen(port, () => {',
  `// ==================== PHASE 3 ROUTES ====================
const phase3Routes = require('./lib/phase3-routes');
app.use('/api', phase3Routes);

console.log('✅ Phase 3 Routes loaded');

app.listen(port, () => {`
);

fs.writeFileSync(serverPath, content, 'utf8');
console.log('✅ Phase 3 integrated into server.js');

// Then run: node integrate-phase3.js
*/

module.exports = {
  instructions: `
    Phase 3 Integration Steps:
    
    1. Open server.js in editor
    2. Add imports after line 11 (after const auth = ...)
    3. Add routes before app.listen() (around line 410)
    4. Save and test: npm start
    5. Verify: curl http://localhost:8080/api/admin/stats -H "Authorization: Bearer TOKEN"
  `,
  
  filesNeeded: [
    'lib/stripe-service.js',
    'lib/flutterwave-service.js',
    'lib/2fa-service.js',
    'lib/phase3-routes.js'
  ],
  
  testCommand: 'node test-phase3.js',
  
  startCommand: 'npm start'
};
