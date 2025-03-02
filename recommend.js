const express = require('express'); // Import the Express framework to handle HTTP requests
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai'); // Import Google's Generative AI SDK
const dotenv = require('dotenv').config(); // Load environment variables from a `.env` file

const app = express(); // Initialize an Express application
const port = process.env.PORT || 3000; // Set the port for the server (either from environment variables or default to 3000)
app.use(express.json()); // Middleware to parse incoming JSON requests

// Define the model name and API key from the environment variables
const MODEL_NAME = "gemini-pro"; // Name of the Google Generative AI model
const API_KEY = process.env.API_KEY; // API key for authenticating with Google Generative AI service

// Function to interact with the Google Generative AI model
async function runChat(userInput, chatHistory) {
    const genAI = new GoogleGenerativeAI(API_KEY); // Create an instance of the Google Generative AI client
    const model = genAI.getGenerativeModel({ model: MODEL_NAME }); // Get the generative model using the specified model name

    // Configuration for generating the response
    const generationConfig = {
        temperature: 0.9, // Controls the randomness of the output (higher means more creative responses)
        topK: 1, // Limits the pool of tokens considered for each step to top 1
        topP: 1, // Limits the pool of tokens based on cumulative probability
        maxOutputTokens: 1000, // Maximum number of tokens (words) in the output
    };

    // Safety settings to prevent harmful content in the response
    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT, // Category to block harassment-related content
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Block content deemed medium risk or above
        },
        // Additional safety settings can be added here if needed
    ];

    // Start a new chat interaction with the generative model
    const chat = model.startChat({
        generationConfig, // Apply the generation configuration
        safetySettings, // Apply safety filters
        history: chatHistory, // Pass the chat history to maintain context
    });

    // Send the user's input to the model and get the response
    const result = await chat.sendMessage(userInput);
    const responseText = result.response.text(); // Extract the response text

    // Format the response into a more readable and structured format
    const formattedResponse = formatResponse(responseText);

    return { formattedResponse }; // Return the formatted response
}

// Helper function to format the response into structured feedback with markdown-like syntax
function formatResponse(responseText) {
    // Replace specific phrases in the response with headings or sections
    let formattedText = responseText
        .replace(/\*\*Feedback:\*\*/g, "\n**Feedback:**\n") // Adds a "Feedback" section
        .replace(/\*\*Strengths:\*\*/g, "\n**Strengths:**\n") // Adds a "Strengths" section
        .replace(/\*\*Areas for Improvement:\*\*/g, "\n**Areas for Improvement:**\n") // Adds an "Areas for Improvement" section
        .replace(/\*\*Recommendations for Skill Improvement:\*\*/g, "\n**Recommendations for Skill Improvement:**\n") // Adds a "Recommendations for Skill Improvement" section
        .replace(/\*\*Additional Tips:\*\*/g, "\n**Additional Tips:**\n"); // Adds an "Additional Tips" section

    return formattedText.trim(); // Remove any extra whitespace from the response and return it
}

// Basic route to serve an HTML page when visiting the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/main.html'); // Send the 'main.html' file located in the same directory
});

// Route to handle incoming chat requests from the client
app.post('/chat', async (req, res) => {
    try {
        const userInput = req.body?.userInput; // Extract the user's input from the request body
        console.log('Incoming /chat request:', userInput); // Log the incoming user input

        // If no user input is provided, return a 400 Bad Request error
        if (!userInput) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // Chat history to maintain context between the user and the AI
        const chatHistory = [
            {
                role: "user",
                parts: [{ text: "You are an assessment assistant that gives feedback and recommendations for skill improvement based on user performance." }],
            },
            {
                role: "model",
                parts: [{ text: "Please provide the user's performance details." }],
            },
            {
                role: "user",
                parts: [{ text: userInput }],
            }
        ];

        // Generate the response using the AI model
        const { formattedResponse } = await runChat(userInput, chatHistory);

        // Send the formatted response back to the client
        res.json({ response: formattedResponse });
    } catch (error) {
        // Log any errors and return a 500 Internal Server Error
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
