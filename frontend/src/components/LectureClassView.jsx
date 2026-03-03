import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Send, Bot, User, MessageSquare } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

export default function LectureClassView() {
    const { id } = useParams();
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'ai', content: "Hi! I'm your AI lecture assistant. I've analyzed this entire class. What would you like to know?" }
    ]);

    const [lectureData, setLectureData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLecture = async () => {
            try {
                // Import explicitly here to avoid breaking existing imports 
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../firebase');

                const docRef = doc(db, "lectures", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setLectureData(docSnap.data());
                } else {
                    console.log("No such lecture!");
                }
            } catch (error) {
                console.error("Error fetching lecture:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLecture();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!lectureData) {
        return (
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <h2 className="text-xl font-bold mb-4">Lecture Not Found</h2>
                <Link to="/student" className="text-primary-600 hover:text-primary-700 underline">Return to Vault</Link>
            </div>
        );
    }

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setQuery('');

        // Simulate loading state
        setChatHistory(prev => [...prev, { role: 'ai', content: '...', isLoading: true }]);

        try {
            // In a real app, this sends `id` and `userMsg` to backend
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lectureId: id, question: userMsg })
            });

            const data = await response.json();

            setChatHistory(prev => [
                ...prev.filter(msg => !msg.isLoading),
                { role: 'ai', content: data.answer || "I couldn't find an answer in the transcript. Could you rephrase your question?" }
            ]);

        } catch (error) {
            console.error(error);
            setChatHistory(prev => [
                ...prev.filter(msg => !msg.isLoading),
                { role: 'ai', content: "Sorry, I'm having trouble connecting to the backend service." }
            ]);
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-4">
                <Link to="/student" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Vault
                </Link>
                <h1 className="text-2xl font-bold pt-1">{lectureData.title}</h1>
                <p className="text-slate-500 text-sm mt-1">Recorded on {lectureData.date}</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

                {/* Left Column: Audio & Summary */}
                <div className="lg:col-span-2 flex flex-col space-y-6 overflow-y-auto pr-2 pb-6">

                    {/* AI Summary Card */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex-1">
                        <div className="flex items-center border-b border-slate-100 pb-4 mb-6">
                            <Bot className="w-6 h-6 text-primary-500 mr-3" />
                            <h2 className="text-xl font-bold text-slate-800">AI Lecture Intelligence</h2>
                        </div>

                        {(() => {
                            let parsedSummary = { topics: [], keyPoints: [], actionItems: [] };
                            let isRawText = false;
                            try {
                                if (typeof lectureData.summary === 'string') {
                                    // Sometimes Gemini might wrap the json in markdown blocks
                                    const cleanedString = lectureData.summary.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
                                    parsedSummary = JSON.parse(cleanedString);
                                } else if (typeof lectureData.summary === 'object') {
                                    parsedSummary = lectureData.summary;
                                }
                            } catch (e) {
                                isRawText = true;
                            }

                            parsedSummary = parsedSummary || { topics: [], keyPoints: [], actionItems: [] };

                            if (isRawText || (!parsedSummary.topics && !parsedSummary.keyPoints)) {
                                return (
                                    <div className="prose prose-slate max-w-none text-slate-600">
                                        <p className="whitespace-pre-wrap">{typeof lectureData.summary === 'string' ? lectureData.summary.replace(/[*#`]/g, '').trim() : "Summary is being processed..."}</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-8">
                                    {Array.isArray(parsedSummary?.topics) && parsedSummary.topics.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Topics Covered</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {parsedSummary.topics.map((topic, i) => (
                                                    <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full border border-primary-100">
                                                        {typeof topic === 'string' ? topic.replace(/\*/g, '').trim() : topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {Array.isArray(parsedSummary?.keyPoints) && parsedSummary.keyPoints.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Key Takeaways</h4>
                                            <ul className="space-y-3">
                                                {parsedSummary.keyPoints.map((point, i) => (
                                                    <li key={i} className="flex text-slate-600">
                                                        <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">{i + 1}</span>
                                                        <span className="leading-relaxed">{typeof point === 'string' ? point.replace(/\*/g, '').trim() : point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {Array.isArray(parsedSummary?.actionItems) && parsedSummary.actionItems.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Action Items</h4>
                                            <ul className="space-y-2">
                                                {parsedSummary.actionItems.map((item, i) => (
                                                    <li key={i} className="flex items-start text-slate-600">
                                                        <span className="text-rose-400 mr-2 font-bold">•</span>
                                                        {typeof item === 'string' ? item.replace(/\*/g, '').trim() : item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Right Column: Chatbot */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-bold flex items-center text-slate-800">
                            <MessageSquare className="w-5 h-5 mr-2 text-primary-500" />
                            Chat w/ Lecture
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-md">Powered by AI</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white ml-2' : 'bg-slate-800 text-white mr-2'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>

                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary-50 text-slate-800 border border-primary-100 rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm'}`}>
                                        {msg.isLoading ? (
                                            <div className="flex space-x-1.5 h-3 items-center px-1">
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white">
                        <form onSubmit={handleAskQuestion} className="relative">
                            <input
                                type="text"
                                placeholder="Ask a question about this class..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-inner text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!query.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-4 h-4 -ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
