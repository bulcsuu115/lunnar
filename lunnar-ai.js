// ============================================================
// LUNNAR AI — Valódi LLM (Groq Llama 3.3 API) + Szűrővezérlés
// ============================================================

const GROQ_KEYS = [
    "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",
    "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",
    "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"
];
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const LUNNAR_AI = {
    history: [],
    MAX_HISTORY: 10,
    currentKeyIndex: 0,

    // === VÁLASZGENERÁTOR (ASYNC) ===
    async generateResponse(text) {
        let lastError = null;
        
        // Próbálkozás az összes kulccsal, ha hiba van
        for (let i = 0; i < GROQ_KEYS.length; i++) {
            const apiKey = GROQ_KEYS[this.currentKeyIndex];
            try {
                // Jelenlegi autók összegyűjtése kontextushoz
                let inventoryContext = "Nincs jelenleg elérhető hirdetés a rendszerben.";
                if (typeof allCars !== 'undefined' && allCars.length > 0) {
                    const availableCars = allCars.map(c => 
                        `- ID: ${c._id || c.id} | ${c.brand} ${c.model} | Év: ${c.year} | Km: ${c.km} | Üzemanyag: ${c.fuel} | Váltó: ${c.transmission} | Ár: ${c.price} Ft | Szín: ${c.color || '-'}`
                    );
                    inventoryContext = availableCars.slice(0, 150).join('\n');
                }

                const systemPrompt = `Te vagy a LUNNAR AI, egy professzionális magyar autópiaci szakértő asszisztens.
Célod, hogy segíts a felhasználóknak megtalálni a tökéletes autót.

KÖTELEZŐ FORMÁTUM: Mindig érvényes JSON-t adj vissza:
{
  "reply": "HTML válasz",
  "filters": { 
    "brand": string|null, 
    "model": string|null, 
    "priceTo": num|null, 
    "yearFrom": num|null, 
    "kmTo": num|null, 
    "fuel": "Benzin"|"Dízel"|"Elektromos"|"Hibrid"|"LPG"|null, 
    "transmission": "Manuális"|"Automata"|null, 
    "bodyType": "Kisautó"|"Limuzin"|"Kombi"|"SUV & Pick-up"|"Kupé"|"Kabriólet"|"Egyterű"|"Transzporter"|null, 
    "color": "Fekete"|"Fehér"|"Ezüst"|"Szürke"|"Kék"|"Piros"|"Zöld"|"Sárga"|"Barna"|"Bézs"|"Arany"|"Bordó"|"Lila"|"Narancs"|"Rózsaszín"|"Pezsgő"|"Bronz"|null
  }
}

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

                const response = await fetch(GROQ_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: messages,
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    })
                });

                if (response.status === 401 || response.status === 429) {
                    throw new Error(`API kulcs hiba (${response.status})`);
                }
                if (!response.ok) throw new Error("Általános API hiba");

                const data = await response.json();
                const jsonResponse = JSON.parse(data.choices[0].message.content);

                const replyText = jsonResponse.reply;
                const detectedFilters = jsonResponse.filters;

                this.history.push({ role: 'user', text: text });
                this.history.push({ role: 'ai', text: replyText });
                if (this.history.length > this.MAX_HISTORY) this.history = this.history.slice(-this.MAX_HISTORY);

                return { 
                    reply: replyText, 
                    filters: detectedFilters ? { ...detectedFilters, hasFilters: Object.values(detectedFilters).some(v => v !== null) } : null 
                };

            } catch (error) {
                console.warn(`Lunnar AI - Kulcs #${this.currentKeyIndex} hiba:`, error.message);
                lastError = error;
                // Váltás a következő kulcsra
                this.currentKeyIndex = (this.currentKeyIndex + 1) % GROQ_KEYS.length;
            }
        }

        console.error("Lunnar AI - Minden kulcs elfogyott vagy hibás.");
        return { 
            reply: "Sajnálom, az AI asszisztens jelenleg túlterhelt vagy karbantartás alatt áll. Kérlek próbáld újra később! 🛠️", 
            filters: null 
        };
    },
    
    hasWord(text, word) { return false; },
    resolveQueryBrand(text) { return null; },
    detectFilters(text) { return { hasFilters: false }; }
};
