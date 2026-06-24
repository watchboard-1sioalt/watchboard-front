import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import Unverified from "../pages/Unverified/Unverified";

export default function AuthGuard({ children, adminOnly = false }) {
    const { user, loading } = useUser();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !user.admin) {
        return <Navigate to="/" replace />;
    }

    if (!user.admin && !user.validation) {
        return <Unverified />
    }

    return children;
}
