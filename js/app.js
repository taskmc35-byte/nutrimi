/* Nutrimi — avvio, navigazione e azioni */
(function () {
  var N = window.N;
  var $ = function (s) { return document.querySelector(s); };
  N.tab = 'oggi';
  try { var qt = new URLSearchParams(location.search).get('tab'); if (['oggi', 'spesa', 'dispensa', 'ricette', 'profilo'].indexOf(qt) !== -1) N.tab = qt; } catch (e) { }
  N.gate = null; // schermata di accesso/onboarding attiva

  /* ---------- render ---------- */
  N.render = function () {
    var view = $('#view');
    document.body.classList.toggle('gated', !!N.gate);
    if (N.gate) { view.innerHTML = N.views[N.gate](); window.scrollTo(0, 0); return; }
    view.innerHTML = N.views[N.tab]();
    document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === N.tab); b.setAttribute('aria-current', b.dataset.tab === N.tab ? 'page' : 'false'); });
    var me = N.me(); $('#avatar').textContent = me ? me.name.charAt(0).toUpperCase() : '?';
  };
  /* re-render senza perdere il focus della ricerca (per gli aggiornamenti in tempo reale) */
  N.softRender = function () {
    if (N.gate) return;
    var a = document.activeElement, id = a && a.id, pos = a && a.selectionStart, y = window.scrollY;
    N.render(); window.scrollTo(0, y);
    if (id) { var el = document.getElementById(id); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) { } } }
    if (!$('#sheet').hidden) N.refreshSheet();
  };
  N.go = function (tab) { N.tab = tab; N.render(); window.scrollTo(0, 0); };

  N.syncState = function (s, err) {
    var el = $('#sync'); if (!el) return;
    el.dataset.s = s;
    el.title = s === 'error' ? 'Errore di sincronizzazione' + (err && err.message ? ': ' + err.message : '') : s === 'saving' ? 'Salvataggio…' : 'Sincronizzato';
    if (s === 'error') N.toast('Non riesco a salvare online. Controlla la connessione.');
  };

  /* ---------- fogli ---------- */
  N.sheetCtx = null; var sheetFn = null, sheetStack = [];
  N.openSheet = function (name, ctx, push) {
    if (push && sheetFn) sheetStack.push([sheetFn, N.sheetCtx]); else sheetStack = [];
    sheetFn = name; N.sheetCtx = ctx || {};
    var sh = $('#sheet'); sh.hidden = false; document.body.classList.add('sheet-open');
    N.refreshSheet(); $('#sheet-body').scrollTop = 0;
    requestAnimationFrame(function () { sh.classList.add('in'); });
  };
  N.refreshSheet = function () {
    var body = $('#sheet-body'), y = body.scrollTop, ed = $('#exp-d'), keep = ed ? ed.value : null;
    var html = N.sheets[sheetFn](N.sheetCtx);
    if (!html) { N.closeSheet(); return; }
    body.innerHTML = html; body.scrollTop = y;
    if (keep != null && $('#exp-d')) $('#exp-d').value = keep;
  };
  function readExp() { var e = $('#exp-d'); return e && e.value ? e.value : null; }
  N.closeSheet = function () {
    var sh = $('#sheet'); sh.classList.remove('in'); document.body.classList.remove('sheet-open');
    sheetFn = null; sheetStack = [];
    setTimeout(function () { if (!sheetFn) sh.hidden = true; }, 220);
  };
  N.sheetBack = function () {
    var prev = sheetStack.pop();
    if (!prev) return N.closeSheet();
    sheetFn = prev[0]; N.sheetCtx = prev[1]; N.refreshSheet();
  };

  /* ---------- toast ---------- */
  var toastT = null;
  N.toast = function (msg, undo) {
    var t = $('#toast');
    t.innerHTML = '<span>' + N.esc(msg) + '</span>' + (undo ? '<button class="link" id="toast-undo">Annulla</button>' : '');
    t.hidden = false; t.classList.add('in');
    if (undo) $('#toast-undo').onclick = function () { undo(); hide(); N.render(); if (!$('#sheet').hidden && sheetFn) N.refreshSheet(); };
    clearTimeout(toastT); toastT = setTimeout(hide, undo ? 5000 : 2800);
    function hide() { t.classList.remove('in'); setTimeout(function () { t.hidden = true; }, 200); }
  };

  /* ---------- azioni ---------- */
  var A = {};
  A.tab = function (el) { N.go(el.dataset.tab); };
  A['close-sheet'] = function () { N.closeSheet(); };
  A['sheet-back'] = function () { N.sheetBack(); };
  A.avatar = function () { N.editId = null; N.go('profilo'); };

  // dati di esempio
  A['demo-reset'] = function () {
    N.openSheet('confirm', { title: 'Iniziare con i tuoi dati?', text: 'Cancello i dati di esempio e ti guido nella creazione del tuo profilo.', yes: 'Inizia', onYes: function () {
      N.S = N.blankState(); N.saveLocal(); N.closeSheet(); N.boot();
    } });
  };
  A['confirm-yes'] = function () { var f = N.sheetCtx.onYes; if (f) f(); };

  // OGGI
  A['meal-del'] = function (el) {
    var m = N.S.meals.find(function (x) { return x.id === el.dataset.id; }); if (!m) return;
    N.del('meals', m.id); N.render();
    N.toast('Pasto tolto dal diario', function () { N.put('meals', m); });
  };
  A['low-to-shop'] = function (el) {
    var i = N.S.pantry.find(function (x) { return x.id === el.dataset.id; }); if (!i) return;
    addShop({ foodId: i.foodId, name: i.name, grams: i.initial || 500, brand: i.brand, n: i.n, al: i.al, traces: i.traces, lat: i.lat, code: i.code, cat: i.cat });
    N.toast(i.name + ' aggiunto alla spesa');
  };

  // SPESA
  function addShop(src) {
    var f = src.foodId && N.FOOD[src.foodId];
    var row = { id: N.uid(), foodId: src.foodId || null, name: src.name || (f ? f.name : 'Prodotto'), grams: +src.grams || 0, checked: false, addedAt: Date.now(), cat: src.cat || (f ? f.cat : 'Altro') };
    ['n', 'al', 'traces', 'lat', 'code', 'brand', 'img'].forEach(function (k) { if (src[k] != null) row[k] = src[k]; });
    return N.put('shopping', row);
  }
  N.addShop = addShop;
  A['shop-pick'] = function (el) {
    var f = N.FOOD[el.dataset.food];
    N.openSheet('shopAdd', { foodId: f.id, grams: f.pz ? f.pz * (f.pz < 30 ? 4 : 2) : f.staple ? 100 : 500 });
  };
  A['qty-preset'] = function (el) { N.sheetCtx.grams = +el.dataset.g; N.refreshSheet(); };
  A['shop-add-confirm'] = function () {
    var g = +$('#qty-g').value || N.sheetCtx.grams || 0;
    addShop({ foodId: N.sheetCtx.foodId, grams: g });
    N.shopQ = ''; N.closeSheet(); N.render();
    N.toast(N.FOOD[N.sheetCtx.foodId].name + ' in lista');
  };
  A['shop-free'] = function () {
    var q = (N.shopQ || '').trim(); if (!q) return;
    var f = N.guessFood(q);
    addShop({ name: q.charAt(0).toUpperCase() + q.slice(1), foodId: f ? f.id : null, cat: f ? f.cat : 'Altro', grams: 0 });
    N.shopQ = ''; N.render(); N.toast(q + ' in lista');
  };
  A['shop-toggle'] = function (el) {
    var i = N.S.shopping.find(function (x) { return x.id === el.dataset.id; }); if (!i) return;
    if (!i.checked) {
      var p = N.addToPantry(i, i.grams || 0);
      i.checked = true; i.pantryId = p.id; N.put('shopping', i); N.render();
      N.toast(i.name + ' è in dispensa' + (i.grams ? '' : ' (indica la quantità dalla dispensa)'), function () {
        N.del('pantry', p.id); i.checked = false; delete i.pantryId; N.put('shopping', i);
      });
    } else {
      if (i.pantryId) N.del('pantry', i.pantryId);
      i.checked = false; delete i.pantryId; N.put('shopping', i); N.render();
    }
  };
  A['shop-clear'] = function () {
    var done = N.S.shopping.filter(function (i) { return i.checked; });
    done.forEach(function (i) { N.del('shopping', i.id); }); N.render();
    N.toast(done.length + ' prodotti tolti dalla lista', function () { done.forEach(function (i) { N.put('shopping', i); }); });
  };
  A['shop-edit'] = function (el) { N.openSheet('shopEdit', { id: el.dataset.id }); };
  A['shop-save'] = function () {
    var i = N.S.shopping.find(function (x) { return x.id === N.sheetCtx.id; }); if (!i) return;
    i.grams = +$('#edit-g').value || 0;
    var fid = $('#edit-food').value || null;
    if (fid !== i.foodId) { i.foodId = fid; if (fid && !i.n) i.cat = N.FOOD[fid].cat; }
    N.put('shopping', i);
    if (i.checked && i.pantryId) { var p = N.S.pantry.find(function (x) { return x.id === i.pantryId; }); if (p) { p.grams = i.grams; p.initial = i.grams; p.foodId = i.foodId; N.put('pantry', p); } }
    N.closeSheet(); N.render();
  };
  A['shop-del'] = function () {
    var i = N.S.shopping.find(function (x) { return x.id === N.sheetCtx.id; }); if (!i) return;
    N.del('shopping', i.id); N.closeSheet(); N.render();
    N.toast(i.name + ' eliminato', function () { N.put('shopping', i); });
  };

  // SCANNER
  A.scan = function (el) {
    var target = el.dataset.for;
    N.scanner.open(function (code) { handleCode(code, target); });
  };
  A['scan-close'] = function () { N.scanner.close(); };
  async function handleCode(code, target) {
    N.toast('Cerco il prodotto ' + code + '…');
    try {
      var p = await N.off.lookup(code);
      if (!p) { N.openSheet('manual', { draft: { code: code }, target: target }); return; }
      N.openSheet('scanned', { product: p, target: target });
    } catch (e) {
      N.openSheet('manual', { draft: { code: code }, target: target });
      N.toast('Open Food Facts non raggiungibile: inserisci i valori a mano.');
    }
  }
  A['sc-shop'] = function () {
    var p = N.sheetCtx.product; p.grams = +$('#sc-g').value || p.grams; p.foodId = $('#edit-food').value || null;
    if (p.foodId && p.cat === 'Altro') p.cat = N.FOOD[p.foodId].cat;
    addShop(p); N.closeSheet(); N.render(); N.toast(p.name + ' in lista');
  };
  A['sc-pantry'] = function () {
    var p = N.sheetCtx.product, g = +$('#sc-g').value || p.grams || 0; p.foodId = $('#edit-food').value || null;
    p.exp = readExp() || undefined;
    if (p.foodId && p.cat === 'Altro') p.cat = N.FOOD[p.foodId].cat;
    var it = N.addToPantry(p, g); N.closeSheet(); N.render();
    N.toast(p.name + ' in dispensa', function () { N.del('pantry', it.id); });
  };

  // DISPENSA
  A['pantry-cat'] = function (el) { N.S.settings.pantryCat = el.dataset.cat; N.saveLocal(); N.render(); };
  A['pantry-open'] = function (el) {
    N.openSheet('pantryItem', { id: el.dataset.id });
    if (el.dataset.focus === 'exp') setTimeout(function () { var f = $('.expfield'); if (f) { f.scrollIntoView({ block: 'center' }); $('#exp-d').focus(); } }, 260);
  };
  A['pi-trash'] = function (el) {
    var i = N.S.pantry.find(function (x) { return x.id === el.dataset.id; }); if (!i) return;
    N.del('pantry', i.id); N.render(); N.toast(i.name + ' tolto dalla dispensa', function () { N.put('pantry', i); });
  };
  // data di scadenza
  A['exp-clear'] = function () { $('#exp-d').value = ''; $('#exp-cands').innerHTML = ''; };
  A['exp-pick'] = function (el) { $('#exp-d').value = el.dataset.d; document.querySelectorAll('[data-a="exp-pick"]').forEach(function (b) { b.classList.toggle('on', b === el); }); };
  A['exp-ocr'] = function () { var f = $('#exp-file'); f.value = ''; f.click(); };
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'exp-file' || !e.target.files[0]) return;
    var box = $('#exp-cands');
    box.innerHTML = '<p class="muted small">Leggo la data dalla foto…</p>';
    N.ocrExpiry(e.target.files[0]).then(function (r) {
      if (!r.best) { box.innerHTML = '<p class="form-err">Non trovo una data nella foto. Avvicinati alla scritta e riprova, oppure inseriscila a mano.</p>'; return; }
      $('#exp-d').value = r.best;
      box.innerHTML = '<p class="muted small">' + (r.dates.length > 1 ? 'Ho trovato più date: tocca quella di scadenza.' : 'Data letta: controlla che sia giusta.') + '</p>' +
        (r.dates.length > 1 ? '<div class="chips">' + r.dates.map(function (d) { return N.ui.chip(N.fmtDate(d), d === r.best, 'data-a="exp-pick" data-d="' + d + '"'); }).join('') + '</div>' : '');
    }, function (er) { box.innerHTML = '<p class="form-err">' + N.esc(er.message || 'Lettura non riuscita') + '. Inserisci la data a mano.</p>'; });
  });
  A['pi-step'] = function (el) {
    var inp = $('#pi-g'), i = N.S.pantry.find(function (x) { return x.id === N.sheetCtx.id; });
    var f = i && (i.pz || (N.FOOD[i.foodId] || {}).pz), step = f || (+inp.value >= 500 ? 50 : 10);
    inp.value = Math.max(0, (+inp.value || 0) + step * (+el.dataset.d));
  };
  A['pi-save'] = function () {
    var i = N.S.pantry.find(function (x) { return x.id === N.sheetCtx.id; }); if (!i) return;
    var g = Math.max(0, +$('#pi-g').value || 0);
    if (g > (i.initial || 0)) i.initial = g;
    i.grams = g; i.foodId = $('#edit-food').value || null;
    var ex = readExp(); if (ex) i.exp = ex; else delete i.exp;
    if (i.foodId && (!i.cat || i.cat === 'Altro')) i.cat = N.FOOD[i.foodId].cat;
    if (g <= 0) { N.del('pantry', i.id); N.toast(i.name + ' finito: tolto dalla dispensa', function () { i.grams = i.initial; N.put('pantry', i); }); }
    else N.put('pantry', i);
    N.closeSheet(); N.render();
  };
  A['pi-del'] = function () {
    var i = N.S.pantry.find(function (x) { return x.id === N.sheetCtx.id; }); if (!i) return;
    N.del('pantry', i.id); N.closeSheet(); N.render(); N.toast(i.name + ' eliminato', function () { N.put('pantry', i); });
  };
  A['pantry-add'] = function () { N.openSheet('pantryAdd', { q: '' }); setTimeout(function () { var x = $('#pa-q'); if (x) x.focus(); }, 250); };
  A['pa-pick'] = function (el) { var f = N.FOOD[el.dataset.food]; N.sheetCtx.foodId = f.id; N.sheetCtx.grams = f.pz ? f.pz * 2 : 500; N.refreshSheet(); };
  A['pa-preset'] = function (el) { N.sheetCtx.grams = +el.dataset.g; N.refreshSheet(); };
  A['pa-confirm'] = function () {
    var id = N.sheetCtx.foodId, always = $('#pa-always') && $('#pa-always').checked;
    if (always) { N.put('pantry', { id: N.uid(), foodId: id, name: N.FOOD[id].name, always: true, grams: 0, addedAt: Date.now(), source: 'base', cat: N.FOOD[id].cat }); }
    else N.addToPantry({ foodId: id, exp: readExp() || undefined }, +$('#pa-g').value || N.sheetCtx.grams || 0);
    N.closeSheet(); N.render(); N.toast(N.FOOD[id].name + ' in dispensa');
  };
  A['manual-open'] = function () { N.openSheet('manual', { draft: { name: N.sheetCtx.q || '' } }, true); };
  function readManual() {
    var v = function (id) { return parseFloat(($('#' + id).value || '').replace(',', '.')) || 0; };
    var name = $('#mn-name').value.trim();
    if (!name) { var e = $('#mn-err'); e.textContent = 'Inserisci il nome del prodotto.'; e.hidden = false; return null; }
    var hasN = v('mn-kcal') || v('mn-p') || v('mn-c') || v('mn-f');
    var al = Array.prototype.map.call(document.querySelectorAll('input[name="mn-al"]:checked'), function (i) { return i.value; });
    var fid = $('#edit-food').value || null;
    return {
      name: name, grams: v('mn-g'), source: 'manuale', foodId: fid, cat: fid ? N.FOOD[fid].cat : 'Altro', code: (N.sheetCtx.draft || {}).code,
      n: hasN ? { kcal: v('mn-kcal'), p: v('mn-p'), c: v('mn-c'), s: v('mn-s'), f: v('mn-f'), sat: v('mn-sat'), fib: v('mn-fib'), A: 0, C: 0, D: 0, E: 0, B12: 0 } : undefined,
      al: al, lat: al.indexOf('latte') !== -1, exp: readExp() || undefined
    };
  }
  A['mn-save'] = function () { var p = readManual(); if (!p) return; N.addToPantry(p, p.grams); N.closeSheet(); N.render(); N.toast(p.name + ' in dispensa'); };
  A['mn-to-shop'] = function () { var p = readManual(); if (!p) return; addShop(p); N.closeSheet(); N.render(); N.toast(p.name + ' in lista'); };
  A.basics = function () { N.openSheet('basics'); };
  A['basic-toggle'] = function (el) {
    var id = el.dataset.id, ex = N.S.pantry.find(function (i) { return i.foodId === id && i.always; });
    if (ex) N.del('pantry', ex.id);
    else N.put('pantry', { id: N.uid(), foodId: id, name: N.FOOD[id].name, always: true, grams: 0, addedAt: Date.now(), source: 'base', cat: N.FOOD[id].cat });
    N.refreshSheet(); N.render();
  };

  // RICETTE
  A.servings = function (el) { var s = N.S.settings; s.servings = Math.max(1, Math.min(6, s.servings + (+el.dataset.d))); N.saveLocal(); N.render(); };
  A.eater = function (el) {
    var s = N.S.settings, ids = (s.eaters || N.S.profiles.map(function (p) { return p.id; })).slice(), id = el.dataset.id, i = ids.indexOf(id);
    if (i === -1) ids.push(id); else if (ids.length > 1) ids.splice(i, 1);
    s.eaters = ids; N.saveLocal(); N.render();
  };
  A['follow-goal'] = function (el) { N.S.settings.followGoal = el.checked; N.saveLocal(); N.render(); };
  A.rfilter = function (el) { N.S.settings.filter = el.dataset.f; N.saveLocal(); N.render(); };
  A['show-blocked'] = function () { N.showBlocked = !N.showBlocked; N.render(); };
  A['recipe-open'] = function (el) { N.openSheet('recipe', { id: el.dataset.id, servings: N.S.settings.servings, view: 'per' }); };
  A['r-serv'] = function (el) { var c = N.sheetCtx; c.servings = Math.max(1, Math.min(6, c.servings + (+el.dataset.d))); N.refreshSheet(); };
  A['r-view'] = function (el) { N.sheetCtx.view = el.dataset.v; N.refreshSheet(); };
  A['r-missing'] = function () {
    var r = N.recipeById(N.sheetCtx.id), ev = N.evaluate(r, N.sheetCtx.servings), n = 0;
    ev.lines.forEach(function (l) {
      if (!(l.status === 'missing' || l.status === 'partial' || l.status === 'staple')) return;
      var already = N.S.shopping.some(function (s) { return !s.checked && s.foodId === l.food.id; });
      if (already) return;
      var need = l.food.staple ? (l.food.id === 'olio_evo' ? 1000 : 100) : Math.max(0, l.need - (l.have || 0));
      if (l.food.pz) need = Math.ceil(need / l.food.pz) * l.food.pz;
      else if (!l.food.staple) need = Math.ceil(need / 50) * 50;
      addShop({ foodId: l.food.id, grams: need }); n++;
    });
    N.toast(n ? n + (n === 1 ? ' prodotto aggiunto' : ' prodotti aggiunti') + ' alla spesa' : 'Erano già tutti in lista');
    N.render();
  };
  A['r-cook'] = function () {
    var c = N.sheetCtx, ids = N.eaters().map(function (p) { return p.id; }).slice(0, c.servings);
    N.openSheet('cook', { id: c.id, servings: c.servings, eaters: ids }, true);
  };
  A['cook-eater'] = function (el) {
    var e = N.sheetCtx.eaters, i = e.indexOf(el.dataset.id);
    if (i === -1) e.push(el.dataset.id); else e.splice(i, 1);
    N.refreshSheet();
  };
  A['cook-confirm'] = function () {
    var c = N.sheetCtx, r = N.recipeById(c.id), ev = N.evaluate(r, c.servings), logs = [];
    ev.lines.forEach(function (l) {
      if (l.have === Infinity || l.have <= 0) return;
      logs = logs.concat(N.consume(l.food.id, Math.min(l.have, l.need)));
    });
    var meal = { id: N.uid(), date: N.today(), recipeId: r.id, title: r.t, servings: c.servings, eaters: c.eaters.slice(), per: ev.per, at: Date.now() };
    if (c.eaters.length) N.put('meals', meal);
    N.closeSheet(); N.render();
    N.toast('Buon appetito! Dispensa aggiornata', function () {
      var ids = {}; logs.forEach(function (row) { if (!ids[row.id]) { ids[row.id] = 1; N.put('pantry', row); } });
      if (c.eaters.length) N.del('meals', meal.id);
    });
  };

  // PROFILO
  A['edit-person'] = function (el) { N.editId = el.dataset.id; N.render(); };
  A['add-person'] = function () {
    var p = { id: N.uid(), name: 'Nuova persona', sex: 'F', age: 30, weight: 60, height: 165, activity: 1.375, goal: 'mantenere', meals: 3, allergies: [], intolerances: [], otherAvoid: [], custom: {} };
    N.put('profiles', p); N.editId = p.id;
    if (N.S.settings.eaters) { N.S.settings.eaters.push(p.id); N.saveLocal(); }
    N.render(); var x = $('#pf-name'); if (x) { x.focus(); x.select(); }
  };
  A['set-me'] = function (el) {
    var p = N.S.profiles.find(function (x) { return x.id === el.dataset.id; });
    if (N.cloud.active) { N.S.profiles.forEach(function (x) { if (x.userId === N.cloud.user.id && x.id !== p.id) { delete x.userId; N.put('profiles', x); } }); p.userId = N.cloud.user.id; N.put('profiles', p); }
    N.S.meId = p.id; N.saveLocal(); N.render(); N.toast('Ora sei ' + p.name);
  };
  A['del-person'] = function (el) {
    var p = N.S.profiles.find(function (x) { return x.id === el.dataset.id; });
    N.openSheet('confirm', { title: 'Eliminare ' + p.name + '?', text: 'Il profilo, le allergie e gli obiettivi di questa persona verranno cancellati.', yes: 'Elimina', danger: true, onYes: function () {
      N.del('profiles', p.id);
      if (N.S.settings.eaters) N.S.settings.eaters = N.S.settings.eaters.filter(function (x) { return x !== p.id; });
      N.editId = null; N.saveLocal(); N.closeSheet(); N.render();
    } });
  };
  A['push-on'] = function () {
    N.push.enable().then(function (st) {
      N.render();
      N.toast(st === 'push' ? 'Notifiche attive: arrivano alle 9:00' : st === 'local' ? 'Notifiche attive all’apertura dell’app' : 'Notifiche non consentite');
    });
  };
  A['push-off'] = function () { N.push.disable().then(function () { N.render(); N.toast('Notifiche disattivate'); }); };
  A['push-test'] = function () { N.push.test().catch(function () { N.toast('Non riesco a mostrare la notifica'); }); };
  A['copy-code'] = function () {
    var code = $('#house-code').textContent;
    try { navigator.clipboard.writeText(code).then(function () { N.toast('Codice copiato'); }, sel); } catch (e) { sel(); }
    function sel() { var r = document.createRange(); r.selectNodeContents($('#house-code')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); N.toast('Codice selezionato: copialo'); }
  };
  A.logout = function () { N.cloud.signOut(); };
  A.export = function () {
    var data = JSON.stringify({ esportato: new Date().toISOString(), profili: N.S.profiles, spesa: N.S.shopping, dispensa: N.S.pantry, pasti: N.S.meals }, null, 2);
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = 'nutrimi-dati.json';
    document.body.appendChild(a); a.click(); a.remove();
  };
  A.wipe = function () {
    N.openSheet('confirm', { title: 'Cancellare tutti i dati?', text: 'Profili, lista, dispensa e diario su questo dispositivo verranno eliminati.', yes: 'Cancella tutto', danger: true, onYes: function () {
      N.S = N.blankState(); N.saveLocal(); N.closeSheet(); N.boot();
    } });
  };

  // ONBOARDING / ACCESSO
  A['ob-start'] = function () { N.gate = 'obProfile'; N.render(); };
  A['ob-sample'] = function () { N.loadSample(); N.gate = null; N.tab = 'oggi'; N.render(); };
  A['ob-basic'] = function (el) { var s = N.obBasics, i = s.indexOf(el.dataset.id); if (i === -1) s.push(el.dataset.id); else s.splice(i, 1); N.render(); };
  A['ob-finish'] = function () {
    (N.obBasics || []).forEach(function (id) {
      if (!N.S.pantry.some(function (i) { return i.foodId === id && i.always; }))
        N.put('pantry', { id: N.uid(), foodId: id, name: N.FOOD[id].name, always: true, grams: 0, addedAt: Date.now(), source: 'base', cat: N.FOOD[id].cat });
    });
    if (N.push.status() === 'push' || N.push.status() === 'local') return A['ob-done']();
    N.gate = 'obNotify'; N.render();
  };
  A['ob-notify'] = function () {
    N.push.enable().then(function (st) {
      A['ob-done']();
      N.toast(st === 'push' || st === 'local' ? 'Notifiche attive. Inizia dalla lista della spesa' : 'Puoi attivarle quando vuoi dal Profilo');
    });
  };
  A['ob-done'] = function () { N.gate = null; N.tab = 'spesa'; N.render(); N.toast('Tutto pronto: inizia dalla lista della spesa'); };
  A['auth-mode'] = function (el) { N.authMode = el.dataset.m; N.render(); };
  A['goal-change'] = function (el) {
    var d = el.closest('form').querySelector('details.custom'); if (d && el.value === 'personalizzato') d.open = true;
  };

  /* ---------- form ---------- */
  function onSubmit(e) {
    var f = e.target; e.preventDefault();
    if (f.id === 'pform') {
      var res = N.readProfileForm(f), err = f.querySelector('#pf-err');
      if (res.err) { err.textContent = res.err; err.hidden = false; return; }
      err.hidden = true;
      if (f.dataset.mode === 'edit') {
        var p = N.S.profiles.find(function (x) { return x.id === f.dataset.id; });
        Object.assign(p, res.p); N.put('profiles', p); N.render(); N.toast('Profilo salvato');
      } else {
        var np = Object.assign({ id: N.uid() }, res.p);
        if (N.cloud.active) np.userId = N.cloud.user.id;
        N.put('profiles', np); N.S.meId = np.id; N.S.settings.eaters = null; N.S.demo = false; N.saveLocal();
        N.gate = 'obBasics'; N.render();
      }
    } else if (f.id === 'authform') {
      var email = $('#au-email').value.trim(), pass = $('#au-pass').value, ae = $('#au-err');
      ae.hidden = true;
      if (!email || pass.length < 8) { ae.textContent = 'Inserisci email e una password di almeno 8 caratteri.'; ae.hidden = false; return; }
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      var p2 = N.authMode === 'signup' ? N.cloud.signUp(email, pass) : N.cloud.signIn(email, pass);
      p2.then(function (r) {
        if (r && r.needsConfirm) { ae.textContent = 'Ti abbiamo inviato un’email: conferma l’indirizzo e poi accedi.'; ae.hidden = false; N.authMode = 'login'; btn.disabled = false; return; }
        N.boot();
      }, function (er) {
        btn.disabled = false;
        ae.textContent = /invalid login/i.test(er.message) ? 'Email o password non corrette.' : /already registered/i.test(er.message) ? 'Questa email ha già un account: accedi.' : er.message;
        ae.hidden = false;
      });
    } else if (f.id === 'hhform-new') {
      N.cloud.createHousehold($('#hh-name').value.trim()).then(function () { N.boot(); }, function (er) { N.toast(er.message); });
    } else if (f.id === 'hhform-join') {
      var code = $('#hh-code').value.trim(), he = $('#hh-err');
      N.cloud.joinHousehold(code).then(function (hid) {
        if (!hid) { he.textContent = 'Codice non valido.'; he.hidden = false; return; }
        N.boot();
      }, function () { he.textContent = 'Codice non trovato: controlla le lettere e riprova.'; he.hidden = false; });
    }
  }

  /* ---------- eventi ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]'); if (!el) return;
    if (el.tagName === 'INPUT' && el.type === 'radio') { if (A[el.dataset.a]) A[el.dataset.a](el, e); return; }
    if (el.tagName === 'INPUT' && el.type === 'checkbox') return;
    var fn = A[el.dataset.a]; if (!fn) return;
    e.preventDefault(); fn(el, e);
  });
  document.addEventListener('change', function (e) {
    var el = e.target; if (el.matches('input[type=checkbox][data-a]') && A[el.dataset.a]) A[el.dataset.a](el, e);
  });
  document.addEventListener('input', function (e) {
    var k = e.target.dataset.in; if (!k) return;
    if (k === 'shop-q') { N.shopQ = e.target.value; N.renderShopSugg(); }
    else if (k === 'pantry-q') { N.pantryQ = e.target.value; var pos = e.target.selectionStart; N.render(); var x = $('#pantry-q'); x.focus(); x.setSelectionRange(pos, pos); }
    else if (k === 'pa-q') { N.sheetCtx.q = e.target.value; N.sheetCtx.foodId = null; N.renderPaResults(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'shop-q') {
      e.preventDefault(); var first = document.querySelector('#shop-sugg [data-a="shop-pick"]');
      if (first) first.click(); else A['shop-free']();
    }
    if (e.key === 'Escape') { if (!$('#scanner').hidden) N.scanner.close(); else if (!$('#sheet').hidden) N.closeSheet(); }
  });
  document.addEventListener('submit', onSubmit);
  $('#scan-form').addEventListener('submit', function (e) { e.preventDefault(); N.scanner.submit($('#scan-code').value); });

  /* ---------- avvio ---------- */
  N.boot = async function () {
    N.gate = null;
    if (N.cloud.configured()) {
      $('#sync').hidden = false;
      try {
        if (!N.cloud.sb) await N.cloud.init();
        if (!N.cloud.user) { N.gate = 'auth'; return N.render(); }
        await N.cloud.loadHousehold();
        if (!N.cloud.hid) { N.gate = 'household'; return N.render(); }
        N.loadLocal();
        await N.cloud.pull();
        N.cloud.active = true; N.cloud.subscribe(); N.syncState('ok');
        if (!N.me()) { N.obDraft = { name: (N.cloud.user.email || '').split('@')[0] }; N.gate = 'obProfile'; return N.render(); }
      } catch (err) {
        console.error(err);
        if (N.loadLocal() && N.me()) { N.toast('Sei offline: uso i dati salvati sul telefono.'); }
        else { N.gate = 'auth'; N.render(); N.toast('Connessione al server non riuscita.'); return; }
      }
    } else {
      var had = N.loadLocal();
      if (window.NUTRIMI_PREVIEW && (!had || !N.me() || (N.S.demo && !N.S.pantry.some(function (i) { return i.exp; })))) N.loadSample();
      if (!N.me()) { N.gate = 'welcome'; return N.render(); }
    }
    N.render();
    setTimeout(function () {
      Promise.resolve(N.push.autoEnable()).catch(function () { }).then(function () { try { N.push.checkLocal(); } catch (e) { } });
    }, 1500);
  };
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !N.gate && N.me()) { N.softRender(); try { N.push.checkLocal(); } catch (e) { } }
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.NUTRIMI_PREVIEW) {
    navigator.serviceWorker.register('sw.js').catch(function () { });
  }
  N.boot();
})();
