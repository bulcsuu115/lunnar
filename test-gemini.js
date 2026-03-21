const apiKey = "AIzaSyDvgOqvLjFPiBsAYKkanJgW5jJB_xVaKBE";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

async function test() {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{parts: [{text: "Szia!"}]}]
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Data:", text);
    } catch(e) {
        console.error(e);
    }
}
test();
