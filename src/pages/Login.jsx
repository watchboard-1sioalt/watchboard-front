import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Login() {
    const { login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname ?? "/";

    const [email, setEmail]         = useState("");
    const [password, setPassword]   = useState("");
    const [error, setError]         = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || "Email ou mot de passe incorrect");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col justify-center items-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full mx-4">

                <div className="flex flex-col justify-center items-center mb-6">
                    <div className="text-blue-400 rounded-full bg-blue-50 p-4 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Connexion</h1>
                </div>

                {error && (
                    <p className="w-full mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">
                        {error}
                    </p>
                )}

                <form onSubmit={handleLogin} className="flex flex-col space-y-3 w-full">
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50 transition-colors"
                    />
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50 transition-colors"
                    />

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-xl bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 px-4 text-sm shadow-sm transition-colors cursor-pointer"
                        >
                            {submitting ? "Connexion..." : "Se connecter"}
                        </button>
                    </div>
                </form>

                <p className="text-gray-400 text-xs mt-4">OU</p>

                <Link to="/Register">
                    <button className="text-sm font-medium text-blue-500 mt-2 hover:underline cursor-pointer bg-transparent border-none">
                        Créer un compte
                    </button>
                </Link>
            </div>
        </div>
    );
}
