#!/usr/bin/env node
/* Baja los titulares de Google Noticias y los guarda como JSON estático en news/.
   Uso: node scripts/titulares.js  (lo corre .github/workflows/titulares.yml cada 20 min).
   Por qué: rss2json.com quedó tras un desafío de Cloudflare y Google Noticias rechaza (503)
   las peticiones desde Workers, así que los feeds se bajan desde GitHub Actions.

   Las búsquedas se sacan de las propias páginas (las que usan adnNews(...)), así que
   agregar una búsqueda nueva en un panel no requiere tocar este script si sigue los
   mismos patrones: queries:[...], QUERIES=[...], qs=[...], fill=[...], feed('...'),
   feedMany([...]), encodeURIComponent('...') en la URL de Google, o FAENAS {n:'...'}.

   Cada feed queda en news/<clave>.json con el formato de rss2json ({status, feed, items}).
   La clave es FNV-1a de "q|ceid", igual que la función adnNews() de las páginas. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'news');
const MAX_ITEMS = 30; // los paneles muestran a lo más 24 titulares combinando varias búsquedas
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function key(q, ceid) {
  const k = q + '|' + ceid;
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}

// ---- 1) Búsquedas usadas por las páginas ----
function pageFiles() {
  const out = [];
  for (const rel of ['', 'app/']) {
    for (const name of fs.readdirSync(path.join(ROOT, rel))) {
      if (name.endsWith('.html')) out.push(rel + name);
    }
  }
  return out;
}
const strs = s => [...s.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\(.)/g, '$1'));

function collectFeeds() {
  const feeds = new Map(); // clave -> {q, ceid}
  for (const f of pageFiles()) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (!html.includes('adnNews(')) continue;
    const ceids = [...new Set([...html.matchAll(/ceid=(CL:es(?:-419)?)'/g)].map(m => m[1]))];
    const qs = [];
    for (const m of html.matchAll(/(?:queries:|\b(?:QUERIES|qs|fill)\s*=)\s*\[([^\]]*)\]/g)) qs.push(...strs(m[1]));
    for (const m of html.matchAll(/feedMany\(\[([^\]]*)\]/g)) qs.push(...strs(m[1]));
    for (const m of html.matchAll(/\bfeed\('((?:[^'\\]|\\.)*)'/g)) qs.push(m[1]);
    for (const line of html.split('\n').filter(l => l.includes('news.google.com/rss'))) {
      for (const m of line.matchAll(/encodeURIComponent\('((?:[^'\\]|\\.)*)'\)/g)) qs.push(m[1]);
    }
    // Ficha de faena: busca '"<nombre>" minería' por cada faena de la lista
    if (/'"'\+f\.n\+'" minería'/.test(html)) {
      const list = (html.match(/const FAENAS=\[([\s\S]*?)\n\s*\];/) || [])[1] || '';
      for (const m of list.matchAll(/\bn:'((?:[^'\\]|\\.)*)'/g)) qs.push('"' + m[1].replace(/\\(.)/g, '$1') + '" minería');
    }
    for (const q of qs) for (const ceid of ceids) feeds.set(key(q, ceid), { q, ceid });
  }
  return feeds;
}

// ---- 2) RSS -> JSON (formato rss2json) ----
function xmlText(s) {
  return String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').trim();
}
function xmlTag(block, tag) {
  const m = block.match(new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>'));
  return m ? xmlText(m[1]) : '';
}
function toJSON(url, xml) {
  const channel = xml.split('<item>')[0];
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, MAX_ITEMS).map(m => {
    const b = m[1];
    const pub = Date.parse(xmlTag(b, 'pubDate'));
    return {
      title: xmlTag(b, 'title'),
      // rss2json entrega "YYYY-MM-DD HH:MM:SS" en UTC
      pubDate: isNaN(pub) ? '' : new Date(pub).toISOString().replace('T', ' ').slice(0, 19),
      link: xmlTag(b, 'link'),
      author: '',
      source: xmlTag(b, 'source')
    };
  });
  return { status: 'ok', feed: { url, title: xmlTag(channel, 'title') }, items };
}
// Un titular por línea: así git guarda solo los titulares nuevos entre corridas
const stringify = j => '{"status":"ok","feed":' + JSON.stringify(j.feed) + ',"items":[\n' + j.items.map(it => JSON.stringify(it)).join(',\n') + '\n]}\n';

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchFeed(url) {
  for (let intento = 0; intento < 3; intento++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.ok) return await r.text();
      console.warn(`  ${r.status} (intento ${intento + 1})`);
    } catch (e) { console.warn(`  ${e.message} (intento ${intento + 1})`); }
    await sleep(2000 * (intento + 1));
  }
  return null;
}

(async () => {
  const feeds = collectFeeds();
  if (!feeds.size) { console.error('No se encontraron búsquedas en las páginas'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0, fail = 0;
  for (const [k, { q, ceid }] of feeds) {
    const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(q) + '&hl=es-419&gl=CL&ceid=' + ceid;
    const xml = await fetchFeed(url);
    if (xml && xml.includes('<rss')) {
      const j = toJSON(url, xml);
      fs.writeFileSync(path.join(OUT, k + '.json'), stringify(j));
      console.log(`ok   ${k}  ${String(j.items.length).padStart(3)}  ${q} [${ceid}]`);
      ok++;
    } else {
      // Se conserva el archivo anterior (si existe) para no dejar el panel vacío
      console.log(`FAIL ${k}  ${q} [${ceid}]`);
      fail++;
    }
    await sleep(400);
  }
  // Borra feeds que ya ninguna página usa
  for (const name of fs.readdirSync(OUT)) {
    if (/^[0-9a-f]+\.json$/.test(name) && !feeds.has(name.slice(0, -5))) fs.unlinkSync(path.join(OUT, name));
  }
  console.log(`\n${ok} feeds actualizados, ${fail} fallidos, de ${feeds.size}`);
  if (!ok) process.exit(1);
})();
