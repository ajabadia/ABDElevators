
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const logFile = path.join(process.cwd(), 'scripts/gemini-results.txt');
fs.writeFileSync(logFile, `Diagnostic start: ${new Date().toISOString()}\n\n`);

function logResult(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function testModel(modelName) {
    logResult(`--- Testing model: ${modelName} ---`);
    if (!process.env.GEMINI_API_KEY) {
        logResult('❌ Error: GEMINI_API_KEY no encontrada en .env.local');
        return false;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent("Respond only with the word 'READY'");
        const response = result.response.text();
        logResult(`✅ Success! Response: ${response.trim()}`);
        return true;
    } catch (error) {
        logResult(`❌ Failed: ${error.message}`);
        return false;
    }
}

async function run() {
    const models = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp'
    ];

    for (const modelName of models) {
        await testModel(modelName);
    }
    logResult(`\nDiagnostic end: ${new Date().toISOString()}`);
}

run();
