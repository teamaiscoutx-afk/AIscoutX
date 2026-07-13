const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("🔥 AIscoutX - ULTIMATE DETECTOR ENGINE STATUS CHECK 🔥");
console.log("=======================================================\n");

const checkPackage = () => {
    if (!fs.existsSync('package.json')) {
        console.log("❌ Error: package.json nahi mila! Please project ke root folder me terminal kholiye.");
        return;
    }
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const targets = {
        'node-cron': 'Phase 1: 24/7 Autopilot Automation',
        'apify': 'Phase 1: Web Scraping & Firehose',
        '@google/genai': 'Phase 3/4: Gemini Brain Integrations',
        'openai': 'Phase 3/4: OpenAI Brain Integrations',
        '@supabase/supabase-js': 'Phase 2: Vector DB Database',
        'pinecone-client': 'Phase 2: VectDatabase',
        'sharp': 'Phase 4: Screenshot Image Compression',
        'multer': 'Phase 4: User Image Upload System',
        'stripe': 'Phase 5: Global Revenue Machine'
    };

    console.log("📦 INTEGRATIONS & DEPENDENCIES STATUS:");
    Object.keys(targets).forEach(dep => {
        if (deps[dep]) {
            console.log(`  🟢 APPROVED: [${dep}] - Installed for ${targets[dep]}`);
        } else {
            console.log(`  🔴 MISSING:  [${dep}] - Needed for ${targets[dep]}`);
        }
    });
};

const checkArchitecture = () => {
    console.log("\n📂 PROJECT ARCHITECTURE FILES CHECK:");
    const vitalFiles = [
        { path: 'src/cron/cron.js', name: 'Cron Background Worker' },
        { path: 'src/scrapers/reddit.js', name: 'Reddit Data Extractor' },
        { path: 'src/config/vectorDb.js', name: 'Vector Database Connector' },
        { path: 'src/agents/lockAgent.js', name: 'Lock & Build Core Engine' },
        { path: 'src/controllers/visionController.js', name: 'Vision Screenshot Error Solver' }
    ];

    let foundFiles = 0;
    vitalFiles.forEach(file => {
        if (fs.existsSync(file.path) || fs.existsSync(file.path.replace('src/', ''))) {
            console.log(`  🟢 FOUND:    ${file.name}`);
            foundFiles++;
        } else {
            console.log(`  🟡 NOT FOUND: ${file.name} (Custom logic needed here)`);
        }
    });
    
    if(foundFiles === 0) {
        console.log("\n💡 Note: Agar aapne saara code single app.js ya index.js me likha hai, toh files alag dikh sakti hain.");
    }
};

checkPackage();
checkArchitecture();
console.log("\n=======================================================");
console.log("👉 Bhai, is output ka screenshot ya text copy karke");
console.log("   mujhe bhejo, fir main batata hu aage kya karna hai!");
console.log("=======================================================\n");
