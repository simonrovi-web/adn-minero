#!/usr/bin/env node
/* Validación de ADN Minero (CI). Sin dependencias.
   1) Sintaxis de cada bloque <script> inline.
   2) Evaluación real de const VIVO/DATOS (caza ReferenceError como el bug O'Higgins).
   3) Integridad de enlaces internos (href="..." y f:'...').
   Sale con código !=0 si algo falla. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
const fail = (f, msg) => { errors++; console.error(`  ✗ ${f}: ${msg}`); };

function listHtml() {
  const out = [];
  for (const f of fs.readdirSync(ROOT)) {
    if (/^(adn-minero-[a-z0-9-]+|index)\.html$/.test(f)) out.push(f);
  }
  if (fs.existsSync(path.join(ROOT, 'app', 'index.html'))) out.push('app/index.html');
  return out;
}
const HTML = listHtml();
const fileSet = new Set(HTML.map(f => path.basename(f)));

function scripts(src) {
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const arr = []; let m;
  while ((m = re.exec(src))) {
    const attrs = m[1] || '';
    if (/\bsrc=/i.test(attrs)) continue;                 // externo
    const t = (attrs.match(/\btype="([^"]*)"/i) || [])[1];
    if (t && !/^(text\/javascript|application\/javascript|module)$/i.test(t)) continue; // p.ej. ld+json
    if (m[2].trim()) arr.push(m[2]);
  }
  return arr;
}

console.log('== 1) Sintaxis de bloques <script> ==');
for (const f of HTML) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  scripts(s).forEach((code, i) => {
    try { new vm.Script(code, { filename: `${f}#${i}` }); }
    catch (e) { fail(f, `bloque ${i} sintaxis: ${e.message}`); }
  });
}

console.log('== 2) Evaluación de VIVO / DATOS ==');
for (const f of ['index.html', 'app/index.html']) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const name of ['VIVO', 'DATOS']) {
    const m = s.match(new RegExp('const\\s+' + name + '\\s*=\\s*(\\[[\\s\\S]*?\\]);'));
    if (!m) { fail(f, `no se encontró ${name}`); continue; }
    try {
      const val = vm.runInNewContext(m[1]); // lanza si hay ReferenceError (ej. chr)
      if (!Array.isArray(val) || val.some(o => !o || !o.f || !o.t))
        fail(f, `${name} inválido (falta f/t)`);
    } catch (e) { fail(f, `${name} no evalúa: ${e.message}`); }
  }
}

console.log('== 3) Integridad de enlaces internos ==');
for (const f of HTML) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const refs = new Set();
  let m;
  const reHref = /href="((?:\.\.\/)?(?:adn-minero-[a-z0-9-]+|index)\.html)"/g;
  while ((m = reHref.exec(s))) refs.add(m[1]);
  const reF = /f:'((?:\.\.\/)?adn-minero-[a-z0-9-]+\.html)'/g;
  while ((m = reF.exec(s))) refs.add(m[1]);
  for (const r of refs) {
    if (!fileSet.has(path.basename(r.replace('../', '')))) fail(f, `enlace roto → ${r}`);
  }
}

if (errors) { console.error(`\n${errors} error(es). Falla la validación.`); process.exit(1); }
console.log(`\n✓ Todo OK · ${HTML.length} archivos validados.`);
