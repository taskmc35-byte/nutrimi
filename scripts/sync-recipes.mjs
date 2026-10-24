#!/usr/bin/env node
/* Nutrimi — aggiornamento settimanale delle ricette dal web.
   Da ogni pagina di ricetta legge SOLO i dati strutturati (schema.org/Recipe): titolo, porzioni, tempo,
   ingredienti e dosi. Il procedimento non viene copiato: nell'app resta il link alla pagina originale.
   I valori nutrizionali li calcola Nutrimi dai propri alimenti.

   Uso:
     node scripts/sync-recipes.mjs                  → importa e salva su Supabase
     node scripts/sync-recipes.mjs --dry            → prova senza salvare, stampa il risultato
     node scripts/sync-recipes.mjs --dry --url URL  → prova una singola pagina
   Variabili d'ambiente (non servono con --dry): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ONE = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;

/* ---------- alimenti dell'app ---------- */
const ctx = { window: {} };
vm.runInNewContext(await readFile(path.join(ROOT, 'js/data/foods.js'), 'utf8'), ctx);
const FOODS = ctx.window.NUTRIMI_FOODS;
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
FOODS.forEach((f) => { f._keys = [norm(f.name), ...(f.alias || []).map(norm)]; });
function guessFood(name) {
  const n = ' ' + norm(name).replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  let best = null, bestLen = 0;
  for (const f of FOODS) for (const k of f._keys) {
    if (k.length > bestLen && n.includes(' ' + k + ' ')) { best = f; bestLen = k.length; }
    else if (k.length > bestLen && k.length > 4 && n.includes(' ' + k)) { best = f; bestLen = k.length - 0.5; }
  }
  return best;
}

/* ---------- configurazione ---------- */
const CFG = JSON.parse(await readFile(path.join(ROOT, 'scripts/recipe-sources.json'), 'utf8'));
const UA = CFG.userAgent || 'NutrimiBot/1.0';
const DELAY = CFG.delayMs || 3000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it-IT,it;q=0.9' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/* ---------- robots.txt ---------- */
const robotsCache = new Map();
async function allowed(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let rules = [];
    try {
      const txt = await get(u.origin + '/robots.txt');
      let applies = false;
      for (const raw of txt.split('\n')) {
        const line = raw.split('#')[0].trim(); if (!line) continue;
        const [k, ...v] = line.split(':'); const val = v.join(':').trim();
        if (/^user-agent$/i.test(k)) applies = val === '*' || /nutrimibot/i.test(val);
        else if (applies && /^disallow$/i.test(k) && val) rules.push(val);
      }
    } catch { rules = []; }
    robotsCache.set(u.origin, rules);
  }
  const p = u.pathname + u.search;
  return !robotsCache.get(u.origin).some((r) => p.startsWith(r.replace(/\*.*$/, '')));
}

/* ---------- raccolta degli indirizzi ---------- */
async function urlsFromSitemap(src) {
  let xml = await get(src.sitemap);
  if (/<sitemapindex/i.test(xml)) {
    const subs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1])
      .filter((u) => !src.sitemapMatch || new RegExp(src.sitemapMatch).test(u)).slice(0, src.maxSitemaps || 3);
    xml = '';
    for (const s of subs) { await sleep(DELAY); xml += await get(s); }
  }
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].map((m) => ({
    loc: (m[1].match(/<loc>\s*([^<\s]+)/i) || [])[1],
    lastmod: (m[1].match(/<lastmod>\s*([^<\s]+)/i) || [])[1] || ''
  })).filter((e) => e.loc && (!src.match || new RegExp(src.match).test(e.loc)));
  entries.sort((a, b) => b.lastmod.localeCompare(a.lastmod));
  return entries.map((e) => e.loc);
}

/* ---------- lettura della ricetta ---------- */
function findRecipe(node) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const n of node) { const r = findRecipe(n); if (r) return r; } return null; }
  const t = node['@type']; if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) return node;
  return findRecipe(node['@graph']) || null;
}
function extractRecipe(html) {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const r = findRecipe(JSON.parse(m[1].trim())); if (r) return r; } catch { /* JSON non valido: passa al prossimo */ }
  }
  return null;
}
const WORDNUM = { un: 1, uno: 1, una: 1, mezzo: 0.5, mezza: 0.5, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, otto: 8, dieci: 10 };
const UNITS = [
  [/^(kg|chilo|chili)$/, 1000], [/^(g|gr|grammi|grammo)$/, 1], [/^ml$/, 1], [/^cl$/, 10], [/^dl$/, 100], [/^(l|litro|litri)$/, 1000],
  [/^cucchiai(o)?$/, 10], [/^cucchiain[oi]$/, 4], [/^tazz[ae]$/, 200], [/^bicchier[ei]$/, 150], [/^pizzic(o|hi)$/, 1],
  [/^spicch(io|i)$/, 5], [/^fett[ae]$/, 30], [/^fogli[ae]$/, 0.5], [/^rametti?o?$/, 1], [/^ciuff[oi]$/, 5], [/^mazzett[oi]$/, 20], [/^cespo$/, 300], [/^vasett[oi]$/, 125], [/^scatol(a|e|etta|ette)$/, 240], [/^confezion[ei]$/, 250]
];
function parseLine(line) {
  const raw = norm(line).replace(/(\d),(\d)/g, '$1.$2').replace(/½/g, '0.5');
  const food = guessFood(raw.replace(/\([^)]*\)/g, ' '));
  if (!food) return { line, food: null };
  if (/\bq\.?\s?b\.?\b|quanto basta|a piacere|per (la )?(cottura|friggere|ungere)/.test(raw) && !/\d/.test(raw)) {
    return { line, food, grams: food.staple ? (food.id === 'olio_evo' ? 30 : 1) : null };
  }
  const tokens = raw.split(/[\s]+/);
  for (let i = 0; i < tokens.length; i++) {
    let tok = tokens[i], qty = null;
    const frac = tok.match(/^(\d+)\/(\d+)$/);
    if (frac) qty = +frac[1] / +frac[2];
    else if (/^\d+(\.\d+)?(-\d+(\.\d+)?)?$/.test(tok)) qty = +tok.split('-')[0];
    else if (/^\d+(\.\d+)?[a-z]+$/.test(tok)) { const m = tok.match(/^(\d+(?:\.\d+)?)([a-z]+)$/); qty = +m[1]; tokens.splice(i + 1, 0, m[2]); }
    else if (WORDNUM[tok] != null && i + 1 < tokens.length && UNITS.some(([re]) => re.test(tokens[i + 1]))) qty = WORDNUM[tok];
    if (qty == null) continue;
    const next = (tokens[i + 1] || '').replace(/[.,;]$/, '');
    const unit = UNITS.find(([re]) => re.test(next));
    if (unit) return { line, food, grams: qty * unit[1] };
    if (food.pz) return { line, food, grams: qty * food.pz };
    if (qty >= 20) return { line, food, grams: qty };
  }
  if (food.staple) return { line, food, grams: food.id === 'olio_evo' ? 30 : 1 };
  return { line, food, grams: null };
}
function servingsOf(y) {
  const arr = Array.isArray(y) ? y : [y];
  for (const v of arr) { const m = String(v || '').match(/\d+/); if (m && +m[0] > 0 && +m[0] <= 20) return +m[0]; }
  return 4;
}
function minutesOf(iso) {
  const m = String(iso || '').match(/P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 30; const v = (+m[1] || 0) * 60 + (+m[2] || 0); return v || 30;
}
const SKIP_CAT = /dolc|dessert|bevand|cocktail|salse|sughi pronti|marmellat|conserv|lievitat|pane e pizze/;
function tagsOf(rec, ing) {
  const cat = norm([].concat(rec.recipeCategory || [], rec.keywords || []).join(' '));
  const tags = [];
  if (/colazion/.test(cat)) tags.push('colazione');
  else if (/primi|primo/.test(cat)) tags.push('primo');
  else if (/piatti? unic/.test(cat)) tags.push('unico');
  else if (/secondi|secondo/.test(cat)) tags.push('secondo');
  else if (/antipast|contorn|insalat/.test(cat)) tags.push('unico');
  const carniPesce = ['Carne e salumi', 'Pesce'];
  if (!ing.some((x) => carniPesce.includes(FOODS.find((f) => f.id === x[0]).cat))) tags.push('vegetariana');
  return { tags, skip: SKIP_CAT.test(cat) };
}
function buildRecipe(rec, url, sourceName) {
  const lines = [].concat(rec.recipeIngredient || rec.ingredients || []).map(String).filter(Boolean);
  if (lines.length < 2) return { error: 'ingredienti assenti' };
  const parsed = lines.map(parseLine);
  const ok = parsed.filter((p) => p.food && p.grams);
  if (ok.length / lines.length < 0.75) return { error: `solo ${ok.length}/${lines.length} ingredienti riconosciuti`, parsed };
  const serv = servingsOf(rec.recipeYield);
  const merged = {};
  ok.forEach((p) => { merged[p.food.id] = (merged[p.food.id] || 0) + p.grams / serv; });
  const ing = Object.entries(merged).map(([id, g]) => [id, Math.round(g * 10) / 10]);
  const { tags, skip } = tagsOf(rec, ing);
  if (skip) return { error: 'categoria esclusa (dolci, bevande, conserve…)' };
  if (!tags.some((t) => ['colazione', 'primo', 'secondo', 'unico'].includes(t))) tags.unshift('unico');
  const title = String(rec.name || '').replace(/\s+/g, ' ').trim();
  if (!title) return { error: 'titolo assente' };
  return {
    row: {
      id: 'w-' + createHash('sha1').update(url).digest('hex').slice(0, 14),
      source_url: url, source_name: sourceName, active: true,
      data: { t: title, tag: tags, min: minutesOf(rec.totalTime || rec.cookTime), ing, imported: true }
    }, parsed
  };
}

/* ---------- Supabase ---------- */
const SB = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sbHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
async function existingUrls() {
  if (DRY) return new Set();
  const res = await fetch(`${SB}/rest/v1/recipes?select=source_url&limit=10000`, { headers: sbHeaders });
  if (!res.ok) throw new Error('Lettura ricette esistenti non riuscita: ' + res.status + ' ' + await res.text());
  return new Set((await res.json()).map((r) => r.source_url));
}
async function save(rows) {
  if (!rows.length) return;
  const res = await fetch(`${SB}/rest/v1/recipes`, { method: 'POST', headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows) });
  if (!res.ok) throw new Error('Salvataggio non riuscito: ' + res.status + ' ' + await res.text());
}

/* ---------- esecuzione ---------- */
async function processUrl(url, sourceName) {
  if (!(await allowed(url))) return { url, error: 'pagina esclusa da robots.txt' };
  const rec = extractRecipe(await get(url));
  if (!rec) return { url, error: 'nessun dato strutturato di ricetta' };
  return { url, ...buildRecipe(rec, url, sourceName) };
}

if (!DRY && (!SB || !KEY)) { console.error('Mancano SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (oppure usa --dry).'); process.exit(1); }

if (ONE) {
  const r = await processUrl(ONE, new URL(ONE).hostname.replace(/^www\./, ''));
  console.log(JSON.stringify({ ...r, parsed: (r.parsed || []).map((p) => ({ riga: p.line, alimento: p.food?.name || null, grammi: p.grams })) }, null, 2));
  process.exit(0);
}

const seen = await existingUrls();
const rows = [], report = [];
const max = CFG.maxPerRun || 40;
for (const src of (CFG.sources || []).filter((s) => s.enabled)) {
  let urls = [...(src.urls || [])];
  try { if (src.sitemap) urls = urls.concat(await urlsFromSitemap(src)); } catch (e) { report.push(`${src.name}: sitemap non leggibile (${e.message})`); }
  let taken = 0;
  for (const url of urls) {
    if (rows.length >= max || taken >= (src.limit || 20)) break;
    if (seen.has(url)) continue;
    seen.add(url);
    await sleep(DELAY);
    try {
      const r = await processUrl(url, src.name);
      if (r.row) { rows.push(r.row); taken++; report.push(`OK  ${r.row.data.t} — ${url}`); }
      else report.push(`--  ${url}: ${r.error}`);
    } catch (e) { report.push(`ERR ${url}: ${e.message}`); }
  }
}
console.log(report.join('\n') || 'Nessuna fonte attiva in scripts/recipe-sources.json');
if (DRY) console.log(JSON.stringify(rows, null, 2));
else { await save(rows); console.log(`Salvate ${rows.length} ricette.`); }
