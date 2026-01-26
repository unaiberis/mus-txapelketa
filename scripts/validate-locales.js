#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../src/locales');
if (!fs.existsSync(localesDir)) {
  console.error('Locales dir not found:', localesDir);
  process.exit(2);
}

const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error('No locale json files found in', localesDir);
  process.exit(2);
}

const dicts = {};
files.forEach((f) => {
  const p = path.join(localesDir, f);
  try {
    dicts[f] = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('Failed to parse', p, e.message);
    process.exit(2);
  }
});

// collect union of keys
const allKeys = new Set();
Object.values(dicts).forEach((d) => Object.keys(d).forEach((k) => allKeys.add(k)));

let ok = true;
Object.keys(dicts).forEach((f) => {
  const missing = [...allKeys].filter((k) => !(k in dicts[f]));
  if (missing.length) {
    ok = false;
    console.error(`Locale ${f} is missing ${missing.length} keys:\n  ${missing.join('\n  ')}`);
  }
});

if (!ok) {
  console.error('\nValidation failed: some locales have missing keys.');
  process.exit(1);
}

console.log('All locale files validated OK. Keys count:', allKeys.size);
process.exit(0);
