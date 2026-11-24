'use strict';
// Loads KEY=value lines from .env.local (for example from `vercel env pull`) into process.env,
// without overriding variables that are already set. .env.local is never committed.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}
