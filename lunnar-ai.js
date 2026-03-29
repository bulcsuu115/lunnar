// ============================================================
// LUNNAR AI — Valódi LLM (API a saját szerveren keresztül) + Szűrővezérlés
// ============================================================

const LUNNAR_AI = {
    history: [],
    MAX_HISTORY: 10,

    // === VÁLASZGENERÁTOR (ASYNC) ===
    async generateResponse(text) {
        try {
            // Jelenlegi autók összegyűjtése kontextushoz
            let inventoryContext = "Nincs jelenleg elérhető hirdetés a rendszerben.";
            if (typeof allCars !== 'undefined' && allCars.length > 0) {
                const availableCars = allCars.map(c =>
                    `- ID: ${c._id || c.id} | ${c.brand} ${c.model} | Év: ${c.year} | Km: ${c.km} | Üzemanyag: ${c.fuel} | Váltó: ${c.transmission} | Ár: ${c.price} Ft | Szín: ${c.color || '-'} | Város: ${c.city || '-'}`
                );
                inventoryContext = availableCars.slice(0, 150).join('\n');
            }

            const systemPrompt = `Te vagy a LUNNAR AI, egy professzionális magyar autópiaci szakértő asszisztens.
Célod, hogy segíts a felhasználóknak megtalálni a tökéletes autót.

KÖTELEZŐ FORMÁTUM: Mindig érvényes JSON-t adj vissza:
{
  "reply": "HTML válasz",
  "reset": false,
  "filters": { 
    "brand": string|null, 
    "model": string|null, 
    "priceTo": num|null, 
    "yearFrom": num|null, 
    "kmTo": num|null, 
    "fuel": "Benzin"|"Dízel"|"Elektromos"|"Hibrid"|"LPG"|null, 
    "transmission": "Manuális"|"Automata"|null, 
    "bodyType": "Kisautó"|"Limuzin"|"Kombi"|"SUV & Pick-up"|"Kupé"|"Kabriólet"|"Egyterű"|"Transzporter"|null, 
    "color": "Fekete"|"Fehér"|"Ezüst"|"Szürke"|"Kék"|"Piros"|"Zöld"|"Sárga"|"Barna"|"Bézs"|"Arany"|"Bordó"|"Lila"|"Narancs"|"Rózsaszín"|"Pezsgő"|"Bronz"|null,
    "city": string|null
  }
}

FONTOS SZABÁLYOK:
- Ha a felhasználó szűrők törlését kéri (pl. "töröld a szűrőket", "mutass mindent"), állítsd a "reset" mezőt true-ra és MINDEN filter legyen null!
- A válaszodban (reply) KIZÁRÓLAG olyan autókat említs és ajánlj, amik MEGFELELNEK a felhasználó kérésének (márka, város, ár, stb.)! NE ajánlj olyan autót, ami más városban van, ha a felhasználó konkrét várost kért!

FORMÁZÁSI SZABÁLYOK:
1. Használj <b>-t a márkákhoz és árakhoz.
2. Használj <ul> és <li> elemeket a listákhoz.
3. Használj <a> tageket az autókra való hivatkozáshoz így: <a href='#ad/ID' class='ai-ad-link'>[AUTÓ MEGTEKINTÉSE]</a>
4. SOHA ne használj emoji-kat (pl. 🚗, 💰), tartsd meg a professzionális hangvételt.
5. Soha ne használj Markdownt (** vagy -), CSAK tiszta HTML-t!

ELÉRHETŐ AUTÓK (Készlet):
${inventoryContext}`;

            const messages = [{ role: "system", content: systemPrompt }];
            for (const msg of this.history) {
                messages.push({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.text });
            }
            messages.push({ role: "user", content: text });

            const requestBody = {
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.1,
                response_format: { type: "json_object" }
            };

            let data;
            // Always use backend proxy (API key is safe on server side)
            const proxyUrl = (window.location.hostname === 'lunnar.onrender.com') ? '/api/ai/chat' : 'https://lunnar.onrender.com/api/ai/chat';
            const proxyResponse = await fetch(proxyUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });
            if (!proxyResponse.ok) throw new Error("API hiba: " + proxyResponse.status);
            data = await proxyResponse.json();

            const jsonResponse = JSON.parse(data.choices[0].message.content);

            const replyText = jsonResponse.reply;
            const detectedFilters = jsonResponse.filters;

            this.history.push({ role: 'user', text: text });
            this.history.push({ role: 'ai', text: replyText });
            if (this.history.length > this.MAX_HISTORY) this.history = this.history.slice(-this.MAX_HISTORY);

            return { 
                reply: replyText, 
                reset: jsonResponse.reset === true,
                filters: detectedFilters ? { ...detectedFilters, hasFilters: Object.values(detectedFilters).some(v => v !== null) } : null 
            };

        } catch (error) {
            console.error("Lunnar AI - Szerver/API Hiba:", error.message);
            return { 
                reply: "Sajnálom, az AI asszisztens jelenleg nem elérhető. Kérlek próbáld újra később!", 
                filters: null 
            };
        }
    },

    hasWord(text, word) { return false; },
    resolveQueryBrand(text) { return null; },
    detectFilters(text) { return { hasFilters: false }; }
};
