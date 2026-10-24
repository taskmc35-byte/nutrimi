/* Nutrimi — account online e sincronizzazione (Supabase) */
(function () {
  var N = window.N;
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

  function loadScript(src) {
    return new Promise(function (ok, ko) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { ko(new Error('Impossibile caricare ' + src)); };
      document.head.appendChild(s);
    });
  }

  var C = N.cloud = { active: false, sb: null, user: null, hid: null, household: null, channel: null };

  C.configured = function () {
    var c = window.NUTRIMI_CONFIG || {};
    return !!(c.supabaseUrl && c.supabaseAnonKey && !window.NUTRIMI_PREVIEW);
  };

  C.init = async function () {
    if (!window.supabase) await loadScript(LIB);
    var c = window.NUTRIMI_CONFIG;
    C.sb = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    var res = await C.sb.auth.getSession();
    C.user = res.data.session ? res.data.session.user : null;
    C.sb.auth.onAuthStateChange(function (ev, session) {
      var before = C.user && C.user.id;
      C.user = session ? session.user : null;
      if (ev === 'SIGNED_OUT' || (before && !C.user)) { C.stop(); N.boot(); }
    });
    return C.user;
  };

  C.signIn = async function (email, password) {
    var r = await C.sb.auth.signInWithPassword({ email: email, password: password });
    if (r.error) throw r.error; C.user = r.data.user; return C.user;
  };
  C.signUp = async function (email, password) {
    var r = await C.sb.auth.signUp({ email: email, password: password, options: { emailRedirectTo: location.origin + location.pathname } });
    if (r.error) throw r.error;
    C.user = r.data.session ? r.data.user : null;
    return { user: C.user, needsConfirm: !r.data.session };
  };
  C.signOut = async function () { C.stop(); await C.sb.auth.signOut(); };

  C.loadHousehold = async function () {
    var r = await C.sb.from('household_members').select('household_id, households(id, name, invite_code)').eq('user_id', C.user.id).limit(1);
    if (r.error) throw r.error;
    var row = r.data && r.data[0];
    C.hid = row ? row.household_id : null;
    C.household = row ? row.households : null;
    return C.hid;
  };
  C.createHousehold = async function (name) {
    var r = await C.sb.rpc('create_household', { p_name: name || 'Casa' });
    if (r.error) throw r.error; return C.loadHousehold();
  };
  C.joinHousehold = async function (code) {
    var r = await C.sb.rpc('join_household', { p_code: String(code || '').trim().toUpperCase() });
    if (r.error) throw r.error; return C.loadHousehold();
  };

  C.pull = async function () {
    for (var i = 0; i < N.TABLES.length; i++) {
      var t = N.TABLES[i];
      var r = await C.sb.from(t).select('id, data').eq('household_id', C.hid);
      if (r.error) throw r.error;
      N.S[t] = r.data.map(function (x) { return Object.assign({}, x.data, { id: x.id }); });
    }
    var rr = await C.sb.from('recipes').select('id, data, source_url, source_name').eq('active', true).limit(2000);
    if (!rr.error) N.S.imported = rr.data.map(function (x) { return Object.assign({}, x.data, { id: x.id, url: x.source_url, src: x.source_name || 'Web', imported: true }); });
    var mine = N.S.profiles.find(function (p) { return p.userId === C.user.id; });
    N.S.meId = mine ? mine.id : null;
    N.S.demo = false;
    N.saveLocal();
  };

  C.upsert = function (table, row) {
    N.syncState('saving');
    C.sb.from(table).upsert({ id: row.id, household_id: C.hid, data: row, updated_at: new Date().toISOString() })
      .then(function (r) { N.syncState(r.error ? 'error' : 'ok', r.error); });
  };
  C.remove = function (table, id) {
    N.syncState('saving');
    C.sb.from(table).delete().eq('id', id).then(function (r) { N.syncState(r.error ? 'error' : 'ok', r.error); });
  };

  C.savePush = async function (sub) {
    var r = await C.sb.from('push_subscriptions').upsert({ endpoint: sub.endpoint, user_id: C.user.id, household_id: C.hid, sub: sub });
    if (r.error) throw r.error;
  };
  C.removePush = async function (endpoint) { await C.sb.from('push_subscriptions').delete().eq('endpoint', endpoint); };

  C.subscribe = function () {
    C.unsubscribe();
    var ch = C.sb.channel('casa-' + C.hid);
    N.TABLES.forEach(function (t) {
      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: t, filter: 'household_id=eq.' + C.hid }, function (p) { apply(t, p.new); });
      ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: t, filter: 'household_id=eq.' + C.hid }, function (p) { apply(t, p.new); });
      ch.on('postgres_changes', { event: 'DELETE', schema: 'public', table: t }, function (p) {
        var id = p.old && p.old.id; if (!id) return;
        var before = N.S[t].length;
        N.S[t] = N.S[t].filter(function (r) { return r.id !== id; });
        if (N.S[t].length !== before) { N.saveLocal(); N.softRender(); }
      });
    });
    ch.subscribe();
    C.channel = ch;
  };
  function apply(t, rec) {
    if (!rec || !rec.data) return;
    var row = Object.assign({}, rec.data, { id: rec.id });
    var arr = N.S[t], i = arr.findIndex(function (r) { return r.id === row.id; });
    if (i !== -1 && (arr[i].updatedAt || 0) >= (row.updatedAt || 0)) return; // già aggiornato da questo telefono
    if (i === -1) arr.push(row); else arr[i] = row;
    N.saveLocal(); N.softRender();
  }
  /* chiude solo il canale in tempo reale: la sincronizzazione resta attiva */
  C.unsubscribe = function () { if (C.channel && C.sb) { C.sb.removeChannel(C.channel); C.channel = null; } };
  /* uscita dall'account: chiude il canale e ferma la sincronizzazione */
  C.stop = function () { C.unsubscribe(); C.active = false; };
})();
