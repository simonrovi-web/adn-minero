#!/usr/bin/env node
/* Estampa la versión del Service Worker con un hash del contenido.
   Uso: node scripts/build.js  (correr antes de cada deploy).
   Así la caché se invalida sola cuando cambia cualquier HTML/JS/CSS. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SW = path.join(ROOT, 'app', 'sw.js');

// Hashea el contenido relevante (excluye el backup grande de lucide)
function collect(dir, rel = '') {
  let files = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'lucide.full.min.js') continue;
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) files = files.concat(collect(fp, rel + name + '/'));
    else if (/\.(html|js|css|json)$/.test(name)) files.push(fp);
  }
  return files;
}

const h = crypto.createHash('sha256');
for (const f of collect(ROOT).sort()) h.update(fs.readFileSync(f));
const hash = h.digest('hex').slice(0, 8);

let sw = fs.readFileSync(SW, 'utf8');
const before = (sw.match(/const CACHE='([^']+)'/) || [])[1];
sw = sw.replace(/const CACHE='[^']+'/, `const CACHE='adn-app-${hash}'`);
fs.writeFileSync(SW, sw, 'utf8');
console.log(`SW cache: ${before} -> adn-app-${hash}`);
