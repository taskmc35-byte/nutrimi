/* Nutrimi — configurazione.
   Lascia vuoti i due valori per usare l'app solo su questo telefono (dati salvati nel browser).
   Per l'account online condiviso incolla qui i dati del tuo progetto Supabase
   (Supabase → Project Settings → API): "Project URL" e la chiave "anon public".
   La chiave anon è pensata per stare nel codice del sito: i dati sono protetti dalle regole del database. */
window.NUTRIMI_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  // Notifiche ad app chiusa: chiave pubblica VAPID (vedi README, sezione Notifiche)
  vapidPublicKey: ''
};
