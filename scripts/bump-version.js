#!/usr/bin/env node
/**
 * Version Bump Script
 * Updates version in ALL locations to keep them in sync:
 *   1. package.json
 *   2. package-lock.json
 *   3. src/constants/Version.ts (VERSION_CODE kept equal to gradle versionCode)
 *   4. android/app/build.gradle (versionCode + versionName)
 *   5. README.md version badge
 *
 * Usage:
 *   node scripts/bump-version.js <newVersion>
 *   npm run bump -- 0.0.13
 */

const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];
if (!newVersion) {
  console.error('Usage: node scripts/bump-version.js <newVersion>');
  console.error('Example: node scripts/bump-version.js 0.0.13');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`Invalid version format: "${newVersion}". Expected: X.Y.Z`);
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const results = [];

// 1. package.json
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version;

if (oldVersion === newVersion) {
  console.log(`Version is already ${newVersion}. Nothing to do.`);
  process.exit(0);
}

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
results.push(`package.json: ${oldVersion} -> ${newVersion}`);

// 2. package-lock.json
const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  let lockContent = fs.readFileSync(lockPath, 'utf8');
  const lock = JSON.parse(lockContent);
  lock.version = newVersion;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = newVersion;
  }
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
  results.push(`package-lock.json: updated`);
}

// The Android versionCode in build.gradle is authoritative; Version.ts is kept in sync with it.
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
const vcMatch = gradle.match(/versionCode (\d+)/);
const newVc = vcMatch ? parseInt(vcMatch[1], 10) + 1 : 1;

// 3. src/constants/Version.ts
const versionTsPath = path.join(root, 'src', 'constants', 'Version.ts');
let versionTs = fs.readFileSync(versionTsPath, 'utf8');
versionTs = versionTs.replace(
  /export const APP_VERSION = '.*?';/,
  `export const APP_VERSION = '${newVersion}';`,
);
versionTs = versionTs.replace(
  /export const VERSION_CODE = \d+;/,
  `export const VERSION_CODE = ${newVc};`,
);
fs.writeFileSync(versionTsPath, versionTs, 'utf8');
results.push(`Version.ts: APP_VERSION='${newVersion}', VERSION_CODE=${newVc}`);

// 4. android/app/build.gradle
gradle = gradle.replace(/versionCode \d+/, `versionCode ${newVc}`);
gradle = gradle.replace(/versionName ".*?"/, `versionName "${newVersion}"`);
fs.writeFileSync(gradlePath, gradle, 'utf8');
results.push(`build.gradle: versionCode=${newVc}, versionName="${newVersion}"`);

// 5. README.md version badge (e.g. version-0.0.29-blue)
const readmePath = path.join(root, 'README.md');
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  const updated = readme.replace(/version-\d+\.\d+\.\d+-blue/g, `version-${newVersion}-blue`);
  if (updated !== readme) {
    fs.writeFileSync(readmePath, updated, 'utf8');
    results.push('README.md: version badge updated');
  }
}

// Summary
console.log(`\n✔ Version bumped to ${newVersion}\n`);
results.forEach(r => console.log(`  ${r}`));
console.log('');
