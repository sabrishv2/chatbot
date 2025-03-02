const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

async function runChat(userInput, chatHistory) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1000,
    };

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        // ... other safety settings
    ];

    const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: chatHistory,
    });

    const result = await chat.sendMessage(userInput);
    const responseText = result.response.text();

    // Parse responseText to generate assessment data
    const assessment = parseAssessment(responseText);

    return { responseText, assessment };
}

function parseAssessment(responseText) {
    const sections = responseText.split('\n\n'); // Split by sections (assuming '\n\n' is the separator)
    return sections.map(section => {
        const [topic, difficulty, ...questions] = section.split('\n');
        return {
            topic,
            difficulty,
            questions: questions.map((q, index) => {
                const [text, ...options] = q.split('|');
                return {
                    text,
                    options
                };
            })
        };
    });
}


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/main.html');
});

app.post('/chat', async (req, res) => {
    try {
        const userInput = req.body?.userInput;
        console.log('incoming /chat req', userInput);
        if (!userInput) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // Example of maintaining the chat history
        const chatHistory = [
            {
                role: "user",
                parts: [{ text: "You are an assessment assistant that helps users create custom assessments. Gather details such as subject, difficulty level, topics, number of questions, MCQs format with 4 Options for each and every questions and generate the assessment based on these inputs."}],
            },
            {
                role: "model",
                parts: [{ text: "Hello! Please provide the subject of the test."}],
            },
        ];

        const { responseText, assessment } = await runChat(userInput, chatHistory);

        res.json({ response: responseText, assessment });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
