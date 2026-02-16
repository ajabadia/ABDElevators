
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const logFile = path.join(process.cwd(), 'scripts/gemini-list.txt');
fs.writeFileSync(logFile, `Model List start: ${new Date().toISOString()}\n\n`);

async function run() {
    if (!process.env.GEMINI_API_KEY) {
        fs.appendFileSync(logFile, '❌ Error: GEMINI_API_KEY no encontrada\n');
        return;
    }

    // We can't easily list models with the SDK without a special method? 
    // Actually, we can use the fetch API to call the listModels endpoint.
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        fs.appendFileSync(logFile, JSON.stringify(data, null, 2));
    } catch (error) {
        fs.appendFileSync(logFile, `❌ Failed to list models: ${error.message}\n`);
    }
}

run();
