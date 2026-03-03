const { createClient } = require("@deepgram/sdk");

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

let deepgram;
if (DEEPGRAM_API_KEY && DEEPGRAM_API_KEY !== 'your_deepgram_api_key') {
    deepgram = createClient(DEEPGRAM_API_KEY);
}

/**
 * Transcribes audio buffer using Deepgram
 * @param {Buffer} buffer The audio file buffer
 * @param {string} mimetype The mimetype of the audio file
 * @returns {Promise<string>} The transcribed text
 */
async function transcribeAudio(buffer, mimetype) {
    if (!deepgram) {
        console.warn("Deepgram API key not provided or is default. Returning dummy transcription.");
        return "This is a dummy transcription because the Deepgram API key was not configured.";
    }

    try {
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            buffer,
            {
                model: "nova-2",
                smart_format: true,
                mimetype,
            }
        );

        if (error) {
            throw new Error(`Deepgram error: ${error.message}`);
        }

        const transcript = result.results?.channels[0]?.alternatives[0]?.transcript;
        if (!transcript) {
            throw new Error("No transcription found in Deepgram response.");
        }

        return transcript;
    } catch (error) {
        console.error("Error calling Deepgram API:", error);
        throw error;
    }
}

module.exports = { transcribeAudio };
