import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRole }) {
    const { currentUser, userRole, loading } = useAuth();

    if (loading || (currentUser && userRole === null)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && userRole !== allowedRole) {
        if (userRole === 'teacher') return <Navigate to="/teacher" replace />;
        if (userRole === 'student') return <Navigate to="/student" replace />;

        // If they have no role at all, redirect to login or a setup page
        return <Navigate to="/login" replace />;
    }

    return children;
}