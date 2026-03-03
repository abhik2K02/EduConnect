import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function TeacherChatbot() {
    const [messages, setMessages] = useState([
        { role: 'model', content: "Hello! I'm your AI Teaching Assistant. How can I help you prepare for your lessons today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceMuted, setVoiceMuted] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + ' ' + transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition isn't supported in your browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const speakText = (text) => {
        if (voiceMuted || !('speechSynthesis' in window)) return;

        // Stop any ongoing speech
        window.speechSynthesis.cancel();

        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a good English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Female'))
            || voices.find(v => v.lang.includes('en-'))
            || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.05;
        utterance.pitch = 1.1; // Slightly higher pitch for a "Siri-like" feel

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const toggleMute = () => {
        if (!voiceMuted) stopSpeaking();
        setVoiceMuted(!voiceMuted);
    };

    // Clean up speech synthesis on unmount
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/teacher/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMessage })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();
            const cleanAnswer = data.answer.replace(/[*#`]/g, '').trim();

            setMessages(prev => [...prev, { role: 'model', content: cleanAnswer }]);
            speakText(cleanAnswer);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white flex items-center">
                <div className="bg-primary-100 p-2 rounded-lg mr-3">
                    <Bot className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        AI Teaching Assistant
                        {isSpeaking && <span className="ml-2 flex space-x-1 h-3 items-center">
                            <span className="w-1 h-2 bg-primary-500 rounded-full animate-bounce"></span>
                            <span className="w-1 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-1 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        </span>}
                    </h2>
                    <p className="text-xs text-slate-500">Brainstorm, plan, and create</p>
                </div>
                <button
                    onClick={toggleMute}
                    title={voiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                    className="ml-auto p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    {voiceMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex text-sm ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3 flex-shrink-0">
                                <Bot className="w-5 h-5 text-primary-600" />
                            </div>
                        )}

                        <div className={`px-4 py-3 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed ${msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center ml-3 flex-shrink-0">
                                <User className="w-5 h-5 text-slate-600" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3 flex-shrink-0">
                            <Bot className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-500 rounded-bl-none flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-3 rounded-xl transition-colors flex items-center justify-center ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title={isListening ? "Stop listening" : "Start voice dictation"}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type or speak a question..."
                        className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
