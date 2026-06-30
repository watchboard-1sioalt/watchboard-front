import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.png";
import { useUser } from "../../contexts/UserContext";
import { FiLogOut } from "react-icons/fi";
import { useToast } from "../Toast/Toast";
import NotificationBell from "./NotificationBell";



export default function Navbar() {

    const { toast } = useToast();
    const { user, loading, logout } = useUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success({
            title: "Déconnexion réussie.",
            message: "Votre compte a été déconnecté avec succès"
        })
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 h-16 flex justify-between items-center shadow-sm">
            <div className="flex flex-1 gap-2 align-middle items-center">
                <div className="w-12 ">
                    <img src={Logo} />
                </div>

                <h1 className="inline-block text-6xl font-bold
                    bg-gradient-to-r from-blue-400 to-blue-600
                    bg-clip-text text-transparent cursor-pointer" onClick={() => window.location.href = "/"}>
                    WatchBoard
                </h1>
            </div>
            <div className="flex items-center gap-4">
                {!loading && user ? (
                    <>
                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <span className="text-sm text-gray-600 font-medium">
                                {user.prenom} {user.nom.toString().toUpperCase()}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-400 hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none"
                            >
                                <FiLogOut size={22} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className=" flex gap-2.5">
                        <Link to="/login" className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-500 cursor-pointer">
                            Connexion
                        </Link>

                        <Link to="/register" className="bg-white border-blue-600 border text-blue-600 py-2 px-3 rounded-lg hover:bg-gray-100 cursor-pointer">
                            Inscription
                        </Link>
                    </div>
                )}
            </div>
        </header>
    )
}