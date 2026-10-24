/* Nutrimi — database alimenti generici.
   Valori medi indicativi per 100 g di parte edibile (fonti di riferimento: tabelle CREA e USDA).
   Colonne: kcal, proteine, carboidrati, di cui zuccheri, grassi, di cui saturi, fibre,
            vit. A (µg), vit. C (mg), vit. D (µg), vit. E (mg), vit. B12 (µg)
   Allergeni: i 14 allergeni UE (Reg. 1169/2011).
   Opzioni: pz = grammi per pezzo, lat = contiene lattosio, staple = base di casa, alias = altri nomi */
(function () {
  function F(id, name, cat, kcal, p, c, s, f, sat, fib, A, C, D, E, B12, al, o) {
    return Object.assign({
      id: id, name: name, cat: cat,
      n: { kcal: kcal, p: p, c: c, s: s, f: f, sat: sat, fib: fib, A: A, C: C, D: D, E: E, B12: B12 },
      al: al ? al.split('|') : [], alias: []
    }, o || {});
  }
  var CP = 'Cereali e pasta', CA = 'Carne e salumi', PE = 'Pesce', LU = 'Latticini e uova', LE = 'Legumi e tofu',
      VE = 'Verdura', FR = 'Frutta', SE = 'Frutta secca e semi', CO = 'Condimenti', SP = 'Spezie ed erbe', DI = 'Dispensa';

  window.NUTRIMI_FOODS = [
    // Cereali, pasta, pane, tuberi
    F('pasta_secca', 'Pasta di semola', CP, 353, 12.5, 71, 3.5, 1.5, 0.3, 3, 0, 0, 0, 0.1, 0, 'glutine', { alias: ['pasta', 'spaghetti', 'penne', 'fusilli', 'rigatoni', 'linguine', 'mezze maniche', 'paccheri', 'tagliatelle secche', 'bucatini', 'farfalle', 'orecchiette', 'ditalini', 'ditali', 'tubetti', 'maccheroni', 'mafalde'] }),
    F('pasta_integrale', 'Pasta integrale', CP, 340, 13, 64, 3, 2.5, 0.4, 8, 0, 0, 0, 0.3, 0, 'glutine', { alias: ['spaghetti integrali', 'penne integrali'] }),
    F('riso', 'Riso', CP, 350, 7, 79, 0.2, 0.6, 0.2, 1.3, 0, 0, 0, 0.1, 0, '', { alias: ['riso carnaroli', 'riso arborio', 'riso vialone nano', 'riso originario'] }),
    F('riso_basmati', 'Riso basmati', CP, 352, 8, 78, 0.3, 0.8, 0.2, 1.5, 0, 0, 0, 0.1, 0, '', { alias: ['basmati', 'riso jasmine', 'riso thai'] }),
    F('riso_integrale', 'Riso integrale', CP, 350, 7.5, 74, 0.7, 2.7, 0.5, 3.5, 0, 0, 0, 0.6, 0, '', { alias: ['riso venere', 'riso rosso'] }),
    F('farro', 'Farro', CP, 335, 15, 67, 1, 2.5, 0.4, 7, 0, 0, 0, 0.5, 0, 'glutine', { alias: ['farro perlato'] }),
    F('orzo_perlato', 'Orzo perlato', CP, 320, 10, 71, 0.8, 1.2, 0.3, 9, 1, 0, 0, 0.1, 0, 'glutine', { alias: ['orzo'] }),
    F('quinoa', 'Quinoa', CP, 368, 14, 64, 0, 6, 0.7, 7, 1, 0, 0, 2.4, 0, ''),
    F('cous_cous', 'Cous cous', CP, 360, 12.5, 72, 0.5, 1.5, 0.3, 5, 0, 0, 0, 0.1, 0, 'glutine', { alias: ['couscous', 'cuscus'] }),
    F('pane', 'Pane comune', CP, 270, 9, 55, 2, 1.5, 0.3, 3, 0, 0, 0, 0.3, 0, 'glutine', { alias: ['pane casereccio', 'pane raffermo', 'baguette', 'pane pugliese', 'ciabatta', 'pagnotta', 'fette di pane'] }),
    F('pane_integrale', 'Pane integrale', CP, 250, 10, 46, 3, 2.5, 0.5, 7, 0, 0, 0, 0.4, 0, 'glutine'),
    F('farina_00', 'Farina 00', CP, 340, 11, 73, 1.5, 1, 0.2, 2.2, 0, 0, 0, 0.1, 0, 'glutine', { alias: ['farina', 'farina tipo 00', 'farina 0', 'farina di grano tenero'] }),
    F('fiocchi_avena', "Fiocchi d'avena", CP, 370, 13, 60, 1, 7, 1.2, 10, 0, 0, 0, 0.7, 0, 'glutine', { alias: ['avena', 'fiocchi di avena', "fiocchi d'avena"] }),
    F('pangrattato', 'Pangrattato', CP, 395, 13, 72, 6, 5, 1, 4.5, 0, 0, 0, 0.3, 0, 'glutine', { alias: ['pan grattato', 'pane grattugiato'] }),
    F('gnocchi', 'Gnocchi di patate', CP, 150, 3.5, 33, 1, 0.3, 0.1, 2, 0, 3, 0, 0.1, 0, 'glutine|uova'),
    F('patate', 'Patate', CP, 77, 2, 17, 0.8, 0.1, 0, 2.2, 0, 20, 0, 0, 0, '', { pz: 150, alias: ['patata', 'patate novelle'] }),
    F('patate_dolci', 'Patate dolci', CP, 86, 1.6, 20, 4.2, 0.1, 0, 3, 709, 2.4, 0, 0.3, 0, '', { pz: 250, alias: ['patata dolce', 'patata americana'] }),

    // Carne e salumi
    F('petto_pollo', 'Petto di pollo', CA, 110, 23, 0, 0, 1.5, 0.4, 0, 6, 0, 0.1, 0.2, 0.3, '', { alias: ['pollo', 'fesa di pollo', 'filetti di pollo', 'bocconcini di pollo'] }),
    F('cosce_pollo', 'Cosce di pollo', CA, 170, 19, 0, 0, 10, 2.8, 0, 20, 0, 0.1, 0.3, 0.4, '', { alias: ['sovracosce di pollo', 'fusi di pollo'] }),
    F('tacchino', 'Fesa di tacchino', CA, 107, 24, 0, 0, 1.2, 0.4, 0, 0, 0, 0, 0.1, 0.4, '', { alias: ['tacchino', 'petto di tacchino'] }),
    F('manzo_magro', 'Manzo magro', CA, 130, 21, 0, 0, 5, 2, 0, 0, 0, 0.1, 0.4, 2, '', { alias: ['manzo', 'fesa di manzo', 'girello', 'filetto di manzo', 'bistecca', 'straccetti di manzo'] }),
    F('macinato_manzo', 'Macinato di manzo', CA, 200, 19, 0, 0, 13.5, 5.5, 0, 0, 0, 0.1, 0.2, 2.3, '', { alias: ['carne macinata', 'macinato', 'carne trita', 'trito di manzo', 'macinato misto'] }),
    F('maiale_lonza', 'Lonza di maiale', CA, 145, 21, 0, 0, 6.5, 2.3, 0, 2, 0, 0.5, 0.2, 0.6, '', { alias: ['maiale', 'arista', 'braciola di maiale', 'filetto di maiale'] }),
    F('salsiccia', 'Salsiccia', CA, 300, 15, 0.5, 0.5, 26, 10, 0, 0, 0, 0.6, 0.3, 1, '', { alias: ['salsicce', 'luganega'] }),
    F('prosciutto_crudo', 'Prosciutto crudo', CA, 250, 26, 0, 0, 16, 5.5, 0, 0, 0, 0.6, 0.3, 0.9, '', { alias: ['crudo'] }),
    F('prosciutto_cotto', 'Prosciutto cotto', CA, 135, 19, 1, 1, 6, 2, 0, 0, 0, 0.4, 0.1, 0.6, '', { alias: ['cotto'] }),
    F('bresaola', 'Bresaola', CA, 151, 32, 0, 0, 2.6, 1, 0, 0, 0, 0, 0.1, 1.6, ''),
    F('pancetta', 'Pancetta', CA, 360, 14, 0, 0, 34, 12, 0, 0, 0, 0.5, 0.3, 0.7, '', { alias: ['guanciale', 'pancetta a cubetti', 'dadini di pancetta'] }),

    // Pesce
    F('salmone', 'Salmone', PE, 185, 20, 0, 0, 12, 2.5, 0, 15, 0, 11, 1.5, 3.2, 'pesce', { alias: ['filetto di salmone', 'trancio di salmone'] }),
    F('merluzzo', 'Merluzzo', PE, 82, 18, 0, 0, 0.7, 0.1, 0, 12, 1, 1, 0.6, 1, 'pesce', { alias: ['filetti di merluzzo', 'nasello', 'baccalà dissalato', 'platessa'] }),
    F('tonno_scatola', 'Tonno al naturale', PE, 110, 25, 0, 0, 1, 0.3, 0, 15, 0, 3, 0.3, 2.5, 'pesce', { alias: ['tonno', 'tonno in scatola'] }),
    F('tonno_olio', "Tonno sott'olio sgocciolato", PE, 190, 25, 0, 0, 10, 1.8, 0, 20, 0, 3, 1, 2.2, 'pesce', { alias: ["tonno sott'olio", "tonno all'olio d'oliva"] }),
    F('orata', 'Orata', PE, 120, 20, 0, 0, 4.5, 1, 0, 10, 0, 7, 0.5, 2, 'pesce', { pz: 350, alias: ['branzino', 'spigola', 'filetti di orata'] }),
    F('sgombro', 'Sgombro', PE, 205, 19, 0, 0, 14, 3.3, 0, 50, 0, 16, 1.5, 8.7, 'pesce', { alias: ['maccarello'] }),
    F('alici', 'Alici', PE, 130, 20, 0, 0, 5, 1.3, 0, 15, 0, 1.7, 0.6, 0.6, 'pesce', { alias: ['acciughe', 'filetti di alici', 'filetti di acciughe', 'acciughe sott\'olio'] }),
    F('gamberi', 'Gamberi', PE, 85, 18, 0.5, 0, 1, 0.2, 0, 0, 0, 0, 1.3, 1.1, 'crostacei', { alias: ['gamberetti', 'mazzancolle', 'code di gambero', 'gamberoni'] }),
    F('cozze', 'Cozze', PE, 86, 12, 3.5, 0, 2.2, 0.4, 0, 48, 8, 0, 0.6, 12, 'molluschi', { alias: ['vongole', 'frutti di mare'] }),
    F('calamari', 'Calamari', PE, 92, 15.6, 3, 0, 1.4, 0.4, 0, 10, 5, 0, 1.2, 1.3, 'molluschi', { alias: ['totani', 'seppie', 'anelli di calamaro', 'polpo'] }),

    // Latticini e uova
    F('uova', 'Uova', LU, 143, 12.5, 0.7, 0.4, 9.5, 3.1, 0, 160, 0, 2, 1.1, 0.9, 'uova', { pz: 60, alias: ['uovo', 'uova medie', 'uova grandi', 'tuorli', 'tuorlo'] }),
    F('albume', 'Albume', LU, 52, 11, 0.7, 0.7, 0.2, 0, 0, 0, 0, 0, 0, 0.1, 'uova', { alias: ['albumi', 'albume d\'uovo', 'chiare d\'uovo'] }),
    F('latte_ps', 'Latte parzialmente scremato', LU, 46, 3.4, 4.9, 4.9, 1.6, 1, 0, 18, 1, 0.1, 0.04, 0.4, 'latte', { lat: 1, alias: ['latte', 'latte scremato'] }),
    F('latte_intero', 'Latte intero', LU, 64, 3.3, 4.8, 4.8, 3.6, 2.3, 0, 40, 1, 0.1, 0.1, 0.4, 'latte', { lat: 1 }),
    F('yogurt_greco', 'Yogurt greco 0%', LU, 57, 10, 3.6, 3.6, 0.4, 0.1, 0, 2, 0, 0, 0, 0.75, 'latte', { lat: 1, alias: ['yogurt greco'] }),
    F('yogurt_bianco', 'Yogurt bianco intero', LU, 66, 3.8, 4.7, 4.7, 3.5, 2.2, 0, 27, 1, 0.1, 0.1, 0.4, 'latte', { lat: 1, alias: ['yogurt', 'yogurt naturale'] }),
    F('parmigiano', 'Parmigiano Reggiano', LU, 392, 33, 0, 0, 28, 18, 0, 270, 0, 0.5, 0.3, 1.2, 'latte', { alias: ['parmigiano', 'grana', 'grana padano', 'formaggio grattugiato'] }),
    F('pecorino', 'Pecorino', LU, 390, 26, 0, 0, 32, 20, 0, 300, 0, 0.5, 0.6, 1.5, 'latte', { alias: ['pecorino romano'] }),
    F('mozzarella', 'Mozzarella', LU, 250, 18.5, 0.7, 0.7, 19.5, 12.5, 0, 180, 0, 0.3, 0.2, 0.9, 'latte', { lat: 1, pz: 125, alias: ['fiordilatte', 'fior di latte', 'mozzarella di bufala', 'bocconcini di mozzarella'] }),
    F('ricotta', 'Ricotta vaccina', LU, 146, 9, 3.5, 0.3, 10.9, 7, 0, 120, 0, 0.2, 0.1, 0.3, 'latte', { lat: 1, alias: ['ricotta'] }),
    F('feta', 'Feta', LU, 265, 14, 4, 4, 21, 15, 0, 125, 0, 0.4, 0.2, 1.7, 'latte', { lat: 1 }),
    F('fiocchi_latte', 'Fiocchi di latte', LU, 100, 12, 3, 3, 4.5, 2.8, 0, 37, 0, 0.1, 0.1, 0.4, 'latte', { lat: 1, alias: ['cottage cheese', 'fiocchi di formaggio'] }),
    F('burro', 'Burro', LU, 750, 0.8, 0.6, 0.6, 83, 51, 0, 680, 0, 1.5, 2.3, 0.2, 'latte', { lat: 1 }),
    F('panna', 'Panna da cucina', LU, 337, 2.3, 3.4, 3.4, 35, 22, 0, 400, 0, 0.6, 0.9, 0.2, 'latte', { lat: 1, alias: ['panna', 'panna fresca', 'panna liquida'] }),

    // Legumi e tofu
    F('ceci_cotti', 'Ceci lessati', LE, 120, 7, 16, 1, 2.4, 0.3, 6, 1, 1, 0, 0.3, 0, '', { alias: ['ceci', 'ceci in scatola', 'ceci precotti'] }),
    F('ceci_secchi', 'Ceci secchi', LE, 334, 21, 47, 3, 6, 0.6, 14, 3, 4, 0, 0.8, 0, ''),
    F('cannellini', 'Fagioli cannellini lessati', LE, 100, 7, 14, 0.3, 0.5, 0.1, 6, 0, 0, 0, 0.9, 0, '', { alias: ['fagioli cannellini', 'cannellini', 'fagioli bianchi'] }),
    F('borlotti', 'Fagioli borlotti lessati', LE, 105, 7.5, 15, 0.5, 0.5, 0.1, 6.5, 0, 1, 0, 0.9, 0, '', { alias: ['fagioli borlotti', 'borlotti', 'fagioli'] }),
    F('lenticchie_secche', 'Lenticchie secche', LE, 325, 23, 51, 1.8, 1.5, 0.2, 14, 2, 4, 0, 0.5, 0, '', { alias: ['lenticchie', 'lenticchie rosse', 'lenticchie decorticate'] }),
    F('lenticchie_cotte', 'Lenticchie lessate', LE, 116, 9, 17, 1.8, 0.4, 0.1, 8, 0, 1.5, 0, 0.1, 0, '', { alias: ['lenticchie in scatola', 'lenticchie precotte'] }),
    F('piselli', 'Piselli', LE, 76, 5.5, 7, 4, 0.4, 0.1, 5, 38, 18, 0, 0.1, 0, '', { alias: ['piselli surgelati', 'pisellini'] }),
    F('tofu', 'Tofu', LE, 120, 13, 1, 0.5, 7, 1, 0.3, 0, 0, 0, 0, 0, 'soia'),

    // Verdura
    F('pomodori', 'Pomodori', VE, 19, 1, 3.5, 3, 0.2, 0, 1.2, 42, 21, 0, 0.5, 0, '', { pz: 120, alias: ['pomodoro', 'pomodori ramati', 'pomodori maturi', 'pomodori cuore di bue', 'pomodori san marzano'] }),
    F('pomodorini', 'Pomodorini', VE, 20, 1.2, 3, 3, 0.4, 0, 1.2, 45, 25, 0, 0.5, 0, '', { alias: ['pomodori ciliegino', 'pomodori datterini', 'datterini', 'ciliegini', 'pomodorini pachino'] }),
    F('passata', 'Passata di pomodoro', VE, 35, 1.5, 6, 5, 0.2, 0, 1.2, 30, 10, 0, 1.3, 0, '', { alias: ['passata', 'salsa di pomodoro', 'sugo di pomodoro', 'polpa di pomodoro'] }),
    F('pelati', 'Pomodori pelati', VE, 22, 1.2, 3.5, 3, 0.2, 0, 1, 30, 9, 0, 0.6, 0, '', { alias: ['pelati'] }),
    F('concentrato', 'Concentrato di pomodoro', VE, 80, 4, 13, 12, 0.5, 0.1, 4, 76, 22, 0, 4.3, 0, '', { alias: ['doppio concentrato di pomodoro'] }),
    F('zucchine', 'Zucchine', VE, 17, 1.3, 1.4, 1.4, 0.1, 0, 1.2, 10, 18, 0, 0.1, 0, '', { pz: 200, alias: ['zucchina', 'zucchine romanesche'] }),
    F('melanzane', 'Melanzane', VE, 20, 1, 2.6, 2.6, 0.1, 0, 2.6, 1, 2, 0, 0.3, 0, '', { pz: 300, alias: ['melanzana'] }),
    F('peperoni', 'Peperoni', VE, 26, 1, 4.2, 4.2, 0.3, 0, 1.9, 157, 127, 0, 1.6, 0, '', { pz: 200, alias: ['peperone', 'peperoni rossi', 'peperoni gialli', 'peperone rosso', 'peperone giallo'] }),
    F('cipolla', 'Cipolle', VE, 28, 1, 5.7, 4.5, 0.1, 0, 1.1, 0, 5, 0, 0, 0, '', { pz: 100, alias: ['cipolla', 'cipolla bianca', 'cipolla dorata', 'scalogno', 'cipollotto', 'porro'] }),
    F('cipolla_rossa', 'Cipolle rosse', VE, 30, 1, 6, 4.5, 0.1, 0, 1.4, 0, 6, 0, 0, 0, '', { pz: 100, alias: ['cipolla rossa', 'cipolla di tropea', 'cipolle di tropea'] }),
    F('aglio', 'Aglio', VE, 120, 6, 23, 1, 0.6, 0.1, 2, 0, 31, 0, 0.1, 0, '', { pz: 5, alias: ['spicchio d\'aglio', 'spicchi d\'aglio', 'spicchio di aglio', 'spicchi di aglio'] }),
    F('carote', 'Carote', VE, 35, 1, 7.6, 4.7, 0.2, 0, 2.8, 835, 6, 0, 0.7, 0, '', { pz: 80, alias: ['carota'] }),
    F('sedano', 'Sedano', VE, 16, 0.7, 3, 1.4, 0.2, 0, 1.6, 22, 3, 0, 0.3, 0, 'sedano', { pz: 40, alias: ['costa di sedano', 'coste di sedano', 'gambo di sedano'] }),
    F('spinaci', 'Spinaci', VE, 23, 2.9, 3.6, 0.4, 0.4, 0.1, 2.2, 469, 28, 0, 2, 0, '', { alias: ['spinaci freschi', 'spinaci surgelati', 'spinacini', 'bietole', 'bieta', 'erbette'] }),
    F('broccoli', 'Broccoli', VE, 34, 2.8, 7, 1.7, 0.4, 0, 2.6, 31, 89, 0, 0.8, 0, '', { alias: ['broccolo', 'cime di rapa', 'friarielli'] }),
    F('cavolfiore', 'Cavolfiore', VE, 25, 2, 5, 2, 0.3, 0, 2, 0, 48, 0, 0.1, 0, '', { pz: 600, alias: ['cavolo romanesco', 'cavolfiore romanesco'] }),
    F('cavolo_nero', 'Cavolo nero', VE, 49, 4.3, 8.8, 2.3, 0.9, 0.1, 3.6, 241, 120, 0, 1.5, 0, '', { alias: ['cavolo riccio', 'verza', 'cavolo verza', 'cavolo cappuccio'] }),
    F('lattuga', 'Insalata', VE, 15, 1.4, 2.2, 0.8, 0.2, 0, 1.3, 370, 9, 0, 0.2, 0, '', { alias: ['lattuga', 'insalata verde', 'iceberg', 'misticanza', 'songino', 'valeriana', 'radicchio', 'insalata mista', 'lattughino'] }),
    F('rucola', 'Rucola', VE, 25, 2.6, 3.7, 2, 0.7, 0.1, 1.6, 119, 15, 0, 0.4, 0, ''),
    F('funghi', 'Funghi champignon', VE, 22, 3, 3.3, 2, 0.3, 0, 1, 0, 2, 0.2, 0, 0.04, '', { alias: ['funghi', 'champignon', 'funghi porcini', 'funghi misti', 'funghi cardoncelli'] }),
    F('cetrioli', 'Cetrioli', VE, 15, 0.7, 3.6, 1.7, 0.1, 0, 0.5, 5, 3, 0, 0, 0, '', { pz: 250, alias: ['cetriolo'] }),
    F('zucca', 'Zucca', VE, 26, 1, 6.5, 2.8, 0.1, 0, 0.5, 426, 9, 0, 1.1, 0, '', { alias: ['zucca delica', 'zucca mantovana', 'polpa di zucca'] }),
    F('fagiolini', 'Fagiolini', VE, 31, 1.8, 7, 3.3, 0.2, 0, 2.7, 35, 12, 0, 0.4, 0, '', { alias: ['cornetti', 'tegoline'] }),
    F('carciofi', 'Carciofi', VE, 47, 3.3, 10.5, 1, 0.2, 0, 5.4, 1, 12, 0, 0.2, 0, '', { pz: 180, alias: ['carciofo', 'cuori di carciofo'] }),
    F('olive', 'Olive', VE, 145, 1, 3.8, 0, 15, 2, 3.3, 20, 0, 0, 3.8, 0, '', { alias: ['olive verdi', 'olive nere', 'olive taggiasche', 'olive di gaeta', 'olive denocciolate'] }),
    F('capperi', 'Capperi', VE, 23, 2.4, 4.9, 0.4, 0.9, 0.2, 3.2, 7, 4, 0, 0.9, 0, '', { alias: ['capperi sotto sale', 'capperi sott\'aceto'] }),

    // Frutta
    F('mele', 'Mele', FR, 52, 0.3, 14, 10, 0.2, 0, 2.4, 3, 5, 0, 0.2, 0, '', { pz: 180, alias: ['mela'] }),
    F('banane', 'Banane', FR, 89, 1.1, 23, 12, 0.3, 0.1, 2.6, 3, 9, 0, 0.1, 0, '', { pz: 120, alias: ['banana'] }),
    F('arance', 'Arance', FR, 47, 0.9, 12, 9, 0.1, 0, 2.4, 11, 53, 0, 0.2, 0, '', { pz: 200, alias: ['arancia', 'succo d\'arancia', 'mandarini', 'clementine'] }),
    F('limoni', 'Limoni', FR, 29, 1.1, 9, 2.5, 0.3, 0, 2.8, 1, 53, 0, 0.2, 0, '', { pz: 100, alias: ['limone', 'succo di limone', 'scorza di limone', 'lime'] }),
    F('pere', 'Pere', FR, 57, 0.4, 15, 10, 0.1, 0, 3.1, 1, 4, 0, 0.1, 0, '', { pz: 180, alias: ['pera'] }),
    F('kiwi', 'Kiwi', FR, 61, 1.1, 15, 9, 0.5, 0, 3, 4, 93, 0, 1.5, 0, '', { pz: 80 }),
    F('frutti_bosco', 'Frutti di bosco', FR, 50, 1, 12, 6, 0.3, 0, 5, 3, 25, 0, 0.9, 0, '', { alias: ['mirtilli', 'lamponi', 'fragole', 'more', 'frutti rossi'] }),
    F('avocado', 'Avocado', FR, 160, 2, 8.5, 0.7, 14.7, 2.1, 6.7, 7, 10, 0, 2.1, 0, '', { pz: 200 }),

    // Frutta secca e semi
    F('noci', 'Noci', SE, 654, 15, 14, 2.6, 65, 6, 6.7, 1, 1.3, 0, 0.7, 0, 'frutta_guscio', { alias: ['gherigli di noce', 'noci sgusciate'] }),
    F('mandorle', 'Mandorle', SE, 579, 21, 22, 4.4, 50, 3.8, 12.5, 0, 0, 0, 25.6, 0, 'frutta_guscio', { alias: ['mandorle pelate', 'farina di mandorle', 'nocciole'] }),
    F('pistacchi', 'Pistacchi', SE, 560, 20, 28, 7.7, 45, 5.9, 10.6, 26, 5.6, 0, 2.9, 0, 'frutta_guscio', { alias: ['pistacchio', 'granella di pistacchio'] }),
    F('pinoli', 'Pinoli', SE, 673, 13.7, 13, 3.6, 68, 4.9, 3.7, 1, 0.8, 0, 9.3, 0, ''),
    F('semi_sesamo', 'Semi di sesamo', SE, 573, 17.7, 23, 0.3, 50, 7, 11.8, 0, 0, 0, 0.3, 0, 'sesamo', { alias: ['sesamo', 'tahina', 'tahini'] }),
    F('burro_arachidi', "Burro d'arachidi", SE, 588, 25, 20, 9, 50, 10, 6, 0, 0, 0, 9, 0, 'arachidi', { alias: ['arachidi', 'burro di arachidi'] }),

    // Condimenti
    F('olio_evo', "Olio extravergine d'oliva", CO, 884, 0, 0, 0, 100, 14, 0, 0, 0, 0, 14, 0, '', { staple: 1, alias: ['olio', 'olio evo', 'olio extravergine', "olio extra vergine d'oliva", "olio d'oliva", 'olio di oliva', "olio extravergine di oliva"] }),
    F('aceto', 'Aceto di vino', CO, 19, 0, 0.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'solfiti', { staple: 1, alias: ['aceto', 'aceto bianco', 'aceto di mele'] }),
    F('aceto_balsamico', 'Aceto balsamico', CO, 88, 0.5, 17, 15, 0, 0, 0, 0, 0, 0, 0, 0, 'solfiti', { staple: 1, alias: ['balsamico', 'glassa di aceto balsamico'] }),
    F('sale', 'Sale', CO, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', { staple: 1, alias: ['sale fino', 'sale grosso', 'sale marino'] }),
    F('zucchero', 'Zucchero', CO, 400, 0, 100, 100, 0, 0, 0, 0, 0, 0, 0, 0, '', { staple: 1, alias: ['zucchero semolato', 'zucchero di canna', 'zucchero a velo'] }),
    F('miele', 'Miele', CO, 304, 0.3, 82, 82, 0, 0, 0.2, 0, 0.5, 0, 0, 0, '', { alias: ['miele millefiori', 'miele di acacia'] }),
    F('senape', 'Senape', CO, 66, 4, 6, 3, 3.5, 0.2, 3, 2, 1.5, 0, 0.3, 0, 'senape', { staple: 1 }),
    F('salsa_soia', 'Salsa di soia', CO, 53, 8, 4.9, 0.4, 0.6, 0.1, 0.8, 0, 0, 0, 0, 0, 'soia|glutine', { staple: 1, alias: ['salsa di soia', 'shoyu', 'soia'] }),
    F('brodo', 'Brodo vegetale', CO, 6, 0.3, 0.6, 0.4, 0.2, 0.1, 0, 10, 0, 0, 0, 0, 'sedano', { staple: 1, alias: ['brodo', 'dado', 'dado vegetale', 'brodo di carne', 'brodo di pollo', 'granulare per brodo'] }),
    F('vino_bianco', 'Vino bianco (per cucinare)', CO, 82, 0.1, 2.6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 'solfiti', { staple: 1, alias: ['vino bianco', 'vino bianco secco', 'vino rosso', 'vino'] }),

    // Spezie ed erbe
    F('pepe', 'Pepe nero', SP, 251, 10, 64, 0.6, 3.3, 1.4, 25, 27, 0, 0, 1, 0, '', { staple: 1, alias: ['pepe', 'pepe macinato', 'pepe in grani'] }),
    F('peperoncino', 'Peperoncino', SP, 282, 12, 50, 10, 14, 2.5, 35, 1483, 1, 0, 30, 0, '', { staple: 1, alias: ['peperoncino secco', 'peperoncino fresco', 'peperoncino in polvere'] }),
    F('origano', 'Origano secco', SP, 265, 9, 69, 4, 4.3, 1.6, 42.5, 85, 2.3, 0, 18, 0, '', { staple: 1, alias: ['origano'] }),
    F('basilico', 'Basilico', SP, 23, 3.2, 2.7, 0.3, 0.6, 0, 1.6, 264, 18, 0, 0.8, 0, '', { staple: 1, alias: ['foglie di basilico'] }),
    F('prezzemolo', 'Prezzemolo', SP, 36, 3, 6, 0.9, 0.8, 0.1, 3.3, 421, 133, 0, 0.8, 0, '', { staple: 1, alias: ['prezzemolo tritato', 'erba cipollina', 'aneto', 'coriandolo'] }),
    F('rosmarino', 'Rosmarino', SP, 131, 3.3, 20, 0, 5.9, 2.8, 14, 146, 22, 0, 0, 0, '', { staple: 1, alias: ['rametto di rosmarino', 'aghi di rosmarino'] }),
    F('timo', 'Timo', SP, 101, 5.6, 24, 0, 1.7, 0.5, 14, 238, 160, 0, 0, 0, '', { staple: 1, alias: ['maggiorana', 'salvia', 'alloro', 'foglie di alloro'] }),
    F('menta', 'Menta', SP, 70, 3.8, 15, 0, 0.9, 0.2, 8, 212, 31, 0, 0, 0, '', { staple: 1, alias: ['foglie di menta'] }),
    F('curcuma', 'Curcuma', SP, 312, 9.7, 67, 3.2, 3.3, 1.8, 22.7, 0, 0.7, 0, 4.4, 0, '', { staple: 1, alias: ['curry', 'curry in polvere', 'cumino', 'zafferano'] }),
    F('paprika', 'Paprika', SP, 282, 14, 54, 10, 13, 2, 35, 2463, 1, 0, 29, 0, '', { staple: 1, alias: ['paprika dolce', 'paprika affumicata'] }),
    F('cannella', 'Cannella', SP, 247, 4, 81, 2.2, 1.2, 0.3, 53, 15, 3.8, 0, 2.3, 0, '', { staple: 1, alias: ['cannella in polvere', 'noce moscata', 'vaniglia'] }),
    F('zenzero', 'Zenzero', SP, 80, 1.8, 18, 1.7, 0.8, 0.2, 2, 0, 5, 0, 0.3, 0, '', { staple: 1, alias: ['zenzero fresco', 'zenzero in polvere'] }),

    // Dispensa
    F('cacao', 'Cacao amaro', DI, 228, 20, 58, 1.8, 14, 8, 37, 0, 0, 0, 0.1, 0, '', { staple: 1, alias: ['cacao amaro in polvere', 'cacao'] }),
    F('cioccolato_fondente', 'Cioccolato fondente', DI, 550, 7.8, 46, 24, 43, 24, 11, 2, 0, 0, 0.6, 0.3, '', { alias: ['cioccolato', 'cioccolato fondente 70%'] }),
    F('lievito', 'Lievito', DI, 100, 0, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', { staple: 1, alias: ['lievito per dolci', 'lievito di birra', 'lievito istantaneo', 'bicarbonato'] })
  ];
})();
