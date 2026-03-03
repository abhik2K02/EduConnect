import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Mic, Library, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, userRole, logout } = useAuth();

    const isTeacherRoute = location.pathname.includes('/teacher');
    const isAdminRoute = location.pathname.includes('/admin');

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
            {/* Navigation */}
            <nav className="sticky top-0 z-50 shadow-lg" style={{ background: 'rgba(5,5,20,0.75)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(3,179,195,0.25)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                    EduConnect
                                </span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {userRole === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className={`${isAdminRoute
                                            ? 'border-rose-500 text-slate-900'
                                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                            } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                    >
                                        <ShieldAlert className="w-4 h-4 mr-2" />
                                        SysAdmin
                                    </Link>
                                )}

                                {userRole === 'teacher' && (
                                    <Link
                                        to="/teacher"
                                        className={`${isTeacherRoute
                                            ? 'border-primary-500 text-slate-900'
                                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                            } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                    >
                                        <Mic className="w-4 h-4 mr-2" />
                                        Teacher Dashboard
                                    </Link>
                                )}

                                {userRole === 'student' && (
                                    <Link
                                        to="/student"
                                        className={`${!isTeacherRoute && location.pathname !== '/'
                                            ? 'border-primary-500 text-slate-900'
                                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                            } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                    >
                                        <Library className="w-4 h-4 mr-2" />
                                        Student Vault
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {currentUser && (
                                <span className="text-sm hidden sm:block" style={{ color: 'rgba(180,220,255,0.7)' }}>
                                    {currentUser.email} ({userRole || 'student'})
                                </span>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-sm font-medium transition-colors" style={{ color: 'rgba(180,220,255,0.8)' }}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ position: 'relative', zIndex: 1 }}>
                <Outlet />
            </main>
        </div>
    );
}
