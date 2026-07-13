const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("🌍 AIscoutX - GLOBAL USD & RAZORPAY AUDIT SYSTEM 🌍");
console.log("=======================================================\n");

let filesScanned = 0;
let razorpayFoundInFiles = [];

const scanProject = (dir) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        if (item === 'node_modules' || item === '.next' || item === '.git') continue;
        const fullPath = path.join(dir, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
            scanProject(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.sql')) {
            filesScanned++;
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes('razorpay'
                razorpayFoundInFiles.push(fullPath);
            }
        }
    }
};

scanProject('.');

console.log(`📊 TOTAL SOURCE FILES SCANNED: ${filesScanned}`);
console.log(`💳 RAZORPAY ENGINES DETECTED: ${razorpayFoundInFiles.length}`);

if (razorpayFoundInFiles.length > 0) {
    console.log("\n🟢 SUCCESS: Razorpay is globally mapped in these files:");
    razorpayFoundInFiles.forEach(f => console.log(`   - ${f}`));
} else {
    console.log("\n🟡 ALERT: Direct code me 'razorpay' scan nahi hua. (Check endpoints or environment variables).");
}

console.log("\n=======================================================");
console.log("👉 Bhai, iska output do, fir seedha Data Pipeline pe aate hain!");
console.log("=======================================================\n");
