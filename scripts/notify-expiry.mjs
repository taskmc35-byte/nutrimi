#!/usr/bin/env node
/* Nutrimi — avvisi di scadenza delle 9:00 (ora italiana).
   Per ogni casa cerca in dispensa i prodotti che scadono entro 3 giorni e non sono ancora stati segnalati,
   e invia una notifica a tutti i telefoni di casa che l'hanno attivata, con una ricetta che li usa.
   Variabili: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (es. mailto:tua@email.it)
   Opzione --force: invia anche se in Italia non sono ancora le 9. */
import webpush from 'web-push';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const { SUPABASE_URL: SB, SUPABASE_SERVICE_ROLE_KEY: KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
if (!SB || !KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) { console.error('Mancano le variabili SUPABASE_* o VAPID_*'); process.exit(1); }
webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:info@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/* ora e data in Italia */
const now = new Date();
const romeHour = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false }).format(now);
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(now); // YYYY-MM-DD
if (romeHour < 9 && !FORCE) { console.log(`In Italia sono le ${romeHour}: aspetto le 9.`); process.exit(0); }
const daysLeft = (exp) => Math.round((new Date(exp + 'T00:00:00Z') - new Date(today + 'T00:00:00Z')) / 86400000);

// le chiavi nuove (sb_secret_…) vanno solo in apikey; quelle vecchie (service_role, JWT) anche in Authorization
const H = { apikey: KEY, 'Content-Type': 'application/json', ...(String(KEY).startsWith('eyJ') ? { Authorization: `Bearer ${KEY}` } : {}) };
async function q(pathAndQuery) {
  const r = await fetch(`${SB}/rest/v1/${pathAndQuery}`, { headers: H });
  if (!r.ok) throw new Error(`${pathAndQuery}: ${r.status} ${await r.text()}`);
  return r.json();
}
async function post(table, rows, prefer) {
  const r = await fetch(`${SB}/rest/v1/${table}`, { method: 'POST', headers: { ...H, Prefer: prefer || 'return=minimal' }, body: JSON.stringify(rows) });
  if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
}

/* ricette: ricettario dell'app + importate */
const ctx = { window: {} };
vm.runInNewContext(await readFile(path.join(ROOT, 'js/data/foods.js'), 'utf8'), ctx);
vm.runInNewContext(await readFile(path.join(ROOT, 'js/data/recipes.js'), 'utf8'), ctx);
const FOOD = Object.fromEntries(ctx.window.NUTRIMI_FOODS.map((f) => [f.id, f]));
let RECIPES = ctx.window.NUTRIMI_RECIPES.map((r) => ({ t: r.t, ing: r.ing }));
try { RECIPES = RECIPES.concat((await q('recipes?select=data&active=eq.true&limit=2000')).map((x) => x.data)); } catch { /* solo ricettario base */ }

function bestRecipe(foodIds, allergies) {
  let best = null, n = 0;
  for (const r of RECIPES) {
    if (r.ing.some(([id, , opt]) => !opt && (FOOD[id]?.al || []).some((a) => allergies.has(a)))) continue;
    const k = r.ing.filter(([id, , opt]) => !opt && foodIds.includes(id)).length;
    if (k > n) { best = r; n = k; }
  }
  return best;
}
const when = (d) => (d === 0 ? 'oggi' : d === 1 ? 'domani' : `tra ${d} giorni`);

const subs = await q('push_subscriptions?select=endpoint,household_id,sub');
const byHouse = {};
subs.forEach((s) => (byHouse[s.household_id] ||= []).push(s));
let sentCount = 0;

for (const [hid, houseSubs] of Object.entries(byHouse)) {
  const pantry = (await q(`pantry?select=id,data&household_id=eq.${hid}`)).map((r) => ({ ...r.data, id: r.id }));
  const soon = pantry.filter((i) => !i.always && i.exp && (+i.grams || 0) > 0 && daysLeft(i.exp) >= 0 && daysLeft(i.exp) <= 3);
  if (!soon.length) continue;
  const already = await q(`push_sent?select=item_id,exp&item_id=in.(${soon.map((i) => `"${i.id}"`).join(',')})`);
  const fresh = soon.filter((i) => !already.some((a) => a.item_id === i.id && a.exp === i.exp)).sort((a, b) => a.exp.localeCompare(b.exp));
  if (!fresh.length) continue;

  const profiles = (await q(`profiles?select=data&household_id=eq.${hid}`)).map((r) => r.data);
  const allergies = new Set(profiles.flatMap((p) => p.allergies || []));
  const recipe = bestRecipe(fresh.map((i) => i.foodId).filter(Boolean), allergies);
  const title = fresh.length === 1 ? `${fresh[0].name} scade ${when(daysLeft(fresh[0].exp))}` : `${fresh.length} prodotti stanno per scadere`;
  const body = (fresh.length === 1 ? 'Consumalo presto.' : fresh.slice(0, 4).map((i) => `${i.name} (${when(daysLeft(i.exp))})`).join(', ') + '.') +
    (recipe ? ` Prova: ${recipe.t}.` : '');
  const payload = JSON.stringify({ title, body, url: './' });

  for (const s of houseSubs) {
    try { await webpush.sendNotification(s.sub, payload, { TTL: 6 * 3600 }); sentCount++; }
    catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { // telefono non più iscritto
        await fetch(`${SB}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE', headers: H });
      } else console.error('Invio non riuscito:', e.statusCode, e.body || e.message);
    }
  }
  await post('push_sent', fresh.map((i) => ({ item_id: i.id, exp: i.exp, sent_on: today })), 'resolution=ignore-duplicates,return=minimal');
  console.log(`Casa ${hid.slice(0, 8)}: ${title}`);
}
console.log(`Notifiche inviate: ${sentCount}`);
