/* Nutrimi — configurazione.
   Lascia vuoti i due valori per usare l'app solo su questo telefono (dati salvati nel browser).
   Per l'account online condiviso incolla qui i dati del tuo progetto Supabase
   (Supabase → Project Settings → API): "Project URL" e la chiave "anon public".
   La chiave anon è pensata per stare nel codice del sito: i dati sono protetti dalle regole del database. */
window.NUTRIMI_CONFIG = {
  supabaseUrl: 'https://sgkwudyqizncipqnjuhk.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna3d1ZHlxaXpuY2lwcW5qdWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NzM5OTgsImV4cCI6MjEwODQ0OTk5OH0.t4FgZIhX6i27qaUqxfs-FXcrGKHMU7ahLRwb44rNLl0',
  // Notifiche ad app chiusa: chiave pubblica VAPID (vedi README, sezione Notifiche)
  vapidPublicKey: 'BF1v4MavaRkRD0yyumNrfqlR0JmiNjO7hkXFVIcNIvbcfpx8sXQdWoZe6ewtlQR0uSFat_NZCvxw4_IdcOlEo2k'
};
