// Download makeup pattern textures into assets/patterns/<type>/<id>.png
// Usage: node scripts/import-patterns.mjs [urls-file]
//   urls-file lines: "<source_url>\t<target_path>"  (default .import/patterns-urls.txt)
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const urlsFile = process.argv[2] || join(root, '.import/patterns-urls.txt');
const lines = readFileSync(urlsFile, 'utf8').split('\n').filter(Boolean);
let ok = 0, fail = 0;
for (const line of lines) {
  const [url, target] = line.split('\t');
  if (!url || !target) continue;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const out = join(root, target);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, buf);
    console.log('ok  ', target); ok++;
  } catch (e) { console.log('FAIL', target, '(' + e.message + ')'); fail++; }
}
console.log(`done: ${ok} downloaded, ${fail} failed`);
