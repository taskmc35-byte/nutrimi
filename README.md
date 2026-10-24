# Nutrimi

Web app installabile per la spesa, la dispensa e le ricette mediterranee, calibrate sui tuoi obiettivi.

- **Spesa**: lista con controllo allergeni e intolleranze per tutte le persone di casa, scanner dei codici a barre (Open Food Facts).
- **Dispensa**: ogni prodotto spuntato in lista entra in dispensa con la quantità; le "basi di casa" (sale, olio, spezie) sono sempre disponibili.
- **Ricette**: 30 ricette mediterranee incluse + quelle importate ogni settimana. Da 1 a 6 porzioni, ordinate per quello che hai e per il tuo obiettivo.
- **Ho cucinato**: scala dalla dispensa le quantità usate e registra il pasto nel diario di chi ha mangiato.
- **Valori nutrizionali**: kcal, proteine, carboidrati (zuccheri), grassi insaturi e saturi, fibre, vitamine A, C, D, E, B12 per prodotti e ricette.
- **Scadenze**: data inserita a mano o letta dalla foto dell'etichetta. Tre giorni prima arriva una notifica con le ricette che usano il prodotto; da scaduto è segnato in rosso, non conta più come disponibile e le ricette lo segnalano.
- **Profilo**: nome, sesso, età, peso, altezza, allergie, intolleranze, obiettivo (dimagrire, mantenere, massa o valori personalizzati).

## Struttura

```
index.html            app
config.js             collegamento a Supabase (vuoto = solo sul telefono)
css/app.css           stile
js/data/foods.js      alimenti generici con valori nutrizionali e allergeni
js/data/recipes.js    ricettario iniziale
js/core.js            calcoli: nutrizione, allergeni, dispensa, obiettivi
js/cloud.js           account e sincronizzazione Supabase
js/scanner.js         scanner e Open Food Facts
js/expiry.js          lettura della data dalla foto e notifiche
js/views.js, app.js   schermate e azioni
supabase/schema.sql   database
scripts/              aggiornamento settimanale delle ricette
.github/workflows/    esecuzione automatica ogni lunedì
```

Nessun passaggio di build: sono file statici.

---

## 1. Metterla online (GitHub + Vercel)

1. Crea un nuovo repository su GitHub (es. `nutrimi`) e carica tutto il contenuto della cartella, comprese le cartelle nascoste `.github`.
2. Su Vercel: **Add New → Project**, scegli il repository, *Framework Preset*: **Other**, nessun comando di build. **Deploy**.
3. Apri l'indirizzo dal telefono e usa **Condividi → Aggiungi a schermata Home** (iPhone) o **Installa app** (Android).

A questo punto l'app funziona già, con i dati salvati solo su quel telefono.

## 2. Account online condiviso (Supabase)

1. Crea un account gratuito su supabase.com e un nuovo progetto (regione: Europa).
2. **SQL Editor → New query**: incolla tutto `supabase/schema.sql` e premi **Run**.
3. **Authentication → URL Configuration**: in *Site URL* metti l'indirizzo Vercel dell'app.
4. Copia due valori dentro `config.js`. Il *Project URL* lo trovi nel pulsante **Connect** in alto nel progetto. La chiave è in **Project Settings → API Keys**: usa la *anon public* della scheda *Legacy API Keys* oppure la *Publishable key* (`sb_publishable_…`). Poi carica la modifica su GitHub e Vercel ripubblica da solo.
5. Apri l'app: ora chiede di registrarsi. Dopo la registrazione crei la "casa"; in **Profilo** trovi il codice da dare a chi vive con te, che lo inserisce dopo essersi registrato.

Per default Supabase chiede di confermare l'email alla registrazione. Puoi lasciarlo così o disattivarlo in **Authentication → Providers → Email**.

## 3. Ricette aggiornate ogni settimana

Lo script legge dalle pagine delle ricette solo i dati strutturati (titolo, porzioni, tempo, ingredienti e dosi). Il procedimento non viene copiato: l'app mostra il link alla pagina originale. Rispetta il file robots.txt dei siti e aspetta 3 secondi tra una pagina e l'altra.

1. In `scripts/recipe-sources.json` aggiungi i siti da cui importare. Per ogni sito servono la sitemap delle ricette (di solito è indicata in `https://sito/robots.txt` alla riga `Sitemap:`) e un pezzo di indirizzo che distingue le pagine di ricetta (`match`). Metti `"enabled": true`. In alternativa elenca a mano gli indirizzi in `urls`.
2. Prima di attivare un sito leggi le sue condizioni d'uso.
3. Prova in locale senza salvare: `node scripts/sync-recipes.mjs --dry --url https://indirizzo-di-una-ricetta`
4. Su GitHub: **Settings → Secrets and variables → Actions → New repository secret**, aggiungi `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API Keys: la *Secret key* `sb_secret_…` oppure la legacy *service_role*. Questa chiave non va mai in `config.js`).
5. **Actions → Aggiorna ricette → Run workflow** per la prima esecuzione. Poi parte da sola ogni lunedì.

Vengono importate solo ricette di cui Nutrimi riconosce almeno il 75% degli ingredienti, così i valori nutrizionali sono affidabili. Dolci, bevande e conserve sono esclusi. GitHub sospende le esecuzioni programmate se il repository resta senza modifiche per 60 giorni: basta riattivarle da Actions.

## 4. Notifiche di scadenza alle 9:00

Senza account online l'avviso compare quando apri l'app. Con l'account online arriva alle 9:00 anche ad app chiusa, a tutti quelli di casa che hanno attivato le notifiche in **Profilo → Notifiche scadenze**.

Su iPhone le notifiche funzionano solo con l'app aggiunta alla schermata Home (iOS 16.4 o successivo) e aperta da lì.

1. Crea le chiavi di invio (servono una volta sola). Su un computer con Node.js installato, apri il Terminale e scrivi `npx web-push generate-vapid-keys`. Ottieni una *Public Key* e una *Private Key*.
2. Incolla la *Public Key* in `config.js`, alla voce `vapidPublicKey`, e carica la modifica su GitHub.
3. Su GitHub, **Settings → Secrets and variables → Actions**, aggiungi `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` (scrivi `mailto:` seguito dalla tua email). `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono gli stessi della sezione 3.
4. Esegui di nuovo `supabase/schema.sql` nel SQL Editor: aggiunge le tabelle delle notifiche.
5. Prova: **Actions → Avvisi scadenze → Run workflow**, spunta *Invia subito*.

Lo script parte ogni mattina e invia una sola notifica per casa, raggruppando i prodotti che scadono entro 3 giorni. Ogni prodotto viene segnalato una volta. Gli orari di GitHub possono slittare di qualche minuto.

La data dalla foto si legge con il riconoscimento del testo direttamente sul telefono (serve connessione la prima volta). Se trova più date, per esempio produzione e scadenza, ti fa scegliere. Controlla sempre la data proposta.

## Note

- I valori nutrizionali degli alimenti generici sono medie indicative (tabelle CREA/USDA). Per i prodotti scansionati valgono i dati di etichetta di Open Food Facts, database collaborativo: in caso di allergie gravi controlla sempre l'etichetta.
- Il fabbisogno è stimato con la formula Mifflin-St Jeor. Non sostituisce un nutrizionista.
- Profili con peso, allergie e intolleranze sono dati personali sulla salute: se l'app verrà usata da altre persone servono un'informativa privacy e il loro consenso.
