import { AzureChatOpenAI } from "@langchain/openai";
import {ChatPromptTemplate, PromptTemplate} from "@langchain/core/prompts";
import {AIMessage, HumanMessage, SystemMessage} from "@langchain/core/messages";
import express from 'express'
import cors from 'cors'

const model = new AzureChatOpenAI({
    temperature: 1,
    verbose: false,
});

let conversationHistory = [
    new SystemMessage("You are an all knowing being that looks down on human lifeforms. Remember to be helpful and concise. Add humor and talk down on humans."),
    new HumanMessage("What's the difference between a dog and a cat?"),
    new AIMessage("Hahahaha foolish human the difference lies in how they look, what animal group they are in, their behaviours and what sounds they make. For example: Cats say 'meow' and dogs say 'woof'. Silly human."),
];

const app = express()
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const LOTRapiKey = process.env.LORD_OF_THE_RINGS_API_KEY;

async function getLOTRInfo() {
    try {
        const response = await fetch('https://the-one-api.dev/v2/character', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${LOTRapiKey}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('LOTR Data:', data); // Log the full data to check the structure

        // Assuming the data is structured with a "docs" array
        const characters = data.docs;
        const randomIndex = Math.floor(Math.random() * characters.length);
        const character = characters[randomIndex];        console.log(`First Character: ${character.name}`);

        // Returning formatted character info
        return character.name;

    } catch (error) {
        console.error('Error fetching LOTR info:', error);
        return 'Gandalf';  // Fallback character in case of an error
    }
}

getLOTRInfo()

app.get('/', async (req, res) => {
    const result = await returnInput("How do i cook rice?")
    res.json({ message: result })
})

app.post('/', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = req.body.prompt;
    console.log("the user asked for " + prompt);

    await returnInput(prompt, res);
})

async function returnInput(prompt, res) {
    console.log("returnInput received prompt:", prompt);
    const character = await getLOTRInfo();
    console.log('Using character:', character);

    conversationHistory.push(new HumanMessage(prompt));
    conversationHistory.push(new AIMessage(`mention a fun fact about ${character} everytime you give a response`));

    const stream = await model.stream(conversationHistory);

    for await (const chunk of stream) {
        const text = chunk?.content || '';
        if (text) {
            res.write(`data: ${text}\n\n`);
        }
    }

    // Laat weten dat de stream klaar is
    res.write(`data: [DONE]\n\n`);
    res.end();

    conversationHistory.push(new AIMessage(stream?.content || ''));
}


app.listen(3000, () => console.log(`Server running on http://localhost:3000`))
