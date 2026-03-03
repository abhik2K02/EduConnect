import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Register() {
    // We are reusing the Register.jsx file as the Admin Setup page
    const [institutionId, setInstitutionId] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [secretKey, setSecretKey] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    // The hardcoded secret key required to setup the first Admin
    const MASTER_SECRET = 'admin@123';

    async function handleSubmit(e) {
        e.preventDefault();

        if (secretKey !== MASTER_SECRET) {
            return setError('Invalid Secret Setup Key. You are not authorized to initialize this system.');
        }

        if (!institutionId || !loginId) {
            return setError('Institution Code and Admin ID are required.');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setSuccess('');
            setLoading(true);

            // Construct pseudo-email for Firebase Auth
            const safeInst = institutionId.toLowerCase().replace(/[^a-z0-9]/g, '');
            const safeId = loginId.toLowerCase().replace(/[^a-z0-9]/g, '');
            const firebaseEmail = `${safeId}@${safeInst}.educonnect.com`;

            // Hardcode role to 'admin'
            await register(firebaseEmail, password, 'admin');

            setSuccess('System Initialized Successfully! Redirecting to Admin Dashboard...');

            // Route an admin to the new admin dashboard after a delay
            setTimeout(() => {
                navigate('/admin');
            }, 2000);

        } catch (err) {
            setError('Failed to initialize Admin account. ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-rose-500">
                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                    </div>
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-white">
                    Initial System Setup
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Create the Master Administrator Account
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-800 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-slate-700 border-t-4 border-t-rose-500">

                    {error && (
                        <div className="mb-4 bg-red-900/50 border-l-4 border-red-500 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-200">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 bg-emerald-900/50 border-l-4 border-emerald-500 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-emerald-200">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <label htmlFor="secretKey" className="block text-sm font-semibold text-rose-400">
                                Secret Setup Key
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Required to authorize system initialization.</p>
                            <div className="mt-1">
                                <input
                                    id="secretKey"
                                    name="secretKey"
                                    type="password"
                                    placeholder="Enter the master password..."
                                    required
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm text-white placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="institution" className="block text-sm font-medium text-slate-300">
                                    Institution Code
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="institution"
                                        name="institution"
                                        type="text"
                                        placeholder="e.g. CHRIST"
                                        required
                                        value={institutionId}
                                        onChange={(e) => setInstitutionId(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm text-white placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm uppercase"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="loginId" className="block text-sm font-medium text-slate-300">
                                    Admin ID
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="loginId"
                                        name="loginId"
                                        type="text"
                                        placeholder="e.g. ADMIN_01"
                                        required
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm text-white placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm text-white placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300">
                                Confirm Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm text-white placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !!success}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-900 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Initializing...' : 'Initialize System'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 border-t border-slate-700 pt-6">
                        <div className="text-center">
                            <p className="text-sm text-slate-400">
                                This page is for secure setup only.{' '}
                                <Link to="/login" className="font-semibold text-rose-400 hover:text-rose-300">
                                    Return to Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
