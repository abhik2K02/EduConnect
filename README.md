# Lecture Assistant

A full-stack application built for Teachers to record lectures and for Students to review AI-generated summaries and chat with the lecture content. 

This project uses:
- **Frontend**: React, Vite, TailwindCSS (v4)
- **Backend**: Node.js, Express
- **AI Services**: Deepgram (Speech-to-Text), Gemini 1.5 Flash (Summarization & Chat)
- **Database/Storage**: Firebase (Firestore, Storage, Auth) & Pinecone (Vector DB)

## Directory Structure

- `/frontend` - The React application (run `npm run dev`)
- `/backend` - The Node.js server (run `npm run start` or `node index.js`)

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Frontend Environment Variables
In the `/frontend` directory, create a `.env` file (one has been scaffolded for you) and add your Firebase client config:
```env
VITE_FIREBASE_API_KEY=your_value
VITE_FIREBASE_AUTH_DOMAIN=your_value
VITE_FIREBASE_PROJECT_ID=your_value
VITE_FIREBASE_STORAGE_BUCKET=your_value
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
VITE_FIREBASE_APP_ID=your_value
```

### 3. Backend Environment Variables
In the `/backend` directory, create a `.env` file and add the following keys:
```env
PORT=5000
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket.appspot.com

# AI & Database Keys
DEEPGRAM_API_KEY=your_deepgram_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=lecture-assistant
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Firebase Admin Setup (Critical)
The backend needs a `serviceAccountKey.json` to securely communicate with Firestore and Firebase Storage.
1. Go to your Firebase Console -> Project Settings -> Service Accounts.
2. Click "Generate new private key".
3. Keep the file name or rename it to `serviceAccountKey.json` and place it in the root of the `/backend` directory. 
*(Note: Never commit this file to public version control!)*

## Running the app

**1. Start the Backend server**
```bash
cd backend
node firebaseAdmin.js # Note: Implement your Express endpoints here
```

**2. Start the Frontend development server**
```bash
cd frontend
npm run dev
```

Navigate to the provided localhost URL. You can toggle between `/teacher` and `/student` to view the different dashboards.
