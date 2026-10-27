/* Nutrimi — catalogo del negozio premi.
   Ogni oggetto: [id, categoria, nome, prezzo in punti, valore].
   Prezzo 0 = incluso da subito. I prezzi veri li controlla il database (tabella store_items, vedi supabase/rewards.sql). */
(function () {
  var I = [];
  function add(cat, list) { list.forEach(function (x) { I.push({ id: cat + ':' + x[0], cat: cat, v: x[0], name: x[1], price: x[2] || 0 }); }); }

  // pelle: sempre tutte incluse
  add('skin', [['ffdbb4', 'Chiara'], ['edb98a', 'Rosata'], ['d08b5b', 'Ambrata'], ['ae5d29', 'Olivastra'], ['614335', 'Scura']]);
  // capelli e copricapo
  add('top', [
    ['shortFlat', 'Corti lisci'], ['shortRound', 'Corti morbidi'], ['shortWaved', 'Corti mossi'], ['theCaesar', 'Taglio Cesare'], ['sides', 'Stempiato'],
    ['straight01', 'Lunghi lisci'], ['straight02', 'Lunghi con frangia'], ['bob', 'Caschetto'], ['bun', 'Chignon'], ['curly', 'Ricci'],
    ['longButNotTooLong', 'Mezza lunghezza'], ['fro', 'Afro'], ['dreads01', 'Dread corti'], ['hijab', 'Hijab'], ['turban', 'Turbante'],
    ['shortCurly', 'Corti ricci', 40], ['theCaesarAndSidePart', 'Cesare con riga', 40], ['curvy', 'Onde lunghe', 50], ['shavedSides', 'Rasati ai lati', 50],
    ['straightAndStrand', 'Lisci con ciocca', 50], ['dreads', 'Dread lunghi', 50], ['dreads02', 'Dread medi', 50], ['frizzle', 'Crespi', 50], ['shaggy', 'Scalati', 50],
    ['frida', 'Treccia con fiori', 60], ['miaWallace', 'Caschetto anni \'90', 60], ['froBand', 'Afro con fascia', 60], ['bigHair', 'Voluminosi', 70],
    ['shaggyMullet', 'Mullet', 80],
    ['winterHat1', 'Berretto invernale', 70], ['winterHat02', 'Berretto con pompon', 70], ['winterHat03', 'Cuffia a righe', 80], ['winterHat04', 'Cappello con orecchie', 80],
    ['hat', 'Cappello', 90]
  ]);
  add('hairColor', [['2c1b18', 'Nero'], ['4a312c', 'Castano scuro'], ['724133', 'Castano'], ['a55728', 'Ramato'], ['b58143', 'Biondo scuro'], ['d6b370', 'Biondo'],
    ['ecdcbf', 'Platino'], ['e8e1e1', 'Grigio'], ['c93305', 'Rosso fuoco', 40], ['f59797', 'Rosa', 60], ['a7ffc4', 'Menta', 100], ['3d7bff', 'Blu Nutrimi', 100], ['ffc83d', 'Oro Nutrimi', 120]]);
  add('facialHair', [['none', 'Niente'], ['beardLight', 'Barba corta'], ['beardMedium', 'Barba media'], ['beardMajestic', 'Barba maestosa', 80],
    ['moustacheFancy', 'Baffi eleganti', 70], ['moustacheMagnum', 'Baffoni', 70]]);
  // vestiti
  add('clothing', [['shirtCrewNeck', 'Maglietta girocollo'], ['hoodie', 'Felpa'], ['shirtScoopNeck', 'Maglietta scollata', 40], ['shirtVNeck', 'Maglietta a V', 40],
    ['graphicShirt', 'Maglietta con stampa', 60], ['collarAndSweater', 'Maglione con colletto', 80], ['overall', 'Salopette', 90],
    ['blazerAndShirt', 'Giacca e camicia', 120], ['blazerAndSweater', 'Giacca e maglione', 120]]);
  add('clothesColor', [['262e33', 'Antracite'], ['e6e6e6', 'Bianco'], ['3c4f5c', 'Grigio ardesia'], ['65c9ff', 'Azzurro'],
    ['ff5c5c', 'Rosso', 40], ['a7ffc4', 'Menta', 40], ['ffafb9', 'Rosa', 40], ['ff488e', 'Fucsia', 60], ['2a5fd6', 'Blu notte', 50], ['3d7bff', 'Blu Nutrimi', 50], ['ffc83d', 'Giallo Nutrimi', 80]]);
  add('clothingGraphic', [['bear', 'Orsetto'], ['deer', 'Cervo', 40], ['hola', 'Hola', 40], ['cumbia', 'Cumbia', 40], ['pizza', 'Pizza', 50],
    ['skull', 'Teschio', 50], ['skullOutline', 'Teschio stilizzato', 50], ['diamond', 'Diamante', 60]]);
  add('accessories', [['none', 'Niente'], ['prescription01', 'Occhiali da vista'], ['prescription02', 'Occhiali sottili'], ['round', 'Occhiali tondi'],
    ['eyepatch', 'Benda da pirata', 70], ['sunglasses', 'Occhiali da sole', 80], ['wayfarers', 'Occhiali squadrati', 90], ['kurt', 'Occhiali bianchi da sole', 120]]);
  // viso
  add('eyes', [['default', 'Normali'], ['happy', 'Felici'], ['squint', 'Socchiusi', 30], ['side', 'Di lato', 30], ['surprised', 'Sorpresi', 30],
    ['wink', 'Occhiolino', 40], ['eyeRoll', 'Al cielo', 40], ['winkWacky', 'Occhiolino matto', 60], ['hearts', 'Innamorati', 100]]);
  add('eyebrows', [['default', 'Normali'], ['defaultNatural', 'Naturali'], ['flatNatural', 'Dritte', 20], ['raisedExcited', 'Entusiaste', 30],
    ['raisedExcitedNatural', 'Entusiaste naturali', 30], ['upDown', 'Perplesse', 30], ['upDownNatural', 'Perplesse naturali', 30], ['unibrowNatural', 'Monociglio', 50]]);
  add('mouth', [['smile', 'Sorriso'], ['default', 'Tranquilla'], ['serious', 'Seria', 20], ['concerned', 'Pensierosa', 20], ['twinkle', 'Sorrisetto', 30],
    ['tongue', 'Linguaccia', 50], ['eating', 'Sta mangiando', 60]]);
  // sfondo dell'avatar, cornice del profilo, tema dell'app
  add('bg', [['notte', 'Notte'], ['cielo', 'Cielo', 60], ['menta', 'Menta', 60], ['tramonto', 'Tramonto', 100], ['oro', 'Oro', 150]]);
  add('frame', [['none', 'Nessuna'], ['blu', 'Blu neon', 120], ['oro', 'Oro', 150], ['foglia', 'Foglia', 200], ['arcobaleno', 'Arcobaleno', 250]]);
  add('theme', [['classico', 'Classico'], ['smeraldo', 'Smeraldo', 300], ['corallo', 'Corallo', 300], ['viola', 'Viola', 300], ['oro', 'Oro', 400]]);

  window.NUTRIMI_STORE = I;
  window.NUTRIMI_STORE_CATS = [
    ['top', 'Capelli', 'hair'], ['hairColor', 'Colore capelli', 'hair'], ['facialHair', 'Barba', 'smile'], ['skin', 'Pelle', 'smile'],
    ['eyes', 'Occhi', 'smile'], ['eyebrows', 'Sopracciglia', 'smile'], ['mouth', 'Bocca', 'smile'],
    ['clothing', 'Vestiti', 'shirt'], ['clothesColor', 'Colore vestiti', 'shirt'], ['clothingGraphic', 'Stampa', 'shirt'], ['accessories', 'Occhiali', 'glasses'],
    ['bg', 'Sfondo', 'palette'], ['frame', 'Cornice', 'frame'], ['theme', 'Tema app', 'palette']
  ];
  // come si guadagnano i punti (mostrato nella pagina Premi; i valori veri li applica il database)
  window.NUTRIMI_EARN = [
    ['scan', 'Prodotto nuovo in dispensa con il codice a barre', 5, 'Una volta per prodotto, fino a 10 al giorno'],
    ['cook', 'Ho cucinato', 15, 'Fino a 3 volte al giorno'],
    ['rescue', 'Prodotto usato prima che scada', 20, 'Ogni ingrediente che scadeva entro 3 giorni, fino a 5 al giorno'],
    ['diary', 'Almeno un pasto nel diario', 3, 'Una volta al giorno'],
    ['streak', 'Serie di giorni di fila', 10, '+10 a 3 giorni, +30 a 7, +60 a 14, +150 a 30 e poi ogni 30'],
    ['week', 'Settimana senza sprechi in casa', 50, 'Se nessuno ha buttato prodotti e tu hai usato l\'app quella settimana']
  ];
})();
