
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form")
    form.addEventListener("submit", (e) => askQuestion(e))
    console.log("Button event attached");
});

async function askQuestion(e) {
    e.preventDefault()
    const chatfield = document.getElementById("chatfield")
    const resultdiv = document.getElementById("resultdiv")
    const options = {
        method: 'POST',
        mode:'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: chatfield.value })
    }

    const response = await fetch("http://localhost:3000/", options)
    if(response.ok){
        const data = await response.json()
        console.log(data)
        resultdiv.innerHTML = data.message
    } else {
        console.error(response.status)
    }
}


