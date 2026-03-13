#!/usr/bin/env node

/**
 * Version Bumper — syncs version across all platform manifests.
 * Usage: node scripts/bump-version.js <major|minor|patch> [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const FILES = {
    packageJson: path.join(ROOT, 'package.json'),
    tauriConf: path.join(ROOT, 'src-tauri', 'tauri.conf.json'),
    cargoToml: path.join(ROOT, 'src-tauri', 'Cargo.toml'),
    buildGradle: path.join(ROOT, 'android', 'app', 'build.gradle'),
};

function parseVersion(version) {
    const [major, minor, patch] = version.replace(/[^0-9.]/g, '').split('.').map(Number);
    return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

function bumpVersion(current, type) {
    const v = parseVersion(current);
    switch (type) {
        case 'major': return `${v.major + 1}.0.0`;
        case 'minor': return `${v.major}.${v.minor + 1}.0`;
        case 'patch': return `${v.major}.${v.minor}.${v.patch + 1}`;
        default: throw new Error(`Invalid bump type: ${type}`);
    }
}

function getVersionCode(version) {
    const v = parseVersion(version);
    return v.major * 10000 + v.minor * 100 + v.patch;
}

// ── Main ──────────────────────────────────────────────

const bumpType = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Usage: node scripts/bump-version.js <major|minor|patch> [--dry-run]');
    process.exit(1);
}

// Read current version from package.json
const pkg = JSON.parse(fs.readFileSync(FILES.packageJson, 'utf8'));
const currentVersion = pkg.version;
const newVersion = bumpVersion(currentVersion, bumpType);
const versionCode = getVersionCode(newVersion);

console.log(`\n📦 Version bump: ${currentVersion} → ${newVersion} (${bumpType})`);
console.log(`   Android versionCode: ${versionCode}`);
if (dryRun) console.log('   🔍 DRY RUN — no files will be modified\n');

const updates = [];

// 1. package.json
pkg.version = newVersion;
updates.push({ file: 'package.json', content: JSON.stringify(pkg, null, 4) + '\n' });

// 2. tauri.conf.json
if (fs.existsSync(FILES.tauriConf)) {
    const tauri = JSON.parse(fs.readFileSync(FILES.tauriConf, 'utf8'));
    tauri.version = newVersion;
    updates.push({ file: 'src-tauri/tauri.conf.json', content: JSON.stringify(tauri, null, 2) + '\n' });
}

// 3. Cargo.toml
if (fs.existsSync(FILES.cargoToml)) {
    let cargo = fs.readFileSync(FILES.cargoToml, 'utf8');
    cargo = cargo.replace(/^version\s*=\s*"[^"]*"/m, `version = "${newVersion}"`);
    updates.push({ file: 'src-tauri/Cargo.toml', content: cargo });
}

// 4. Android build.gradle
if (fs.existsSync(FILES.buildGradle)) {
    let gradle = fs.readFileSync(FILES.buildGradle, 'utf8');
    gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
    gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${newVersion}"`);
    updates.push({ file: 'android/app/build.gradle', content: gradle });
}

// Apply updates
updates.forEach(({ file, content }) => {
    const fullPath = path.join(ROOT, file);
    if (!dryRun) {
        fs.writeFileSync(fullPath, content);
    }
    console.log(`   ✅ ${file}`);
});

console.log(`\n🎉 Version ${newVersion} applied to ${updates.length} files.`);
if (!dryRun) {
    console.log(`\nNext steps:`);
    console.log(`  git add -A && git commit -m "chore: bump version to v${newVersion}"`);
    console.log(`  git tag v${newVersion}`);
    console.log(`  git push origin main --tags`);
}
