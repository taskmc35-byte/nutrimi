/* Nutrimi — schermate */
(function () {
  var N = window.N, esc = N.esc;

  /* ---------- icone ---------- */
  function ic(d, extra) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" ' + (extra || '') + '>' + d + '</svg>'; }
  N.IC = {
    home: ic('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>'),
    cart: ic('<path d="M3 4h2.2l2.3 11.2h10.8L20.5 7H6.4"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>'),
    jar: ic('<path d="M8 3h8v3H8z"/><path d="M7 6h10a1 1 0 0 1 1 1v12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5V7a1 1 0 0 1 1-1Z"/><path d="M6 11h12M6 16h12"/>'),
    pot: ic('<path d="M4 10h16v6.5A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5Z"/><path d="M2 10h20M9 6.5c0-1 1-1.2 1-2.2M13 6.5c0-1 1-1.2 1-2.2"/>'),
    user: ic('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.9-3.7 3.9-5.7 7.5-5.7s6.6 2 7.5 5.7"/>'),
    scan: ic('<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M8 8v8M11 8v8M14 8v8M17 8v8" stroke-width="1.4"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    minus: ic('<path d="M5 12h14"/>'),
    check: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    x: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
    trash: ic('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'),
    search: ic('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
    alert: ic('<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2v.3"/>'),
    clock: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    link: ic('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'),
    chev: ic('<path d="m9 6 6 6-6 6"/>'),
    leaf: ic('<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z"/><path d="M5 19 13 11"/>'),
    cloud: ic('<path d="M7 18.5h10.5a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 7.3 9.3 4.6 4.6 0 0 0 7 18.5Z"/>'),
    bell: ic('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    camera: ic('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="13" r="3.4"/>'),
    phone: ic('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17.5h2"/>')
  };

  var MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  function longDate() { var d = new Date(), t = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; return t.charAt(0).toUpperCase() + t.slice(1); }
  function goalLabel(g) { var x = N.GOALS.find(function (a) { return a[0] === g; }); return x ? x[1] : 'Mantenere'; }

  /* ---------- componenti ---------- */
  function ring(val, target) {
    var r = 46, c = 2 * Math.PI * r, pct = target ? Math.min(1, val / target) : 0, over = target && val > target * 1.05;
    return '<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="' + N.f0(val) + ' kcal su ' + N.f0(target) + '">' +
      '<circle cx="60" cy="60" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="60" cy="60" r="' + r + '" class="ring-fg' + (over ? ' over' : '') + '" stroke-dasharray="' + (c * pct).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
      '<text x="60" y="58" class="ring-num">' + N.f0(val) + '</text><text x="60" y="76" class="ring-sub">di ' + N.f0(target) + ' kcal</text></svg>';
  }
  function bar(label, val, target, cls, unit) {
    var pct = target ? Math.min(100, val / target * 100) : 0;
    return '<div class="mbar ' + cls + '"><div class="mbar-top"><span>' + label + '</span><span class="num">' + N.f0(val) + '<em> / ' + N.f0(target) + ' ' + (unit || 'g') + '</em></span></div>' +
      '<div class="mbar-track"><i style="width:' + pct.toFixed(1) + '%"></i></div></div>';
  }
  function macroMini(n) {
    return '<span class="mm p">P ' + N.f0(n.p) + '</span><span class="mm c">C ' + N.f0(n.c) + '</span><span class="mm f">G ' + N.f0(n.f) + '</span>';
  }
  function conflictBadges(conf) {
    if (!conf.length) return '';
    var seen = {}, out = [];
    conf.forEach(function (c) {
      var k = c.person.id + c.label; if (seen[k]) return; seen[k] = 1;
      out.push('<span class="warn ' + (c.kind === 'allergia' ? 'hard' : 'soft') + '">' + N.IC.alert + esc(c.label) + ' · ' + esc(c.person.name) + '</span>');
    });
    return '<div class="warns">' + out.join('') + '</div>';
  }
  function alList(item) {
    var al = N.allergensOf(item);
    if (!al.length && !(item.traces || []).length) return '';
    return '<div class="allist">' + al.map(function (a) { return '<span class="tag">' + esc(N.AL_LABEL[a] || a) + '</span>'; }).join('') +
      (item.traces || []).map(function (a) { return '<span class="tag ghost">tracce di ' + esc((N.AL_LABEL[a] || a).toLowerCase()) + '</span>'; }).join('') + '</div>';
  }
  function chip(label, on, attrs) { return '<button type="button" class="chip' + (on ? ' on' : '') + '" ' + attrs + '>' + esc(label) + '</button>'; }
  function stepper(val, action, min, max, unit) {
    return '<div class="stepper"><button type="button" data-a="' + action + '" data-d="-1" ' + (val <= min ? 'disabled' : '') + ' aria-label="Meno">' + N.IC.minus + '</button>' +
      '<span class="num">' + val + (unit ? ' <em>' + unit + '</em>' : '') + '</span>' +
      '<button type="button" data-a="' + action + '" data-d="1" ' + (val >= max ? 'disabled' : '') + ' aria-label="Più">' + N.IC.plus + '</button></div>';
  }
  function emptyState(title, text, btn) {
    return '<div class="empty"><p class="empty-t">' + title + '</p><p>' + text + '</p>' + (btn || '') + '</div>';
  }
  function demoBanner() {
    if (!N.S.demo) return '';
    return '<div class="demo">Stai guardando <b>dati di esempio</b>. <button data-a="demo-reset" class="link">Inizia con i tuoi dati</button></div>';
  }
  function expChip(item, short) {
    var x = N.expInfo(item); if (!x) return '';
    if (short && x.cls === 'ok') return '';
    return '<span class="exp ' + x.cls + '">' + N.IC.clock + x.label + '</span>';
  }
  N.expChip = expChip;
  /* campo data di scadenza: a mano o dalla foto dell'etichetta */
  N.expField = function (val) {
    return '<div class="field expfield"><span>Data di scadenza</span><div class="exp-row">' +
      '<input id="exp-d" type="date" value="' + esc(val || '') + '" min="2000-01-01">' +
      '<button type="button" class="btn ghost" data-a="exp-ocr">' + N.IC.camera + 'Foto etichetta</button></div>' +
      '<input id="exp-file" type="file" accept="image/*" capture="environment" hidden>' +
      '<div id="exp-cands" class="exp-cands"></div>' +
      (val ? '<button type="button" class="link small left" data-a="exp-clear">Togli la data</button>' : '') + '</div>';
  };
  N.ui = { chip: chip, stepper: stepper, conflictBadges: conflictBadges, alList: alList, macroMini: macroMini };

  /* ====================================================== OGGI */
  N.views = {};
  N.views.oggi = function () {
    var me = N.me(); if (!me) return '';
    var t = N.targets(me), eaten = N.dayTotals(me.id, N.today());
    var meals = N.S.meals.filter(function (m) { return m.date === N.today() && (!m.eaters || m.eaters.indexOf(me.id) !== -1); });
    var ranked = N.rankRecipes(N.S.settings.servings).filter(function (e) { return !e.blocked; }).slice(0, 5);
    var low = N.S.pantry.filter(function (i) { return !i.always && i.initial && (i.grams / i.initial <= 0.25); }).slice(0, 6);
    var left = Math.max(0, t.kcal - eaten.kcal);

    var h = demoBanner() +
      '<section class="hello"><p class="eyebrow">' + longDate() + '</p><h1>Ciao ' + esc(me.name) + '</h1></section>' +
      '<section class="card today"><div class="today-ring">' + ring(eaten.kcal, t.kcal) + '</div><div class="today-bars">' +
      bar('Proteine', eaten.p, t.p, 'p') + bar('Carboidrati', eaten.c, t.c, 'c') + bar('Grassi', eaten.f, t.f, 'f') +
      '<p class="today-note">' + goalLabel(me.goal) + ' · ' + (left > 0 ? 'ti restano <b>' + N.f0(left) + ' kcal</b>' : 'obiettivo calorico raggiunto') + '</p></div></section>';

    var pst = N.push.status();
    if (pst === 'off' && !N.push.disabledByUser()) h += '<div class="card notify-cta"><span class="nd-ic">' + N.IC.bell + '</span><div class="nc-txt"><b>Attiva gli avvisi di scadenza</b><p class="muted small">Ti avvisiamo alle 9:00, 3 giorni prima.</p></div><button class="btn small primary" data-a="push-on">Attiva</button></div>';
    var soon = N.soonItems(), expired = N.expiredItems();
    if (soon.length) {
      h += '<section class="card usesoon"><div class="sec-head"><h2>' + N.IC.bell + 'Da consumare presto</h2></div><ul class="plain">' + soon.slice(0, 5).map(function (i) {
        var recs = i.foodId ? N.recipesUsing(i.foodId).slice(0, 2) : [];
        return '<li><div class="us-top"><button class="us-name" data-a="pantry-open" data-id="' + i.id + '">' + esc(i.name) + '</button>' + expChip(i) + '</div>' +
          (recs.length ? '<div class="us-recs">' + recs.map(function (e) { return '<button class="us-rec" data-a="recipe-open" data-id="' + e.r.id + '">' + N.IC.pot + esc(e.r.t) + '</button>'; }).join('') + '</div>'
            : '<p class="muted small">Nessuna ricetta del ricettario lo usa: consumalo come contorno o spuntino.</p>') + '</li>';
      }).join('') + '</ul></section>';
    }
    if (expired.length) {
      h += '<section class="card expired-box"><div class="sec-head"><h2>' + N.IC.alert + 'Scaduti</h2></div><p class="muted small">Non vengono più contati nelle ricette. Controllali e buttali se non sono più buoni.</p><ul class="plain">' + expired.map(function (i) {
        return '<li class="exp-li"><button class="us-name" data-a="pantry-open" data-id="' + i.id + '">' + esc(i.name) + '</button>' + expChip(i) +
          '<button class="pill-btn bad" data-a="pi-trash" data-id="' + i.id + '">' + N.IC.trash + 'Buttato</button></li>';
      }).join('') + '</ul></section>';
    }

    h += '<section><div class="sec-head"><h2>Cosa cucino adesso</h2><button class="link" data-a="tab" data-tab="ricette">Tutte le ricette</button></div>';
    if (!ranked.length) h += emptyState('Nessuna ricetta compatibile', 'Controlla allergie e persone a tavola nella sezione Ricette.');
    else h += '<div class="hscroll">' + ranked.map(function (e) { return recipeTile(e); }).join('') + '</div>';
    h += '</section>';

    if (meals.length) {
      h += '<section><div class="sec-head"><h2>Oggi hai mangiato</h2></div><ul class="list">' + meals.map(function (m) {
        return '<li class="row"><div class="row-main"><div class="name">' + esc(m.title) + '</div><div class="meta num">' + N.f0(m.per.kcal) + ' kcal · ' + macroMini(m.per) + '</div></div>' +
          '<button class="icon-btn" data-a="meal-del" data-id="' + m.id + '" aria-label="Elimina dal diario">' + N.IC.trash + '</button></li>';
      }).join('') + '</ul></section>';
    }

    h += '<section><div class="sec-head"><h2>In esaurimento</h2><button class="link" data-a="tab" data-tab="dispensa">Dispensa</button></div>';
    if (!low.length) h += '<p class="muted small">Nessun prodotto sotto il 25% della quantità acquistata.</p>';
    else h += '<ul class="list">' + low.map(function (i) {
      return '<li class="row"><div class="row-main"><div class="name">' + esc(i.name) + '</div><div class="meta">Restano ' + N.qty(i.grams, i) + '</div>' + levelBar(i) + '</div>' +
        '<button class="pill-btn" data-a="low-to-shop" data-id="' + i.id + '">' + N.IC.plus + 'Spesa</button></li>';
    }).join('') + '</ul>';
    h += '</section>';
    return h;
  };
  function recipeTile(e) {
    var st = e.ready ? '<span class="status ok">Pronta</span>' : e.missing + e.partial <= 2 ? '<span class="status near">Manca ' + (e.missing + e.partial) + '</span>' : '<span class="status no">Mancano ' + (e.missing + e.partial) + '</span>';
    return '<button class="tile" data-a="recipe-open" data-id="' + e.r.id + '">' + st +
      '<span class="tile-t">' + esc(e.r.t) + '</span>' + (e.soonLines.length ? '<span class="exp soon">' + N.IC.clock + 'Usa ' + esc(e.soonLines[0].food.name.toLowerCase()) + '</span>' : '') +
      '<span class="tile-m num">' + N.f0(e.per.kcal) + ' kcal · ' + N.f0(e.per.p) + ' g prot.</span></button>';
  }
  function levelBar(i) {
    if (i.always || !i.initial) return '';
    var pct = Math.max(0, Math.min(100, i.grams / i.initial * 100));
    return '<div class="level' + (pct <= 25 ? ' low' : '') + '"><i style="width:' + pct.toFixed(0) + '%"></i></div>';
  }

  /* ====================================================== SPESA */
  N.views.spesa = function () {
    var list = N.S.shopping.slice().sort(function (a, b) { return (a.addedAt || 0) - (b.addedAt || 0); });
    var todo = list.filter(function (i) { return !i.checked; }), done = list.filter(function (i) { return i.checked; });
    var people = N.S.profiles;
    var h = demoBanner() + '<div class="view-head"><h1>Spesa</h1><p class="muted num">' + todo.length + ' da comprare · ' + done.length + ' nel carrello</p></div>';
    h += '<div class="checkfor">' + N.IC.alert + '<span>Controllo allergeni per ' + people.map(function (p) { return '<b>' + esc(p.name) + '</b>'; }).join(', ') + '</span></div>';
    h += '<div class="adder"><label class="search">' + N.IC.search + '<input id="shop-q" data-in="shop-q" autocomplete="off" placeholder="Aggiungi un prodotto" value="' + esc(N.shopQ || '') + '"></label>' +
      '<button class="icon-btn solid" data-a="scan" data-for="shop" aria-label="Scansiona un codice a barre">' + N.IC.scan + '</button></div>';
    h += '<div id="shop-sugg">' + shopSugg() + '</div>';
    if (!list.length) return h + emptyState('La lista è vuota', 'Scrivi un prodotto qui sopra o scansiona un codice a barre. Le ricette ti suggeriscono anche cosa manca.');
    var groups = {};
    todo.forEach(function (i) { var c = i.cat || 'Altro'; (groups[c] = groups[c] || []).push(i); });
    N.CATS.forEach(function (c) {
      if (!groups[c]) return;
      h += '<h3 class="group">' + esc(c) + '</h3><ul class="list">' + groups[c].map(function (i) { return shopRow(i, people); }).join('') + '</ul>';
    });
    if (done.length) {
      h += '<div class="sec-head cart-head"><h3 class="group">Nel carrello · già in dispensa</h3><button class="link" data-a="shop-clear">Togli dalla lista</button></div>' +
        '<ul class="list done">' + done.map(function (i) { return shopRow(i, people); }).join('') + '</ul>';
    }
    return h;
  };
  function shopRow(i, people) {
    var conf = N.conflicts(i, people);
    return '<li class="row' + (i.checked ? ' is-done' : '') + '"><button class="check' + (i.checked ? ' on' : '') + '" data-a="shop-toggle" data-id="' + i.id + '" aria-label="' + (i.checked ? 'Togli dal carrello' : 'Preso') + '">' + N.IC.check + '</button>' +
      '<button class="row-main" data-a="shop-edit" data-id="' + i.id + '"><span class="name">' + esc(i.name) + (i.brand ? ' <em>' + esc(i.brand) + '</em>' : '') + '</span>' +
      '<span class="meta num">' + (i.grams ? N.qty(i.grams, i.foodId ? N.FOOD[i.foodId] || i : i) : 'quantità da definire') + '</span>' + conflictBadges(conf) + '</button>' + cartExp(i) + '</li>';
  }
  function cartExp(i) {
    if (!i.checked || !i.pantryId) return '';
    var p = N.S.pantry.find(function (x) { return x.id === i.pantryId; }); if (!p) return '';
    if (p.exp) return '<button class="cart-exp" data-a="pantry-open" data-id="' + p.id + '">' + expChip(p) + '</button>';
    return '<button class="pill-btn" data-a="pantry-open" data-id="' + p.id + '" data-focus="exp">' + N.IC.clock + 'Scadenza</button>';
  }
  function shopSugg() {
    var q = N.shopQ || ''; if (!q.trim()) return '';
    var people = N.S.profiles, res = N.searchFoods(q, 6);
    var h = '<ul class="sugg">' + res.map(function (f) {
      var conf = N.conflicts({ foodId: f.id, name: f.name }, people);
      return '<li><button data-a="shop-pick" data-food="' + f.id + '"><span class="name">' + esc(f.name) + '</span><span class="meta">' + esc(f.cat) + ' · ' + N.f0(f.n.kcal) + ' kcal/100 g</span>' + conflictBadges(conf) + '</button></li>';
    }).join('');
    h += '<li><button data-a="shop-free"><span class="name">Aggiungi «' + esc(q.trim()) + '»</span><span class="meta">come voce libera</span></button></li></ul>';
    return h;
  }
  N.renderShopSugg = function () { var el = document.getElementById('shop-sugg'); if (el) el.innerHTML = shopSugg(); };

  /* ====================================================== DISPENSA */
  N.views.dispensa = function () {
    var q = N.norm(N.pantryQ || ''), cat = N.S.settings.pantryCat || 'tutte';
    var tracked = N.S.pantry.filter(function (i) { return !i.always; });
    var basics = N.S.pantry.filter(function (i) { return i.always; });
    var cats = N.CATS.filter(function (c) { return tracked.some(function (i) { return (i.cat || 'Altro') === c; }); });
    var rank = function (i) { var x = N.expInfo(i); return !x ? 3 : x.cls === 'expired' ? 0 : x.cls === 'soon' ? 1 : 2; };
    var nExp = tracked.filter(function (i) { return rank(i) < 2; }).length;
    var shown = tracked.filter(function (i) {
      var inCat = cat === 'tutte' || (cat === '__exp' ? rank(i) < 2 : (i.cat || 'Altro') === cat);
      return inCat && (!q || N.norm(i.name + ' ' + (i.brand || '')).indexOf(q) !== -1);
    }).sort(function (a, b) { return (rank(a) - rank(b)) || (rank(a) < 2 ? a.exp.localeCompare(b.exp) : 0) || a.name.localeCompare(b.name); });
    var tot = N.zero(); tracked.forEach(function (i) { N.addN(tot, N.itemNutr(i), i.grams); });

    var h = demoBanner() + '<div class="view-head"><h1>Dispensa</h1><p class="muted num">' + tracked.length + ' prodotti · ' + basics.length + ' basi di casa</p></div>';
    h += '<div class="stats"><div><span class="num">' + N.f0(tot.kcal / 1000) + '</span><em>mila kcal</em></div><div><span class="num">' + N.f1(tot.p / 1000) + '</span><em>kg di proteine</em></div><div><span class="num">' + N.f0(tot.fib) + '</span><em>g di fibre</em></div></div>';
    h += '<div class="adder"><label class="search">' + N.IC.search + '<input id="pantry-q" data-in="pantry-q" autocomplete="off" placeholder="Cerca in dispensa" value="' + esc(N.pantryQ || '') + '"></label>' +
      '<button class="icon-btn solid" data-a="scan" data-for="pantry" aria-label="Scansiona un prodotto">' + N.IC.scan + '</button>' +
      '<button class="icon-btn solid yellow" data-a="pantry-add" aria-label="Aggiungi in dispensa">' + N.IC.plus + '</button></div>';
    h += '<div class="chips scroll">' + chip('Tutto', cat === 'tutte', 'data-a="pantry-cat" data-cat="tutte"') +
      (nExp ? chip('In scadenza (' + nExp + ')', cat === '__exp', 'data-a="pantry-cat" data-cat="__exp"') : '') + cats.map(function (c) { return chip(c, cat === c, 'data-a="pantry-cat" data-cat="' + esc(c) + '"'); }).join('') + '</div>';
    if (!tracked.length) h += emptyState('Dispensa vuota', 'Spunta i prodotti nella lista della spesa oppure aggiungili qui con + o con lo scanner.');
    else if (!shown.length) h += '<p class="muted small">Nessun prodotto corrisponde alla ricerca.</p>';
    else h += '<ul class="list">' + shown.map(function (i) {
      var src = i.source === 'off' ? '<span class="src">Etichetta</span>' : i.source === 'manuale' ? '<span class="src">Manuale</span>' : '';
      var xi = N.expInfo(i);
      return '<li class="row' + (xi && xi.cls === 'expired' ? ' is-expired' : xi && xi.cls === 'soon' ? ' is-soon' : '') + '"><button class="row-main" data-a="pantry-open" data-id="' + i.id + '"><span class="name">' + esc(i.name) + (i.brand ? ' <em>' + esc(i.brand) + '</em>' : '') + src + '</span>' +
        '<span class="meta num">' + N.qty(i.grams, i.pz ? i : (N.FOOD[i.foodId] || i)) + (N.itemNutr(i) ? ' · ' + N.f0(N.itemNutr(i).kcal) + ' kcal/100 g' : ' · valori non disponibili') + '</span>' + expChip(i) + levelBar(i) + '</button>' +
        '<span class="chev">' + N.IC.chev + '</span></li>';
    }).join('') + '</ul>';
    h += '<section><div class="sec-head"><h2>Basi di casa</h2><button class="link" data-a="basics">Gestisci</button></div>' +
      '<p class="muted small">Sale, olio, spezie: sempre disponibili per le ricette, senza contare i grammi.</p>' +
      '<div class="chips">' + (basics.length ? basics.map(function (b) { return '<span class="chip static">' + esc(b.name) + '</span>'; }).join('') : '<span class="muted small">Nessuna base impostata.</span>') + '</div></section>';
    return h;
  };

  /* ====================================================== RICETTE */
  var FILTERS = [['tutte', 'Tutte'], ['scadenza', 'Da consumare'], ['pronte', 'Pronte ora'], ['quasi', 'Ti manca poco'], ['colazione', 'Colazione'], ['primo', 'Primi'], ['secondo', 'Secondi'], ['unico', 'Piatti unici'], ['web', 'Dal web']];
  N.views.ricette = function () {
    var S = N.S.settings, me = N.me(), people = N.S.profiles, eaters = N.eaters();
    var all = N.rankRecipes(S.servings), f = S.filter || 'tutte';
    var blocked = all.filter(function (e) { return e.blocked; });
    var list = all.filter(function (e) {
      if (e.blocked && !N.showBlocked) return false;
      if (f === 'pronte') return e.ready;
      if (f === 'scadenza') return e.soonLines.length > 0;
      if (f === 'quasi') return !e.ready && e.missing + e.partial <= 2;
      if (f === 'web') return !!e.r.imported;
      if (f !== 'tutte') return (e.r.tag || []).indexOf(f) !== -1;
      return true;
    });
    var h = demoBanner() + '<div class="view-head"><h1>Ricette</h1><p class="muted num">' + all.filter(function (e) { return e.ready && !e.blocked; }).length + ' pronte con quello che hai</p></div>';
    h += '<div class="card controls"><div class="ctl"><span class="ctl-l">Porzioni</span>' + stepper(S.servings, 'servings', 1, 6) + '</div>' +
      '<div class="ctl col"><span class="ctl-l">A tavola</span><div class="chips">' + people.map(function (p) {
        return chip(p.name, eaters.some(function (x) { return x.id === p.id; }), 'data-a="eater" data-id="' + p.id + '"');
      }).join('') + '</div></div>' +
      (me ? '<label class="ctl toggle"><span class="ctl-l">Segui il mio obiettivo<em>' + goalLabel(me.goal) + ' · ' + N.f0(N.targets(me).meal.kcal) + ' kcal a pasto</em></span><input type="checkbox" id="follow-goal" data-a="follow-goal" ' + (S.followGoal ? 'checked' : '') + '><i></i></label>' : '') + '</div>';
    h += '<div class="chips scroll">' + FILTERS.map(function (x) { return chip(x[1], f === x[0], 'data-a="rfilter" data-f="' + x[0] + '"'); }).join('') + '</div>';
    if (f === 'scadenza' && !list.length) h += emptyState('Niente in scadenza', 'Quando un prodotto scade entro 3 giorni, qui trovi le ricette che lo usano.');
    else if (f === 'web' && !list.length) h += emptyState('Ancora nessuna ricetta dal web', N.cloud.active ? 'L’aggiornamento settimanale aggiunge qui le ricette importate, con il link alla fonte.' : 'Le ricette importate ogni settimana arrivano con l’account online.');
    else if (!list.length) h += emptyState('Nessuna ricetta in questo filtro', 'Prova un altro filtro o aggiungi prodotti in dispensa.');
    h += '<div class="rlist">' + list.map(recipeCard).join('') + '</div>';
    if (blocked.length) h += '<p class="muted small center">' + blocked.length + ' ricette nascoste per allergie di chi è a tavola. <button class="link" data-a="show-blocked">' + (N.showBlocked ? 'Nascondi' : 'Mostra') + '</button></p>';
    return h;
  };
  function recipeCard(e) {
    var st = e.ready ? '<span class="status ok">' + N.IC.check + 'Pronta</span>'
      : '<span class="status ' + (e.missing + e.partial <= 2 ? 'near' : 'no') + '">' + (e.missing + e.partial === 1 ? 'Manca 1 ingrediente' : 'Mancano ' + (e.missing + e.partial)) + '</span>';
    var fit = '';
    if (N.S.settings.followGoal && e.fit && e.fit.t) {
      var z = N.fitZone(e.fit.kd, (N.me() || {}).goal);
      fit = '<span class="fit ' + z[0] + '">' + z[1] + '</span>';
    }
    return '<button class="rcard' + (e.blocked ? ' blocked' : '') + '" data-a="recipe-open" data-id="' + e.r.id + '">' +
      '<span class="rcard-top">' + st + '<span class="rmeta">' + N.IC.clock + e.r.min + '′</span></span>' +
      '<span class="rcard-t">' + esc(e.r.t) + '</span>' +
      '<span class="rcard-n num"><b>' + N.f0(e.per.kcal) + '</b> kcal a porzione ' + macroMini(e.per) + '</span>' +
      '<span class="rcard-b">' + e.soonLines.map(function (l) { return '<span class="exp soon">' + N.IC.clock + 'Usa ' + esc(l.food.name.toLowerCase()) + ' · ' + (l.soon === 0 ? 'scade oggi' : l.soon === 1 ? 'domani' : 'tra ' + l.soon + ' gg') + '</span>'; }).join('') +
      e.expLines.map(function (l) { return '<span class="exp expired">' + N.IC.alert + esc(l.food.name) + ' scaduto</span>'; }).join('') +
      fit + (e.r.imported ? '<span class="src">' + esc(e.r.src) + '</span>' : '') + '</span>' +
      conflictBadges(e.conf) + '</button>';
  }

  /* ====================================================== PROFILO */
  N.views.profilo = function () {
    var editId = N.editId || (N.me() && N.me().id), p = N.S.profiles.find(function (x) { return x.id === editId; }) || N.me();
    var h = demoBanner() + '<div class="view-head"><h1>Profilo</h1><p class="muted">Persone in casa, obiettivi e allergie</p></div>';
    h += '<div class="chips scroll">' + N.S.profiles.map(function (x) {
      return chip(x.name + (x.id === N.S.meId ? ' (tu)' : ''), x.id === p.id, 'data-a="edit-person" data-id="' + x.id + '"');
    }).join('') + '<button class="chip add" data-a="add-person">' + N.IC.plus + 'Persona</button></div>';
    var t = N.targets(p);
    h += '<section class="card targets"><div class="tg-head"><div><p class="eyebrow">Fabbisogno di ' + esc(p.name) + '</p><p class="tg-kcal num">' + N.f0(t.kcal) + ' <em>kcal al giorno</em></p></div><span class="goal-pill">' + goalLabel(p.goal) + '</span></div>' +
      '<div class="tg-grid num"><div><b>' + N.f0(t.p) + ' g</b><span>Proteine</span></div><div><b>' + N.f0(t.c) + ' g</b><span>Carboidrati</span></div><div><b>' + N.f0(t.f) + ' g</b><span>Grassi</span></div><div><b>' + N.f0(t.meal.kcal) + '</b><span>kcal a pasto</span></div></div>' +
      '<p class="muted small">Metabolismo basale ' + N.f0(t.bmr) + ' kcal · IMC ' + N.f1(N.bmi(p)) + '. Stime generali (formula Mifflin-St Jeor): per una dieta vera e propria fatti seguire da un professionista.</p></section>';
    h += N.profileForm(p, 'edit');
    if (p.id !== N.S.meId) h += '<div class="row-actions"><button class="btn ghost" data-a="set-me" data-id="' + p.id + '">Questa persona sono io</button><button class="btn danger ghost" data-a="del-person" data-id="' + p.id + '">' + N.IC.trash + 'Elimina</button></div>';
    h += notifyCard() + accountCard();
    return h;
  };
  function notifyCard() {
    var st = N.push.status();
    var txt = {
      push: 'Attive: alle 9:00 ricevi un avviso quando un prodotto scade entro 3 giorni, anche ad app chiusa.',
      local: 'Attive: l’avviso arriva quando apri l’app. Per riceverle ad app chiusa serve l’account online.',
      off: 'Ti avvisiamo 3 giorni prima che un prodotto scada, con le ricette per usarlo.',
      denied: 'Le notifiche sono bloccate per questa app: riattivale dalle impostazioni del telefono.',
      ios: 'Su iPhone le notifiche funzionano solo con l’app sulla schermata Home: tocca Condividi → Aggiungi alla schermata Home, poi apri Nutrimi da lì.',
      unsupported: 'Questo browser non supporta le notifiche. Le scadenze restano evidenziate nella schermata Oggi.'
    }[st];
    return '<section class="card notify"><h2>' + N.IC.bell + 'Notifiche scadenze</h2><p class="muted small">' + txt + '</p>' +
      (st === 'off' ? '<button class="btn primary block" data-a="push-on">Attiva le notifiche</button>' : '') +
      (st === 'push' || st === 'local' ? '<div class="row-actions"><button class="btn ghost" data-a="push-test">Invia una prova</button><button class="btn ghost" data-a="push-off">Disattiva</button></div>' : '') + '</section>';
  }
  function accountCard() {
    var C = N.cloud, h = '<section class="card account"><h2>Account e dati</h2>';
    if (C.active) {
      h += '<p class="acc-line">' + N.IC.cloud + '<span>Account online <b>' + esc(C.user.email) + '</b></span></p>' +
        '<div class="code-box"><span class="muted small">Codice casa da condividere</span><span class="code num" id="house-code">' + esc(C.household ? C.household.invite_code : 'Non disponibile') + '</span>' +
        '<button class="btn small" data-a="copy-code">Copia</button></div>' +
        '<p class="muted small">Chi crea un account Nutrimi e inserisce questo codice vede la stessa lista della spesa e la stessa dispensa, aggiornate in tempo reale.</p>' +
        '<div class="row-actions"><button class="btn ghost" data-a="logout">Esci</button></div>';
    } else {
      h += '<p class="acc-line">' + N.IC.phone + '<span>Dati salvati <b>solo su questo dispositivo</b></span></p>' +
        '<p class="muted small">' + (C.configured() ? '' : 'L’account online condiviso si attiva quando colleghi Supabase (vedi la guida nel progetto).') + '</p>';
    }
    h += '<div class="row-actions">' + (window.NUTRIMI_PREVIEW ? '' : '<button class="btn ghost" data-a="export">Esporta i dati</button>') +
      (C.active ? '' : '<button class="btn danger ghost" data-a="wipe">Cancella tutto</button>') + '</div></section>';
    return h;
  }

  /* form profilo (onboarding e modifica) */
  N.profileForm = function (p, mode) {
    p = p || {};
    var v = function (k) { return p[k] != null ? esc(p[k]) : ''; }, c = p.custom || {};
    var h = '<form class="card pform" id="pform" data-mode="' + mode + '" data-id="' + esc(p.id || '') + '" novalidate>';
    h += '<div class="grid2"><label class="field span2"><span>Nome</span><input id="pf-name" required value="' + v('name') + '" autocomplete="given-name"></label>' +
      '<div class="field span2"><span>Sesso</span><div class="seg">' +
      ['M', 'F'].map(function (s) { return '<label><input type="radio" name="pf-sex" value="' + s + '"' + ((p.sex || 'M') === s ? ' checked' : '') + '><span>' + (s === 'M' ? 'Uomo' : 'Donna') + '</span></label>'; }).join('') + '</div></div>' +
      '<label class="field"><span>Età</span><input id="pf-age" type="number" inputmode="numeric" min="10" max="110" value="' + v('age') + '" placeholder="anni"></label>' +
      '<label class="field"><span>Peso (kg)</span><input id="pf-weight" type="number" inputmode="decimal" step="0.1" min="25" max="300" value="' + v('weight') + '"></label>' +
      '<label class="field"><span>Altezza (cm)</span><input id="pf-height" type="number" inputmode="numeric" min="100" max="230" value="' + v('height') + '"></label>' +
      '<label class="field"><span>Pasti principali</span><select id="pf-meals">' + [2, 3, 4, 5].map(function (n) { return '<option' + ((+p.meals || 3) === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
      '<label class="field span2"><span>Attività fisica</span><select id="pf-activity">' + N.ACTIVITY.map(function (a) { return '<option value="' + a[0] + '"' + ((+p.activity || 1.375) === a[0] ? ' selected' : '') + '>' + a[1] + '</option>'; }).join('') + '</select></label></div>';
    h += '<div class="field"><span>Obiettivo</span><div class="seg wrap">' + N.GOALS.map(function (g) {
      return '<label><input type="radio" name="pf-goal" value="' + g[0] + '"' + ((p.goal || 'mantenere') === g[0] ? ' checked' : '') + ' data-a="goal-change"><span>' + g[1] + '</span></label>';
    }).join('') + '</div></div>';
    h += '<details class="custom"' + ((p.goal === 'personalizzato' || c.kcal) ? ' open' : '') + '><summary>Valori personalizzati</summary><p class="muted small">Lascia vuoto per usare il calcolo automatico. Utile se segui un piano del tuo nutrizionista.</p><div class="grid4">' +
      [['kcal', 'kcal/giorno'], ['p', 'Proteine g'], ['c', 'Carbo g'], ['f', 'Grassi g']].map(function (x) {
        return '<label class="field"><span>' + x[1] + '</span><input id="pf-c-' + x[0] + '" type="number" inputmode="numeric" min="0" value="' + (c[x[0]] || '') + '"></label>';
      }).join('') + '</div></details>';
    h += '<div class="field"><span>Allergie</span><div class="chips">' + N.ALLERGENS.map(function (a) {
      return '<label class="chip tick"><input type="checkbox" name="pf-al" value="' + a[0] + '"' + ((p.allergies || []).indexOf(a[0]) !== -1 ? ' checked' : '') + '><span>' + a[1] + '</span></label>';
    }).join('') + '</div></div>';
    h += '<div class="field"><span>Intolleranze</span><div class="chips">' + N.INTOLERANCES.map(function (a) {
      return '<label class="chip tick"><input type="checkbox" name="pf-in" value="' + a[0] + '"' + ((p.intolerances || []).indexOf(a[0]) !== -1 ? ' checked' : '') + '><span>' + a[1] + '</span></label>';
    }).join('') + '</div></div>';
    h += '<label class="field"><span>Altro da evitare</span><input id="pf-other" value="' + esc((p.otherAvoid || []).join(', ')) + '" placeholder="es. fragole, kiwi"></label>';
    h += '<p class="form-err" id="pf-err" hidden></p><button class="btn primary block" type="submit">' + (mode === 'edit' ? 'Salva profilo' : 'Continua') + '</button></form>';
    return h;
  };
  N.readProfileForm = function (form) {
    var g = function (id) { return form.querySelector('#' + id).value.trim(); };
    var checked = function (name) { return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; }); };
    var sex = form.querySelector('input[name="pf-sex"]:checked'), goal = form.querySelector('input[name="pf-goal"]:checked');
    var p = {
      name: g('pf-name'), sex: sex ? sex.value : 'M', age: +g('pf-age') || null, weight: +g('pf-weight') || null, height: +g('pf-height') || null,
      meals: +g('pf-meals') || 3, activity: +g('pf-activity') || 1.375, goal: goal ? goal.value : 'mantenere',
      allergies: checked('pf-al'), intolerances: checked('pf-in'),
      otherAvoid: g('pf-other').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      custom: { kcal: +g('pf-c-kcal') || 0, p: +g('pf-c-p') || 0, c: +g('pf-c-c') || 0, f: +g('pf-c-f') || 0 }
    };
    var checks = [
      [!p.name, 'pf-name', 'Inserisci il nome.'],
      [!p.age || p.age < 10 || p.age > 110, 'pf-age', 'Inserisci un’età tra 10 e 110 anni.'],
      [!p.weight || p.weight < 25 || p.weight > 300, 'pf-weight', 'Inserisci il peso in kg, tra 25 e 300.'],
      [!p.height || p.height < 100 || p.height > 230, 'pf-height', 'Inserisci l’altezza in cm, tra 100 e 230.'],
      [p.goal === 'personalizzato' && !p.custom.kcal, 'pf-c-kcal', 'Con l’obiettivo personalizzato indica almeno le kcal al giorno.']
    ];
    var bad = checks.find(function (c) { return c[0]; });
    if (bad && bad[1] === 'pf-c-kcal') { var d = form.querySelector('details.custom'); if (d) d.open = true; }
    return { p: p, err: bad ? bad[2] : '', field: bad ? bad[1] : null };
  };

  /* ====================================================== ONBOARDING / ACCESSO */
  N.views.welcome = function () {
    return '<div class="gate-wrap"><div class="brand-big">' + logo() + '<p class="claim">La spesa, la dispensa e le ricette giuste per i tuoi obiettivi.</p></div>' +
      '<ul class="feat"><li>' + N.IC.cart + '<span>Lista della spesa con controllo allergeni e scanner</span></li><li>' + N.IC.jar + '<span>Dispensa che si aggiorna da sola quando cucini</span></li><li>' + N.IC.pot + '<span>Ricette mediterranee da 1 a 6 porzioni, con macro e vitamine</span></li></ul>' +
      '<div class="gate-actions"><button class="btn primary block" data-a="ob-start">Crea il mio profilo</button><button class="btn ghost block" data-a="ob-sample">Esplora con dati di esempio</button></div></div>';
  };
  N.views.auth = function () {
    var m = N.authMode || 'login';
    return '<div class="gate-wrap"><div class="brand-big">' + logo() + '<p class="claim">' + (m === 'login' ? 'Accedi per ritrovare la tua dispensa.' : 'Crea il tuo account Nutrimi.') + '</p></div>' +
      '<form class="card" id="authform" novalidate><label class="field"><span>Email</span><input id="au-email" type="email" autocomplete="email" required></label>' +
      '<label class="field"><span>Password</span><input id="au-pass" type="password" autocomplete="' + (m === 'login' ? 'current-password' : 'new-password') + '" minlength="8" required></label>' +
      '<p class="form-err" id="au-err" hidden></p><button class="btn primary block" type="submit">' + (m === 'login' ? 'Accedi' : 'Crea account') + '</button></form>' +
      '<p class="center small">' + (m === 'login' ? 'Non hai un account? <button class="link" data-a="auth-mode" data-m="signup">Registrati</button>' : 'Hai già un account? <button class="link" data-a="auth-mode" data-m="login">Accedi</button>') + '</p></div>';
  };
  N.views.household = function () {
    return '<div class="gate-wrap"><div class="brand-big">' + logo() + '<p class="claim">Una casa, una dispensa condivisa.</p></div>' +
      '<form class="card" id="hhform-new" novalidate><h2>Crea la tua casa</h2><p class="muted small">Poi potrai condividere il codice con chi vive con te.</p><label class="field"><span>Nome</span><input id="hh-name" placeholder="es. Casa Rossi"></label><button class="btn primary block" type="submit">Crea</button></form>' +
      '<form class="card" id="hhform-join" novalidate><h2>Hai un codice?</h2><label class="field"><span>Codice casa</span><input id="hh-code" autocapitalize="characters" placeholder="es. 7F3K9Q"></label><p class="form-err" id="hh-err" hidden></p><button class="btn ghost block" type="submit">Entra nella casa</button></form></div>';
  };
  N.views.obProfile = function () {
    return '<div class="gate-wrap"><p class="eyebrow">Passo 1 di 3</p><h1>Il tuo profilo</h1><p class="muted">Servono per calcolare il fabbisogno e segnalarti gli allergeni mentre fai la spesa.</p>' + N.profileForm(N.obDraft || {}, 'onboarding') + '</div>';
  };
  N.views.obBasics = function () {
    var staples = N.FOODS.filter(function (f) { return f.staple; });
    var sel = N.obBasics || ['sale', 'olio_evo', 'pepe', 'zucchero', 'origano', 'basilico', 'prezzemolo', 'aceto'];
    N.obBasics = sel;
    return '<div class="gate-wrap"><p class="eyebrow">Passo 2 di 3</p><h1>Cosa hai sempre in casa?</h1><p class="muted">Le basi contano come disponibili per tutte le ricette. Puoi cambiarle quando vuoi.</p>' +
      '<div class="chips">' + staples.map(function (f) { return chip(f.name, sel.indexOf(f.id) !== -1, 'data-a="ob-basic" data-id="' + f.id + '"'); }).join('') + '</div>' +
      '<div class="gate-actions"><button class="btn primary block" data-a="ob-finish">Continua</button></div></div>';
  };
  N.views.obNotify = function () {
    var st = N.push.status();
    var body = st === 'ios'
      ? '<p class="muted">Su iPhone le notifiche funzionano con Nutrimi aperta dalla schermata Home: tocca Condividi → <b>Aggiungi alla schermata Home</b>, poi apri l’app da lì. Te le chiederemo al primo avvio.</p>'
      : st === 'unsupported' ? '<p class="muted">Questo browser non supporta le notifiche. Le scadenze restano evidenziate nella schermata Oggi.</p>'
        : st === 'denied' ? '<p class="muted">Le notifiche sono bloccate per Nutrimi nelle impostazioni del telefono. Puoi riattivarle da lì quando vuoi.</p>'
          : '<p class="muted">Alle 9:00 ti avvisiamo quando un prodotto scade entro 3 giorni, con una ricetta per usarlo. Al tocco il telefono ti chiede il permesso: scegli <b>Consenti</b>.</p>';
    var can = st === 'off';
    return '<div class="gate-wrap"><p class="eyebrow">Passo 3 di 3</p><h1>Avvisi di scadenza</h1>' +
      '<div class="card notify-demo"><span class="nd-ic">' + N.IC.bell + '</span><div><b>Zucchine scade domani</b><p class="muted small">Consumale presto. Prova: Frittata di zucchine e menta.</p></div></div>' + body +
      '<div class="gate-actions">' + (can ? '<button class="btn primary block" data-a="ob-notify">Attiva le notifiche</button><button class="btn ghost block" data-a="ob-done">Più tardi</button>'
        : '<button class="btn primary block" data-a="ob-done">Inizia a usare Nutrimi</button>') + '</div></div>';
  };
  function logo() { return '<span class="logo"><span class="logo-mark" aria-hidden="true"></span>Nutrimi</span>'; }
  N.logo = logo;

  /* ====================================================== FOGLI (bottom sheet) */
  N.sheets = {};

  /* nutrizione dettagliata */
  N.nutrTable = function (n, grams, title) {
    var k = grams / 100, insat = Math.max(0, n.f - n.sat);
    var row = function (l, val, u, cls) { return '<tr class="' + (cls || '') + '"><th>' + l + '</th><td class="num">' + (u === 'kcal' ? N.f0(val) : N.f1(val)) + ' ' + u + '</td></tr>'; };
    var en = n.p * 4 + n.c * 4 + n.f * 9 || 1;
    var h = '<div class="nutr"><div class="nutr-head"><span>' + (title || 'Valori nutrizionali') + '</span><span class="num">' + (grams === 100 ? 'per 100 g' : N.f0(grams) + ' g') + '</span></div>' +
      '<div class="split" aria-hidden="true"><i class="p" style="flex:' + (n.p * 4 / en).toFixed(3) + '"></i><i class="c" style="flex:' + (n.c * 4 / en).toFixed(3) + '"></i><i class="f" style="flex:' + (n.f * 9 / en).toFixed(3) + '"></i></div>' +
      '<table>' + row('Energia', n.kcal * k, 'kcal', 'strong') + row('Proteine', n.p * k, 'g', 'k-p') + row('Carboidrati', n.c * k, 'g', 'k-c') + row('di cui zuccheri', n.s * k, 'g', 'sub') +
      row('Grassi', n.f * k, 'g', 'k-f') + row('insaturi (grassi buoni)', insat * k, 'g', 'sub') + row('saturi', n.sat * k, 'g', 'sub') + row('Fibre', n.fib * k, 'g') + '</table>';
    h += '<div class="vits">' + N.VIT.map(function (v) {
      var val = (n[v[0]] || 0) * k, pct = val / N.NRV[v[0]] * 100;
      return '<div class="vit"><span class="vit-l">' + v[0] + '</span><span class="vit-v num">' + N.f1(val) + ' ' + v[2] + '</span><span class="vit-bar"><i style="width:' + Math.min(100, pct).toFixed(0) + '%"></i></span><span class="vit-p num">' + N.f0(pct) + '%</span></div>';
    }).join('') + '<p class="muted tiny">% sul valore di riferimento giornaliero UE. Valori medi indicativi.</p></div></div>';
    return h;
  };

  /* dettaglio ricetta */
  N.sheets.recipe = function (ctx) {
    var r = N.recipeById(ctx.id); if (!r) return '';
    var sv = ctx.servings, ev = N.evaluate(r, sv), people = N.eaters(), conf = N.recipeConflicts(ev, people), me = N.me();
    var showTot = ctx.view === 'tot', n = showTot ? ev.tot : ev.per;
    var h = '<div class="sh-head"><p class="eyebrow">' + (r.tag || []).map(function (t) { return { colazione: 'Colazione', primo: 'Primo', secondo: 'Secondo', unico: 'Piatto unico', vegetariana: 'Vegetariana', vegana: 'Vegana' }[t] || t; }).join(' · ') + '</p>' +
      '<h2>' + esc(r.t) + '</h2><p class="muted small">' + N.IC.clock + ' ' + r.min + ' minuti · ' + (r.imported ? 'Fonte: ' + esc(r.src) : 'Ricetta Nutrimi') + '</p></div>';
    h += '<div class="ctl"><span class="ctl-l">Porzioni</span>' + stepper(sv, 'r-serv', 1, 6) + '</div>';
    if (conf.length) h += conflictBadges(conf);
    if (me && N.targets(me)) {
      var t = N.targets(me).meal, d = ev.per.kcal - t.kcal, zone = N.fitZone(d / t.kcal, me.goal)[0];
      h += '<div class="goalbox"><div><span class="eyebrow">Il tuo pasto ideale</span><b class="num">' + N.f0(t.kcal) + ' kcal · ' + N.f0(t.p) + ' g prot.</b></div><div><span class="eyebrow">Una porzione</span><b class="num">' + N.f0(ev.per.kcal) + ' kcal · ' + N.f0(ev.per.p) + ' g prot.</b></div>' +
        '<p class="small">' + (zone === 'good' ? 'In linea con il tuo obiettivo.' : d > 0 ? 'Sopra di ' + N.f0(d) + ' kcal: valuta una porzione più piccola di carboidrati o condimento.' : 'Sotto di ' + N.f0(-d) + ' kcal: puoi aggiungere un contorno o una fonte proteica.') + '</p></div>';
    }
    h += '<h3 class="group">Ingredienti per ' + sv + (sv === 1 ? ' porzione' : ' porzioni') + '</h3><ul class="ing">' + ev.lines.map(function (l) {
      var icon = l.status === 'ok' ? '<i class="st ok">' + N.IC.check + '</i>' : l.status === 'partial' ? '<i class="st near">!</i>' : l.status === 'opt' ? '<i class="st opt">–</i>' : '<i class="st no">' + N.IC.x + '</i>';
      var have = l.food.staple ? (l.status === 'ok' ? 'in casa' : 'non in casa') : l.have === Infinity ? 'in casa' : l.have > 0 ? 'ne hai ' + N.qty(l.have, l.food.id) : 'non in dispensa';
      if (l.expired) have = (l.have > 0 && l.have !== Infinity ? have + ' · ' : '') + '<b class="t-bad">scaduto, non conteggiato</b>';
      else if (l.soon != null && l.status !== 'missing') have += ' · <b class="t-soon">' + (l.soon === 0 ? 'scade oggi' : l.soon === 1 ? 'scade domani' : 'scade tra ' + l.soon + ' gg') + '</b>';
      return '<li class="' + l.status + (l.expired ? ' has-exp' : '') + '">' + icon + '<span class="ing-n">' + esc(l.food.name) + (l.opt ? ' <em>facoltativo</em>' : '') + '</span><span class="ing-q num">' + N.qty(l.need, l.food.id) + '<em>' + have + '</em></span></li>';
    }).join('') + '</ul>';
    var missingLines = ev.lines.filter(function (l) { return l.status === 'missing' || l.status === 'partial' || l.status === 'staple'; });
    if (missingLines.length) h += '<button class="btn ghost block" data-a="r-missing">' + N.IC.cart + 'Aggiungi i mancanti alla spesa (' + missingLines.length + ')</button>';
    h += '<div class="seg small-seg"><button class="' + (showTot ? '' : 'on') + '" data-a="r-view" data-v="per">A porzione</button><button class="' + (showTot ? 'on' : '') + '" data-a="r-view" data-v="tot">Totale ricetta</button></div>';
    var grams = ev.lines.reduce(function (s, l) { return s + l.per; }, 0) * (showTot ? sv : 1);
    h += N.nutrTable(scaleTo100(n, grams), grams, showTot ? 'Valori per ' + sv + ' porzioni' : 'Valori per porzione');
    if (r.st && r.st.length) h += '<h3 class="group">Preparazione</h3><ol class="steps">' + r.st.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    if (r.url) h += '<a class="btn ghost block" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + N.IC.link + 'Procedimento su ' + esc(r.src) + '</a>';
    h += '<div class="sh-foot"><button class="btn primary block" data-a="r-cook"' + (ev.lines.some(function (l) { return l.status === 'missing' && !l.food.staple; }) ? ' data-warn="1"' : '') + '>Ho cucinato ' + sv + (sv === 1 ? ' porzione' : ' porzioni') + '</button></div>';
    return h;
  };
  function scaleTo100(n, grams) { var o = {}; N.NUTR_KEYS.forEach(function (k) { o[k] = grams ? n[k] / grams * 100 : 0; }); return o; }

  /* conferma "ho cucinato" */
  N.sheets.cook = function (ctx) {
    var r = N.recipeById(ctx.id), sv = ctx.servings, ev = N.evaluate(r, sv);
    var eat = ctx.eaters;
    var h = '<div class="sh-head"><p class="eyebrow">Conferma</p><h2>' + esc(r.t) + '</h2><p class="muted small">Tolgo dalla dispensa le quantità usate per ' + sv + (sv === 1 ? ' porzione' : ' porzioni') + '.</p></div>';
    h += '<ul class="ing">' + ev.lines.filter(function (l) { return !l.opt || l.have > 0; }).map(function (l) {
      var txt;
      if (l.have === Infinity) txt = 'base di casa';
      else if (l.food.staple && l.have <= 0) txt = l.status === 'ok' ? 'base di casa' : 'non in dispensa';
      else if (l.have <= 0) txt = l.expired ? 'scaduto, non usato' : 'non in dispensa';
      else txt = '−' + N.qty(Math.min(l.have, l.need), l.food.id);
      return '<li class="' + (txt === 'non in dispensa' ? 'missing' : 'ok') + '"><span class="ing-n">' + esc(l.food.name) + '</span><span class="ing-q num">' + txt + '</span></li>';
    }).join('') + '</ul>';
    h += '<div class="field"><span>Chi ha mangiato (una porzione a testa nel diario)</span><div class="chips">' + N.S.profiles.map(function (p) {
      return chip(p.name, eat.indexOf(p.id) !== -1, 'data-a="cook-eater" data-id="' + p.id + '"');
    }).join('') + '</div></div>';
    h += '<div class="sh-foot two"><button class="btn ghost" data-a="sheet-back">Annulla</button><button class="btn primary" data-a="cook-confirm">Conferma</button></div>';
    return h;
  };

  /* aggiunta alla lista: quantità */
  N.sheets.shopAdd = function (ctx) {
    var f = N.FOOD[ctx.foodId], conf = N.conflicts({ foodId: f.id, name: f.name }, N.S.profiles);
    var presets = f.pz ? [1, 2, 4, 6].map(function (n) { return [n * f.pz, n + ' pz']; }) : f.staple || f.cat === 'Spezie ed erbe' ? [[50, '50 g'], [100, '100 g'], [250, '250 g'], [500, '500 g']] : [[250, '250 g'], [500, '500 g'], [1000, '1 kg'], [2000, '2 kg']];
    var h = '<div class="sh-head"><p class="eyebrow">' + esc(f.cat) + '</p><h2>' + esc(f.name) + '</h2></div>' + conflictBadges(conf) + alList({ foodId: f.id }) +
      '<div class="field"><span>Quanto ne compri?</span><div class="chips">' + presets.map(function (p) { return chip(p[1], +ctx.grams === p[0], 'data-a="qty-preset" data-g="' + p[0] + '"'); }).join('') + '</div></div>' +
      '<label class="field"><span>Grammi</span><input id="qty-g" type="number" inputmode="numeric" min="1" value="' + (ctx.grams || '') + '"></label>' +
      N.nutrTable(f.n, 100) +
      '<div class="sh-foot"><button class="btn primary block" data-a="shop-add-confirm">Aggiungi alla lista</button></div>';
    return h;
  };

  /* modifica voce della lista */
  N.sheets.shopEdit = function (ctx) {
    var i = N.S.shopping.find(function (x) { return x.id === ctx.id; }); if (!i) return '';
    var conf = N.conflicts(i, N.S.profiles), n = N.itemNutr(i);
    var h = '<div class="sh-head"><p class="eyebrow">Lista della spesa</p><h2>' + esc(i.name) + '</h2>' + (i.brand ? '<p class="muted small">' + esc(i.brand) + '</p>' : '') + '</div>' +
      conflictBadges(conf) + alList(i) +
      '<label class="field"><span>Quantità (g)</span><input id="edit-g" type="number" inputmode="numeric" min="0" value="' + (i.grams || '') + '"></label>' +
      foodMatch(i) + (n ? N.nutrTable(n, 100) : '') +
      '<div class="sh-foot two"><button class="btn danger ghost" data-a="shop-del">' + N.IC.trash + 'Elimina</button><button class="btn primary" data-a="shop-save">Salva</button></div>';
    return h;
  };
  function foodMatch(i) {
    return '<label class="field"><span>Per le ricette conta come</span><select id="edit-food"><option value="">Nessun alimento</option>' +
      N.CATS.map(function (c) {
        var fs = N.FOODS.filter(function (f) { return f.cat === c; }); if (!fs.length) return '';
        return '<optgroup label="' + esc(c) + '">' + fs.map(function (f) { return '<option value="' + f.id + '"' + (i.foodId === f.id ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('') + '</optgroup>';
      }).join('') + '</select></label>';
  }

  /* dettaglio prodotto in dispensa */
  N.sheets.pantryItem = function (ctx) {
    var i = N.S.pantry.find(function (x) { return x.id === ctx.id; }); if (!i) return '';
    var n = N.itemNutr(i), conf = N.conflicts(i, N.S.profiles);
    var srcLabel = i.source === 'off' ? 'Dati da etichetta (Open Food Facts)' : i.source === 'manuale' ? 'Inserito a mano' : 'Valori medi dell’alimento';
    var h = '<div class="sh-head"><p class="eyebrow">' + esc(i.cat || 'Dispensa') + '</p><h2>' + esc(i.name) + '</h2><p class="muted small">' + (i.brand ? esc(i.brand) + ' · ' : '') + srcLabel + (i.code ? ' · EAN ' + esc(i.code) : '') + '</p></div>' +
      expChip(i) + conflictBadges(conf) + alList(i) +
      '<div class="ctl"><span class="ctl-l">Quantità rimasta</span><div class="stepper wide"><button type="button" data-a="pi-step" data-d="-1" aria-label="Meno">' + N.IC.minus + '</button><input id="pi-g" type="number" inputmode="numeric" min="0" value="' + Math.round(i.grams) + '"><span class="unit">g</span><button type="button" data-a="pi-step" data-d="1" aria-label="Più">' + N.IC.plus + '</button></div></div>' +
      N.expField(i.exp) + foodMatch(i) +
      (n ? N.nutrTable(n, 100) + (i.grams ? N.nutrTable(n, i.grams, 'Nella confezione rimasta') : '') : '<p class="muted small">Valori nutrizionali non disponibili: collega il prodotto a un alimento qui sopra.</p>') +
      '<div class="sh-foot two"><button class="btn danger ghost" data-a="pi-del">' + N.IC.trash + 'Elimina</button><button class="btn primary" data-a="pi-save">Salva</button></div>';
    return h;
  };

  /* aggiungi in dispensa */
  N.sheets.pantryAdd = function (ctx) {
    var q = ctx.q || '', res = N.searchFoods(q, 8);
    var h = '<div class="sh-head"><p class="eyebrow">Dispensa</p><h2>Aggiungi un prodotto</h2></div>' +
      '<div class="adder"><label class="search">' + N.IC.search + '<input id="pa-q" data-in="pa-q" autocomplete="off" placeholder="Cerca un alimento" value="' + esc(q) + '"></label>' +
      '<button class="icon-btn solid" data-a="scan" data-for="pantry" aria-label="Scansiona">' + N.IC.scan + '</button></div><div id="pa-res">' + paResults(res, ctx) + '</div>' +
      '<button class="btn ghost block" data-a="manual-open">Inserisci a mano con i valori dell’etichetta</button>';
    return h;
  };
  function paResults(res, ctx) {
    if (ctx.foodId) {
      var f = N.FOOD[ctx.foodId];
      var presets = f.pz ? [1, 2, 4, 6].map(function (n) { return [n * f.pz, n + ' pz']; }) : [[100, '100 g'], [250, '250 g'], [500, '500 g'], [1000, '1 kg']];
      return '<div class="picked"><b>' + esc(f.name) + '</b>' + conflictBadges(N.conflicts({ foodId: f.id, name: f.name }, N.S.profiles)) +
        '<div class="chips">' + presets.map(function (p) { return chip(p[1], +ctx.grams === p[0], 'data-a="pa-preset" data-g="' + p[0] + '"'); }).join('') + '</div>' +
        '<label class="field"><span>Grammi</span><input id="pa-g" type="number" inputmode="numeric" min="1" value="' + (ctx.grams || '') + '"></label>' +
        (f.staple ? '<label class="chip tick"><input type="checkbox" id="pa-always"><span>È una base: sempre in casa</span></label>' : '') +
        N.expField(ctx.exp) +
        '<div class="sh-foot"><button class="btn primary block" data-a="pa-confirm">Metti in dispensa</button></div></div>';
    }
    if (!(ctx.q || '').trim()) return '<p class="muted small">Scrivi il nome di un alimento, scansiona il codice a barre o inserisci i valori a mano.</p>';
    return '<ul class="sugg">' + res.map(function (f) { return '<li><button data-a="pa-pick" data-food="' + f.id + '"><span class="name">' + esc(f.name) + '</span><span class="meta">' + esc(f.cat) + '</span></button></li>'; }).join('') + '</ul>';
  }
  N.renderPaResults = function () { var el = document.getElementById('pa-res'); if (el) el.innerHTML = paResults(N.searchFoods(N.sheetCtx.q || '', 8), N.sheetCtx); };

  /* prodotto manuale */
  N.sheets.manual = function (ctx) {
    var d = ctx.draft || {};
    var fld = function (id, l, val) { return '<label class="field"><span>' + l + '</span><input id="' + id + '" type="number" inputmode="decimal" step="0.1" min="0" value="' + (val != null ? val : '') + '"></label>'; };
    var n = d.n || {};
    var h = '<div class="sh-head"><p class="eyebrow">Dispensa</p><h2>' + (d.code ? 'Prodotto non trovato' : 'Inserimento manuale') + '</h2>' + (d.code ? '<p class="muted small">Il codice ' + esc(d.code) + ' non è nel database di Open Food Facts: copia i valori dall’etichetta.</p>' : '') + '</div>' +
      '<label class="field"><span>Nome del prodotto</span><input id="mn-name" value="' + esc(d.name || '') + '"></label>' +
      '<div class="grid2">' + fld('mn-g', 'Quantità (g)', d.grams) + fld('mn-kcal', 'kcal / 100 g', n.kcal) + fld('mn-p', 'Proteine', n.p) + fld('mn-c', 'Carboidrati', n.c) + fld('mn-s', 'di cui zuccheri', n.s) +
      fld('mn-f', 'Grassi', n.f) + fld('mn-sat', 'di cui saturi', n.sat) + fld('mn-fib', 'Fibre', n.fib) + '</div>' +
      '<div class="field"><span>Allergeni in etichetta</span><div class="chips">' + N.ALLERGENS.map(function (a) {
        return '<label class="chip tick"><input type="checkbox" name="mn-al" value="' + a[0] + '"><span>' + a[1] + '</span></label>';
      }).join('') + '</div></div>' + N.expField(d.exp) + foodMatch({ foodId: d.foodId }) +
      '<p class="form-err" id="mn-err" hidden></p><div class="sh-foot two"><button class="btn ghost" data-a="mn-to-shop">Metti in lista</button><button class="btn primary" data-a="mn-save">Metti in dispensa</button></div>';
    return h;
  };

  /* prodotto scansionato */
  N.sheets.scanned = function (ctx) {
    var p = ctx.product, conf = N.conflicts(p, N.S.profiles);
    var h = '<div class="sh-head"><p class="eyebrow">Codice ' + esc(p.code) + '</p><h2>' + esc(p.name) + '</h2><p class="muted small">' + esc(p.brand || '') + (p.grams ? ' · ' + N.qty(p.grams, p) : '') + '</p></div>' +
      (p.img ? '<img class="prod-img" src="' + esc(p.img) + '" alt="">' : '') +
      (conf.length ? conflictBadges(conf) : '<div class="okbox">' + N.IC.check + 'Nessun allergene segnalato per le persone di casa</div>') + alList(p) +
      '<label class="field"><span>Quantità (g)</span><input id="sc-g" type="number" inputmode="numeric" min="1" value="' + (p.grams || '') + '"></label>' +
      N.expField(p.exp) + foodMatch(p) + N.nutrTable(p.n, 100, 'Valori da etichetta') +
      '<p class="muted tiny">Dati da Open Food Facts, database aperto e collaborativo: in caso di allergie gravi controlla sempre l’etichetta.</p>' +
      '<div class="sh-foot two"><button class="btn ghost" data-a="sc-shop">Metti in lista</button><button class="btn primary" data-a="sc-pantry">Metti in dispensa</button></div>';
    return h;
  };

  /* basi di casa */
  N.sheets.basics = function () {
    var staples = N.FOODS.filter(function (f) { return f.staple; });
    return '<div class="sh-head"><p class="eyebrow">Dispensa</p><h2>Basi di casa</h2><p class="muted small">Tocca per aggiungere o togliere. Le basi non vengono scalate quando cucini.</p></div>' +
      '<div class="chips">' + staples.map(function (f) {
        var on = N.S.pantry.some(function (i) { return i.foodId === f.id && i.always; });
        return chip(f.name, on, 'data-a="basic-toggle" data-id="' + f.id + '"');
      }).join('') + '</div><div class="sh-foot"><button class="btn primary block" data-a="close-sheet">Fatto</button></div>';
  };

  /* conferma generica */
  N.sheets.confirm = function (ctx) {
    return '<div class="sh-head"><h2>' + esc(ctx.title) + '</h2><p class="muted">' + esc(ctx.text) + '</p></div>' +
      '<div class="sh-foot two"><button class="btn ghost" data-a="close-sheet">Annulla</button><button class="btn ' + (ctx.danger ? 'danger' : 'primary') + '" data-a="confirm-yes">' + esc(ctx.yes) + '</button></div>';
  };
})();
