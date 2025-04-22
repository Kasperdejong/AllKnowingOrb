
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form")
    form.addEventListener("submit", (e) => askQuestion(e))
    console.log("Button event attached");
});

async function askQuestion(e) {
    e.preventDefault();
    const chatfield = document.getElementById("chatfield");
    const resultdiv = document.getElementById("resultdiv");
    const formButton = document.getElementById("formButton");

    resultdiv.textContent = "";
    formButton.disabled = true; // 🔒 Disable button
    formButton.textContent = "You will now wait until i'm done speaking!"; // Optional loading text

    const options = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: chatfield.value })
    };

    const response = await fetch("http://localhost:3000/", options);
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    const typingSpeed = 50;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");

        for (let line of lines) {
            if (line.startsWith("data: ")) {
                const text = line.replace("data: ", "");

                // Skip the special "[DONE]" marker
                if (text.includes("[DONE]")) continue;

                for (let char of text) {
                    resultdiv.textContent += char;
                    await new Promise(r => setTimeout(r, typingSpeed));
                }
            }
        }

        buffer = "";
    }
    formButton.disabled = false; // ✅ Re-enable button
    formButton.textContent = "click me!"; // Reset button text
}


