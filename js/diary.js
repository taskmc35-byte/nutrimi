/* Nutrimi — diario dei pasti ("Aggiungi al diario") e ricette personali */
(function () {
  var N = window.N, esc = N.esc;
  var A = N.extraActions = N.extraActions || {};
  var IN = N.inputHandlers = N.inputHandlers || {};
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- momenti della giornata ---------- */
  N.SLOTS = [['colazione', 'Colazione'], ['pranzo', 'Pranzo'], ['spuntino', 'Spuntino'], ['cena', 'Cena']];
  N.SLOT_LABEL = {}; N.SLOTS.forEach(function (s) { N.SLOT_LABEL[s[0]] = s[1]; });
  N.slotNow = function () {
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    if (m >= 300 && m < 660) return 'colazione';
    if (m >= 660 && m < 900) return 'pranzo';
    if (m >= 1110 && m < 1380) return 'cena';
    return 'spuntino';
  };
  function slotOf(meal) {
    if (meal.slot) return meal.slot;
    var d = new Date(meal.at || Date.now()), m = d.getHours() * 60 + d.getMinutes();
    return m >= 300 && m < 660 ? 'colazione' : m >= 660 && m < 900 ? 'pranzo' : m >= 1110 && m < 1380 ? 'cena' : 'spuntino';
  }
  N.slotOf = slotOf;

  function slotChips(sel, action) {
    return '<div class="seg wrap slots" role="group" aria-label="Momento della giornata">' + N.SLOTS.map(function (s) {
      return '<button type="button" class="' + (sel === s[0] ? 'on' : '') + '" aria-pressed="' + (sel === s[0]) + '" data-a="' + action + '" data-slot="' + s[0] + '">' + s[1] + '</button>';
    }).join('') + '</div>';
  }
  N.ui.slotChips = slotChips;

  /* ---------- diario nella schermata Oggi ---------- */
  N.diaryHtml = function (me) {
    var day = N.today();
    var meals = N.S.meals.filter(function (m) { return m.date === day && (!m.eaters || m.eaters.indexOf(me.id) !== -1); })
      .sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
    var h = '<section><div class="sec-head"><h2>Diario di oggi</h2></div>';
    h += '<div class="diary">' + N.SLOTS.map(function (s) {
      var ms = meals.filter(function (m) { return slotOf(m) === s[0]; });
      var kcal = ms.reduce(function (t, m) { return t + (m.per.kcal || 0); }, 0);
      return '<div class="slot"><div class="slot-head"><h3>' + s[1] + '</h3><span class="num muted small">' + (ms.length ? N.f0(kcal) + ' kcal' : '') + '</span>' +
        '<button class="icon-btn small-ic" data-a="log-open" data-slot="' + s[0] + '" aria-label="Aggiungi a ' + s[1].toLowerCase() + '">' + N.IC.plus + '</button></div>' +
        (ms.length ? '<ul class="plain slot-list">' + ms.map(function (m) {
          return '<li class="meal"><div class="meal-main"><span class="name">' + esc(m.title) + (m.est ? ' <em class="est">stima</em>' : '') + '</span>' +
            '<span class="meta num">' + N.f0(m.per.kcal) + ' kcal · ' + N.ui.macroMini(m.per) + '</span></div>' +
            '<button class="icon-btn" data-a="meal-del" data-id="' + m.id + '" aria-label="Elimina ' + esc(m.title) + ' dal diario">' + N.IC.trash + '</button></li>';
        }).join('') + '</ul>' : '') + '</div>';
    }).join('') + '</div></section>';
    return h;
  };

  /* ---------- foglio "Aggiungi al diario" ---------- */
  function itemNutr(it) { return it.n || (it.foodId && N.FOOD[it.foodId] ? N.FOOD[it.foodId].n : null); }
  function isEst(it) { return !!(it.est || (it.foodId && N.FOOD[it.foodId] && N.FOOD[it.foodId].est)); }
  function logTotals(items) {
    var t = N.zero(); items.forEach(function (it) { N.addN(t, itemNutr(it), it.grams || 0); }); return t;
  }
  function recentFoods() {
    var seen = {}, out = [];
    N.S.meals.slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).forEach(function (m) {
      (m.items || []).forEach(function (it) {
        var k = it.foodId || it.name; if (seen[k] || out.length >= 8) return; seen[k] = 1; out.push(it);
      });
    });
    return out;
  }
  function itemRow(it) {
    var f = it.foodId && N.FOOD[it.foodId], pz = it.pz || (f && f.pz);
    var av = it.foodId && !isEst(it) ? N.available(it.foodId) : null;
    var inPantry = av && (av.grams > 0 || av.always);
    var qty = pz
      ? '<div class="stepper"><button type="button" data-a="log-step" data-key="' + it.key + '" data-d="-1" aria-label="Meno">' + N.IC.minus + '</button><span class="num">' + N.f1(it.grams / pz) + ' <em>pz</em></span><button type="button" data-a="log-step" data-key="' + it.key + '" data-d="1" aria-label="Più">' + N.IC.plus + '</button></div>'
      : '<label class="gram-in"><input type="number" inputmode="decimal" min="0" step="5" value="' + Math.round(it.grams) + '" data-in="log-g" data-key="' + it.key + '" aria-label="Grammi di ' + esc(it.name) + '"><span>g</span></label>';
    var n = itemNutr(it);
    return '<li class="log-item"><div class="li-main"><span class="name">' + esc(it.name) + (isEst(it) ? ' <em class="est">stima</em>' : '') + '</span>' +
      '<span class="meta num">' + (n ? N.f0(n.kcal * it.grams / 100) + ' kcal' : 'valori non disponibili') + (pz ? ' · ' + N.f0(it.grams) + ' g' : '') + (inPantry ? ' · in dispensa' : '') + '</span></div>' +
      qty + '<button type="button" class="icon-btn" data-a="log-rm" data-key="' + it.key + '" aria-label="Togli ' + esc(it.name) + '">' + N.IC.x + '</button></li>';
  }
  function logResults(ctx) {
    var q = ctx.q || '';
    if (!q.trim()) {
      var rec = recentFoods();
      return rec.length ? '<p class="muted small">Usati di recente</p><div class="chips">' + rec.map(function (it, i) {
        return '<button type="button" class="chip" data-a="log-recent" data-i="' + i + '">' + N.IC.plus + esc(it.name) + '</button>';
      }).join('') + '</div>' : '<p class="muted small">Cerca un alimento o una voce da bar, per esempio «cappuccino», «granola», «trancio di pizza».</p>';
    }
    var res = N.searchFoods(q, 8);
    var recs = N.allRecipes().filter(function (r) { return N.norm(r.t).indexOf(N.norm(q)) !== -1; }).slice(0, 3);
    return '<ul class="sugg">' + res.map(function (f) {
      return '<li><button type="button" data-a="log-pick" data-food="' + f.id + '"><span class="name">' + esc(f.name) + (f.est ? ' <em class="est">stima</em>' : '') + '</span><span class="meta">' + esc(f.cat) +
        (f.pz ? ' · 1 pz ≈ ' + f.pz + ' g · ' + N.f0(f.n.kcal * f.pz / 100) + ' kcal' : ' · ' + N.f0(f.n.kcal) + ' kcal/100 g') + '</span></button></li>';
    }).join('') + recs.map(function (r) {
      return '<li><button type="button" data-a="log-recipe" data-id="' + r.id + '"><span class="name">' + esc(r.t) + '</span><span class="meta">Ricetta · 1 porzione</span></button></li>';
    }).join('') + (res.length || recs.length ? '' : '<li><p class="muted small pad">Nessun alimento trovato. Prova con un nome più semplice o usa lo scanner.</p></li>') + '</ul>';
  }
  N.renderLogResults = function () { var el = $('#log-res'); if (el) el.innerHTML = logResults(N.sheetCtx); };

  N.sheets.logAdd = function (ctx) {
    var items = ctx.items, t = logTotals(items), me = N.me(), tg = me ? N.targets(me) : null;
    var eaten = me ? N.dayTotals(me.id, N.today()) : N.zero();
    var anyPantry = items.some(function (it) { return it.foodId && !isEst(it) && (N.available(it.foodId).grams > 0); });
    var h = '<div class="sh-head"><p class="eyebrow">Diario</p><h2>Aggiungi al diario</h2></div>';
    h += slotChips(ctx.slot, 'log-slot');
    h += '<div class="adder"><label class="search">' + N.IC.search + '<input id="log-q" data-in="log-q" autocomplete="off" placeholder="Cosa hai mangiato?" value="' + esc(ctx.q || '') + '" aria-label="Cerca alimento"></label>' +
      '<button class="icon-btn solid" data-a="log-scan" aria-label="Scansiona un prodotto">' + N.IC.scan + '</button></div>';
    h += '<div id="log-res">' + logResults(ctx) + '</div>';
    if (items.length) {
      h += '<ul class="plain log-items">' + items.map(itemRow).join('') + '</ul>';
      h += '<div class="log-tot"><div><b class="num">' + N.f0(t.kcal) + '</b> kcal</div>' + N.ui.macroMini(t) +
        (tg ? '<span class="muted small num">Dopo: ' + N.f0(Math.max(0, tg.kcal - eaten.kcal - t.kcal)) + ' kcal rimaste oggi</span>' : '') + '</div>';
      if (items.some(isEst)) h += '<p class="muted tiny">Le voci segnate «stima» hanno valori medi indicativi: un cornetto al bar può variare anche del 30%.</p>';
      if (anyPantry) h += '<label class="toggle ctl"><span class="ctl-l">Togli dalla dispensa<em>Solo quello che hai in casa; bar e fuori casa esclusi</em></span><input type="checkbox" id="log-pantry" data-a="log-pantry"' + (ctx.fromPantry ? ' checked' : '') + '><i></i></label>';
      if (N.S.profiles.length > 1) h += '<div class="field"><span>Chi ha mangiato</span><div class="chips">' + N.S.profiles.map(function (p) {
        return N.ui.chip(p.name, ctx.eaters.indexOf(p.id) !== -1, 'data-a="log-eater" data-id="' + p.id + '"');
      }).join('') + '</div></div>';
      h += '<label class="field"><span>Nome nel diario</span><input id="log-title" value="' + esc(ctx.title || '') + '" placeholder="' + esc(autoTitle(items)) + '"></label>';
      h += '<label class="chip tick"><input type="checkbox" id="log-save"' + (ctx.saveRecipe ? ' checked' : '') + ' data-a="log-save"><span>Salva anche come mia ricetta</span></label>';
      h += '<div class="sh-foot"><button class="btn primary block" data-a="log-confirm"' + (ctx.eaters.length ? '' : ' disabled') + '>Aggiungi a ' + N.SLOT_LABEL[ctx.slot].toLowerCase() + '</button>' +
        (ctx.eaters.length ? '' : '<p class="muted small center">Scegli almeno una persona.</p>') + '</div>';
    }
    return h;
  };
  function autoTitle(items) {
    var names = items.map(function (i, k) { return k ? i.name.charAt(0).toLowerCase() + i.name.slice(1) : i.name; });
    if (names.length > 4) return names.slice(0, 3).join(', ') + ' e altri ' + (names.length - 3);
    return names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0] || '';
  }
  /* porzione tipica quando l'alimento non ha un peso per pezzo */
  var PORZ = { miele: 15, marmellata: 20, crema_spalmabile: 15, zucchero: 5, burro: 10, olio_evo: 10, parmigiano: 10, pecorino: 10, granola: 40, muesli: 40, cornflakes: 30,
    fiocchi_avena: 40, latte_ps: 200, latte_intero: 200, latte_soia: 200, bevanda_avena: 200, yogurt_greco: 170, yogurt_bianco: 125, frutta_secca_mista: 30, noci: 20, mandorle: 20,
    nocciole: 20, pistacchi: 20, frutti_bosco: 80, pasta_secca: 80, pasta_integrale: 80, riso: 80, riso_basmati: 80, pane: 50, pane_integrale: 50, prosciutto_crudo: 50,
    prosciutto_cotto: 50, bresaola: 50, ricotta: 100, mozzarella: 125, cioccolato_fondente: 20, cacao: 5, panna: 30 };
  var PORZ_CAT = { 'Condimenti': 10, 'Spezie ed erbe': 1, 'Frutta secca e semi': 30, 'Colazione e snack': 30, 'Cereali e pasta': 80, 'Carne e salumi': 120, 'Pesce': 150, 'Latticini e uova': 100, 'Legumi e tofu': 120, 'Verdura': 150, 'Frutta': 150 };
  N.defaultGrams = function (f) { return f.pz || PORZ[f.id] || PORZ_CAT[f.cat] || 100; };
  function addItem(src) {
    var c = N.sheetCtx, f = src.foodId && N.FOOD[src.foodId];
    var ex = c.items.find(function (i) { return src.foodId && i.foodId === src.foodId && !i.n && !src.n; });
    var pz = src.pz || (f && f.pz);
    if (ex) { ex.grams += pz || (f ? N.defaultGrams(f) : 50); }
    else c.items.push(Object.assign({ key: N.uid(), grams: src.grams || pz || 100 }, src));
    c.q = ''; N.refreshSheet();
    var q = $('#log-q'); if (q) q.focus();
  }

  A['log-open'] = function (el) {
    var me = N.me();
    N.openSheet('logAdd', { slot: (el && el.dataset.slot) || N.slotNow(), items: [], q: '', eaters: me ? [me.id] : [], fromPantry: true, saveRecipe: false });
    setTimeout(function () { var q = $('#log-q'); if (q) q.focus(); }, 260);
  };
  A['log-slot'] = function (el) { N.sheetCtx.slot = el.dataset.slot; N.refreshSheet(); };
  A['log-pick'] = function (el) { var f = N.FOOD[el.dataset.food]; addItem({ foodId: f.id, name: f.name, grams: N.defaultGrams(f) }); };
  A['log-recent'] = function (el) { var it = recentFoods()[+el.dataset.i]; if (it) addItem({ foodId: it.foodId, name: it.name, grams: it.grams, n: it.n, pz: it.pz, est: it.est }); };
  A['log-recipe'] = function (el) {
    var r = N.recipeById(el.dataset.id); if (!r) return;
    r.ing.forEach(function (x) { if (x[2]) return; var f = N.FOOD[x[0]]; if (f) N.sheetCtx.items.push({ key: N.uid(), foodId: f.id, name: f.name, grams: x[1] }); });
    if (!N.sheetCtx.title) N.sheetCtx.title = r.t;
    N.sheetCtx.q = ''; N.refreshSheet();
  };
  A['log-step'] = function (el) {
    var it = N.sheetCtx.items.find(function (i) { return i.key === el.dataset.key; }); if (!it) return;
    var pz = it.pz || (N.FOOD[it.foodId] || {}).pz || 50;
    it.grams = Math.max(pz / 2, it.grams + pz / 2 * (+el.dataset.d)); N.refreshSheet();
  };
  A['log-rm'] = function (el) { N.sheetCtx.items = N.sheetCtx.items.filter(function (i) { return i.key !== el.dataset.key; }); N.refreshSheet(); };
  A['log-eater'] = function (el) { var e = N.sheetCtx.eaters, i = e.indexOf(el.dataset.id); if (i === -1) e.push(el.dataset.id); else e.splice(i, 1); N.refreshSheet(); };
  A['log-pantry'] = function (el) { N.sheetCtx.fromPantry = el.checked; };
  A['log-save'] = function (el) { N.sheetCtx.saveRecipe = el.checked; };
  A['log-scan'] = function () {
    N.openScanner(function (code) {
      N.toast('Cerco il prodotto ' + code + '…');
      N.off.lookup(code).then(function (p) {
        if (!p) { N.toast('Prodotto non trovato: cercalo per nome o aggiungi l’alimento più simile.'); return; }
        addItem({ foodId: p.foodId, name: p.name, grams: p.grams && p.grams < 400 ? p.grams : 100, n: p.n, al: p.al });
      }, function () { N.toast('Open Food Facts non raggiungibile: cerca l’alimento per nome.'); });
    });
  };
  IN['log-q'] = function (e) { N.sheetCtx.q = e.target.value; N.renderLogResults(); };
  IN['log-g'] = function (e) {
    var it = N.sheetCtx.items.find(function (i) { return i.key === e.target.dataset.key; }); if (!it) return;
    it.grams = Math.max(0, parseFloat(String(e.target.value).replace(',', '.')) || 0);
    var t = logTotals(N.sheetCtx.items), box = $('.log-tot b'); if (box) box.textContent = N.f0(t.kcal);
  };
  N.logEnter = function () { var first = $('#log-res [data-a="log-pick"]'); if (first) first.click(); };

  A['log-confirm'] = function () {
    var c = N.sheetCtx, items = c.items.filter(function (i) { return i.grams > 0; });
    if (!items.length || !c.eaters.length) return;
    var title = ($('#log-title') && $('#log-title').value.trim()) || autoTitle(items);
    var per = logTotals(items), logs = [];
    if (c.fromPantry) items.forEach(function (it) {
      if (!it.foodId || isEst(it)) return;
      var av = N.available(it.foodId); if (av.always || av.grams <= 0) return;
      logs = logs.concat(N.consume(it.foodId, Math.min(av.grams, it.grams)));
    });
    var meal = { id: N.uid(), date: N.today(), slot: c.slot, title: title, per: per, eaters: c.eaters.slice(), at: Date.now(), kind: 'quick',
      est: items.some(isEst), items: items.map(function (i) { return { foodId: i.foodId || null, name: i.name, grams: i.grams, n: i.n, pz: i.pz, est: isEst(i) || undefined }; }) };
    N.put('meals', meal);
    var saved = null;
    if (c.saveRecipe) {
      var ing = items.filter(function (i) { return i.foodId && N.FOOD[i.foodId]; }).map(function (i) { return [i.foodId, Math.round(i.grams * 10) / 10]; });
      if (ing.length) saved = N.saveCustomRecipe({ t: title, tag: [c.slot === 'colazione' ? 'colazione' : c.slot === 'spuntino' ? 'spuntino' : 'unico'], min: 5, ing: ing, st: [] });
    }
    N.closeSheet(); N.render();
    N.rewards.afterMeal('meal:' + meal.id, false, meal.id, logs);
    N.toast(title + ' in ' + N.SLOT_LABEL[c.slot].toLowerCase() + (logs.length ? ' · dispensa aggiornata' : '') + (saved ? ' · ricetta salvata' : ''), function () {
      N.rewards.cancel('meal:' + meal.id);
      N.del('meals', meal.id);
      var ids = {}; logs.forEach(function (row) { if (!ids[row.id]) { ids[row.id] = 1; N.put('pantry', row); } });
      if (saved) N.del('custom_recipes', saved.id);
    });
  };

  /* ---------- ricette personali ---------- */
  function myOwnerId() { return N.cloud && N.cloud.active ? N.cloud.user.id : (N.me() || {}).id; }
  N.canEditRecipe = function (r) { return !!(r && r.custom && r.owner && r.owner === myOwnerId()); };
  N.saveCustomRecipe = function (data, id) {
    var me = N.me(), old = id && N.S.custom_recipes.find(function (r) { return r.id === id; });
    var r = Object.assign({}, old || {}, data, {
      id: id || ('u-' + N.uid()), custom: true, owner: (old && old.owner) || myOwnerId(), ownerName: (old && old.ownerName) || (me ? me.name : ''),
      src: 'Ricetta di ' + ((old && old.ownerName) || (me ? me.name : 'casa')), min: +data.min || 15
    });
    var veg = !r.ing.some(function (x) { var f = N.FOOD[x[0]]; return f && (f.cat === 'Carne e salumi' || f.cat === 'Pesce'); });
    r.tag = (r.tag || []).filter(function (t) { return t !== 'vegetariana' && t !== 'vegana'; }).concat(veg ? ['vegetariana'] : []);
    return N.put('custom_recipes', r);
  };

  var CATS = [['colazione', 'Colazione'], ['primo', 'Primo'], ['secondo', 'Secondo'], ['unico', 'Piatto unico'], ['spuntino', 'Spuntino']];
  N.sheets.recipeEdit = function (ctx) {
    var d = ctx.draft, sv = d.servings;
    var t = N.zero(); d.ing.forEach(function (x) { var f = N.FOOD[x.foodId]; if (f) N.addN(t, f.n, x.grams / sv); });
    var h = '<div class="sh-head"><p class="eyebrow">' + (ctx.id ? 'Modifica ricetta' : 'Nuova ricetta') + '</p><h2>' + (d.t ? esc(d.t) : 'La tua ricetta') + '</h2></div>';
    h += '<label class="field"><span>Nome</span><input id="re-t" data-in="re-t" value="' + esc(d.t) + '" placeholder="es. Ciotola di yogurt e granola" autocomplete="off"></label>';
    h += '<div class="field"><span>Tipo di piatto</span><div class="chips">' + CATS.map(function (c) { return N.ui.chip(c[1], d.cat === c[0], 'data-a="re-cat" data-c="' + c[0] + '"'); }).join('') + '</div></div>';
    h += '<div class="grid2"><div class="field"><span>Porzioni</span>' + N.ui.stepper(sv, 're-serv', 1, 12) + '</div>' +
      '<label class="field"><span>Tempo (minuti)</span><input id="re-min" type="number" inputmode="numeric" min="1" value="' + (d.min || '') + '" placeholder="15"></label></div>';
    h += '<div class="field"><span>Ingredienti per ' + sv + (sv === 1 ? ' porzione' : ' porzioni') + '</span>';
    if (d.ing.length) h += '<ul class="plain log-items">' + d.ing.map(function (x) {
      var f = N.FOOD[x.foodId];
      return '<li class="log-item"><div class="li-main"><span class="name">' + esc(f.name) + '</span><span class="meta num">' + N.f0(f.n.kcal * x.grams / 100) + ' kcal' + (f.pz ? ' · ' + N.f1(x.grams / f.pz) + ' pz' : '') + '</span></div>' +
        '<label class="gram-in"><input type="number" inputmode="decimal" min="0" step="5" value="' + Math.round(x.grams) + '" data-in="re-g" data-key="' + x.key + '" aria-label="Grammi di ' + esc(f.name) + '"><span>g</span></label>' +
        '<button type="button" class="icon-btn" data-a="re-rm" data-key="' + x.key + '" aria-label="Togli ' + esc(f.name) + '">' + N.IC.x + '</button></li>';
    }).join('') + '</ul>';
    h += '<div class="adder"><label class="search">' + N.IC.search + '<input id="re-q" data-in="re-q" autocomplete="off" placeholder="Aggiungi ingrediente" value="' + esc(ctx.q || '') + '" aria-label="Cerca ingrediente"></label></div><div id="re-res">' + reResults(ctx) + '</div></div>';
    if (d.ing.length) h += '<div class="log-tot"><div><b class="num">' + N.f0(t.kcal) + '</b> kcal a porzione</div>' + N.ui.macroMini(t) + '</div>';
    h += '<label class="field"><span>Preparazione (facoltativa, un passaggio per riga)</span><textarea id="re-st" rows="4" placeholder="Versa lo yogurt in una ciotola&#10;Aggiungi granola, miele e frutta secca">' + esc((d.st || []).join('\n')) + '</textarea></label>';
    h += '<p class="form-err" id="re-err" hidden></p>';
    h += '<div class="sh-foot' + (ctx.id ? ' two' : '') + '">' + (ctx.id ? '<button class="btn danger ghost" data-a="re-del">' + N.IC.trash + 'Elimina</button>' : '') + '<button class="btn primary' + (ctx.id ? '' : ' block') + '" data-a="re-save">Salva ricetta</button></div>';
    return h;
  };
  function reResults(ctx) {
    var q = ctx.q || ''; if (!q.trim()) return '';
    var res = N.searchFoods(q, 6);
    return '<ul class="sugg">' + res.map(function (f) {
      return '<li><button type="button" data-a="re-pick" data-food="' + f.id + '"><span class="name">' + esc(f.name) + '</span><span class="meta">' + esc(f.cat) + '</span></button></li>';
    }).join('') + (res.length ? '' : '<li><p class="muted small pad">Nessun alimento trovato con questo nome.</p></li>') + '</ul>';
  }
  function readReForm() {
    var d = N.sheetCtx.draft, t = $('#re-t'), m = $('#re-min'), st = $('#re-st');
    if (t) d.t = t.value; if (m) d.min = +m.value || ''; if (st) d.st = st.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function reRefresh() { readReForm(); N.refreshSheet(); }

  A['recipe-new'] = function () {
    N.openSheet('recipeEdit', { draft: { t: '', cat: 'unico', servings: 1, min: '', ing: [], st: [] }, q: '' });
    setTimeout(function () { var x = $('#re-t'); if (x) x.focus(); }, 260);
  };
  A['recipe-edit'] = function (el) {
    var r = N.recipeById(el.dataset.id); if (!N.canEditRecipe(r)) return;
    var sv = r.servings || 1;
    N.openSheet('recipeEdit', { id: r.id, q: '', draft: {
      t: r.t, cat: (r.tag || []).find(function (x) { return x !== 'vegetariana' && x !== 'vegana'; }) || 'unico', servings: sv, min: r.min, st: (r.st || []).slice(),
      ing: r.ing.map(function (x) { return { key: N.uid(), foodId: x[0], grams: x[1] * sv }; }) } }, true);
  };
  A['re-cat'] = function (el) { readReForm(); N.sheetCtx.draft.cat = el.dataset.c; N.refreshSheet(); };
  A['re-serv'] = function (el) { readReForm(); var d = N.sheetCtx.draft; d.servings = Math.max(1, Math.min(12, d.servings + (+el.dataset.d))); N.refreshSheet(); };
  A['re-pick'] = function (el) {
    readReForm(); var f = N.FOOD[el.dataset.food];
    N.sheetCtx.draft.ing.push({ key: N.uid(), foodId: f.id, grams: N.defaultGrams(f) * N.sheetCtx.draft.servings });
    N.sheetCtx.q = ''; N.refreshSheet(); var q = $('#re-q'); if (q) q.focus();
  };
  A['re-rm'] = function (el) { readReForm(); N.sheetCtx.draft.ing = N.sheetCtx.draft.ing.filter(function (x) { return x.key !== el.dataset.key; }); N.refreshSheet(); };
  IN['re-q'] = function (e) { N.sheetCtx.q = e.target.value; var el = $('#re-res'); if (el) el.innerHTML = reResults(N.sheetCtx); };
  IN['re-g'] = function (e) { var x = N.sheetCtx.draft.ing.find(function (i) { return i.key === e.target.dataset.key; }); if (x) x.grams = Math.max(0, parseFloat(String(e.target.value).replace(',', '.')) || 0); };
  IN['re-t'] = function (e) { N.sheetCtx.draft.t = e.target.value; };
  A['re-save'] = function () {
    readReForm(); var d = N.sheetCtx.draft, err = $('#re-err');
    var msg = !d.t.trim() ? 'Dai un nome alla ricetta.' : !d.ing.filter(function (x) { return x.grams > 0; }).length ? 'Aggiungi almeno un ingrediente con i grammi.' : '';
    if (msg) { err.textContent = msg; err.hidden = false; (d.t.trim() ? $('#re-q') : $('#re-t')).focus(); return; }
    var r = N.saveCustomRecipe({ t: d.t.trim(), tag: [d.cat], min: d.min, servings: d.servings, st: d.st,
      ing: d.ing.filter(function (x) { return x.grams > 0; }).map(function (x) { return [x.foodId, Math.round(x.grams / d.servings * 10) / 10]; }) }, N.sheetCtx.id);
    N.closeSheet(); N.render(); N.toast('Ricetta «' + r.t + '» salvata');
  };
  A['re-del'] = function () {
    var r = N.recipeById(N.sheetCtx.id); if (!r) return;
    N.openSheet('confirm', { title: 'Eliminare «' + r.t + '»?', text: 'La ricetta sparisce per tutta la casa. I pasti già registrati nel diario restano.', yes: 'Elimina ricetta', danger: true, onYes: function () {
      N.del('custom_recipes', r.id); N.closeSheet(); N.render(); N.toast('Ricetta eliminata');
    } }, true);
  };
})();
