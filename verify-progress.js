const fs = require('fs');

console.log("\n=======================================================");
console.log("⚡ AIscoutX PRODUCTION LIVE CHECKPOINT ⚡");
console.log("=======================================================\n");

// Read Dependencies
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

console.log("📦 1. CORE DEPENDENCIES:");
const checkDep = (name) => console.log(`   - ${name}: ${deps[name] ? '🟢 READY (' + deps[name] + ')' : '🔴 MISSING'}`);
checkDep('node-cron');
checkDep('@supabase/supabase-js');
checkDep('razorpay');
checkDep('@google/genai');
checkDep('openai');
checkDep('apify');
checkDep('sharp');
checkDep('multer');

console.log("\n📂 2. FILE LOCATION CHECKS:");
const checkPath = (label, paths) => {
    let found = false;
    for (const p of paths) {
        if (fs.existsSync(p)) {
            console.log(`   🟢 FOUND [${label}] at path: ${p}`);
            found = true;
            break;
        }
    }
    if (!found) console.log(`   🔴 NOT FOUND: [${label}]`);
};

checkPath('Reddit Scraper / API Route', ['app/api/cron/fetch-trends/route.ts', 'src/app/api/cron/fetch-trends/route.ts', 'pages/api/cron/fetch-trends.ts']);
checkPath('Lock & Build Core Engine', ['app/api/build/route.ts', 'src/agents/lockAgent.js', 'src/agents/lockAgent.ts']);
checkPath('Vision Error Solvision/route.ts', 'src/controllers/visionController.js', 'src/controllers/visionController.ts']);
checkPath('Razorpay Webhook/Billing', ['app/api/billing/webhook/route.ts', 'src/controllers/billing.ts', '008_founder_watchtower_billing.sql']);

console.log("\n=======================================================");
console.log("👉 Bhai, iska clean string text copy karke ya screenshot");
console.log("   bhejo, fir main batata hu kya baaki hai!");
console.log("=======================================================\n");
