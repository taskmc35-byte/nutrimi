/* Nutrimi — memoria dei prodotti inseriti a mano e lettura della tabella nutrizionale dalla foto.
   I prodotti con codice a barre inseriti da un utente finiscono nel catalogo condiviso (tabella products,
   vedi supabase/products.sql): chi li scansiona dopo li trova subito. Senza account restano su questo telefono. */
(function () {
  var N = window.N;
  var LKEY = 'nutrimi:products:v1';
  function online() { return !!(N.cloud && N.cloud.active && N.cloud.sb); }
  function loadL() { try { return JSON.parse(localStorage.getItem(LKEY)) || {}; } catch (e) { return {}; } }
  function saveL(m) { try { localStorage.setItem(LKEY, JSON.stringify(m)); } catch (e) { } }
  function toProduct(r, src) {
    return {
      code: r.code, name: r.name, brand: r.brand || '', grams: +r.grams || 0, n: r.n, al: r.al || [], traces: [], lat: !!r.lat,
      img: null, foodId: r.food_id || r.foodId || null, cat: r.cat || 'Altro', source: src
    };
  }

  var P = N.products = {};
  /* cerca prima nella memoria di Nutrimi, poi (in N.off.lookup) su Open Food Facts */
  P.lookup = async function (code) {
    if (online()) {
      try {
        var r = await N.cloud.sb.from('products').select('code, name, brand, grams, n, al, lat, food_id, cat').eq('code', code).limit(1);
        if (!r.error && r.data && r.data[0]) return toProduct(r.data[0], 'nutrimi');
      } catch (e) { console.warn('prodotti', e); }
    }
    var l = loadL()[code];
    return l ? toProduct(l, 'nutrimi') : null;
  };
  P.save = async function (p) {
    if (!p || !p.code || !/^\d{8,14}$/.test(p.code) || !p.n) return { ok: false };
    var row = { code: p.code, name: p.name, brand: p.brand || '', grams: p.grams || null, n: p.n, al: p.al || [], lat: !!p.lat, foodId: p.foodId || null, cat: p.cat || null };
    var m = loadL(); m[p.code] = row; saveL(m);
    if (!online()) return { ok: true, local: true };
    try {
      var r = await N.cloud.sb.rpc('nm_save_product', { p: row });
      if (r.error) throw r.error;
      return r.data;
    } catch (e) { console.warn('prodotti', e); return { ok: false, reason: e.message }; }
  };

  /* lookup: memoria Nutrimi → Open Food Facts */
  var offLookup = N.off.lookup;
  N.off.lookup = async function (code) {
    var mine = await P.lookup(code);
    if (mine) return mine;
    return offLookup(code);
  };

  /* ---------- tabella nutrizionale dalla foto ---------- */
  var KEYS = {
    f: /\b(grassi|lipidi|materie grasse|fat|grasas|gorduras|lipides)\b/,
    sat: /(saturi|saturated|saturados|satur)/,
    c: /\b(carboidrati|carbohydrate|carbohydrates|hidratos|glucides|carboidratos)\b/,
    s: /\b(zuccheri|sugars?|azucares|açúcares|acucares|sucres)\b/,
    fib: /\b(fibre|fibra|fibras|fiber|fibres|fibers|fibres alimentaires)\b/,
    p: /\b(proteine|protein|proteins|proteinas|proteínas|protéines)\b/
  };
  function nums(line) {
    var out = [], m, re = /(\d{1,4}(?:[.,]\d{1,2})?)/g;
    while ((m = re.exec(line))) out.push(parseFloat(m[1].replace(',', '.')));
    return out;
  }
  N.parseNutrition = function (text) {
    var lines = String(text || '').toLowerCase()
      .replace(/(\d)\s*[oq](?=\s|g|%|$)/g, '$10').replace(/[oq](?=[.,]\d)/g, '0')
      .replace(/<\s*0[.,]5/g, '0.4').replace(/<\s*0[.,]1/g, '0')
      .replace(/(\d+[.,]\d)9(?=\s|$)/gm, '$1') // "2,5 g" letto come "2,59"
      .replace(/(\d)\s?g(?=\s|$)/gm, '$1 g')
      .split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
    var out = {};
    // energia: il numero seguito da "kcal", oppure la coppia kJ / kcal
    lines.forEach(function (l) {
      if (out.kcal != null || !/kcal|energia|energy|valor energ|valeur/.test(l)) return;
      var m = l.match(/(\d{1,4}(?:[.,]\d)?)\s*kcal/);
      if (m) { out.kcal = parseFloat(m[1].replace(',', '.')); return; }
      var ns = nums(l);
      for (var i = 0; i + 1 < ns.length; i++) {
        if (ns[i] > ns[i + 1] && Math.abs(ns[i] / 4.184 - ns[i + 1]) <= Math.max(3, ns[i + 1] * 0.04)) { out.kcal = ns[i + 1]; return; }
      }
    });
    lines.forEach(function (l, idx) {
      Object.keys(KEYS).forEach(function (k) {
        if (out[k] != null || !KEYS[k].test(l)) return;
        if (k === 'f' && KEYS.sat.test(l)) return;
        if (k === 'c' && KEYS.s.test(l)) return;
        var after = l.split(KEYS[k])[2] || l; // testo dopo la parola chiave
        var ns = nums(after);
        if (!ns.length && lines[idx + 1]) ns = nums(lines[idx + 1]); // numero andato a capo
        if (ns.length) out[k] = ns[0];
      });
    });
    // controlli di plausibilità
    Object.keys(out).forEach(function (k) { if (out[k] < 0 || (k === 'kcal' ? out[k] > 900 : out[k] > 100)) delete out[k]; });
    if (out.s != null && out.c != null && out.s > out.c + 0.5) delete out.s;
    if (out.sat != null && out.f != null && out.sat > out.f + 0.5) delete out.sat;
    if (out.kcal == null && out.p != null && out.c != null && out.f != null) out.kcal = Math.round(out.p * 4 + out.c * 4 + out.f * 9);
    return out;
  };

  var A = N.extraActions = N.extraActions || {};
  A['mn-ocr'] = function () { var f = document.getElementById('mn-file'); if (f) { f.value = ''; f.click(); } };
  document.addEventListener('change', async function (e) {
    if (e.target.id !== 'mn-file' || !e.target.files[0]) return;
    var box = document.getElementById('mn-ocr-msg');
    var say = function (t, cls) { if (box) { box.hidden = false; box.className = 'ocr-msg ' + (cls || ''); box.textContent = t; } };
    say('Sto leggendo la tabella nutrizionale…');
    try {
      var text = await N.ocrText(e.target.files[0], 'ita', true, true);
      var v = N.parseNutrition(text), ids = { kcal: 'mn-kcal', p: 'mn-p', c: 'mn-c', s: 'mn-s', f: 'mn-f', sat: 'mn-sat', fib: 'mn-fib' };
      var found = 0;
      Object.keys(ids).forEach(function (k) {
        var el = document.getElementById(ids[k]);
        if (el && v[k] != null) { el.value = String(v[k]); el.classList.add('ocr-filled'); found++; }
      });
      if (!found) say('Non sono riuscito a leggere i valori. Prova con una foto più vicina e dritta, solo sulla tabella.', 'bad');
      else say('Letti ' + found + ' valori su 7: controllali con l’etichetta prima di salvare.' + (found < 7 ? ' Quelli mancanti scrivili a mano.' : ''), 'ok');
    } catch (err) { say(err.message || 'Lettura non riuscita', 'bad'); }
  });
})();
