const { Pinecone } = require('@pinecone-database/pinecone');

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'lecture-assistant';

let pinecone;
let index;

if (PINECONE_API_KEY && PINECONE_API_KEY !== 'your_pinecone_api_key') {
    pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
    index = pinecone.index(PINECONE_INDEX_NAME);
}

/**
 * Upserts a set of vectors to Pinecone
 * @param {Array<{id: string, values: number[], metadata: any}>} vectors Vectors to upsert
 */
async function upsertVectors(vectors) {
    if (!index) {
        console.warn("Pinecone API key not provided or is default. Bypassing upsert.");
        return;
    }

    try {
        await index.namespace('transcripts').upsert(vectors);
    } catch (error) {
        console.error("Error upserting vectors to Pinecone:", error);
        throw error;
    }
}

/**
 * Queries the nearest neighbors in Pinecone
 * @param {Array<number>} queryVector The embedding vector of the query
 * @param {number} topK Number of results to return
 * @param {Object} filter Optional metadata filter (e.g. for a specific lectureId)
 * @returns {Promise<Array>} The matched records
 */
async function queryContext(queryVector, topK = 5, filter = {}) {
    if (!index) {
        console.warn("Pinecone API key not provided or is default. Returning dummy context.");
        return [{ metadata: { text: "This is a dummy retrieved context. Ensure you configure PINECONE_API_KEY in backend/.env to search true lecture context." } }];
    }

    try {
        const queryResponse = await index.namespace('transcripts').query({
            topK,
            vector: queryVector,
            includeValues: false,
            includeMetadata: true,
            filter: filter
        });

        return queryResponse.matches;
    } catch (error) {
        console.error("Error querying Pinecone:", error);
        throw error;
    }
}

module.exports = { upsertVectors, queryContext };
