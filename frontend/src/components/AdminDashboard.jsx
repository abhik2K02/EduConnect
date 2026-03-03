import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Library, Mic, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
    const { register } = useAuth();

    const [institutionId, setInstitutionId] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleCreateUser(e) {
        e.preventDefault();

        if (!institutionId || !loginId || !password) {
            return setError('All fields are required.');
        }

        try {
            setError('');
            setSuccess('');
            setLoading(true);

            // Construct pseudo-email for Firebase Auth
            const safeInst = institutionId.toLowerCase().replace(/[^a-z0-9]/g, '');
            const safeId = loginId.toLowerCase().replace(/[^a-z0-9]/g, '');
            const firebaseEmail = `${safeId}@${safeInst}.educonnect.com`;

            await register(firebaseEmail, password, role);

            setSuccess(`Successfully created ${role} account for ${loginId.toUpperCase()}`);

            // Clear form
            setLoginId('');
            setPassword('');
            // Optional: Keep institution ID so they can rapidly create for the same school

        } catch (err) {
            setError('Failed to create account. ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 border-t-4 border-t-rose-600">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="p-2 bg-rose-50 rounded-lg">
                        <UserPlus className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Account Management</h2>
                        <p className="text-slate-500 text-sm">Create and issue new Teacher and Student accounts.</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                        <div className="flex">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-6">

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Select Account Role
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('student')}
                                className={`${role === 'student'
                                    ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50'
                                    : 'border-slate-300 bg-white hover:bg-slate-50'
                                    } flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200`}
                            >
                                <Library className={`w-6 h-6 mb-2 ${role === 'student' ? 'text-rose-600' : 'text-slate-400'}`} />
                                <span className={`text-sm font-medium ${role === 'student' ? 'text-rose-900' : 'text-slate-700'}`}>
                                    Student
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('teacher')}
                                className={`${role === 'teacher'
                                    ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50'
                                    : 'border-slate-300 bg-white hover:bg-slate-50'
                                    } flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200`}
                            >
                                <Mic className={`w-6 h-6 mb-2 ${role === 'teacher' ? 'text-rose-600' : 'text-slate-400'}`} />
                                <span className={`text-sm font-medium ${role === 'teacher' ? 'text-rose-900' : 'text-slate-700'}`}>
                                    Faculty
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label htmlFor="institution" className="block text-sm font-medium text-slate-700">
                                Institution Code
                            </label>
                            <input
                                id="institution"
                                type="text"
                                placeholder="e.g. CHRIST"
                                required
                                value={institutionId}
                                onChange={(e) => setInstitutionId(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 uppercase"
                            />
                        </div>

                        <div>
                            <label htmlFor="loginId" className="block text-sm font-medium text-slate-700">
                                {role === 'student' ? 'Roll No. (Student ID)' : 'Faculty ID'}
                            </label>
                            <input
                                id="loginId"
                                type="text"
                                placeholder={role === 'student' ? "e.g. 21CS101" : "e.g. T905"}
                                required
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 uppercase"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                            Temporary Password
                        </label>
                        <p className="text-xs text-slate-500 mb-1">Users will use this to sign in initially.</p>
                        <input
                            id="password"
                            type="password"
                            placeholder="Assign a secure password..."
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                        />
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Processing...' : `Create ${role.charAt(0).toUpperCase() + role.slice(1)} Account`}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-sm text-slate-600">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Administration Guidelines
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Ensure <strong>Institution Codes</strong> exactly match your organization's designated code.</li>
                    <li><strong>Roll Numbers/Faculty IDs</strong> must be unique within an institution.</li>
                    <li>Store generated passwords securely before distributing them to users.</li>
                </ul>
            </div>
        </div>
    );
}
