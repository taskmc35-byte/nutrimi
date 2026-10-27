/* Nutrimi — avatar personalizzabile, negozio premi, temi e cornici.
   Disegni: "Avataaars" di Pablo Stanley (libero per uso personale e commerciale), resi con DiceBear (js/vendor/avataaars.js). */
(function () {
  var N = window.N, R = N.rewards, esc = N.esc;
  var STORE = window.NUTRIMI_STORE || [], CATS = window.NUTRIMI_STORE_CATS || [];
  var byCat = {}; STORE.forEach(function (i) { (byCat[i.cat] = byCat[i.cat] || []).push(i); });
  function dayLabel(d) { d = String(d || '').slice(0, 10); if (d === N.today()) return 'Oggi'; var y = new Date(); y.setDate(y.getDate() - 1); var ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); if (d === ys) return 'Ieri'; var p = d.split('-'); return p[2] + '/' + p[1]; }
  function free(cat) { return (byCat[cat] || []).filter(function (i) { return !i.price; }); }

  /* ---------- avatar di partenza, diverso per ogni persona ---------- */
  function hash(s) { var h = 2166136261; s = String(s || ''); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function pick(list, seed, salt) { return list[hash(seed + ':' + salt) % list.length].v; }
  N.avatarDefault = function (p) {
    var seed = (p && (p.id || p.name)) || 'nutrimi', fem = p && p.sex === 'F';
    var tops = fem ? ['straight01', 'straight02', 'bob', 'bun', 'curly', 'longButNotTooLong'] : ['shortFlat', 'shortRound', 'shortWaved', 'theCaesar', 'sides', 'fro'];
    return {
      skin: pick(free('skin'), seed, 's'), top: tops[hash(seed + 't') % tops.length], hairColor: pick(free('hairColor').slice(0, 6), seed, 'h'),
      facialHair: 'none', clothing: pick(free('clothing'), seed, 'c'), clothesColor: pick(free('clothesColor'), seed, 'cc'), clothingGraphic: 'bear',
      accessories: 'none', eyes: 'happy', eyebrows: 'default', mouth: 'smile', bg: 'notte', frame: 'none', theme: 'classico'
    };
  };
  N.avatarOf = function (p) { return Object.assign(N.avatarDefault(p), (p && p.avatar) || {}); };

  /* ---------- disegno ---------- */
  var cache = {};
  function svgFor(a) {
    var key = JSON.stringify(a);
    if (cache[key]) return cache[key];
    if (!window.NAV) return '';
    var o = {
      seed: 'n', style: ['default'], base: ['default'], nose: ['default'],
      skinColor: [a.skin], top: [a.top], topProbability: 100, hairColor: [a.hairColor], hatColor: [a.clothesColor],
      facialHair: [a.facialHair === 'none' ? 'beardLight' : a.facialHair], facialHairProbability: a.facialHair === 'none' ? 0 : 100, facialHairColor: [a.hairColor],
      clothing: [a.clothing], clothesColor: [a.clothesColor], clothingGraphic: [a.clothingGraphic],
      accessories: [a.accessories === 'none' ? 'round' : a.accessories], accessoriesProbability: a.accessories === 'none' ? 0 : 100, accessoriesColor: ['262e33'],
      eyes: [a.eyes], eyebrows: [a.eyebrows], mouth: [a.mouth]
    };
    var s;
    try { s = window.NAV.svg(o).replace('<svg ', '<svg aria-hidden="true" focusable="false" '); }
    catch (e) { console.error('avatar', e); N.avatarError = String(e && e.message || e); return ''; }
    cache[key] = s; return s;
  }
  /* avatar con sfondo e cornice; size in px */
  N.avatarHtml = function (p, size, extra, override) {
    var a = Object.assign(N.avatarOf(p), override || {});
    var svg = svgFor(a);
    var inner = svg || '<b class="av-ini">' + esc(String((p && p.name) || '?').charAt(0).toUpperCase()) + '</b>';
    return '<span class="av bg-' + a.bg + ' fr-' + a.frame + (extra ? ' ' + extra : '') + '" style="--av:' + (size || 40) + 'px"><span class="av-in">' + inner + '</span></span>';
  };

  /* tema dell'app (solo per chi lo ha scelto, su questo dispositivo) */
  N.applyTheme = function () {
    var me = N.me(), t = me ? N.avatarOf(me).theme : 'classico';
    if (t && t !== 'classico' && R.owns('theme:' + t)) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  };

  /* ---------- riquadri nelle schermate ---------- */
  N.rewardStrip = function () {
    var me = N.me(); if (!me) return '';
    var w = R.w;
    return '<button class="card rw-strip" data-a="rewards-open">' + N.avatarHtml(me, 46) +
      '<span class="rw-main"><b class="num">' + N.IC.star + N.f0(w.balance) + ' punti</b><small>' + (w.today ? '+' + N.f0(w.today) + ' oggi' : 'Cucina, scansiona e non sprecare per guadagnarne') + '</small></span>' +
      (w.streak ? '<span class="rw-streak num" title="Giorni di fila">' + N.IC.fire + w.streak + '</span>' : '') +
      '<span class="rw-go">' + N.IC.chev + '</span></button>';
  };
  N.avatarCard = function () {
    var me = N.me(); if (!me) return '';
    var w = R.w;
    return '<section class="card av-card">' + N.avatarHtml(me, 112, 'av-big') +
      '<div class="av-card-r"><p class="eyebrow">Il tuo avatar</p><p class="av-pts num">' + N.IC.star + N.f0(w.balance) + ' <em>punti</em></p>' +
      '<p class="muted small">' + (w.streak ? N.IC.fire + ' ' + w.streak + (w.streak === 1 ? ' giorno' : ' giorni') + ' di fila · ' : '') + 'I punti sono solo tuoi: nessuno li vede.</p>' +
      '<div class="row-actions"><button class="btn primary small" data-a="avatar-edit">' + N.IC.shop + 'Negozio e avatar</button><button class="btn ghost small" data-a="rewards-open">Come guadagnare</button></div></div></section>';
  };

  /* ---------- foglio: punti ---------- */
  N.sheets.rewards = function () {
    var w = R.w, earn = window.NUTRIMI_EARN || [];
    var h = '<p class="eyebrow">Premi</p><h2>I tuoi punti</h2>' +
      '<div class="rw-head"><div><b class="num">' + N.f0(w.balance) + '</b><span>da spendere</span></div><div><b class="num">' + N.f0(w.today) + '</b><span>oggi</span></div><div><b class="num">' + (w.streak || 0) + '</b><span>giorni di fila</span></div></div>' +
      '<button class="btn primary block" data-a="avatar-edit">' + N.IC.shop + 'Apri il negozio</button>' +
      '<h3 class="sh-sub">Come si guadagnano</h3><ul class="plain earn">' + earn.map(function (e) {
        return '<li><span class="earn-pts num">+' + e[2] + '</span><span><b>' + esc(e[1]) + '</b><small>' + esc(e[3]) + '</small></span></li>';
      }).join('') + '</ul>';
    var rec = (w.recent || []).slice(0, 8);
    if (rec.length) h += '<h3 class="sh-sub">Ultimi punti</h3><ul class="plain earn hist">' + rec.map(function (e) {
      return '<li><span class="earn-pts num">+' + e.points + '</span><span><b>' + esc(R.LABEL[e.kind] || e.kind) + '</b><small>' + esc(dayLabel(e.day)) + '</small></span></li>';
    }).join('') + '</ul>';
    h += '<p class="muted small">Il calcolo delle calorie non dà punti: Nutrimi premia chi cucina, chi non spreca e chi è costante.</p>';
    return h;
  };

  /* ---------- foglio: negozio e avatar ---------- */
  var COLOR_CATS = { skin: 1, hairColor: 1, clothesColor: 1 };
  var SWATCH = { bg: { notte: 'linear-gradient(160deg,#17306A,#05080F)', cielo: 'linear-gradient(160deg,#7FB2FF,#2A5FD6)', menta: 'linear-gradient(160deg,#A7FFC4,#2FBF8F)', tramonto: 'linear-gradient(160deg,#FFC83D,#FF6B6B 60%,#6B4FD6)', oro: 'linear-gradient(160deg,#FFE7A3,#FFC83D 50%,#C98A00)' },
    theme: { classico: 'linear-gradient(135deg,#3D7BFF 50%,#FFC83D 50%)', smeraldo: 'linear-gradient(135deg,#2FBF8F 50%,#FFC83D 50%)', corallo: 'linear-gradient(135deg,#FF7A66 50%,#FFC83D 50%)', viola: 'linear-gradient(135deg,#8B6CFF 50%,#FFC83D 50%)', oro: 'linear-gradient(135deg,#FFC83D 50%,#3D7BFF 50%)' } };

  N.sheets.avatarEdit = function (ctx) {
    var me = N.me(); if (!me) return '';
    var a = N.avatarOf(me), cat = ctx.cat || 'top';
    var h = '<div class="ae-top">' + N.avatarHtml(me, 132, 'av-big') +
      '<div><p class="eyebrow">Negozio e avatar</p><h2>' + esc(me.name) + '</h2><p class="ae-pts num">' + N.IC.star + N.f0(R.w.balance) + ' punti</p></div></div>';
    h += '<div class="chips scroll ae-cats">' + CATS.map(function (c) {
      if (c[0] === 'clothingGraphic' && a.clothing !== 'graphicShirt') return '';
      return '<button type="button" class="chip' + (c[0] === cat ? ' on' : '') + '" data-a="ae-cat" data-cat="' + c[0] + '">' + esc(c[1]) + '</button>';
    }).join('') + '</div>';
    var items = byCat[cat] || [];
    h += '<div class="ae-grid' + (COLOR_CATS[cat] || SWATCH[cat] || cat === 'frame' ? ' sw' : '') + '">' + items.map(function (it) {
      var on = a[cat] === it.v, own = R.owns(it.id), prev;
      if (COLOR_CATS[cat]) prev = '<span class="ae-sw" style="background:#' + it.v + '"></span>';
      else if (SWATCH[cat]) prev = '<span class="ae-sw" style="background:' + SWATCH[cat][it.v] + '"></span>';
      else if (cat === 'frame') prev = N.avatarHtml(me, 54, '', { frame: it.v });
      else { var o = {}; o[cat] = it.v; prev = N.avatarHtml(me, 64, 'av-flat', o); }
      return '<button type="button" class="ae-it' + (on ? ' on' : '') + (own ? '' : ' locked') + '" data-a="ae-pick" data-id="' + it.id + '" aria-pressed="' + on + '">' + prev +
        '<span class="ae-name">' + esc(it.name) + '</span>' + (own ? '' : '<span class="ae-price num">' + N.IC.lock + it.price + '</span>') + '</button>';
    }).join('') + '</div>';
    if (ctx.buy) {
      var it = R.item(ctx.buy), can = R.w.balance >= it.price;
      h += '<div class="sh-foot ae-buy"><div><b>' + esc(it.name) + '</b><span class="muted small">' + (can ? 'Costa ' + it.price + ' punti, te ne restano ' + (R.w.balance - it.price) : 'Ti servono ancora ' + (it.price - R.w.balance) + ' punti') + '</span></div>' +
        '<button class="btn primary" data-a="ae-buy" ' + (can ? '' : 'disabled') + '>' + N.IC.star + 'Sblocca per ' + it.price + '</button></div>';
    }
    if (cat === 'theme') h += '<p class="muted small">Il tema cambia i colori dell\'app su questo telefono.</p>';
    return h;
  };

  var A = N.extraActions = N.extraActions || {};
  A['rewards-open'] = function () { R.refresh().then(function () { if (N.sheetCtx && N.sheetCtx._rw) N.refreshSheet(); }); N.openSheet('rewards', { _rw: 1 }); };
  A['avatar-edit'] = function () { N.openSheet('avatarEdit', { cat: 'top' }, true); };
  A['ae-cat'] = function (el) { N.sheetCtx.cat = el.dataset.cat; N.sheetCtx.buy = null; N.refreshSheet(); };
  function equip(id) {
    var it = R.item(id), me = N.me(); if (!it || !me) return;
    me.avatar = Object.assign(N.avatarOf(me), me.avatar || {});
    me.avatar[it.cat] = it.v;
    N.put('profiles', me);
    if (it.cat === 'theme') N.applyTheme();
    N.sheetCtx.buy = null; N.refreshSheet(); N.render();
  }
  A['ae-pick'] = function (el) {
    var id = el.dataset.id;
    if (R.owns(id)) equip(id); else { N.sheetCtx.buy = id; N.refreshSheet(); }
  };
  A['ae-buy'] = async function (el) {
    var id = N.sheetCtx.buy; if (!id) return;
    el.disabled = true;
    var r = await R.buy(id);
    if (!r.ok) { N.toast(r.reason || 'Acquisto non riuscito'); el.disabled = false; return; }
    N.toast(R.item(id).name + ' sbloccato!');
    equip(id);
  };
})();
