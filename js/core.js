/* Nutrimi — logica: stato, nutrizione, allergeni, dispensa, ricette, obiettivi */
(function () {
  var N = window.N = window.N || {};

  /* ---------- utilità ---------- */
  N.uid = function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  };
  N.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  N.norm = function (s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
  };
  var nf0 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
  N.f0 = function (x) { return nf0.format(Math.round(x || 0)); };
  N.f1 = function (x) { return nf1.format(x || 0); };
  N.today = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* ---------- alimenti ---------- */
  N.FOODS = window.NUTRIMI_FOODS || [];
  N.FOOD = {};
  N.FOODS.forEach(function (f) { N.FOOD[f.id] = f; f._keys = [N.norm(f.name)].concat((f.alias || []).map(N.norm)); });
  N.CATS = ['Cereali e pasta', 'Carne e salumi', 'Pesce', 'Latticini e uova', 'Legumi e tofu', 'Verdura', 'Frutta', 'Frutta secca e semi', 'Condimenti', 'Spezie ed erbe', 'Dispensa', 'Colazione e snack', 'Bar e fuori casa', 'Altro'];

  N.searchFoods = function (q, limit, opts) {
    q = N.norm(q); if (!q) return [];
    var out = [], noEst = opts && opts.noEst;
    var words = q.split(' ').filter(function (w) { return w.length > 1 && ['al', 'alla', 'allo', 'di', 'del', 'della', 'con', 'e'].indexOf(w) === -1; });
    N.FOODS.forEach(function (f) {
      if (noEst && f.est) return;
      var best = 99;
      f._keys.forEach(function (k, i) {
        var pos = k.indexOf(q);
        if (pos === 0) best = Math.min(best, i === 0 ? 0 : 1);
        else if (pos > 0) best = Math.min(best, i === 0 ? 2 : 3);
        // ogni parola cercata compare nel nome, in qualsiasi ordine ("cornetto marm")
        else if (words.length > 1 && words.every(function (w) { return k.indexOf(w) !== -1; })) best = Math.min(best, i === 0 ? 4 : 5);
      });
      if (best < 99) out.push([best, f]);
    });
    out.sort(function (a, b) { return a[0] - b[0] || a[1].name.localeCompare(b[1].name); });
    return out.slice(0, limit || 8).map(function (x) { return x[1]; });
  };
  /* trova l'alimento generico più adatto a un nome libero (prodotti scansionati, ricette importate) */
  N.guessFood = function (name) {
    var n = ' ' + N.norm(name).replace(/[^a-z0-9' ]/g, ' ') + ' ';
    var best = null, bestLen = 0;
    N.FOODS.forEach(function (f) {
      f._keys.forEach(function (k) {
        if (k.length > bestLen && n.indexOf(' ' + k + ' ') !== -1) { best = f; bestLen = k.length; }
        else if (k.length > bestLen && k.length > 4 && n.indexOf(' ' + k) !== -1) { best = f; bestLen = k.length - 0.5; }
      });
    });
    return best;
  };

  /* ---------- nutrizione ---------- */
  N.NUTR_KEYS = ['kcal', 'p', 'c', 's', 'f', 'sat', 'fib', 'A', 'C', 'D', 'E', 'B12'];
  N.NRV = { A: 800, C: 80, D: 5, E: 12, B12: 2.5 }; // valori nutritivi di riferimento UE
  N.VIT = [['A', 'Vitamina A', 'µg'], ['C', 'Vitamina C', 'mg'], ['D', 'Vitamina D', 'µg'], ['E', 'Vitamina E', 'mg'], ['B12', 'Vitamina B12', 'µg']];
  N.zero = function () { var o = {}; N.NUTR_KEYS.forEach(function (k) { o[k] = 0; }); return o; };
  N.addN = function (acc, per100, grams) {
    if (!per100) return acc;
    N.NUTR_KEYS.forEach(function (k) { acc[k] += (per100[k] || 0) * grams / 100; });
    return acc;
  };
  N.itemNutr = function (item) { // valori per 100 g di un elemento dispensa/spesa
    if (item.n) return item.n;
    var f = item.foodId && N.FOOD[item.foodId];
    return f ? f.n : null;
  };

  /* ---------- allergeni e intolleranze ---------- */
  N.ALLERGENS = [
    ['glutine', 'Glutine'], ['crostacei', 'Crostacei'], ['uova', 'Uova'], ['pesce', 'Pesce'], ['arachidi', 'Arachidi'],
    ['soia', 'Soia'], ['latte', 'Latte'], ['frutta_guscio', 'Frutta a guscio'], ['sedano', 'Sedano'], ['senape', 'Senape'],
    ['sesamo', 'Sesamo'], ['solfiti', 'Solfiti'], ['lupini', 'Lupini'], ['molluschi', 'Molluschi']
  ];
  N.AL_LABEL = {}; N.ALLERGENS.forEach(function (a) { N.AL_LABEL[a[0]] = a[1]; });
  N.INTOLERANCES = [['lattosio', 'Lattosio'], ['glutine', 'Glutine (sensibilità)'], ['nichel', 'Nichel'], ['istamina', 'Istamina']];
  N.IN_LABEL = {}; N.INTOLERANCES.forEach(function (a) { N.IN_LABEL[a[0]] = a[1]; });
  // alimenti segnalati per intolleranze senza un allergene ufficiale (indicazioni generali, non mediche)
  var NICHEL = ['pomodori', 'pomodorini', 'passata', 'pelati', 'concentrato', 'cacao', 'cioccolato_fondente', 'lenticchie_secche', 'lenticchie_cotte', 'ceci_cotti', 'ceci_secchi', 'borlotti', 'cannellini', 'piselli', 'spinaci', 'noci', 'mandorle', 'pistacchi', 'fiocchi_avena', 'pane_integrale', 'pasta_integrale', 'tonno_scatola', 'tonno_olio', 'kiwi', 'cozze', 'gamberi', 'tofu'];
  var ISTAMINA = ['pomodori', 'pomodorini', 'passata', 'pelati', 'concentrato', 'spinaci', 'melanzane', 'avocado', 'parmigiano', 'pecorino', 'feta', 'salsiccia', 'prosciutto_crudo', 'bresaola', 'pancetta', 'tonno_scatola', 'tonno_olio', 'sgombro', 'alici', 'aceto', 'aceto_balsamico', 'vino_bianco', 'salsa_soia', 'cacao', 'cioccolato_fondente', 'arance', 'limoni', 'kiwi', 'frutti_bosco', 'banane'];

  N.allergensOf = function (item) {
    if (item.al) return item.al;
    var f = item.foodId && N.FOOD[item.foodId];
    return f ? f.al : [];
  };
  N.hasLactose = function (item) {
    if (item.lat != null) return !!item.lat;
    var f = item.foodId && N.FOOD[item.foodId];
    return !!(f && f.lat);
  };
  /* conflitti di un prodotto/alimento con le persone indicate */
  N.conflicts = function (item, people) {
    var out = [], al = N.allergensOf(item), traces = item.traces || [], nm = N.norm(item.name || (N.FOOD[item.foodId] || {}).name);
    (people || []).forEach(function (p) {
      (p.allergies || []).forEach(function (a) {
        if (al.indexOf(a) !== -1) out.push({ person: p, label: N.AL_LABEL[a] || a, kind: 'allergia' });
        else if (traces.indexOf(a) !== -1) out.push({ person: p, label: (N.AL_LABEL[a] || a) + ' (tracce)', kind: 'tracce' });
      });
      (p.intolerances || []).forEach(function (i) {
        var hit = false;
        if (i === 'lattosio') hit = N.hasLactose(item);
        else if (i === 'glutine') hit = al.indexOf('glutine') !== -1;
        else if (i === 'nichel') hit = NICHEL.indexOf(item.foodId) !== -1;
        else if (i === 'istamina') hit = ISTAMINA.indexOf(item.foodId) !== -1;
        if (hit) out.push({ person: p, label: N.IN_LABEL[i] || i, kind: 'intolleranza' });
      });
      (p.otherAvoid || []).forEach(function (w) {
        w = N.norm(w); if (w && nm.indexOf(w) !== -1) out.push({ person: p, label: w, kind: 'allergia' });
      });
    });
    return out;
  };

  /* ---------- stato ---------- */
  var KEY = 'nutrimi:v1';
  N.blankState = function () {
    return { v: 1, profiles: [], meId: null, shopping: [], pantry: [], meals: [], custom_recipes: [], imported: [],
      settings: { servings: 2, eaters: null, followGoal: true, filter: 'tutte', pantryCat: 'tutte' }, demo: false };
  };
  N.S = N.blankState();
  N.loadLocal = function () {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var s = JSON.parse(raw); N.S = Object.assign(N.blankState(), s); N.S.settings = Object.assign(N.blankState().settings, s.settings || {}); return true; }
    } catch (e) { }
    return false;
  };
  N.saveLocal = function () { try { localStorage.setItem(KEY, JSON.stringify(N.S)); } catch (e) { } };

  /* tabelle sincronizzabili: ogni riga ha id e i suoi dati */
  N.TABLES = ['profiles', 'shopping', 'pantry', 'meals', 'custom_recipes'];
  N.put = function (table, row) {
    row.updatedAt = Date.now();
    var arr = N.S[table], i = arr.findIndex(function (r) { return r.id === row.id; });
    if (i === -1) arr.push(row); else arr[i] = row;
    N.saveLocal();
    if (N.cloud && N.cloud.active) N.cloud.upsert(table, row);
    return row;
  };
  N.del = function (table, id) {
    N.S[table] = N.S[table].filter(function (r) { return r.id !== id; });
    N.saveLocal();
    if (N.cloud && N.cloud.active) N.cloud.remove(table, id);
  };

  N.me = function () { return N.S.profiles.find(function (p) { return p.id === N.S.meId; }) || N.S.profiles[0] || null; };
  N.eaters = function () {
    var ids = N.S.settings.eaters;
    var list = N.S.profiles.filter(function (p) { return !ids || ids.indexOf(p.id) !== -1; });
    if (!list.length && N.me()) list = [N.me()];
    return list;
  };

  /* ---------- obiettivi nutrizionali ---------- */
  N.GOALS = [['dimagrire', 'Dimagrire'], ['mantenere', 'Mantenere'], ['massa', 'Mettere massa'], ['personalizzato', 'Personalizzato']];
  N.ACTIVITY = [[1.2, 'Sedentaria'], [1.375, 'Leggera (1-3 allenamenti)'], [1.55, 'Moderata (3-5 allenamenti)'], [1.725, 'Intensa (6-7 allenamenti)']];
  N.targets = function (p) {
    if (!p) return null;
    var w = +p.weight || 70, h = +p.height || 170, a = +p.age || 35;
    var bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'F' ? -161 : 5);
    var tdee = bmr * (+p.activity || 1.375);
    var goal = p.goal || 'mantenere', kcal, protPerKg;
    if (goal === 'dimagrire') { kcal = tdee - Math.min(500, tdee * 0.18); protPerKg = 1.8; }
    else if (goal === 'massa') { kcal = tdee + 300; protPerKg = 2.0; }
    else { kcal = tdee; protPerKg = 1.4; }
    var t = { kcal: kcal, p: w * protPerKg, f: kcal * 0.28 / 9 };
    t.c = Math.max(0, (t.kcal - t.p * 4 - t.f * 9) / 4);
    var c = p.custom || {};
    if (goal === 'personalizzato' || c.kcal) {
      if (+c.kcal) t.kcal = +c.kcal;
      if (+c.p) t.p = +c.p;
      if (+c.f) t.f = +c.f; else if (+c.kcal) t.f = t.kcal * 0.28 / 9;
      if (+c.c) t.c = +c.c; else t.c = Math.max(0, (t.kcal - t.p * 4 - t.f * 9) / 4);
    }
    var meals = +p.meals || 3;
    t.meals = meals; t.bmr = bmr; t.tdee = tdee;
    t.meal = { kcal: t.kcal / meals, p: t.p / meals, c: t.c / meals, f: t.f / meals };
    return t;
  };
  N.bmi = function (p) { var h = (+p.height || 0) / 100; return h ? (+p.weight || 0) / (h * h) : 0; };

  /* ---------- dispensa ---------- */
  /* ---------- scadenze ---------- */
  N.SOON_DAYS = 3;
  N.daysLeft = function (exp) {
    if (!exp) return null;
    var t = new Date(N.today() + 'T00:00:00'), e = new Date(exp + 'T00:00:00');
    if (isNaN(e)) return null;
    return Math.round((e - t) / 86400000);
  };
  var MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  N.fmtDate = function (exp) { var p = String(exp).split('-'); return +p[2] + ' ' + MESI[+p[1] - 1] + (p[0] !== N.today().slice(0, 4) ? ' ' + p[0] : ''); };
  N.expInfo = function (item) {
    if (!item || item.always) return null;
    var d = N.daysLeft(item.exp); if (d == null) return null;
    var label, cls;
    if (d < 0) { cls = 'expired'; label = d === -1 ? 'Scaduto ieri' : 'Scaduto da ' + (-d) + ' giorni'; }
    else if (d <= N.SOON_DAYS) { cls = 'soon'; label = d === 0 ? 'Scade oggi' : d === 1 ? 'Scade domani' : 'Scade tra ' + d + ' giorni'; }
    else { cls = 'ok'; label = 'Scade il ' + N.fmtDate(item.exp); }
    return { d: d, cls: cls, label: label };
  };
  N.soonItems = function () {
    return N.S.pantry.filter(function (i) { var x = N.expInfo(i); return x && x.cls === 'soon'; })
      .sort(function (a, b) { return a.exp.localeCompare(b.exp); });
  };
  N.expiredItems = function () {
    return N.S.pantry.filter(function (i) { var x = N.expInfo(i); return x && x.cls === 'expired'; })
      .sort(function (a, b) { return a.exp.localeCompare(b.exp); });
  };

  /* prodotti di un alimento, prima quelli che scadono prima */
  N.pantryFor = function (foodId) {
    return N.S.pantry.filter(function (i) { return i.foodId === foodId; })
      .sort(function (a, b) {
        var ea = a.exp || '9999', eb = b.exp || '9999';
        return ea < eb ? -1 : ea > eb ? 1 : (a.addedAt || 0) - (b.addedAt || 0);
      });
  };
  /* quantità utilizzabile: i prodotti scaduti non contano */
  N.available = function (foodId) {
    var items = N.pantryFor(foodId), g = 0, always = false, expired = 0, soon = null;
    items.forEach(function (i) {
      if (i.always) { always = true; return; }
      var d = N.daysLeft(i.exp);
      if (d != null && d < 0) { expired += +i.grams || 0; return; }
      g += +i.grams || 0;
      if (d != null && d <= N.SOON_DAYS && (soon == null || d < soon)) soon = d;
    });
    return { grams: g, always: always, any: always || g > 0, expired: expired, soon: soon };
  };
  /* scala le quantità (FIFO). Restituisce un registro per l'annullamento */
  N.consume = function (foodId, grams) {
    var log = [], left = grams;
    N.pantryFor(foodId).forEach(function (i) {
      if (left <= 0 || i.always) return;
      var dl = N.daysLeft(i.exp); if (dl != null && dl < 0) return; // gli scaduti non si usano
      var before = +i.grams || 0, take = Math.min(before, left);
      left -= take;
      log.push(JSON.parse(JSON.stringify(i)));
      if (before - take <= 0.5) N.del('pantry', i.id);
      else { i.grams = Math.round((before - take) * 10) / 10; N.put('pantry', i); }
    });
    return log;
  };
  N.restore = function (log) { log.forEach(function (row) { N.put('pantry', row); }); };

  N.addToPantry = function (src, grams) {
    var item = {
      id: N.uid(), foodId: src.foodId || null, name: src.name || (N.FOOD[src.foodId] || {}).name || 'Prodotto',
      grams: grams != null ? grams : (+src.grams || 0), initial: grams != null ? grams : (+src.grams || 0),
      addedAt: Date.now(), source: src.source || (src.foodId ? 'generico' : 'manuale'),
      cat: src.cat || (N.FOOD[src.foodId] || {}).cat || 'Altro'
    };
    ['n', 'al', 'traces', 'lat', 'code', 'brand', 'img', 'pz', 'exp'].forEach(function (k) { if (src[k] != null) item[k] = src[k]; });
    return N.put('pantry', item);
  };

  /* quantità leggibile */
  N.qty = function (grams, foodIdOrItem) {
    var f = typeof foodIdOrItem === 'string' ? N.FOOD[foodIdOrItem] : foodIdOrItem;
    var pz = f && (f.pz || (f.foodId && N.FOOD[f.foodId] && N.FOOD[f.foodId].pz));
    if (pz && grams >= pz * 0.75) {
      var n = grams / pz, r = Math.round(n * 2) / 2;
      if (Math.abs(n - r) < 0.15) return N.f1(r) + (r === 1 ? ' pz' : ' pz') + ' · ' + N.f0(grams) + ' g';
    }
    if (grams >= 1000) return N.f1(grams / 1000) + ' kg';
    if (grams < 10) return N.f1(grams) + ' g';
    return N.f0(grams) + ' g';
  };

  /* ---------- ricette ---------- */
  N.allRecipes = function () {
    var base = (window.NUTRIMI_RECIPES || []).map(function (r) { return Object.assign({ src: 'Nutrimi' }, r); });
    return base.concat(N.S.imported || [], N.S.custom_recipes || []);
  };
  N.recipeById = function (id) { return N.allRecipes().find(function (r) { return r.id === id; }); };

  N.evaluate = function (r, servings) {
    var lines = [], missing = 0, partial = 0, needCount = 0, covered = 0, maxServ = 6;
    var per = N.zero(), al = {}, lat = false;
    r.ing.forEach(function (x) {
      var f = N.FOOD[x[0]]; if (!f) return;
      var g1 = x[1], need = g1 * servings, opt = !!x[2], av = N.available(f.id), st;
      N.addN(per, f.n, g1);
      f.al.forEach(function (a) { al[a] = 1; }); if (f.lat) lat = true;
      if (f.staple) {
        st = av.any ? 'ok' : (opt ? 'opt' : 'staple');
        if (st === 'staple') missing++;
      } else if (av.always) { st = 'ok'; }
      else {
        if (!opt) {
          needCount++;
          var ratio = Math.min(1, av.grams / need);
          covered += ratio;
          maxServ = Math.min(maxServ, Math.floor(av.grams / g1 + 0.0001));
        }
        if (av.grams >= need * 0.98) st = 'ok';
        else if (opt) st = 'opt';
        else if (av.grams > 0) { st = 'partial'; partial++; }
        else { st = 'missing'; missing++; }
      }
      lines.push({ food: f, per: g1, need: need, have: av.always ? Infinity : av.grams, status: st, opt: opt,
        soon: av.soon, expired: av.expired > 0 });
    });
    var tot = N.zero(); N.NUTR_KEYS.forEach(function (k) { tot[k] = per[k] * servings; });
    var coverage = needCount ? covered / needCount : 1;
    var ready = missing === 0 && partial === 0;
    var soonLines = lines.filter(function (l) { return l.soon != null && l.status !== 'missing' && l.status !== 'opt'; });
    var expLines = lines.filter(function (l) { return l.expired; });
    return { r: r, lines: lines, missing: missing, partial: partial, coverage: coverage, ready: ready, soonLines: soonLines, expLines: expLines,
      maxServ: Math.max(0, maxServ), per: per, tot: tot, allergens: Object.keys(al), lactose: lat };
  };
  N.recipeConflicts = function (ev, people) {
    var out = [];
    ev.lines.forEach(function (l) {
      if (l.opt) return;
      N.conflicts({ foodId: l.food.id, name: l.food.name }, people).forEach(function (c) { c.food = l.food; out.push(c); });
    });
    return out;
  };
  /* aderenza all'obiettivo della persona per un pasto (0-1) */
  N.goalFit = function (per, p) {
    var t = N.targets(p); if (!t) return { score: 0.5, t: null };
    var m = t.meal, goal = p.goal || 'mantenere';
    var kd = (per.kcal - m.kcal) / m.kcal;
    var ks = goal === 'dimagrire' ? (kd <= 0 ? 1 - Math.min(1, -kd * 0.8) : 1 - Math.min(1, kd * 1.6))
      : goal === 'massa' ? (kd >= 0 ? 1 - Math.min(1, kd * 0.6) : 1 - Math.min(1, -kd * 1.4))
        : 1 - Math.min(1, Math.abs(kd) * 1.2);
    var protShare = per.kcal ? per.p * 4 / per.kcal : 0;
    var ps = Math.min(1, protShare / (goal === 'mantenere' ? 0.18 : 0.25));
    return { score: Math.max(0, ks) * 0.65 + ps * 0.35, t: t, kd: kd };
  };
  /* fascia di aderenza del pasto all'obiettivo: [classe, etichetta] */
  N.fitZone = function (kd, goal) {
    var lo = goal === 'dimagrire' ? -0.35 : goal === 'massa' ? -0.1 : -0.15;
    var hi = goal === 'dimagrire' ? 0.08 : goal === 'massa' ? 0.3 : 0.15;
    if (kd >= lo && kd <= hi) return ['good', 'Adatta al tuo obiettivo'];
    if (kd > hi) return ['hi', 'Abbondante: +' + Math.round(kd * 100) + '% kcal'];
    return ['lo', 'Leggera: ' + Math.round(kd * 100) + '% kcal'];
  };
  N.rankRecipes = function (servings) {
    var people = N.eaters(), me = N.me(), follow = N.S.settings.followGoal;
    return N.allRecipes().map(function (r) {
      var ev = N.evaluate(r, servings);
      ev.conf = N.recipeConflicts(ev, people);
      ev.blocked = ev.conf.some(function (c) { return c.kind === 'allergia'; });
      ev.fit = me ? N.goalFit(ev.per, me) : { score: 0.5 };
      ev.score = ev.coverage * (follow ? 0.6 : 1) + (follow ? ev.fit.score * 0.4 : 0) - (ev.conf.length ? 0.15 : 0)
        + (ev.soonLines.length ? 0.3 + 0.05 * ev.soonLines.length : 0);
      return ev;
    }).sort(function (a, b) {
      var ua = a.ready || a.soonLines.length > 0, ub = b.ready || b.soonLines.length > 0;
      return (a.blocked - b.blocked) || (ub - ua) || (b.score - a.score);
    });
  };

  N.recipesUsing = function (foodId, servings) {
    return N.rankRecipes(servings || N.S.settings.servings).filter(function (e) {
      return !e.blocked && e.r.ing.some(function (x) { return x[0] === foodId && !x[2]; });
    });
  };

  /* ---------- diario pasti ---------- */
  N.dayTotals = function (profileId, day) {
    var t = N.zero();
    N.S.meals.forEach(function (m) {
      if (m.date !== day) return;
      if (m.eaters && m.eaters.indexOf(profileId) === -1) return;
      N.NUTR_KEYS.forEach(function (k) { t[k] += (m.per[k] || 0); });
    });
    return t;
  };

  /* ---------- dati di esempio ---------- */
  N.loadSample = function () {
    var S = N.blankState(); S.demo = true;
    var me = { id: N.uid(), name: 'Raffaele', sex: 'M', age: 38, weight: 82, height: 178, activity: 1.375, goal: 'dimagrire', meals: 3, allergies: [], intolerances: [], otherAvoid: [], custom: {} };
    var g = { id: N.uid(), name: 'Giulia', sex: 'F', age: 35, weight: 60, height: 166, activity: 1.55, goal: 'mantenere', meals: 3, allergies: ['frutta_guscio'], intolerances: ['lattosio'], otherAvoid: [], custom: {} };
    S.profiles = [me, g]; S.meId = me.id; S.settings.eaters = [me.id, g.id];
    N.S = S;
    var t = Date.now() - 86400000 * 2;
    var plus = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    var EXP = { zucchine: 1, ricotta: 2, spinaci: 3, yogurt_greco: -1, petto_pollo: 4, latte_ps: 6, tacchino: 3, feta: 12, uova: 14, rucola: 2, pomodorini: 5, passata: 200, pasta_secca: 400, tonno_scatola: 700 };
    [['pasta_secca', 1000], ['riso_basmati', 500], ['farro', 400], ['petto_pollo', 600], ['tacchino', 300], ['tonno_scatola', 240], ['uova', 360], ['parmigiano', 180],
      ['ricotta', 250], ['yogurt_greco', 500], ['latte_ps', 1000], ['fiocchi_avena', 500], ['ceci_cotti', 480], ['cannellini', 240], ['passata', 700],
      ['pomodorini', 500], ['zucchine', 600], ['peperoni', 400], ['spinaci', 300], ['cipolla', 300], ['aglio', 50], ['limoni', 200], ['patate', 900], ['mele', 540],
      ['banane', 360], ['frutti_bosco', 125], ['noci', 120], ['rucola', 125], ['feta', 200], ['olive', 150]].forEach(function (x, i) {
      var it = N.addToPantry({ foodId: x[0] }, x[1]); it.addedAt = t + i;
      if (EXP[x[0]] != null) it.exp = plus(EXP[x[0]]);
      N.put('pantry', it);
    });
    ['olio_evo', 'sale', 'pepe', 'zucchero', 'origano', 'basilico', 'prezzemolo', 'rosmarino', 'peperoncino', 'aceto', 'menta', 'cannella', 'curcuma'].forEach(function (id) {
      N.put('pantry', { id: N.uid(), foodId: id, name: N.FOOD[id].name, always: true, grams: 0, addedAt: t, source: 'base', cat: N.FOOD[id].cat });
    });
    // un prodotto confezionato "scansionato" di esempio, con allergeni da etichetta
    N.put('pantry', { id: N.uid(), foodId: 'pasta_secca', name: 'Gnocchetti sardi', brand: 'Esempio', grams: 500, initial: 500, addedAt: t + 40, source: 'off', cat: 'Cereali e pasta',
      n: { kcal: 356, p: 13, c: 71, s: 3.5, f: 1.6, sat: 0.4, fib: 3, A: 0, C: 0, D: 0, E: 0, B12: 0 }, al: ['glutine'], traces: ['uova', 'soia'] });
    [['salmone', 300], ['broccoli', 500], ['mozzarella', 250], ['pane', 400], ['funghi', 300], ['avocado', 200], ['merluzzo', 360], ['mandorle', 200], ['carote', 500], ['latte_intero', 1000]].forEach(function (x, i) {
      N.put('shopping', { id: N.uid(), foodId: x[0], name: N.FOOD[x[0]].name, grams: x[1], checked: i < 2, addedAt: Date.now() + i, cat: N.FOOD[x[0]].cat });
    });
    var r = (window.NUTRIMI_RECIPES || []).find(function (x) { return x.id === 'n25'; });
    if (r) { var ev = N.evaluate(r, 1); N.put('meals', { id: N.uid(), date: N.today(), recipeId: r.id, title: r.t, servings: 1, eaters: [me.id], per: ev.per, at: Date.now() - 3600000 * 4 }); }
    N.saveLocal();
  };
})();
