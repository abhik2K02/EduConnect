import { useState, useEffect } from 'react';
import { PlayCircle, Clock, BookOpen, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function StudentArchive() {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // For demo purposes, fallback to static data if no Firebase records
        const loadLectures = async () => {
            try {
                const q = query(collection(db, "lectures"), orderBy("date", "desc"));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (data.length > 0) {
                    setLectures(data);
                } else {
                    setLectures([]);
                }
            } catch (err) {
                console.error("Error fetching lectures:", err);
            } finally {
                setLoading(false);
            }
        };

        loadLectures();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <BookOpen className="w-6 h-6 mr-3 text-primary-500" />
                        Lecture Vault
                    </h1>
                    <p className="mt-1 text-slate-500">Access your past classes, summaries, and chat with your AI assistant.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lectures.map(lecture => (
                    <div key={lecture.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col">

                        <div className="p-6 flex-grow">
                            <div className="flex items-center text-xs text-slate-400 font-medium mb-3">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {new Date(lecture.date || lecture.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                <span className="mx-2">•</span>
                                {lecture.duration || 'Full Class'}
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-primary-600 transition-colors">
                                {lecture.title || `Lecture Class`}
                            </h3>

                            <p className="text-sm text-slate-500 line-clamp-3">
                                {lecture.summary ? typeof lecture.summary === 'string' ? lecture.summary.replace(/[*#`]/g, '').trim() : "Summary available inside." : "Summary pending generation..."}
                            </p>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center">
                                <PlayCircle className="w-4 h-4 mr-1.5" />
                                Review Class
                            </button>
                            <div className="w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center pointer-events-none" title="AI Chat Available">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Click overlay to route to actual detail page */}
                        <Link to={`/student/lecture/${lecture.id}`} className="absolute inset-0 z-10"><span className="sr-only">View Lecture</span></Link>

                    </div>
                ))}

                {lectures.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                        No lectures recorded yet. Check back after your next class!
                    </div>
                )}
            </div>

        </div>
    );
}
