// ============================================================
// LUNNAR AI — Komplett helyi AI asszisztens (API nélkül)
// ============================================================

const LUNNAR_AI = {
    // Beszélgetés memória
    history: [],
    MAX_HISTORY: 10,

    // === MÁRKA BECENÉV / SZLENG ===
    brandAliases: {
        'bémvé': 'BMW', 'bemve': 'BMW', 'bömbi': 'BMW', 'bivi': 'BMW',
        'merci': 'Mercedes-Benz', 'mercedes': 'Mercedes-Benz', 'merc': 'Mercedes-Benz', 'benz': 'Mercedes-Benz',
        'audi': 'Audi', 'au': 'Audi',
        'vw': 'Volkswagen', 'volki': 'Volkswagen', 'volkswagen': 'Volkswagen', 'vágén': 'Volkswagen',
        'opel': 'Opel', 'opi': 'Opel',
        'ford': 'Ford',
        'toyo': 'Toyota', 'toyota': 'Toyota',
        'honda': 'Honda',
        'mazda': 'Mazda',
        'suzuki': 'Suzuki', 'suzi': 'Suzuki',
        'skoda': 'Škoda', 'škoda': 'Škoda', 'skóda': 'Škoda',
        'hyundai': 'Hyundai', 'hjundai': 'Hyundai',
        'kia': 'Kia',
        'volvo': 'Volvo',
        'peugeot': 'Peugeot', 'pözsó': 'Peugeot', 'pezsó': 'Peugeot',
        'renault': 'Renault', 'renó': 'Renault', 'reno': 'Renault',
        'citroen': 'Citroën', 'citroën': 'Citroën', 'szitroén': 'Citroën',
        'fiat': 'Fiat',
        'alfa': 'Alfa Romeo', 'alfa romeo': 'Alfa Romeo',
        'seat': 'SEAT', 'szeat': 'SEAT',
        'dacia': 'Dacia',
        'nissan': 'Nissan',
        'mitsubishi': 'Mitsubishi', 'micsubisi': 'Mitsubishi',
        'subaru': 'Subaru', 'szubi': 'Subaru',
        'lexus': 'Lexus',
        'porsche': 'Porsche', 'porsé': 'Porsche',
        'jaguar': 'Jaguar', 'jaguár': 'Jaguar',
        'tesla': 'Tesla',
        'mini': 'MINI',
        'jeep': 'Jeep',
        'land rover': 'Land Rover', 'landrover': 'Land Rover',
        'range rover': 'Land Rover',
        'cupra': 'Cupra',
    },

    // === AUTÓS SZLENG ===
    slang: {
        'verdák': 'autók', 'verda': 'autó', 'kocsi': 'autó', 'járgány': 'autó', 'szekér': 'autó',
        'misi': 'millió', 'milla': 'millió', 'milka': 'millió', 'mill': 'millió',
        'lóerő': 'LE', 'lóerős': 'LE',
        'manuál': 'manuális', 'kézi váltó': 'manuális', 'pálcás': 'manuális',
        'autó váltó': 'automata', 'tiptronic': 'automata', 'dsg': 'automata',
    },

    // === MÁRKA TUDÁSBÁZIS ===
    brandKB: {
        'BMW': {
            origin: 'Német', rep: 'Prémium, sportos', pros: 'Kiváló menetdinamika, erős motorok, prémium belső',
            cons: 'Drágább szerviz, magasabb fenntartás, elektronikai hibák idővel',
            best: '3-as sorozat (sportos szedán), X3 (SUV), 5-ös (komfort)',
            tip: 'Figyelj a lánc-/szíj-cserére (N47 motornál!), szervizkönyv elengedhetetlen.',
            reliable: '320d, 520d (2.0 dízel nagyon tartós), X3 2.0d',
            avoid: 'N47 motorok (lánc prob.), korai F10 530d néha AdBlue gondok'
        },
        'Mercedes-Benz': {
            origin: 'Német', rep: 'Luxus, kényelem, presztízs', pros: 'Kiváló komfort, csúcsminőségű belső, erős márkaérték',
            cons: 'Magas szervizköltség, bonyolult elektronika, drága alkatrészek',
            best: 'C-osztály (kompakt luxus), E-osztály (komfort), GLC (SUV)',
            tip: 'Használtan mindig ellenőrizd az elektromos ablakemelőket és a légkondicionálót.',
            reliable: 'C200/C220d, E220d, GLC 220d',
            avoid: 'Korai 7G-tronic váltók néha problémásak'
        },
        'Audi': {
            origin: 'Német', rep: 'Prémium, technológia, quattro összkerék', pros: 'Kiváló összkerék (quattro), igényes belső, jó értéktartás',
            cons: 'Drága szerviz, olajfogyasztás egyes motoroknál, bonyolult javítás',
            best: 'A4 (sokoldalú), A6 (komfort), Q5 (SUV), A3 (kompakt)',
            tip: 'Quattro rendszer télen aranyat ér! Figyelj a 2.0 TFSI olajfogyasztásra.',
            reliable: 'A4 2.0 TDI, A6 3.0 TDI, Q5 2.0 TDI',
            avoid: '2.0 TFSI (2008-2013) olajfogyasztás, korai S-tronic néha ránt'
        },
        'Volkswagen': {
            origin: 'Német', rep: 'Megbízható, jó ár-érték', pros: 'Kiváló alkatrészellátás, jó értéktartás, széles modellkínálat',
            cons: 'DSG váltó igényes, egyes TSI motorok lánc-problémák',
            best: 'Golf (örök klasszikus), Passat (családi), Tiguan (SUV), Polo (városi)',
            tip: 'DSG váltónál az olajcsere létfontosságú! 60.000 km-enként.',
            reliable: '1.6 TDI, 2.0 TDI (EA288), Golf 7+',
            avoid: '1.4 TSI korai (láncfeszítő), száraz DSG (DQ200) problémák'
        },
        'Toyota': {
            origin: 'Japán', rep: 'Legendás megbízhatóság', pros: 'Rendkívül megbízható, alacsony fenntartás, jó értéktartás',
            cons: 'Konzervatív dizájn, nem a legdinamikusabb, drágább használtan',
            best: 'Corolla (szedán/kombi), RAV4 (SUV), Yaris (városi), Camry (limuzin)',
            tip: 'Hibrid változatok kiválóak városi használatra, nagyon alacsony fogyasztás.',
            reliable: 'Szinte minden modell, különösen hibridek',
            avoid: 'Nincs igazán problémás modell — ez a Toyota ereje'
        },
        'Honda': {
            origin: 'Japán', rep: 'Megbízható, sportos motorok', pros: 'Tartós motorok, jó vezetési élmény, alacsony fogyasztás',
            cons: 'Szűkebb modellválaszték EU-ban, néha drágább használtan',
            best: 'Civic (sportos kompakt), CR-V (SUV), Jazz (városi)',
            tip: 'Honda motorok legendásan tartósak, de az olajcserét ne hagyd ki!',
            reliable: '1.5 i-VTEC, 1.6 i-DTEC, 2.0 i-VTEC',
            avoid: 'Korai 1.6 i-DTEC néha injektorgond'
        },
        'Škoda': {
            origin: 'Cseh (VW csoport)', rep: 'Kiváló ár-érték arány', pros: 'VW technika olcsóbban, tágas belső, praktikus',
            cons: 'Belső anyagminőség néha gyengébb, alacsonyabb presztízs',
            best: 'Octavia (király ár-érték), Superb (tágas), Kodiaq (SUV), Fabia (városi)',
            tip: 'Az Octavia Combi az egyik legjobb ár-érték arányú családi autó!',
            reliable: '1.6 TDI, 2.0 TDI, 1.0 TSI',
            avoid: 'Ugyanazok a DSG/TSI gondok mint VW-nél'
        },
        'Ford': {
            origin: 'Amerikai (EU gyártás is)', rep: 'Szórakoztató vezetés, jó ár', pros: 'Kiváló futómű, sportos vezetési élmény, versenyképes árak',
            cons: 'Rozsdásodás idősebb modelleknél, PowerShift váltó problémák',
            best: 'Focus (sportos kompakt), Fiesta (város), Kuga (SUV), Mondeo (nagy)',
            tip: 'Focus és Fiesta ST verziók legendásan jók! PowerShift váltót kerüld.',
            reliable: '1.0 EcoBoost, 2.0 TDCi, 1.5 EcoBlue',
            avoid: 'PowerShift (dupla kuplungos) DCT váltó száraz verzió!'
        },
        'Opel': {
            origin: 'Német', rep: 'Megbízható népauto', pros: 'Olcsó fenntartás, jó alkatrészellátás, kényelmes',
            cons: 'Nem túl izgalmas dizájn, alacsonyabb értéktartás',
            best: 'Astra (sokoldalú), Corsa (városi), Mokka (SUV), Insignia (nagy)',
            tip: 'Jó választás takarékos családi autónak! Új modellek már PSA/Stellantis alapúak.',
            reliable: '1.6 CDTI, 1.4 Turbo, 1.2 Turbo (új)',
            avoid: 'Régebbi 1.7 CDTI (lánc), 2.0 CDTI (dugattyúgyűrű)'
        },
        'Hyundai': {
            origin: 'Dél-koreai', rep: 'Kiváló ár-érték, 5 év garancia', pros: '5 év gyári garancia, modern dizájn, sok felszerelés',
            cons: 'Értéktartás kicsit gyengébb, szervízhálózat kisebb',
            best: 'Tucson (SUV), i30 (kompakt), Kona (kis SUV), i20 (városi)',
            tip: '5 év garanciával gyakorlatilag kockázatmentes vétel! Kiváló választás.',
            reliable: '1.6 CRDi, 1.0 T-GDi, hibridek',
            avoid: 'Korai 1.6 GDi benzin (injektorgond néha)'
        },
        'Kia': {
            origin: 'Dél-koreai', rep: '7 év garancia, modern', pros: '7 év garancia (!), szép dizájn, sok felszerelés olcsón',
            cons: 'Értéktartás közepes, néhány modell műanyag-belső',
            best: 'Sportage (SUV), Ceed (kompakt), Niro (hibrid), Picanto (városi)',
            tip: '7 év garancia = legjobb az iparágban! Használtan is érvényes az első tulajtól.',
            reliable: '1.6 CRDi, 1.0 T-GDi, Niro hibrid',
            avoid: 'Régi modellek (2014 előtt) kevésbé megbízhatóak'
        },
        'Suzuki': {
            origin: 'Japán', rep: 'Olcsó, megbízható, takarékos', pros: 'Nagyon alacsony fogyasztás, olcsó szerviz, megbízható',
            cons: 'Egyszerű felszereltség, gyengébb anyagminőség',
            best: 'Vitara (mini SUV), Swift (sportos kis), S-Cross (kompakt SUV), Jimny (terepjáró)',
            tip: 'Swift Sport legendásan szórakoztató! Vitara Hybrid nagyon takarékos.',
            reliable: '1.0 Boosterjet, 1.4 Boosterjet, SHVS hibridek',
            avoid: 'Régi 1.3 DDiS dízel (koromszűrő)'
        },
        'Renault': {
            origin: 'Francia', rep: 'Kreatív dizájn, kényelmes', pros: 'Kényelmes futómű, jó árak, érdekes dizájn',
            cons: 'Elektronikai hibák, vegyes megbízhatóság',
            best: 'Clio (városi), Megane (kompakt), Captur (kis SUV), Kadjar (SUV)',
            tip: '1.5 dCi motor az egyik legjobb dízel az iparágban!',
            reliable: '1.5 dCi (K9K), 1.0 TCe (új)',
            avoid: '1.2 TCe (H5Ft) - olajfogyasztás, lánc-nyúlás!'
        },
        'Peugeot': {
            origin: 'Francia', rep: 'Stílusos, kényelmes', pros: 'Gyönyörű dizájn, i-Cockpit érdekes, kényelmes',
            cons: 'Elektronika néha megbízhatatlan, alkatrész drágább',
            best: '208 (városi), 308 (kompakt), 3008 (SUV), 508 (elegáns)',
            tip: '3008 SUV az egyik legszebb autó a kategóriában!',
            reliable: '1.5 BlueHDi, 1.2 PureTech (3 hengeres)',
            avoid: 'Korai 1.2 PureTech szíjproblémák (2014-2018)'
        },
        'Tesla': {
            origin: 'Amerikai', rep: 'Elektromos úttörő, high-tech', pros: 'Villámgyors, hatalmas hatótáv, Supercharger hálózat, OTA frissítések',
            cons: 'Összeszerelési minőség, drága javítás, szervíz kevés',
            best: 'Model 3 (szedán), Model Y (SUV)',
            tip: 'Használt Teslánál ellenőrizd az akku állapotát (SoH%)!',
            reliable: 'Model 3 LR, Model Y',
            avoid: 'Korai Model S/X (motorcsapágy, MCU hibák)'
        },
        'Volvo': {
            origin: 'Svéd', rep: 'Biztonság, kényelem, skandináv dizájn', pros: 'Legbiztonságosabb autók, szép belső, kényelmes',
            cons: 'Drága szerviz, bonyolult elektronika',
            best: 'XC60 (SUV), XC40 (kompakt SUV), V60 (kombi), S60 (szedán)',
            tip: 'Volvo = biztonság. Családosoknak kiváló választás!',
            reliable: 'D4/D5 dízel, T5 benzin, hibridek',
            avoid: 'Korai Geartronic váltók (2010 előtt)'
        },
        'Dacia': {
            origin: 'Román (Renault csoport)', rep: 'Legolcsóbb új autó', pros: 'Filléres árak, egyszerű technika, olcsó fenntartás',
            cons: 'Egyszerű belső, kevés felszerelés, gyengébb crashtest',
            best: 'Sandero (város), Duster (SUV), Jogger (hétüléses)',
            tip: 'Ha az olcsó és megbízható a cél, a Dacia verhetetlen!',
            reliable: '1.0 TCe, 1.5 dCi, LPG változatok',
            avoid: 'Régi Logan 1. generáció (rozsdásodás)'
        },
    },

    // === KATEGÓRIA TANÁCSOK ===
    categoryAdvice: {
        'családi': 'Családi autónak ajánlom: Škoda Octavia Combi (ár-érték király), VW Passat, Toyota Corolla Touring Sports, Ford Focus Kombi. Fontos: nagy csomagtartó, ISOFIX, alacsony fogyasztás.',
        'első autó': 'Első autónak tökéletes: Suzuki Swift, VW Polo, Opel Corsa, Toyota Yaris, Škoda Fabia. Válassz kis fogyasztásút, olcsó biztosításút, és max 100.000 km-est!',
        'suv': 'Legjobb SUV-ok: Toyota RAV4 (megbízhatóság), Hyundai Tucson (ár-érték), Škoda Kodiaq (7 ülés), BMW X3 (prémium). Hibrid SUV városban nagyon takarékos!',
        'sportos': 'Sportos autók: BMW M-modellek, Ford Focus ST/RS, VW Golf GTI/R, Mazda MX-5 (roadster), Hyundai i30 N. A GTI/ST modellek jó kompromisszumot nyújtanak napi használatra.',
        'olcsó': 'Olcsó fenntartású autók: Dacia Sandero/Duster, Suzuki Swift/Vitara, Škoda Fabia/Octavia, Toyota Yaris. Japán és cseh autók általában a legolcsóbbak szervizben.',
        'elektromos': 'Elektromos autók: Tesla Model 3/Y (legjobb hatótáv), VW ID.3/ID.4, Hyundai Ioniq 5, Kia EV6, BMW iX3. Fontos: otthoni töltő, napi km igény, akku garancia.',
        'terepjáró': 'Valódi terepjárók: Suzuki Jimny (kicsi de képes), Jeep Wrangler, Toyota Land Cruiser, Land Rover Defender. Városi SUV ≠ terepjáró!',
        'luxus': 'Luxus autók: Mercedes S-osztály, BMW 7-es, Audi A8, Lexus LS/ES. Használtan meglepően olcsóak, de a FENNTARTÁS drága!',
        'városi': 'Városi autók: Toyota Yaris (hibrid!), Suzuki Swift, VW Polo, Fiat 500, Hyundai i10/i20. Kis méret + alacsony fogyasztás = könnyű parkolás.',
        'kombi': 'Legjobb kombik: Škoda Octavia Combi (hatalmas csomag), VW Passat Variant, Toyota Corolla TS, Ford Focus Kombi, Volvo V60.',
    },

    // === VÁSÁRLÁSI TANÁCSOK ===
    buyingTips: {
        'mire figyelj': 'Használt autó vételnél figyelj: ✅ Szervizkönyv (pecsételt), ✅ Futott km valódiság (Totalcar KM-adat), ✅ Karosszéria állapot (lakkvastagság mérő), ✅ Próbaút!, ✅ Hideg indítás, ✅ OBD diagnosztika hibakódok.',
        'papírok': 'Szükséges papírok: forgalmi engedély, törzskönyv, kötelező biztosítás, műszaki vizsga (érvényes), adásvételi szerződés (2 pld), eredetiségvizsgálat.',
        'műszaki vizsga': 'Műszaki vizsga: 4 évnél újabb autó → 4 év múlva első, utána 2 évente. Régebbit évente. Költség: ~15.000-30.000 Ft. Vizsgálják: fék, futómű, világítás, kipufogó, karosszéria.',
        'km ellenőrzés': 'KM ellenőrzés: Ellenőrizd a Totalcar KM-adat adatbázisban, kérd a szervizkönyvet, nézd a kopásjeleket (pedál, kormány, ülés). 20.000 km/év az átlag.',
        'alkudozás': 'Alkudozási tippek: Mindig nézd a piaci árat (össze kell hasonlítani hasonló hirdetésekkel), mutass rá a hibákra, készülj a maximális ajánlattal, és ne kapkodj!',
        'biztosítás': 'Biztosítás típusok: KÖTELEZŐ (Kgfb) = más autójának okozott kár, CASCO = saját autó kárai. Fiatal sofőröknek drágább, de érdemes online kalkulátorral összehasonlítani!',
    },

    // === PLATFORM SEGÍTSÉG ===
    platformHelp: {
        'hirdetés feladás': 'Hirdetés feladása: 1️⃣ Jelentkezz be vagy regisztrálj, 2️⃣ Kattints a \"+ Hirdetés feladása\" gombra, 3️⃣ Töltsd ki az adatokat és tölts fel képeket, 4️⃣ Kattints a \"Hirdetés beküldése\" gombra.',
        'regisztráció': 'Regisztráció: Kattints a 👤 ikonra a fejlécben, válaszd a \"Regisztráció\" fület, add meg a neved, email címed és jelszavadat. Email-ben kapsz megerősítő kódot.',
        'kedvencek': 'Kedvencek: Kattints a ❤️ szív ikonra bármely hirdetésen, és az automatikusan a kedvenceid közé kerül. A profilodban a \"Kedvenceim\" fülön találod.',
        'szűrés': 'Szűrés: A főoldalon a keresőben állítsd be: márkát, modellt, árat, évjáratot, üzemanyagot. \"További keresési opciók\"-nál még több szűrő elérhető (szín, váltó, km, stb.).',
        'összehasonlítás': 'Összehasonlítás: Kattints a ⚖️ ikonra max 3 autónál, majd az \"Összehasonlítás\" gombra a felugró sávban. Táblázatban látod az összes adatot egymás mellett.',
        'profil': 'Profilod: A fejlécben a nevedre kattintva eléred a profilod, ahol láthatod a hirdetéseidet, kedvenceidet, és módosíthatod a beállításaidat.',
    },

    // === INTENT FELISMERŐ ===
    detectIntent(text) {
        const t = text.toLowerCase().replace(/[?!.,]/g, '');

        // Üdvözlés
        if (/^(szia|hello|helo|helló|hi|hali|szevasz|szeva|hé|heló|üdv|jónapot|jó napot)/.test(t)) return 'greeting';
        // Búcsú
        if (/^(viszlát|sziasztok|bye|köszi|kösz|köszönöm|push)/.test(t)) return 'goodbye';
        // Segítség
        if (/mit tudsz|mit csinálsz|miben segít|help|segíts|mit kérdezhetek|hogyan működ/.test(t)) return 'help';
        // Hirdetés statisztika
        if (/hány (autó|hirdetés|kocsi)|mennyi (autó|hirdetés|kocsi)/.test(t)) return 'stats';
        // Platform segítség
        if (/hogyan (adjak|adj|töltsek|tölts|regisztrál|lépjek|keress)|hirdetés felad|hirdet.{0,5}ad|regisztrá|bejelent|profil|kedvenc|szűr|összehasonlít/.test(t)) return 'platform_help';
        // Kalkulátor
        if (/törlesztő|hitel|részlet|havi|finanszíroz|lízing|leasing/.test(t)) return 'calculator_loan';
        if (/fogyasztás|üzemanyag.*költség|benzinköltség|tankol|literenként/.test(t)) return 'calculator_fuel';
        // Összehasonlítás
        if (/vagy\b|vs\b|összehasonlít|melyik.*jobb|különbség/.test(t)) return 'compare';
        // Márka info kérdés
        if (/milyen.*márka|mesélj.*ról|mit tudsz.*ról|mennyire.*megbízható|vélemény|tapasztalat/.test(t)) return 'brand_info';
        // Ajánlás kérdés
        if (/mit ajánl|mit javasol|melyik.{0,10}(leg|jó|tök)|ajánl.{0,5}(nekem|autót)|milyen autót|legjobb|legmeg|legolcsóbb/.test(t)) return 'recommend';
        // Vásárlási tanács
        if (/mire figyel|vásárl|venni|vennék|vásárol|papír|műszaki|vizsga|biztosítás|alku|km.{0,5}(ellenőrz|csekk)/.test(t)) return 'buying_advice';
        // Szűrő / keresés (autót keres)
        if (this.detectFilters(t).hasFilters) return 'filter_search';
        // Brand + kérdés
        const brand = this.resolveQueryBrand(t);
        if (brand) return 'brand_info';
        // Fallback
        return 'unknown';
    },

    // === MÁRKA FELOLDÁS ===
    resolveQueryBrand(text) {
        const t = text.toLowerCase();
        // Alias check
        for (const [alias, brand] of Object.entries(this.brandAliases)) {
            if (t.includes(alias)) return brand;
        }
        // Direct brand name check (from BRANDS_DATA in main.js)
        if (typeof BRANDS_DATA !== 'undefined') {
            const sorted = Object.keys(BRANDS_DATA).sort((a, b) => b.length - a.length);
            const match = sorted.find(b => t.includes(b.toLowerCase()));
            if (match) return match;
        }
        return null;
    },

    // === SZŰRŐ FELISMERÉS ===
    detectFilters(text) {
        const t = text.toLowerCase();
        let d = { brand: null, model: null, fuel: null, priceTo: null, yearFrom: null, kmTo: null, transmission: null, bodyType: null, color: null };
        let hasFilters = false;

        // Brand
        const brand = this.resolveQueryBrand(t);
        if (brand) {
            d.brand = brand; hasFilters = true;
            if (typeof BRANDS_DATA !== 'undefined' && BRANDS_DATA[brand]) {
                const models = [...BRANDS_DATA[brand].models].sort((a, b) => b.length - a.length);
                const mm = models.find(m => t.includes(m.toLowerCase()));
                if (mm) d.model = mm;
            }
        }

        // Year
        const yp = [/(?:újabb|fiatalabb|min(?:imum)?)\s*(?:mint\s*)?(20\d{2})/, /(20\d{2})\s*(?:utáni|fölötti|felett|től)/, /(?:mint|legyen)\s*(20\d{2})/, /(20\d{2})\s*(?:től|tól|után)/];
        for (const p of yp) { const m = t.match(p); if (m) { d.yearFrom = parseInt(m[1]); hasFilters = true; break; } }

        // KM
        const kp = [/(?:max(?:imum)?|kevesebb|legfeljebb)\s*(\d+)\s*(?:ezer|e)?\s*km/, /(\d+)\s*(?:ezer|e)?\s*km\s*(?:alatt|ig)/];
        for (const p of kp) { const m = t.match(p); if (m) { let v = parseInt(m[1]); if (v < 1000) v *= 1000; d.kmTo = v; hasFilters = true; break; } }

        // Price
        const pm = t.match(/(\d+)\s*(?:millió|millio|milla|misi|m\b)/);
        if (pm) { d.priceTo = parseInt(pm[1]) * 1000000; hasFilters = true; }
        else { const rm = t.match(/(\d{6,})/); if (rm && t.includes('ft') || t.includes('forint') || t.includes('ár') || t.includes('alatt')) { d.priceTo = parseInt(rm[1]); hasFilters = true; } }

        // Fuel
        const fuelMap = { 'Benzin': ['benzin', 'benzines'], 'Dízel': ['dízel', 'dizel', 'dízeles', 'gázolaj'], 'Elektromos': ['elektromos', 'villany', 'ev'], 'Hibrid': ['hibrid', 'hybrid'], 'LPG': ['lpg', 'autógáz'] };
        for (const [f, kw] of Object.entries(fuelMap)) { if (kw.some(k => t.includes(k))) { d.fuel = f; hasFilters = true; break; } }

        // Transmission
        if (/automata|dsg|tiptronic|automata váltó/.test(t)) { d.transmission = 'Automata'; hasFilters = true; }
        else if (/manuális|manualis|kézi|kezi|pálcás/.test(t)) { d.transmission = 'Manuális'; hasFilters = true; }

        // Body
        const bodyMap = { 'SUV & Pick-up': ['suv', 'terepjáró', 'pickup', 'terep'], 'Kombi': ['kombi', 'estate', 'touring'], 'Kupé': ['kupé', 'coupe', 'kupe'], 'Kabriólet': ['kabrió', 'cabrio', 'kabriolet'], 'Kisautó': ['kisautó', 'kisauto', 'városi'], 'Limuzin': ['limuzin', 'szedán', 'sedan'], 'Egyterű': ['egyterű', 'egyteru', 'van'], 'Transzporter': ['transzporter', 'furgon'] };
        for (const [b, kw] of Object.entries(bodyMap)) { if (kw.some(k => t.includes(k))) { d.bodyType = b; hasFilters = true; break; } }

        // Color
        const colorMap = { 'Fekete': ['fekete'], 'Fehér': ['fehér', 'feher'], 'Ezüst': ['ezüst'], 'Szürke': ['szürke', 'szurke'], 'Kék': ['kék', 'kek'], 'Piros': ['piros', 'vörös'], 'Zöld': ['zöld'], 'Sárga': ['sárga'], 'Barna': ['barna'] };
        for (const [c, kw] of Object.entries(colorMap)) { if (kw.some(k => t.includes(k))) { d.color = c; hasFilters = true; break; } }

        return { ...d, hasFilters };
    },

    // === VÁLASZGENERÁTOR ===
    generateResponse(text) {
        const intent = this.detectIntent(text);
        const t = text.toLowerCase();

        // Mentés history-ba
        this.history.push({ role: 'user', text });
        if (this.history.length > this.MAX_HISTORY * 2) this.history = this.history.slice(-this.MAX_HISTORY * 2);

        let reply = '';
        let filters = null;

        switch (intent) {
            case 'greeting':
                const greets = [
                    'Szia! 👋 Én vagyok a LUNNAR AI asszisztens. Kérdezz bármit autókról, vagy írd le milyen autót keresel!',
                    'Helló! 🚗 Miben segíthetek? Kereshetsz autót, kérdezhetsz márkákról, vagy kérhetsz vásárlási tanácsot!',
                    'Szevasz! 😊 Készen állok! Írd le milyen autót keresel, vagy kérdezz bármit az autózásról!',
                ];
                reply = greets[Math.floor(Math.random() * greets.length)];
                break;

            case 'goodbye':
                reply = 'Szívesen segítettem! 😊 Ha bármi kérdésed van, itt leszek. Sok sikert az autókereséshez! 🚗';
                break;

            case 'help':
                reply = '🤖 <b>Íme, miben segíthetek:</b>\n' +
                    '🔍 <b>Autókeresés</b> — írd le természetesen (pl. "dízel kombi 5 millió alatt")\n' +
                    '📊 <b>Márka információ</b> — kérdezz bármely márkáról (pl. "milyen a BMW?")\n' +
                    '⚖️ <b>Összehasonlítás</b> — pl. "BMW 3 vagy Audi A4?"\n' +
                    '💰 <b>Havi törlesztő</b> — pl. "mennyit fizetnék havonta egy 8 milliós autóért?"\n' +
                    '⛽ <b>Üzemanyagköltség</b> — pl. "mennyibe kerül havonta 7l fogyasztással?"\n' +
                    '📋 <b>Tanácsok</b> — vásárlási tippek, mire figyelj, papírok\n' +
                    '❓ <b>Platform segítség</b> — hirdetés feladás, regisztráció, szűrők\n' +
                    '💡 <b>Ajánlás</b> — pl. "milyen autót ajánlasz családnak?"';
                break;

            case 'stats':
                reply = this.getStatsResponse();
                break;

            case 'platform_help':
                reply = this.getPlatformHelpResponse(t);
                break;

            case 'calculator_loan':
                reply = this.calcLoan(t);
                break;

            case 'calculator_fuel':
                reply = this.calcFuel(t);
                break;

            case 'compare':
                reply = this.getCompareResponse(t);
                break;

            case 'brand_info':
                reply = this.getBrandInfoResponse(t);
                break;

            case 'recommend':
                reply = this.getRecommendation(t);
                break;

            case 'buying_advice':
                reply = this.getBuyingAdvice(t);
                break;

            case 'filter_search':
                const f = this.detectFilters(t);
                filters = f;
                let parts = [];
                if (f.brand) parts.push(f.brand + (f.model ? ` ${f.model}` : ''));
                if (f.yearFrom) parts.push(`${f.yearFrom} utáni`);
                if (f.priceTo) parts.push(`${(f.priceTo / 1000000).toFixed(0)}M Ft alatt`);
                if (f.kmTo) parts.push(`max ${f.kmTo.toLocaleString()} km`);
                if (f.fuel) parts.push(f.fuel);
                if (f.transmission) parts.push(f.transmission);
                if (f.bodyType) parts.push(f.bodyType);
                if (f.color) parts.push(f.color);
                reply = `🔍 Értettem! Szűrök: <b>${parts.join(', ')}</b>.`;
                // Add context-aware advice
                if (f.brand && this.brandKB[f.brand]) {
                    reply += `\n💡 ${this.brandKB[f.brand].tip}`;
                }
                break;

            default:
                reply = this.handleUnknown(t);
                break;
        }

        this.history.push({ role: 'ai', text: reply });
        return { reply, filters };
    },

    // === STATISZTIKA ===
    getStatsResponse() {
        if (typeof allCars === 'undefined' || !allCars.length) {
            return '📊 Jelenleg nincsenek hirdetések betöltve. Próbáld frissíteni az oldalt!';
        }
        const total = allCars.length;
        const brands = [...new Set(allCars.map(c => c.brand))];
        const avgPrice = Math.round(allCars.reduce((s, c) => s + (c.price || 0), 0) / total);
        const cheapest = allCars.reduce((min, c) => (!min || c.price < min.price) ? c : min, null);
        const newest = allCars.reduce((max, c) => (!max || c.year > max.year) ? c : max, null);

        return `📊 <b>Jelenlegi statisztikák:</b>\n` +
            `🚗 Összesen <b>${total}</b> hirdetés\n` +
            `🏷️ <b>${brands.length}</b> különböző márka\n` +
            `💰 Átlagár: <b>${(avgPrice / 1000000).toFixed(1)}M Ft</b>\n` +
            (cheapest ? `⬇️ Legolcsóbb: <b>${cheapest.brand} ${cheapest.model}</b> — ${(cheapest.price / 1000000).toFixed(1)}M Ft\n` : '') +
            (newest ? `🆕 Legújabb: <b>${newest.brand} ${newest.model}</b> (${newest.year})` : '');
    },

    // === PLATFORM SEGÍTSÉG ===
    getPlatformHelpResponse(t) {
        for (const [key, val] of Object.entries(this.platformHelp)) {
            if (key.split(' ').some(w => t.includes(w))) return val;
        }
        if (/hogyan|help|segít/.test(t)) return this.platformHelp['szűrés'];
        return 'ℹ️ Használd a felső menüt a navigáláshoz! A keresővel szűrhetsz, a ❤️ gombbal menthetsz kedvencet, a + gombbal adhatsz fel hirdetést. Kérdezz konkrétabban és segítek!';
    },

    // === TÖRLESZTŐ KALKULÁTOR ===
    calcLoan(t) {
        const pm = t.match(/(\d+)\s*(?:millió|millio|milla|misi|m\b)/);
        let amount = pm ? parseInt(pm[1]) * 1000000 : null;
        if (!amount) { const nm = t.match(/(\d{6,})/); if (nm) amount = parseInt(nm[1]); }
        if (!amount) return '💰 Írd be az autó árát, pl: "mennyit fizetnék havonta egy 8 milliós autóért?" vagy "törlesztő 5000000 Ft"';

        const ym = t.match(/(\d+)\s*(?:év|évre|éves)/);
        const years = ym ? parseInt(ym[1]) : 5;
        const rate = 0.089; // 8.9% éves kamat
        const months = years * 12;
        const monthlyRate = rate / 12;
        const monthly = Math.round(amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));
        const totalPaid = monthly * months;
        const interest = totalPaid - amount;

        return `💰 <b>Hitel kalkuláció (${(amount / 1000000).toFixed(1)}M Ft, ${years} év, ${(rate * 100).toFixed(1)}% THM):</b>\n` +
            `📅 Havi törlesztő: <b>${monthly.toLocaleString()} Ft</b>\n` +
            `💵 Összesen fizetendő: <b>${(totalPaid / 1000000).toFixed(1)}M Ft</b>\n` +
            `📈 Kamat összesen: <b>${(interest / 1000000).toFixed(1)}M Ft</b>\n` +
            `ℹ️ Ez tájékoztató jellegű, a tényleges feltételek bankonként eltérhetnek.`;
    },

    // === ÜZEMANYAG KALKULÁTOR ===
    calcFuel(t) {
        const fm = t.match(/(\d+(?:[.,]\d+)?)\s*(?:liter|l\b)/);
        const consumption = fm ? parseFloat(fm[1].replace(',', '.')) : 7;
        const km_m = t.match(/(\d+)\s*(?:km|kilom)/);
        const monthlyKm = km_m ? parseInt(km_m[1]) : 1500;

        const benzinPrice = 620; // Ft/liter (becsült)
        const dizelPrice = 640;

        const benzinCost = Math.round((monthlyKm / 100) * consumption * benzinPrice);
        const dizelCost = Math.round((monthlyKm / 100) * consumption * dizelPrice);

        return `⛽ <b>Üzemanyagköltség kalkuláció (${consumption}l/100km, ${monthlyKm.toLocaleString()} km/hó):</b>\n` +
            `🔴 Benzin (${benzinPrice} Ft/l): <b>${benzinCost.toLocaleString()} Ft/hó</b>\n` +
            `🔵 Dízel (${dizelPrice} Ft/l): <b>${dizelCost.toLocaleString()} Ft/hó</b>\n` +
            `📅 Éves költség (benzin): <b>${(benzinCost * 12).toLocaleString()} Ft</b>\n` +
            `💡 Tipp: hibrid autóval akár 30-50%-ot spórolhatsz városban!`;
    },

    // === ÖSSZEHASONLÍTÁS ===
    getCompareResponse(t) {
        const brands = [];
        const allBrandNames = typeof BRANDS_DATA !== 'undefined' ? Object.keys(BRANDS_DATA) : [];
        // Check aliases first
        for (const [alias, brand] of Object.entries(this.brandAliases)) {
            if (t.includes(alias) && !brands.includes(brand)) brands.push(brand);
        }
        // Check direct names
        for (const b of allBrandNames) {
            if (t.includes(b.toLowerCase()) && !brands.includes(b)) brands.push(b);
        }

        if (brands.length >= 2) {
            const b1 = brands[0], b2 = brands[1];
            const kb1 = this.brandKB[b1], kb2 = this.brandKB[b2];
            if (kb1 && kb2) {
                return `⚖️ <b>${b1} vs ${b2}</b>\n\n` +
                    `<b>${b1}:</b> ${kb1.pros}\n` +
                    `⚠️ ${kb1.cons}\n` +
                    `⭐ Legjobb: ${kb1.best}\n\n` +
                    `<b>${b2}:</b> ${kb2.pros}\n` +
                    `⚠️ ${kb2.cons}\n` +
                    `⭐ Legjobb: ${kb2.best}\n\n` +
                    `💡 Egyik sem rossz választás — a ${b1} ${kb1.rep.toLowerCase()}, míg a ${b2} ${kb2.rep.toLowerCase()}.`;
            }
        }

        if (brands.length === 1 && this.brandKB[brands[0]]) {
            return this.formatBrandInfo(brands[0]);
        }

        return '⚖️ Melyik két márkát szeretnéd összehasonlítani? Pl: "BMW vagy Audi?" vagy "Mercedes vs Volvo"';
    },

    // === MÁRKA INFO ===
    getBrandInfoResponse(t) {
        const brand = this.resolveQueryBrand(t);
        if (brand && this.brandKB[brand]) {
            return this.formatBrandInfo(brand);
        }
        if (brand) {
            return `ℹ️ A(z) <b>${brand}</b> elérhető a kínálatunkban! Sajnos részletes leírás egyelőre nincs róla a tudásbázisomban, de kereshetsz rá a szűrőkkel! Írd: "<b>${brand} autót keresek</b>"`;
        }
        return '🤔 Melyik márkáról szeretnél tudni? Írd be a márkanevet, pl: "milyen a BMW?" vagy "mesélj a Toyotáról"';
    },

    formatBrandInfo(brand) {
        const kb = this.brandKB[brand];
        return `🚗 <b>${brand}</b> (${kb.origin})\n` +
            `🏷️ ${kb.rep}\n\n` +
            `✅ <b>Előnyök:</b> ${kb.pros}\n` +
            `⚠️ <b>Hátrányok:</b> ${kb.cons}\n` +
            `⭐ <b>Legjobb modellek:</b> ${kb.best}\n` +
            `🔧 <b>Megbízható:</b> ${kb.reliable}\n` +
            `🚫 <b>Kerülendő:</b> ${kb.avoid}\n\n` +
            `💡 <b>Tipp:</b> ${kb.tip}`;
    },

    // === AJÁNLÁS ===
    getRecommendation(t) {
        for (const [cat, advice] of Object.entries(this.categoryAdvice)) {
            if (cat.split(' ').some(w => w.length > 2 && t.includes(w))) return `💡 ${advice}`;
        }
        // Smart fallback
        if (/család|gyerek|babakocsi/.test(t)) return `💡 ${this.categoryAdvice['családi']}`;
        if (/első|kezdő|tanuló/.test(t)) return `💡 ${this.categoryAdvice['első autó']}`;
        if (/olcsó|takarékos|spórol/.test(t)) return `💡 ${this.categoryAdvice['olcsó']}`;
        if (/sport|gyors|erős/.test(t)) return `💡 ${this.categoryAdvice['sportos']}`;
        if (/elektro|villany|zöld|környezet/.test(t)) return `💡 ${this.categoryAdvice['elektromos']}`;
        if (/terep|off.?road/.test(t)) return `💡 ${this.categoryAdvice['terepjáró']}`;
        if (/luxus|prémium|drága/.test(t)) return `💡 ${this.categoryAdvice['luxus']}`;
        if (/város|kis|parkolás/.test(t)) return `💡 ${this.categoryAdvice['városi']}`;
        if (/suv|crossover/.test(t)) return `💡 ${this.categoryAdvice['suv']}`;
        if (/kombi|csomagtartó/.test(t)) return `💡 ${this.categoryAdvice['kombi']}`;

        return '💡 Családi autót, sportkocsit, SUV-ot, városi kisautót, elektromost kereslek? Mondd el milyen célra kell és milyen a büdzséd, és ajánlok neked!';
    },

    // === VÁSÁRLÁSI TANÁCS ===
    getBuyingAdvice(t) {
        for (const [key, val] of Object.entries(this.buyingTips)) {
            if (key.split(' ').some(w => w.length > 3 && t.includes(w))) return `📋 ${val}`;
        }
        return `📋 ${this.buyingTips['mire figyelj']}`;
    },

    // === ISMERETLEN KÉRDÉS ===
    handleUnknown(t) {
        // Last resort: check if any brand mentioned
        const brand = this.resolveQueryBrand(t);
        if (brand) return this.getBrandInfoResponse(t);

        // Check allCars for simple text search
        if (typeof allCars !== 'undefined' && allCars.length > 0) {
            const words = t.split(/\s+/).filter(w => w.length > 2);
            const matches = allCars.filter(c => {
                const carText = `${c.brand} ${c.model} ${c.fuel} ${c.city}`.toLowerCase();
                return words.some(w => carText.includes(w));
            });
            if (matches.length > 0 && matches.length <= 20) {
                return `🔍 Találtam <b>${matches.length}</b> hirdetést ami illeszkedhet. Próbáld pontosítani: írd le a márkát, árat, évjáratot, vagy használd a szűrőket!`;
            }
        }

        const suggestions = [
            '🤔 Nem teljesen értettem. Próbáld meg így:\n• "<b>BMW 3-as 5 millió alatt</b>"\n• "<b>Milyen a Toyota megbízhatósága?</b>"\n• "<b>Ajánlj családi autót</b>"\n• "<b>Mennyibe kerül havonta egy 8 milliós autó?</b>"',
            '🤔 Sajnos nem értettem. Segíthetek:\n• 🔍 Autókeresésben (pl. "dízel SUV 2020 után")\n• 📊 Márka infóban (pl. "milyen a Škoda?")\n• 💰 Kalkulációval (pl. "törlesztő 6 millió")\n• ❓ Tippekben (pl. "mire figyelj használt autónál")',
        ];
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
};
