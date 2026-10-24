/* Nutrimi — scanner codici a barre + Open Food Facts */
(function () {
  var N = window.N;
  var ZXING = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';

  var OFF_AL = {
    'en:gluten': 'glutine', 'en:crustaceans': 'crostacei', 'en:eggs': 'uova', 'en:fish': 'pesce', 'en:peanuts': 'arachidi',
    'en:soybeans': 'soia', 'en:milk': 'latte', 'en:nuts': 'frutta_guscio', 'en:celery': 'sedano', 'en:mustard': 'senape',
    'en:sesame-seeds': 'sesamo', 'en:sulphur-dioxide-and-sulphites': 'solfiti', 'en:lupin': 'lupini', 'en:molluscs': 'molluschi'
  };
  function mapTags(tags) {
    var out = [];
    (tags || []).forEach(function (t) { var a = OFF_AL[t]; if (a && out.indexOf(a) === -1) out.push(a); });
    return out;
  }
  function num(x) { x = parseFloat(x); return isFinite(x) ? x : 0; }

  N.off = {
    lookup: async function (code) {
      var url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code) +
        '.json?fields=code,product_name,product_name_it,brands,product_quantity,product_quantity_unit,quantity,nutriments,allergens_tags,traces_tags,labels_tags,image_front_small_url,categories_tags';
      var res = await fetch(url);
      if (!res.ok && res.status !== 404) throw new Error('Open Food Facts non risponde (' + res.status + ')');
      var j = await res.json();
      if (!j || j.status !== 1 || !j.product) return null;
      var p = j.product, nm = p.nutriments || {};
      var kcal = nm['energy-kcal_100g'] != null ? num(nm['energy-kcal_100g']) : num(nm['energy_100g']) / 4.184;
      var name = (p.product_name_it || p.product_name || '').trim() || ('Prodotto ' + code);
      var al = mapTags(p.allergens_tags), traces = mapTags(p.traces_tags);
      var lactoseFree = (p.labels_tags || []).some(function (l) { return /lactose-free|senza-lattosio|no-lactose/.test(l); });
      var food = N.guessFood(name + ' ' + (p.categories_tags || []).slice(-2).join(' ').replace(/[a-z]{2}:/g, '').replace(/-/g, ' '));
      var grams = num(p.product_quantity);
      var unit = (p.product_quantity_unit || '').toLowerCase();
      if (unit === 'kg' || unit === 'l') grams *= 1000; else if (unit === 'cl') grams *= 10;
      return {
        code: code, name: name, brand: (p.brands || '').split(',')[0].trim(), grams: grams || 0,
        n: {
          kcal: kcal, p: num(nm.proteins_100g), c: num(nm.carbohydrates_100g), s: num(nm.sugars_100g), f: num(nm.fat_100g),
          sat: num(nm['saturated-fat_100g']), fib: num(nm.fiber_100g),
          A: num(nm['vitamin-a_100g']) * 1e6, C: num(nm['vitamin-c_100g']) * 1000, D: num(nm['vitamin-d_100g']) * 1e6,
          E: num(nm['vitamin-e_100g']) * 1000, B12: num(nm['vitamin-b12_100g']) * 1e6
        },
        al: al, traces: traces, lat: al.indexOf('latte') !== -1 && !lactoseFree,
        img: p.image_front_small_url || null, foodId: food ? food.id : null, cat: food ? food.cat : 'Altro', source: 'off'
      };
    }
  };

  /* ---------- fotocamera ---------- */
  var stream = null, reader = null, raf = null, done = null;
  N.scanner = {
    open: function (onCode) {
      done = onCode;
      var el = document.getElementById('scanner');
      el.hidden = false;
      document.getElementById('scan-msg').textContent = 'Inquadra il codice a barre del prodotto';
      document.getElementById('scan-code').value = '';
      start().catch(function (e) {
        document.getElementById('scan-msg').textContent = 'Fotocamera non disponibile qui: scrivi il codice a barre (le cifre sotto le barre).';
        document.getElementById('scan-video').hidden = true;
      });
    },
    close: function () {
      stop();
      document.getElementById('scanner').hidden = true;
    },
    submit: function (code) {
      code = String(code || '').replace(/\D/g, '');
      if (code.length < 8) { document.getElementById('scan-msg').textContent = 'Il codice deve avere almeno 8 cifre.'; return; }
      var cb = done; N.scanner.close(); if (cb) cb(code);
    }
  };

  async function start() {
    var video = document.getElementById('scan-video');
    video.hidden = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera');
    if ('BarcodeDetector' in window) {
      var det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = stream; await video.play();
      var tick = async function () {
        if (!stream) return;
        try { var codes = await det.detect(video); if (codes && codes[0]) { N.scanner.submit(codes[0].rawValue); return; } } catch (e) { }
        raf = setTimeout(tick, 250);
      };
      tick();
      return;
    }
    if (!window.ZXing) {
      await new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = ZXING; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
    }
    reader = new window.ZXing.BrowserMultiFormatReader();
    await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, function (result) {
      if (result) N.scanner.submit(result.getText());
    });
  }
  function stop() {
    clearTimeout(raf);
    if (reader) { try { reader.reset(); } catch (e) { } reader = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    var v = document.getElementById('scan-video'); if (v) v.srcObject = null;
  }
})();
