const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI({ apiKey: API_KEY });

app.post('/generate-questions', async (req, res) => {
    const { topics, numQuestions, difficulty } = req.body;

    try {
        const prompt = `Create ${numQuestions} ${difficulty} multiple-choice questions on the following topics: ${topics}. Provide each question with four options and indicate the correct answer. Format the response as JSON array with objects containing 'question', 'options', and 'answer'.`;

        const response = await genAI.generateText({
            model: 'gemini-pro',
            prompt,
            temperature: 0.7,
            maxTokens: 1024,
        });

        const questions = JSON.parse(response.text); // Adjust based on actual response format
        res.json({ success: true, questions });
    } catch (error) {
        console.log('Error generating questions:', error);
        res.status(500).json({ success: false, message: 'Failed to generate questions.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'bot.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
