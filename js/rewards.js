/* Nutrimi — punti premio.
   Con l'account online i punti li assegna il database (funzioni nm_award, nm_buy, nm_wallet in supabase/rewards.sql):
   il telefono chiede, il server controlla regole, limiti giornalieri e doppioni.
   Senza account le stesse regole valgono in locale, su questo dispositivo. */
(function () {
  var N = window.N;
  var LKEY = 'nutrimi:rewards:v1';
  var RULES = { scan: [5, 10], cook: [15, 3], rescue: [20, 5], diary: [3, 1], waste: [0, 0], week: [50, 0] };
  var LABEL = { scan: 'Prodotto scansionato', cook: 'Hai cucinato', rescue: 'Salvato dalla scadenza', diary: 'Diario di oggi', streak: 'Serie di giorni', week: 'Settimana senza sprechi' };

  var R = N.rewards = { w: { balance: 0, today: 0, total: 0, streak: 0, owned: [], recent: [] }, LABEL: LABEL };
  var ITEMS = {}; (window.NUTRIMI_STORE || []).forEach(function (i) { ITEMS[i.id] = i; });
  R.item = function (id) { return ITEMS[id]; };
  R.owns = function (id) { var it = ITEMS[id]; return !!it && (it.price === 0 || R.w.owned.indexOf(id) !== -1); };
  function online() { return !!(N.cloud && N.cloud.active && N.cloud.sb); }

  /* ---------- registro locale ---------- */
  function loadL() { try { var l = JSON.parse(localStorage.getItem(LKEY)); if (l && l.ev) return l; } catch (e) { } return { ev: [], owned: [] }; }
  function saveL(l) { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch (e) { } }
  function addDays(d, n) { var x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return N.isoDate ? N.isoDate(x) : x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  function streakOf(ev) {
    var days = {}; ev.forEach(function (e) { if (e.kind === 'diary') days[e.day] = 1; });
    var d = N.today(); if (!days[d]) d = addDays(d, -1);
    var n = 0; while (days[d]) { n++; d = addDays(d, -1); }
    return n;
  }
  function walletL(l) {
    var t = N.today(), sum = function (a) { return a.reduce(function (s, e) { return s + (e.points || 0); }, 0); };
    var spent = l.owned.reduce(function (s, o) { return s + (o.price || 0); }, 0);
    return {
      balance: sum(l.ev) - spent, today: sum(l.ev.filter(function (e) { return e.day === t; })), total: sum(l.ev), streak: streakOf(l.ev),
      owned: l.owned.map(function (o) { return o.id; }),
      recent: l.ev.filter(function (e) { return e.points > 0; }).slice(-15).reverse()
    };
  }
  function mondayOf(d) { var x = new Date(d + 'T12:00:00'), wd = (x.getDay() + 6) % 7; return addDays(d, -wd); }
  function awardLocal(kind, ref) {
    var l = loadL(), t = N.today(), rule = RULES[kind], ok = true, why = null;
    if (!rule) return { ok: false, reason: 'tipo non valido' };
    if (kind === 'diary') ref = t;
    if (kind === 'week') {
      var ws = addDays(mondayOf(t), -7), we = addDays(ws, 6);
      ref = 'W' + ws;
      var active = l.ev.some(function (e) { return e.day >= ws && e.day <= we && (e.kind === 'cook' || e.kind === 'diary'); });
      var waste = l.ev.some(function (e) { return e.day >= ws && e.day <= we && e.kind === 'waste'; });
      ok = active && !waste; if (!ok) why = 'non idonea';
    }
    if (kind === 'rescue') {
      var exp = String(ref).split(':')[1], dl = exp ? N.daysLeft(exp) : null;
      ok = dl != null && dl >= 0 && dl <= 3 && l.ev.some(function (e) { return e.day === t && (e.kind === 'cook' || e.kind === 'diary'); });
      if (!ok) why = 'non era in scadenza';
    }
    if (ok && l.ev.some(function (e) { return e.kind === kind && e.ref === ref; })) { ok = false; why = 'già ottenuto'; }
    if (ok && rule[1] && l.ev.filter(function (e) { return e.kind === kind && e.day === t; }).length >= rule[1]) { ok = false; why = 'limite di oggi raggiunto'; }
    var got = 0, bonus = 0;
    if (ok) {
      l.ev.push({ kind: kind, ref: ref, points: rule[0], day: t, at: Date.now() }); got = rule[0];
      if (kind === 'diary') {
        var s = streakOf(l.ev);
        bonus = s === 3 ? 10 : s === 7 ? 30 : s === 14 ? 60 : s >= 30 && s % 30 === 0 ? 150 : 0;
        if (bonus) l.ev.push({ kind: 'streak', ref: t, points: bonus, day: t, at: Date.now() });
      }
      saveL(l);
    }
    R.w = walletL(l);
    return { ok: ok, kind: kind, points: got, bonus: bonus, streak: R.w.streak, balance: R.w.balance, reason: why };
  }

  /* ---------- API ---------- */
  R.refresh = async function () {
    if (online()) {
      try {
        var r = await N.cloud.sb.rpc('nm_wallet');
        if (r.error) throw r.error;
        R.w = r.data; R.ready = true;
      } catch (e) { console.warn('premi', e); }
    } else { R.w = walletL(loadL()); R.ready = true; }
    return R.w;
  };

  var chain = Promise.resolve();
  R.award = function (kind, ref, quiet) {
    chain = chain.then(async function () {
      var res;
      if (online()) {
        try {
          if (N.cloud.idle) await N.cloud.idle(); // prima arrivano al server pasto e dispensa, poi il server li controlla
          var r = await N.cloud.sb.rpc('nm_award', { p_kind: kind, p_ref: String(ref || '') });
          if (r.error) throw r.error;
          res = r.data;
          R.w.balance = res.balance; R.w.streak = res.streak;
          if (res.ok) { R.w.today += res.points + (res.bonus || 0); R.w.total += res.points + (res.bonus || 0); }
        } catch (e) { console.warn('premi', e); return { ok: false }; }
      } else res = awardLocal(kind, ref);
      if (res.ok && (res.points || res.bonus) && !quiet) celebrate(res);
      if (res.ok && (res.points || res.bonus)) N.softRender();
      return res;
    });
    return chain;
  };
  /* premio dopo che è passato il tempo per "Annulla" */
  var later = {};
  R.later = function (key, fn, ms) {
    clearTimeout(later[key]);
    later[key] = setTimeout(function () { delete later[key]; fn(); }, ms || 5300);
  };
  R.cancel = function (key) { clearTimeout(later[key]); delete later[key]; };

  /* dopo un pasto: cucinato → diario → ingredienti salvati dalla scadenza */
  R.afterMeal = function (key, cooked, mealId, used) {
    R.later(key, function () {
      if (cooked) R.award('cook', mealId);
      R.award('diary', N.today());
      var seen = {};
      (used || []).forEach(function (row) {
        if (!row.exp || seen[row.id]) return; seen[row.id] = 1;
        var dl = N.daysLeft(row.exp); if (dl != null && dl >= 0 && dl <= 3) R.award('rescue', row.id + ':' + row.exp);
      });
    });
  };

  R.buy = async function (id) {
    var it = ITEMS[id]; if (!it) return { ok: false, reason: 'Oggetto non disponibile' };
    if (R.owns(id)) return { ok: true, already: true };
    if (online()) {
      var r = await N.cloud.sb.rpc('nm_buy', { p_item: id });
      if (r.error) return { ok: false, reason: r.error.message };
      if (r.data.ok) { R.w.balance = r.data.balance; if (R.w.owned.indexOf(id) === -1) R.w.owned.push(id); }
      return r.data;
    }
    var l = loadL(), w = walletL(l);
    if (w.balance < it.price) return { ok: false, balance: w.balance, reason: 'Punti insufficienti' };
    l.owned.push({ id: id, price: it.price, at: Date.now() }); saveL(l); R.w = walletL(l);
    return { ok: true, balance: R.w.balance };
  };

  /* ---------- festa per i punti ---------- */
  function celebrate(res) {
    var el = document.getElementById('reward-pop');
    if (!el) { el = document.createElement('div'); el.id = 'reward-pop'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    var main = res.points ? '+' + res.points + ' punti' : '', extra = res.bonus ? 'Serie di ' + res.streak + ' giorni: +' + res.bonus : '';
    el.innerHTML = '<span class="rp-ic">' + N.IC.star + '</span><span class="rp-t"><b>' + (main || ('+' + res.bonus + ' punti')) + '</b><small>' +
      N.esc(extra || LABEL[res.kind] || '') + '</small></span>';
    el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('in'); }, 2600);
    try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) { }
  }
  R.celebrate = celebrate;
})();
