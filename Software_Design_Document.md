# Software Design Document (SDD)
## Project: EduConnect (Lecture Assistant)

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to detail the software architecture, system design, and component level structure for **EduConnect** (also referred to as the Lecture Assistant). This document serves as a guide for developers, project managers, and future maintainers to understand how the system is constructed, how data flows, and how the various technologies interoperate.

### 1.2 Scope
EduConnect is a web-based educational technology platform with distinct interfaces for Teachers and Students.
*   **Teachers** can record live lecture audio in the browser. The audio is transcribed in real-time and uploaded to the cloud, where an AI generates a comprehensive summary and study materials.
*   **Students** can access an archive of these processed lectures, read the generated summaries and transcripts, and interact with an intelligent Chatbot trained specifically on the contents of that exact lecture to ask clarifying questions.

---

## 2. System Architecture

The application follows a standard **Client-Server Architecture** utilizing a modern decoupled stack.

### 2.1 Technology Stack
*   **Frontend**: React.js (Vite), Tailwind CSS, React Router DOM
*   **Backend Server**: Node.js, Express.js
*   **Database**: Firebase Firestore (NoSQL)
*   **Storage**: Firebase Cloud Storage
*   **Authentication**: Firebase Auth (Email/Password)
*   **AI / Integrations**: 
    *   **Deepgram API**: Real-time and batch audio-to-text transcription.
    *   **Google Gemini API**: Large Language Model used for generating intelligent lecture summaries and powering the interactive student chatbot.

### 2.2 High-Level Architecture Diagram
1.  **Client User Interface** (React Single Page Application)
2.  **Firebase Backend-as-a-Service** (Auth, Firestore, Storage)
3.  **Application Server** (Node.js REST API bridging the Client to AI Services)
4.  **External AI Services** (Deepgram, Gemini)

---

## 3. Component Design

### 3.1 Frontend Components
The frontend is logically divided into two primary workspaces managed by `react-router`.

#### Routing (`App.jsx`, `Layout.jsx`, `ProtectedRoute.jsx`)
*   **Protected Routes**: Enforces Role-Based Access Control (RBAC). Verifies the user's role (`teacher` or `student`) via the `AuthContext` before allowing access to specific pages, redirecting unauthenticated users to `/login`.

#### Context (`AuthContext.jsx`)
*   Provides centralized state management for User Authentication.
*   Handles login, registration, and fetching user role metadata from Firestore.

#### Teacher Workspace (`TeacherDashboard.jsx`)
*   **Recording Engine**: Uses `MediaRecorder` API to capture microphone input as `audio/webm;codecs=opus` chunks.
*   **Live Transcription**: Opens a WebSocket connection to Deepgram for real-time subtitling during the recording.
*   **Upload Pipeline**: Submits the final audio Blob via `FormData` to the Node.js backend.

#### Student Workspace (`StudentArchive.jsx`, `LectureClassView.jsx`)
*   **StudentArchive**: Fetches and displays a chronological list of previously recorded lectures from Firestore.
*   **LectureClassView**: Displays the specific details of a lecture (Summary, Full Transcript).
*   **StudentChatbot**: A contextual chat interface that communicates with the Node backend, submitting the user's query alongside the specific lecture's transcript as context for the Gemini model.

### 3.2 Backend Service (`index.js`)
An Express server handling heavy computational tasks and maintaining API secret keys securely.

#### Endpoint 1: `/api/upload-audio` (POST)
*   **Input**: `multipart/form-data` containing the audio `.webm` file.
*   **Process**:
    1.  Receives audio stream (handled via `multer`).
    2.  Sends the buffer to **Deepgram** for a highly accurate batch transcription.
    3.  Sends the resulting transcript to **Gemini API** with a strict prompt to generate a formatted educational summary.
    4.  Saves the metadata (Transcript, Summary, Cloud Storage URL) to Firestore.
*   **Output**: JSON success object with the newly created Firestore `lectureId`.

#### Endpoint 2: `/api/chat` (POST)
*   **Input**: JSON containing the user's string `message`, a selected `role` personality (e.g., Explain Like I'm Five, Academic), and the `lectureContext` (the full transcript text).
*   **Process**:
    1.  Constructs a system prompt instructing the Gemini API to act as a helpful teaching assistant.
    2.  Injects the `lectureContext` so the AI has perfect recall of what the teacher actually said during that specific class.
    3.  Queries the Gemini model.
*   **Output**: JSON containing the AI's string response.

---

## 4. Database Schema (Firestore NoSQL)

### 4.1 `users` Collection
Stores metadata about registered accounts. Authentication credentials themselves are handled securely by Firebase Auth.
*   `uid` (Document ID)
    *   `email`: String
    *   `role`: String ("teacher" or "student")
    *   `createdAt`: ISO Date String

### 4.2 `lectures` Collection
Stores the processed output of every recorded class.
*   `documentId` (Auto-generated UUID)
    *   `title`: String (e.g., "Live Lecture Recording")
    *   `date`: ISO Date String
    *   `audioUrl`: String (Download URI pointing to Firebase Cloud Storage)
    *   `transcript`: String (The raw text output from Deepgram)
    *   `summary`: String (The formatted Markdown output from Gemini)

---

## 5. Security & Limitations

*   **Role-Based Access**: The frontend `ProtectedRoute` isolates functionality. Students cannot access the recording dashboard, and Teachers have their own dedicated space.
*   **API Security**: All external API Keys (Deepgram, Gemini, Firebase Admin) are stored safely on the Node.js backend environment variables and are never exposed to the client bundle.
*   **Storage Limitations**: Audio buffers are temporarily held in RAM during processing via `multer.memoryStorage()`. For production scaling of hour-long lectures, this should be refactored to stream directly to disk or cloud storage to prevent backend memory limits being exceeded.

---
*End of Document*
