import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, CheckCircle, UploadCloud, X, Bot, Video } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { useAuth } from '../context/AuthContext';
import TeacherChatbot from './TeacherChatbot';

export default function TeacherDashboard() {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    // Timer State
    const [recordingStartTime, setRecordingStartTime] = useState(null);
    const [recordingDurationMs, setRecordingDurationMs] = useState(0);
    const MINIMUM_RECORDING_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

    // Live Transcription State
    const [finalTranscript, setFinalTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [debugLogs, setDebugLogs] = useState([]);
    const deepgramConnectionRef = useRef(null);

    // Edu Assistant State
    const [eduAssistantData, setEduAssistantData] = useState(null);
    const [isEduAssistantLoading, setIsEduAssistantLoading] = useState(false);
    const [isEduListening, setIsEduListening] = useState(false);
    const eduRecognitionRef = useRef(null);

    const chunksRef = useRef([]);
    const { currentUser } = useAuth(); // To get actual teacher ID


    // Initialize Speech Recognition for "Hey Edu" Manual Trigger
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            eduRecognitionRef.current = new SpeechRecognition();
            eduRecognitionRef.current.continuous = false;
            eduRecognitionRef.current.interimResults = false;
            eduRecognitionRef.current.lang = 'en-US';

            eduRecognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log("🎙️ Edu Assistant Manual Trigger:", transcript);
                // Use the current finalTranscript stream as context for the AI
                triggerEduAssistant(transcript, finalTranscript);
            };

            eduRecognitionRef.current.onerror = (event) => {
                console.error("Edu speech recognition error", event.error);
                setIsEduListening(false);
            };

            eduRecognitionRef.current.onend = () => {
                setIsEduListening(false);
            };
        }

        return () => {
            if (deepgramConnectionRef.current) {
                deepgramConnectionRef.current.finish();
            }
            if (eduRecognitionRef.current) {
                eduRecognitionRef.current.abort();
            }
        };
    }, [finalTranscript]); // Recreate to capture the latest finalTranscript in closure


    // Timer Interval
    useEffect(() => {
        let interval;
        if (isRecording && recordingStartTime) {
            interval = setInterval(() => {
                setRecordingDurationMs(Date.now() - recordingStartTime);
            }, 1000);
        } else {
            setRecordingDurationMs(0);
        }
        return () => clearInterval(interval);
    }, [isRecording, recordingStartTime]);

    const triggerEduAssistant = async (commandText, contextText) => {
        setIsEduAssistantLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/teacher/edu-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: commandText, context: contextText })
            });
            if (response.ok) {
                const data = await response.json();
                setEduAssistantData(data);
            }
        } catch (err) {
            console.error("Edu Assistant trigger error:", err);
        } finally {
            setIsEduAssistantLoading(false);
        }
    };

    const toggleEduListening = () => {
        if (!eduRecognitionRef.current) {
            alert("Speech recognition isn't supported in your browser.");
            return;
        }

        if (isEduListening) {
            eduRecognitionRef.current.stop();
        } else {
            setEduAssistantData(null); // Clear previous results
            eduRecognitionRef.current.start();
            setIsEduListening(true);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 1. Initialize Deepgram Connection
            setDebugLogs(["Initializing microphone..."]);
            const deepgram = createClient(import.meta.env.VITE_DEEPGRAM_API_KEY);
            setDebugLogs(prev => [...prev, "Deepgram client created. Connecting to live..."]);

            const connection = deepgram.listen.live({
                model: "nova-2",
                language: "en",
                smart_format: true,
                interim_results: true,
            });
            deepgramConnectionRef.current = connection;

            // 2. Initialize Media Recorder with explicit mimeType if supported
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            }

            setDebugLogs(prev => [...prev.slice(-4), `Using mimetype: ${mimeType}`]);
            const recorder = new MediaRecorder(stream, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    // 1. Save locally for the final lecture upload
                    chunksRef.current.push(e.data);

                    // 2. Send live stream fragment to Deepgram
                    if (connection) {
                        const readyState = connection.getReadyState();
                        if (readyState === 1) { // 1 = OPEN
                            try {
                                connection.send(e.data);
                            } catch (sendErr) {
                                console.error("Deepgram send error:", sendErr);
                                setDebugLogs(prev => [...prev.slice(-4), `Send Error: ${sendErr.message}`]);
                            }
                        }
                    }
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                chunksRef.current = [];

                // Close live connection
                if (deepgramConnectionRef.current) {
                    deepgramConnectionRef.current.finish();
                    deepgramConnectionRef.current = null;
                }
            };

            setMediaRecorder(recorder);

            connection.on(LiveTranscriptionEvents.Open, () => {
                console.log("Deepgram connection opened");
                setDebugLogs(prev => [...prev, "Deepgram WS Opened"]);

                // v3 KeepAlive config
                connection.keepAlive();

                // ONLY start the recorder once the WebSocket is fully open!
                // This guarantees the first chunk (the WebM header) is successfully sent.
                recorder.start(1000);

                connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                    const alternatives = data.channel?.alternatives;
                    if (!alternatives || alternatives.length === 0) return;

                    const transcript = alternatives[0].transcript;
                    if (data.is_final) {
                        if (transcript) {
                            setFinalTranscript(prev => prev + (prev ? ' ' : '') + transcript);
                        }
                        setInterimTranscript('');
                    } else {
                        setInterimTranscript(transcript);
                    }
                });

                connection.on(LiveTranscriptionEvents.Error, (err) => {
                    console.error("Deepgram Error:", err);
                    setDebugLogs(prev => [...prev, `Deepgram WS Error: ${JSON.stringify(err)}`]);
                });

                connection.on(LiveTranscriptionEvents.Close, () => {
                    console.log("Deepgram connection closed.");
                    setDebugLogs(prev => [...prev.slice(-4), "Deepgram WS Closed"]);
                });
            });

            setIsRecording(true);
            setRecordingStartTime(Date.now());
            setAudioBlob(null);
            setUploadStatus('');
            setFinalTranscript('');
            setInterimTranscript('');

        } catch (err) {
            console.error("Error accessing microphone or deepgram:", err);
            alert("Error starting recording. Ensure microphone access is granted and API keys are set.");
        }
    };
    const stopRecording = () => {

        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setRecordingStartTime(null);
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleUploadAndProcess = async () => {
        if (!audioBlob) return;

        setIsUploading(true);
        setUploadStatus('Uploading audio to Storage...');

        try {
            setDebugLogs(prev => [...prev.slice(-4), "Sending audio to backend server..."]);
            setUploadStatus('Uploading and Processing with AI...');

            // Create FormData to send the audio Blob to the backend
            const formData = new FormData();
            const fileName = `lecture-${Date.now()}.webm`;
            formData.append('audio', audioBlob, fileName);
            formData.append('title', 'Live Lecture Recording');
            formData.append('date', new Date().toISOString());

            const response = await fetch('http://localhost:5000/api/upload-audio', {
                method: 'POST',
                // Do not set Content-Type header when sending FormData, fetch sets it automatically with the boundary
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to process lecture');
            }

            setUploadStatus('Lecture processed and saved successfully!');
            setAudioBlob(null);
            setFinalTranscript(''); // Clear subtitles
            setInterimTranscript('');
        } catch (error) {
            console.error("Upload/Process Error:", error);
            setUploadStatus(`Error: ${error.message}`);
        } finally {
            setIsUploading(false);
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-8">

            {/* Top Section: Recording Dashboard */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
                <div className="px-6 py-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                    <h1 className="text-2xl font-bold text-slate-800">Teacher Dashboard</h1>
                    <p className="mt-2 text-slate-500">Record your lecture to automatically generate a transcript, summary, and AI-chat capabilities for your students.</p>
                </div>

                <div className="p-8 flex flex-col items-center justify-center flex-1 min-h-[350px]">

                    {/* Recording UI */}
                    <div className="relative group mb-8 mt-4">
                        <div className={`absolute -inset-4 bg-gradient-to-r ${isRecording ? 'from-red-500 to-rose-500 opacity-20 animate-pulse' : 'from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-10 transition-opacity'} rounded-full blur-xl`}></div>

                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                disabled={isUploading || isProcessing}
                                className="relative flex items-center justify-center w-24 h-24 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:scale-105 transition-all disabled:opacity-50"
                            >
                                <Mic className="w-10 h-10" />
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                title="Stop Recording"
                                className={`relative flex items-center justify-center w-24 h-24 rounded-full text-white shadow-lg transition-all bg-red-500 hover:bg-red-600 hover:scale-105 animate-pulse`}
                            >
                                <Square className="w-8 h-8 fill-current" />
                            </button>
                        )}
                    </div>

                    <div className="text-center min-h-[8rem] w-full flex flex-col items-center justify-start">
                        {isRecording && (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center space-x-2 text-rose-500 font-medium mb-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                    <span>Recording in progress...</span>
                                </div>
                                <div className="text-sm font-mono text-slate-600 mb-4 bg-slate-100 px-3 py-1 rounded-full">
                                    {Math.floor(recordingDurationMs / 60000).toString().padStart(2, '0')}:
                                    {Math.floor((recordingDurationMs % 60000) / 1000).toString().padStart(2, '0')}
                                </div>
                            </div>
                        )}

                        {audioBlob && !isUploading && !isProcessing && (
                            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-emerald-600 font-medium flex items-center mb-4">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Recording captured successfully
                                </p>
                                <button
                                    onClick={handleUploadAndProcess}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all"
                                >
                                    <UploadCloud className="w-5 h-5 mr-2" />
                                    Upload & Process Lecture
                                </button>
                            </div>
                        )}

                        {(isUploading || isProcessing) && (
                            <div className="flex flex-col items-center text-primary-600 space-y-3">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="font-medium">{uploadStatus}</span>
                            </div>
                        )}

                        {uploadStatus && !isUploading && !isProcessing && !audioBlob && (
                            <p className="text-slate-600 font-medium">{uploadStatus}</p>
                        )}
                    </div>
                </div>

                {/* Subtitles Block */}
                <div className="bg-slate-900 w-full min-h-[140px] p-6 flex items-center justify-center border-t border-slate-800">
                    <p className="text-white text-lg md:text-xl font-medium text-center max-w-4xl leading-relaxed">
                        {!isRecording && !finalTranscript && !interimTranscript && (
                            <span className="opacity-40 flex items-center justify-center">
                                <Mic className="w-5 h-5 mr-2" />
                                Live subtitles will appear here during the lecture.
                            </span>
                        )}
                        {finalTranscript} <span className="opacity-70">{interimTranscript}</span>
                        {(isRecording && !finalTranscript && !interimTranscript) && <span className="opacity-50">Listening...</span>}
                    </p>
                </div>
            </div>

            {/* Bottom Section: AI Assistant */}
            <div className="w-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
                <TeacherChatbot />
            </div>

            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Recordings</h2>
                <div className="text-center py-8 text-slate-500 italic border-2 border-dashed border-slate-100 rounded-xl">
                    Your recently processed lectures will appear here.
                </div>
            </div>

            {/* Edu Assistant Manual Trigger FAB (Floating Action Button) */}
            <div className="fixed bottom-6 left-6 z-50">
                <button
                    onClick={toggleEduListening}
                    className={`flex items-center justify-center p-4 rounded-full shadow-2xl transition-all duration-300 ${isEduListening
                        ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                        : 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-105'
                        }`}
                    title={isEduListening ? "Listening... click to stop" : "Ask Live Edu Assistant"}
                >
                    <Bot className="w-6 h-6 mr-2 hidden md:block" />
                    {isEduListening ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
                    <span className="font-medium mr-1 hidden md:block">Ask Edu</span>
                </button>
            </div>

            {/* Edu Assistant Floating Overlay */}
            {(isEduAssistantLoading || eduAssistantData) && (
                <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-bottom-5">
                    <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-3 flex items-center justify-between text-white">
                        <div className="flex items-center space-x-2">
                            <Bot className="w-5 h-5" />
                            <span className="font-bold">Live Edu Assistant</span>
                        </div>
                        <button onClick={() => { setEduAssistantData(null); setIsEduAssistantLoading(false); }} className="text-white hover:text-slate-200 transition-colors">
                            <X className="w-5 h-5 pointer-events-auto" />
                        </button>
                    </div>

                    {isEduAssistantLoading ? (
                        <div className="p-8 flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                            <p className="text-sm font-medium animate-pulse">Analyzing command context...</p>
                        </div>
                    ) : (
                        <div className="p-0 max-h-[60vh] flex flex-col overflow-y-auto">
                            {eduAssistantData?.searchQuery && (
                                <div className="aspect-video w-full bg-slate-900 border-b border-slate-100 relative group">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(eduAssistantData.searchQuery)}`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="absolute inset-0 z-0"
                                    ></iframe>
                                </div>
                            )}

                            {eduAssistantData?.notes && (
                                <div className="p-5 text-sm text-slate-700 bg-white">
                                    <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider text-center">Suggested Notes</h4>
                                    <ul className="space-y-3">
                                        {eduAssistantData.notes.split('\n').map((line, i) => {
                                            const cleanLine = line.replace(/[*#`]/g, '').trim();
                                            if (!cleanLine) return null;

                                            // Render bullet strings gracefully
                                            if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                                                return (
                                                    <li key={i} className="flex items-start text-slate-600">
                                                        <span className="text-primary-500 mr-2 font-bold">•</span>
                                                        <span className="leading-relaxed">{cleanLine.replace(/^[-*]\s*/, '')}</span>
                                                    </li>
                                                );
                                            }
                                            return <p key={i} className="font-semibold text-slate-800">{cleanLine}</p>;
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
