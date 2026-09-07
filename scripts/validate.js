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

console.log('== 2) Evaluación de VIVO / DATOS (portal-data.js) ==');
{
  const f = 'portal-data.js';
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
for (const f of [...HTML, 'portal-data.js']) {
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

console.log('== 4) Integridad de assets (byte NUL / carácter de reemplazo) ==');
{
  const skip = new Set(['node_modules', '.git']);
  const exts = new Set(['.html', '.css', '.js', '.json', '.svg', '.webmanifest']);
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!exts.has(path.extname(e.name).toLowerCase())) continue;
      const rel = path.relative(ROOT, p).replace(/\\/g, '/');
      const buf = fs.readFileSync(p);
      if (buf.includes(0x00)) fail(rel, 'contiene byte NUL (0x00) — texto corrupto (p.ej. escape CSS \\00xx roto)');
      if (buf.includes(String.fromCharCode(0xFFFD))) fail(rel, 'contiene caracter de reemplazo U+FFFD (mojibake / codificacion rota)');
    }
  };
  walk(ROOT);
}

console.log('== 5) Integridad de banderas (flags.css ↔ flags/*.svg) ==');
{
  const cssPath = path.join(ROOT, 'flags.css');
  const dir = path.join(ROOT, 'flags');
  if (fs.existsSync(cssPath) && fs.existsSync(dir)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const defined = new Set([...css.matchAll(/\.fi-([a-z]{2})\b/g)].map(m => m[1]));
    const files = new Set(fs.readdirSync(dir).filter(f => f.endsWith('.svg')).map(f => f.replace('.svg', '')));
    for (const c of defined) if (!files.has(c)) fail('flags.css', `.fi-${c} sin archivo flags/${c}.svg`);
    for (const c of files) if (!defined.has(c)) fail('flags/', `${c}.svg sin regla .fi-${c} en flags.css`);
  }
}

console.log('== 6) Integridad de iconos lucide (data-lucide ↔ subset) ==');
{
  const lucidePath = path.join(ROOT, 'lucide.min.js');
  if (fs.existsSync(lucidePath)) {
    const lucide = fs.readFileSync(lucidePath, 'utf8');
    const has = name => lucide.includes(`"${name}":`);
    for (const f of HTML) {
      const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const names = new Set([...s.matchAll(/data-lucide="([a-z0-9-]+)"/g)].map(m => m[1]));
      for (const n of names) if (!has(n)) fail(f, `icono lucide "${n}" no está en lucide.min.js (se vería en blanco)`);
    }
  }
}

if (errors) { console.error(`\n${errors} error(es). Falla la validación.`); process.exit(1); }
console.log(`\n✓ Todo OK · ${HTML.length} archivos validados.`);
