const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
// and place it in the backend root as 'serviceAccountKey.json'
try {
    const serviceAccount = require("./serviceAccountKey.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "edu-connect-6f8f7.firebasestorage.app"
    });

    console.log("Firebase Admin initialized successfully");
} catch (error) {
    console.error("Firebase Admin initialization error:", error.message);
    console.warn("Make sure you have downloaded serviceAccountKey.json and placed it in the backend root.");
}

const db = admin.firestore();
const storage = admin.storage();

module.exports = { admin, db, storage };
