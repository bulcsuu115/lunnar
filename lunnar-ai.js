// ============================================================
// LUNNAR AI — Valódi LLM (Groq Llama 3.3 API) + Szűrővezérlés
// ============================================================

const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

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
                    `- ID: ${c._id || c.id} | ${c.brand} ${c.model} | Év: ${c.year} | Km: ${c.km} | Üzemanyag: ${c.fuel} | Váltó: ${c.transmission} | Ár: ${c.price} Ft | Szín: ${c.color || '-'}`
                );
                inventoryContext = availableCars.slice(0, 150).join('\n');
            }

            const systemPrompt = `Te vagy a LUNNAR AI, egy professzionális magyar autópiaci szakértő asszisztens. 
KÖTELEZŐ FORMÁTUM: Mindig érvényes JSON objektumot adj vissza, pontosan ebben a szerkezetben:
{
  "reply": "Itt a válaszod HTML formázással (<b>, <br>, <ul>, <li>, <a>). Ne használj Markdownt!",
  "filters": {
    "brand": "Márkanév (string vagy null)",
    "model": "Modellnév (string vagy null)",
    "priceTo": szám (null ha nincs),
    "yearFrom": szám (null ha nincs),
    "kmTo": szám (null ha nincs),
    "fuel": "Benzin"|"Dízel"|"Elektromos"|"Hibrid" (null ha nincs),
    "transmission": "Automata"|"Manuális" (null ha nincs),
    "bodyType": "SUV & Pick-up"|"Kombi"|"Kupé"|"Kabriólet"|"Kisautó"|"Limuzin"|"Egyterű"|"Transzporter" (null ha nincs),
    "color": "Fekete"|"Fehér"|"Ezüst"|"Szürke"|"Kék"|"Piros"|"Zöld"|"Sárga"|"Barna" (null ha nincs)
  }
}

SZABÁLYOK:
1. Ha a felhasználó autót keres vagy paramétereket említ, töltsd ki a "filters" részt!
2. Ha CSAK kérdez (pl. "Milyen a BMW?"), a "filters" legyen null.
3. CSALÁDI AUTÓRA pl. állíts be bodyType: "Egyterű" vagy "Kombi" szűrőt.
4. OLCSÓRA pl. priceTo: 3000000.
5. Az autókra a listából linkelj: <a href="#ad/ID" style="color:#667eea;font-weight:bold;">Márka Modell (Ár)</a>.
6. Ha sok (több mint 3) találat van a szűrésedre, NE sorold fel mindet a szövegben! Csak a 3 legrelevánsabbat emeld ki, és jelezd, hogy a többit a weboldal listájában láthatja a beállított szűrőknek köszönhetően. 

ELÉRHETŐ AUTÓK:
${inventoryContext}`;

            const messages = [
                { role: "system", content: systemPrompt }
            ];

            for (const msg of this.history) {
                messages.push({
                    role: msg.role === 'ai' ? 'assistant' : 'user',
                    content: msg.text
                });
            }
            messages.push({ role: "user", content: text });

            const response = await fetch(GROQ_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    temperature: 0.1, // Alacsonyabb hőmérséklet a stabil JSON-höz
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error("Groq API hiba");

            const data = await response.json();
            const jsonResponse = JSON.parse(data.choices[0].message.content);

            const replyText = jsonResponse.reply;
            const detectedFilters = jsonResponse.filters;

            // History frissítése (szövegesen mentjük)
            this.history.push({ role: 'user', text: text });
            this.history.push({ role: 'ai', text: replyText });
            if (this.history.length > this.MAX_HISTORY) this.history = this.history.slice(-this.MAX_HISTORY);

            return { 
                reply: replyText, 
                filters: detectedFilters ? { ...detectedFilters, hasFilters: true } : null 
            };

        } catch (error) {
            console.error("Lunnar AI Error:", error);
            return { 
                reply: "Sajnálom, pici hiba csúszott a gépezetbe. Próbáld újra! 🛠️", 
                filters: null 
            };
        }
    },
    
    hasWord(text, word) { return false; },
    resolveQueryBrand(text) { return null; },
    detectFilters(text) { return { hasFilters: false }; }
};
