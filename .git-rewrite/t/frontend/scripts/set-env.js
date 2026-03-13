#!/usr/bin/env node

/**
 * Environment Switcher — copies the right env file to .env.local
 * Usage: node scripts/set-env.js <dev|staging|prod|mobile|desktop>
 */

const fs = require('fs');
const path = require('path');

const ENV_MAP = {
    dev: path.join(__dirname, '..', 'env', 'dev.env'),
    staging: path.join(__dirname, '..', 'env', 'staging.env'),
    prod: path.join(__dirname, '..', 'env', 'prod.env'),
    mobile: path.join(__dirname, '..', '.env.mobile'),
    desktop: path.join(__dirname, '..', '.env.desktop'),
};

const target = process.argv[2];

if (!target || !ENV_MAP[target]) {
    console.error(`Usage: node scripts/set-env.js <${Object.keys(ENV_MAP).join('|')}>`);
    process.exit(1);
}

const source = ENV_MAP[target];
const dest = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(source)) {
    console.error(`❌ Source file not found: ${source}`);
    process.exit(1);
}

fs.copyFileSync(source, dest);

const lines = fs.readFileSync(dest, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
console.log(`✅ Environment switched to: ${target}`);
console.log(`   Copied ${lines} variables from ${path.basename(source)} → .env.local`);
