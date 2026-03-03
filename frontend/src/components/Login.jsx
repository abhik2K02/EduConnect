import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Building2 } from 'lucide-react';

export default function Login() {
    const [institutionId, setInstitutionId] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, userRole } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!institutionId || !loginId) {
            return setError('Institution ID and Login ID are required.');
        }

        try {
            setError('');
            setLoading(true);

            // Construct pseudo-email for Firebase Auth
            const safeInst = institutionId.toLowerCase().replace(/[^a-z0-9]/g, '');
            const safeId = loginId.toLowerCase().replace(/[^a-z0-9]/g, '');
            const firebaseEmail = `${safeId}@${safeInst}.educonnect.com`;

            const { user, role } = await login(firebaseEmail, password);

            if (role === 'teacher') {
                navigate('/teacher');
            } else if (role === 'student') {
                navigate('/student');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Failed to sign in. Please check your credentials or Institution Code.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ background: 'transparent' }}>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(3,179,195,0.15)', border: '1px solid rgba(3,179,195,0.5)' }}>
                        <Building2 className="w-8 h-8" style={{ color: '#03b3c3' }} />
                    </div>
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-white">
                    Institution Portal
                </h2>
                <p className="mt-2 text-center text-sm" style={{ color: 'rgba(180,220,255,0.7)' }}>
                    Sign in to your academic account
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="py-8 px-4 sm:rounded-xl sm:px-10" style={{ background: 'rgba(5,5,20,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(3,179,195,0.25)', borderTop: '4px solid #03b3c3', boxShadow: '0 0 40px rgba(3,179,195,0.15)' }}>
                    {error && (
                        <div className="mb-4 border-l-4 border-red-500 p-4 rounded" style={{ background: 'rgba(220,38,38,0.15)' }}>
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="institution" className="block text-sm font-medium" style={{ color: 'rgba(180,220,255,0.8)' }}>
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
                                        className="appearance-none block w-full px-3 py-2 rounded-md sm:text-sm uppercase text-white" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(3,179,195,0.3)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="loginId" className="block text-sm font-medium" style={{ color: 'rgba(180,220,255,0.8)' }}>
                                    Roll No. / Faculty ID
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="loginId"
                                        name="loginId"
                                        type="text"
                                        placeholder="e.g. 21CS101"
                                        required
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 rounded-md sm:text-sm uppercase text-white" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(3,179,195,0.3)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'rgba(180,220,255,0.8)' }}>
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
                                    className="appearance-none block w-full px-3 py-2 rounded-md sm:text-sm text-white" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(3,179,195,0.3)', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-bold text-white disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #03b3c3, #6750a2)', boxShadow: '0 0 20px rgba(3,179,195,0.3)' }}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(3,179,195,0.2)' }}>
                        <div className="text-center">
                            <p className="text-sm" style={{ color: 'rgba(180,220,255,0.6)' }}>
                                Don't have an account?{' '}
                                <Link to="/register" className="font-semibold hover:underline" style={{ color: '#03b3c3' }}>
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
