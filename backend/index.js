require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { db, storage } = require("./firebaseAdmin");
const { transcribeAudio } = require("./services/deepgramService");
const { generateSummary, createEmbedding, generateChatAnswer, generateTeacherAdvice, filterTranscript, generateEduAssistantContent } = require("./services/geminiService");
const { upsertVectors, queryContext } = require("./services/pineconeService");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Basic health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "EduConnect Backend is running" });
});

/**
 * Handle lecture audio upload, processing, and storage
 */
app.post("/api/upload-audio", upload.single("audio"), async (req, res) => {
    try {
        const file = req.file;
        const { title, date } = req.body;

        if (!file) {
            return res.status(400).json({ error: "No audio file provided" });
        }

        console.log("Processing uploaded file:", file.originalname);

        // 1. Transcribe audio with Deepgram
        const transcript = await transcribeAudio(file.buffer, file.mimetype);
        console.log("Transcription complete. Length:", transcript.length);

        // 1.5 Filter the transcript to remove off-topic/unwanted words
        console.log("Filtering transcript...");
        const filteredTranscript = await filterTranscript(transcript);
        console.log("Filtering complete. Filtered Length:", filteredTranscript.length);

        // 2. Generate summary with Gemini based on filtered transcript
        let summaryContext = filteredTranscript;
        if (summaryContext.length > 30000) { //truncate if extremely long to avoid token limits
            summaryContext = summaryContext.substring(0, 30000) + "...";
        }
        const summary = await generateSummary(summaryContext);
        console.log("Summary generation complete.");

        // 3. Upload raw audio file to Firebase Storage (Graceful Fallback)
        let audioUrl = "";
        try {
            const fileRef = storage.bucket().file(`lectures/${Date.now()}_${file.originalname}`);
            await fileRef.save(file.buffer, {
                metadata: { contentType: file.mimetype },
            });
            await fileRef.makePublic(); // Optional based on rules, here assuming public access
            audioUrl = `https://storage.googleapis.com/${storage.bucket().name}/${fileRef.name}`;
            console.log("Successfully uploaded raw audio to Firebase Storage.");
        } catch (storageErr) {
            console.warn("⚠️ Bypassed Firebase Storage Upload. Storage Bucket is likely not initialized or requires Blaze plan upgrade.");
            // Generate a dummy URL so the frontend doesn't crash trying to parse it later
            audioUrl = "https://bypassed-storage.test/audio.webm";
        }

        // 4. Save metadata to Firestore database
        const lectureData = {
            title: title || file.originalname,
            date: date || new Date().toISOString(),
            audioUrl: audioUrl, // Might be empty/dummy if Storage failed
            originalTranscript: transcript,
            transcript: filteredTranscript, // Store the cleaned version as main transcript
            summary: summary,
            uploadedAt: new Date().toISOString()
        };
        const docRef = await db.collection("lectures").add(lectureData);
        const lectureId = docRef.id;
        console.log("Saved lecture metadata to Firestore with ID:", lectureId);

        // 5. Chunk the transcript for vector storage (simple chunking logic)
        // In a production app, use advanced chunking strategies (e.g., langchain)
        const CHUNK_SIZE = 1000; // rough characters
        const chunks = [];
        for (let i = 0; i < filteredTranscript.length; i += CHUNK_SIZE) {
            chunks.push(filteredTranscript.slice(i, i + CHUNK_SIZE));
        }

        const vectors = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];
            const embedding = await createEmbedding(chunkText);

            vectors.push({
                id: `${lectureId}-chunk-${i}`,
                values: embedding,
                metadata: {
                    lectureId: lectureId,
                    text: chunkText,
                    chunkIndex: i
                }
            });
        }

        // 6. Save chunks to Pinecone vector DB
        if (vectors.length > 0) {
            await upsertVectors(vectors);
            console.log("Upserted chunks to Pinecone.");
        }

        res.json({
            message: "Lecture processed successfully",
            id: lectureId,
            lectureData
        });

    } catch (error) {
        console.error("Upload process error:", error);
        res.status(500).json({ error: error.message || "An error occurred during processing" });
    }
});

/**
 * Handle student questions specific to a lecture
 */
app.post("/api/chat", async (req, res) => {
    try {
        const { question, lectureId } = req.body;

        if (!question) {
            return res.status(400).json({ error: "No question provided" });
        }

        console.log("Received question:", question, "for lecture ID:", lectureId);

        // 1. Create embedding for the user's question
        const queryVector = await createEmbedding(question);

        // 2. Query Pinecone for relevant context
        // If lectureId is provided, filter by it. Otherwise, search across all lectures
        const filter = lectureId ? { lectureId: { $eq: lectureId } } : {};
        const matches = await queryContext(queryVector, 5, filter);

        // 3. Extract text from matched contexts
        const contextText = matches.map(match => match.metadata.text).join("\n\n---\n\n");
        console.log(`Found ${matches.length} context shards.`);

        // 4. Send question + context to Gemini for final answer
        const answer = await generateChatAnswer(question, contextText);

        res.json({
            answer: answer,
            contextUsed: matches.length > 0
        });

    } catch (error) {
        console.error("Chat process error:", error);
        res.status(500).json({ error: "Failed to generate answer" });
    }
});

/**
 * Handle general teacher AI assistance requests
 */
app.post("/api/teacher/chat", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "No prompt provided" });
        }

        console.log("Received teacher prompt:", prompt);

        // Send prompt to Gemini for advice
        const answer = await generateTeacherAdvice(prompt);

        res.json({
            answer: answer
        });

    } catch (error) {
        console.error("Teacher chat error:", error);
        res.status(500).json({ error: "Failed to generate teaching advice" });
    }
});

/**
 * Handle "Hey Edu" Live Assistant Requests
 */
app.post("/api/teacher/edu-assistant", async (req, res) => {
    try {
        const { command, context } = req.body;

        if (!command) {
            return res.status(400).json({ error: "No command provided" });
        }

        console.log(`Received Hey Edu command: "${command}" with context length: ${context ? context.length : 0}`);

        // Forward to Gemini for notes and search query extraction
        const result = await generateEduAssistantContent(command, context);

        res.json(result);

    } catch (error) {
        console.error("Edu Assistant error:", error);
        res.status(500).json({ error: "Failed to generate Edu Assistant content" });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
