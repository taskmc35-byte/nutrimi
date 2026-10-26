/* Nutrimi — lettura della data di scadenza dalla foto dell'etichetta e notifiche */
(function () {
  var N = window.N;
  var TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

  /* ---------- OCR ---------- */
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise(function (ok, ko) {
      var s = document.createElement('script'); s.src = TESSERACT; s.onload = ok; s.onerror = function () { ko(new Error('Lettura non disponibile senza connessione')); };
      document.head.appendChild(s);
    });
  }
  /* immagine ridimensionata, in scala di grigi e con più contrasto: la data stampata si legge meglio */
  async function prepare(file) {
    var bmp = await createImageBitmap(file);
    var scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    var c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    var x = c.getContext('2d'); x.drawImage(bmp, 0, 0, c.width, c.height);
    var img = x.getImageData(0, 0, c.width, c.height), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      g = Math.max(0, Math.min(255, (g - 128) * 1.6 + 128));
      d[i] = d[i + 1] = d[i + 2] = g;
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  var MON = { GEN: 1, JAN: 1, FEB: 2, MAR: 3, APR: 4, MAG: 5, MAY: 5, GIU: 6, JUN: 6, LUG: 7, JUL: 7, AGO: 8, AUG: 8, SET: 9, SEP: 9, OTT: 10, OCT: 10, NOV: 11, DIC: 12, DEC: 12 };
  function iso(y, m, d) { return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
  function valid(y, m, d) {
    if (y < 100) y += 2000;
    if (m < 1 || m > 12 || d < 1) return null;
    var last = new Date(y, m, 0).getDate(); if (d > last) return null;
    var s = iso(y, m, d), days = N.daysLeft(s);
    return days >= -90 && days <= 365 * 6 ? s : null;
  }
  /* trova tutte le date plausibili nel testo letto */
  N.parseDates = function (text) {
    var t = String(text || '').toUpperCase()
      .replace(/(\d)[OQ](?![A-Z])|(?<![A-Z])[OQ](?=\d)/g, function (m) { return m.replace(/[OQ]/, '0'); })
      .replace(/(\d)[IL|](?![A-Z])|(?<![A-Z])[IL|](?=\d)/g, function (m) { return m.replace(/[IL|]/, '1'); });
    var out = [], m, re;
    re = /(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4}|\d{2})(?!\d)/g;
    while ((m = re.exec(t))) { var a = valid(+m[3], +m[2], +m[1]); if (a) out.push(a); }
    re = /(\d{1,2})\s*(GEN|JAN|FEB|MAR|APR|MAG|MAY|GIU|JUN|LUG|JUL|AGO|AUG|SET|SEP|OTT|OCT|NOV|DIC|DEC)[A-Z]*\.?\s*(\d{4}|\d{2})?(?!\d)/g;
    while ((m = re.exec(t))) {
      var y = m[3] ? +m[3] : new Date().getFullYear(), b = valid(y, MON[m[2]], +m[1]);
      if (b && !m[3] && N.daysLeft(b) < -30) b = valid(y + 1, MON[m[2]], +m[1]);
      if (b) out.push(b);
    }
    if (!out.length) { // mese/anno: "da consumarsi preferibilmente entro fine 05/2027"
      re = /(?:^|[^\d\/.\-])(\d{1,2})\s*[\/.\-]\s*(\d{4})(?!\d)/g;
      while ((m = re.exec(t))) { var mm = +m[1], yy = +m[2]; if (mm >= 1 && mm <= 12) { var c = valid(yy, mm, new Date(yy, mm, 0).getDate()); if (c) out.push(c); } }
    }
    if (!out.length) { // giorno/mese senza anno
      re = /(?:^|[^\d])(\d{1,2})\s*[\/.]\s*(\d{1,2})(?![\d\/.])/g;
      while ((m = re.exec(t))) {
        var yr = new Date().getFullYear(), e = valid(yr, +m[2], +m[1]);
        if (e && N.daysLeft(e) < -30) e = valid(yr + 1, +m[2], +m[1]);
        if (e) out.push(e);
      }
    }
    return out.filter(function (v, i) { return out.indexOf(v) === i; }).sort();
  };
  N.ocrExpiry = async function (file) {
    await loadTesseract();
    var canvas = await prepare(file);
    var res = await window.Tesseract.recognize(canvas, 'eng');
    var dates = N.parseDates(res.data.text);
    return { dates: dates, best: dates.length ? dates[dates.length - 1] : null }; // la scadenza è di solito la data più lontana
  };

  /* ---------- notifiche ---------- */
  var PREF = 'nutrimi:notify', SENT = 'nutrimi:notified';
  function pref() { try { return localStorage.getItem(PREF); } catch (e) { return null; } }
  function setPref(v) { try { if (v) localStorage.setItem(PREF, v); else localStorage.removeItem(PREF); } catch (e) { } }
  function b64ToBytes(b64) {
    var pad = '='.repeat((4 - b64.length % 4) % 4), raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var arr = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i); return arr;
  }
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  /* testo dell'avviso, con la ricetta che usa più prodotti in scadenza */
  N.expiryMessage = function (items) {
    var ids = items.map(function (i) { return i.foodId; }).filter(Boolean);
    var best = null, bestN = 0;
    N.rankRecipes(N.S.settings.servings).forEach(function (e) {
      if (e.blocked) return;
      var n = e.r.ing.filter(function (x) { return ids.indexOf(x[0]) !== -1 && !x[2]; }).length;
      if (n > bestN) { best = e.r; bestN = n; }
    });
    var when = function (i) { var d = N.daysLeft(i.exp); return d === 0 ? 'oggi' : d === 1 ? 'domani' : 'tra ' + d + ' giorni'; };
    var title = items.length === 1 ? items[0].name + ' scade ' + when(items[0]) : items.length + ' prodotti stanno per scadere';
    var body = (items.length === 1 ? 'Consumalo presto.' : items.slice(0, 4).map(function (i) { return i.name + ' (' + when(i) + ')'; }).join(', ') + '.') +
      (best ? ' Prova: ' + best.t + '.' : '');
    return { title: title, body: body };
  };

  async function show(title, body) {
    var opts = { body: body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'nutrimi-scadenze', data: { url: './' } };
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      var reg = await navigator.serviceWorker.ready; return reg.showNotification(title, opts);
    }
    return new Notification(title, opts);
  }

  N.push = {
    status: function () {
      if (window.NUTRIMI_PREVIEW) return 'unsupported';
      if (isIOS && !standalone) return 'ios';
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
      if (Notification.permission === 'denied') return 'denied';
      var p = pref();
      return Notification.permission === 'granted' && p && p !== 'disabled' ? p : 'off';
    },
    /* "off" scelto dalla persona (non riattivare da soli) o mai chiesto */
    disabledByUser: function () { return pref() === 'disabled'; },
    /* attivazione automatica: se il permesso c'è già, iscrive il telefono senza chiedere nulla */
    autoEnable: async function () {
      if (window.NUTRIMI_PREVIEW || !('Notification' in window) || Notification.permission !== 'granted' || pref() === 'disabled') return;
      if (pref() === 'push') return N.push.refresh();
      if (pref() !== 'push' && N.cloud.active) return N.push.enable();
      if (!pref()) setPref('local');
    },
    /* ripete l'iscrizione sul server (es. dopo un nuovo accesso) */
    refresh: async function () {
      try {
        if (!N.cloud.active || !('PushManager' in window)) return;
        var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
        if (sub) await N.cloud.savePush(sub.toJSON()); else await N.push.enable();
      } catch (e) { console.error(e); }
    },
    enable: async function () {
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') return N.push.status();
      var key = (window.NUTRIMI_CONFIG || {}).vapidPublicKey;
      if (N.cloud.active && key && 'PushManager' in window) {
        try {
          var reg = await navigator.serviceWorker.ready;
          var sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
          await N.cloud.savePush(sub.toJSON());
          setPref('push'); return 'push';
        } catch (e) { console.error(e); }
      }
      setPref('local'); N.push.checkLocal(); return 'local';
    },
    disable: async function () {
      try {
        var reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
        if (sub) { if (N.cloud.active) await N.cloud.removePush(sub.endpoint); await sub.unsubscribe(); }
      } catch (e) { }
      setPref('disabled');
    },
    test: function () {
      var soon = N.soonItems();
      var m = soon.length ? N.expiryMessage(soon) : { title: 'Notifiche attive', body: 'Ti avviseremo 3 giorni prima che un prodotto scada.' };
      return show(m.title, m.body);
    },
    /* senza account online: avviso all'apertura dell'app, una volta per prodotto */
    checkLocal: function () {
      if (N.push.status() !== 'local') return;
      var sent = {}; try { sent = JSON.parse(localStorage.getItem(SENT) || '{}'); } catch (e) { }
      var items = N.soonItems().filter(function (i) { return !sent[i.id + ':' + i.exp]; });
      if (!items.length) return;
      var m = N.expiryMessage(items);
      show(m.title, m.body).then(function () {
        items.forEach(function (i) { sent[i.id + ':' + i.exp] = N.today(); });
        try { localStorage.setItem(SENT, JSON.stringify(sent)); } catch (e) { }
      }, function () { });
    }
  };
})();
