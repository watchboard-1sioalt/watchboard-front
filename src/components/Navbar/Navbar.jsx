import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.png";
import { useUser } from "../../contexts/UserContext";
import SearchBarView from "../SearchBarView";
import { FiLogOut } from "react-icons/fi";


export default function Navbar() {
    const { user, loading, logout } = useUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 h-16 flex justify-between items-center shadow-sm">
            <a className="flex flex-1 gap-2 align-middle items-center cursor-pointer" href={"/"}>
                <div className="w-12 ">
                    <img src={Logo} />
                </div>

                <h1 className="inline-block text-6xl font-bold
                    bg-gradient-to-r from-blue-400 to-blue-600
                    bg-clip-text text-transparent">
                    WatchBoard
                </h1>
            </a>
            <div className="flex items-center gap-4">
                {!loading && user ? (
                    <>
                        <SearchBarView />
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 font-medium">
                                {user.prenom} {user.nom.toString().toUpperCase()}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-400 text-red-400 hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none"
                            >
                                <FiLogOut size={22} />

                            </button>
                        </div>
                    </>
                ) : (
                    <Link to="/login" className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-500 cursor-pointer">
                        Connexion
                    </Link>
                )}
            </div>
        </header>
    )
}