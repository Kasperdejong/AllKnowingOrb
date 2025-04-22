document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const chatfield = document.getElementById("chatfield");
    const voiceButton = document.getElementById("voiceButton");

    let speechHeard = false;
    let recognition;

    form.addEventListener("submit", (e) => askQuestion(e));

    voiceButton.addEventListener("click", () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        if (voiceButton.disabled) return;

        recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        speechHeard = false;

        recognition.onstart = () => {
            voiceButton.textContent = "Listening...";
            voiceButton.disabled = true;
        };

        recognition.onresult = (event) => {
            speechHeard = true;
            const transcript = event.results[0][0].transcript;
            chatfield.value = transcript;
            form.requestSubmit();
        };

        recognition.onerror = (event) => {
            console.error("Speech error", event.error);
            resetVoiceButton();
        };

        recognition.onend = () => {
            if (!speechHeard) {
                console.warn("No speech detected");
                resetVoiceButton();
            }
            // If speech was heard, askQuestion will re-enable the button
        };

        recognition.start();
    });

    console.log("Button event attached");
});

function resetVoiceButton() {
    const voiceButton = document.getElementById("voiceButton");
    voiceButton.textContent = "🎤 Speak your question";
    voiceButton.disabled = false;
}

async function askQuestion(e) {
    e.preventDefault();
    const resultdiv = document.getElementById("resultdiv");
    const chatfield = document.getElementById("chatfield");
    const formButton = document.getElementById("formButton");
    const voiceButton = document.getElementById("voiceButton");

    resultdiv.textContent = "";
    formButton.disabled = true;
    voiceButton.disabled = true;
    formButton.textContent = "You will now wait until I'm done speaking!";

    try {
        const response = await fetch("http://localhost:3000/", {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: chatfield.value })
        });

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

                    if (text.includes("[DONE]")) continue;

                    for (let char of text) {
                        resultdiv.textContent += char;
                        await new Promise(r => setTimeout(r, typingSpeed));
                    }
                }
            }

            buffer = "";
        }
    } catch (error) {
        console.error("Failed to fetch response:", error);
        resultdiv.textContent = "Sorry, something went wrong.";
    }

    formButton.disabled = false;
    formButton.textContent = "click me!";
    voiceButton.disabled = false;
    resetVoiceButton();
}
