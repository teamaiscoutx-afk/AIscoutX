const fs = require('fs');

console.log("\n=======================================================");
console.log("⚡ AIscoutX - RAZORPAY & INTEGRATION CHECK V2 ⚡");
console.log("=======================================================\n");

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

// Check Razorpay
if (deps['razorpay']) {
    console.log("🟢 APPROVED: [razorpay] dependency package installed successfully!");
} else {
    console.log("🟡 NOTE: Standard 'razorpay' package node_modules me nahi mila. (Check karein agar custom API endpoints use kiye hain).");
}

// Scanning for Razorpay files or webhooks
console.log("\n🔍 SCANNING FOR PAYMENT FILES:");
const paymentKeywords = ['razorpay', 'payment', 'route.ts', 'webhook'];
let foundPaymentLogic = false;

const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {onst fullPath = `${dir}/${file}`;
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes('razorpay')) {
                console.log(`  🟢 FOUND LOGIC: Razorpay integrated in -> ${fullPath}`);
                foundPaymentLogic = true;
            }
        }
    }
};

scanDir('src');
scanDir('app');

if (!foundPaymentLogic) {
    console.log("🟡 WARNING: Kisi file me 'razorpay' keyword nahi mila. Ek baar routes check karein.");
}

console.log("\n=======================================================");
console.log("👉 Bhai, iska output batao, fir Phase 1 ka code start karte hain!");
console.log("=======================================================\n");
