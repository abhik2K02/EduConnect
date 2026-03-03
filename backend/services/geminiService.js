const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let ai;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key') {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Generates a summary for a given transcription
 * @param {string} text The text to summarize
 * @returns {Promise<string>} The generated summary
 */
async function generateSummary(text) {
    if (!ai) {
        console.warn("Gemini API key not provided or is default. Returning dummy summary.");
        return "This is a dummy summary. Ensure you configure GEMINI_API_KEY in backend/.env.";
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please summarize the following lecture transcription accurately and concisely. Highlight the main topics and key takeaways.\n\nTranscription:\n${text}`,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating summary with Gemini:", error);
        throw error;
    }
}

/**
 * Creates embeddings for a given text
 * @param {string} text The text to embed
 * @returns {Promise<number[]>} The vector embedding
 */
async function createEmbedding(text) {
    if (!ai) {
        console.warn("Gemini API key not provided or is default. Returning dummy embedding.");
        return new Array(768).fill(0.1); // text-embedding-004 has dimension 768
    }

    try {
        const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: text,
        });

        // The response structure might differ depending on sdk version, adjust as needed
        return response.embeddings[0].values;
    } catch (error) {
        console.error("Error generating embedding with Gemini:", error);
        throw error;
    }
}

/**
 * Generates an answer to a chat query given some context
 * @param {string} query The user's question
 * @param {string} context The retrieved context from the vector database
 * @returns {Promise<string>} The generated answer
 */
async function generateChatAnswer(query, context) {
    if (!ai) {
        console.warn("Gemini API key not provided or is default. Returning dummy answer.");
        return "This is a dummy chat answer. Ensure you configure GEMINI_API_KEY in backend/.env.";
    }

    try {
        const prompt = `You are a helpful teaching assistant helping a student understand a lecture. 
Use the following context from the lecture to answer the student's question. 
If the answer is not contained in the context, say "I don't have enough information from the lecture to answer that."

Context:
${context}

Student Question:
${query}

Answer:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating chat answer with Gemini:", error);
        throw error;
    }
}

/**
 * Generates general advice and assistance for a teacher
 * @param {string} prompt The teacher's request
 * @returns {Promise<string>} The generated advice
 */
async function generateTeacherAdvice(prompt) {
    if (!ai) {
        console.warn("Gemini API key not provided or is default. Returning dummy advice.");
        return "This is dummy teacher advice. Ensure you configure GEMINI_API_KEY in backend/.env.";
    }

    try {
        const systemInstruction = `You are an expert, highly experienced teaching assistant and instructional designer. 
Your goal is to help teachers brainstorm lesson plans, create quiz questions, explain difficult concepts, and improve their teaching materials. 
Be concise, pedagogical, encouraging, and highly practical in your advice.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemInstruction}\n\nTeacher Request:\n${prompt}\n\nResponse:`,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating teacher advice with Gemini:", error);
        throw error;
    }
}

/**
 * Filters out unwanted words or off-topic conversation from a transcript,
 * keeping only class-related content.
 * @param {string} text The raw transcript
 * @returns {Promise<string>} The filtered transcript
 */
async function filterTranscript(text) {
    if (!ai) {
        console.warn("Gemini API key not provided. Returning original transcript.");
        return text;
    }

    try {
        const systemInstruction = `You are an expert teaching assistant and editor. 
Your task is to take a raw lecture transcript and clean it up. 
Please filter out any unwanted words, filler words, casual off-topic conversations, and interruptions. 
Keep only the content that is strictly related to the class topic and educational material. 
Do not summarize it; preserve the original wording of the educational content as much as possible, just remove the fluff.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemInstruction}\n\nRaw Transcript:\n${text}\n\nFiltered Transcript:`,
        });

        return response.text;
    } catch (error) {
        console.error("Error filtering transcript with Gemini:", error);
        return text; // Fallback to original transcript if filtering fails
    }
}

/**
 * Generates notes and search queries for the "Hey Edu" Live Assistant
 * @param {string} command The specific request spoken by the teacher
 * @param {string} context The recent lecture transcript for context
 * @returns {Promise<object>} JSON object with notes and searchQuery
 */
async function generateEduAssistantContent(command, context) {
    if (!ai) {
        console.warn("Gemini API key not provided or is default. Returning dummy edu assistant content.");
        return {
            notes: "Please configure your GEMINI_API_KEY in the backend `.env` file to enable Live Edu Assistant notes.",
            searchQuery: "education"
        };
    }

    try {
        const systemInstruction = `You are a real-time teaching assistant named "Edu". 
The teacher has just spoken a command to you during a live lecture. 
Your goal is to fulfill their request by providing concise, well-formatted Markdown notes and identifying a highly relevant YouTube search query.

Respond with a strictly formatted JSON object matching this schema:
{
  "notes": "string (Markdown formatted notes answering the request. Use bullet points and bold text for readability. Limit to 3-5 key points.)",
  "searchQuery": "string (A 3-5 word search term that would yield the most relevant educational YouTube videos for this topic)"
}

Do NOT wrap the JSON in markdown code blocks. Return ONLY the raw JSON object string.`;

        const prompt = `${systemInstruction}

Recent Lecture Context:
${context || "No recent context available."}

Teacher Command:
"${command}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const rawText = response.text;

        try {
            return JSON.parse(rawText);
        } catch (parseError) {
            // Fallback parsing just in case
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        }

    } catch (error) {
        console.error("Error generating Edu Assistant content with Gemini:", error);
        throw error;
    }
}

module.exports = { generateSummary, createEmbedding, generateChatAnswer, generateTeacherAdvice, filterTranscript, generateEduAssistantContent };
