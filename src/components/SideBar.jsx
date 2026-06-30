import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import {
    FiGrid, FiFileText, FiRss, FiSettings,
    FiChevronLeft, FiChevronRight, FiLogOut, FiUser, FiShield,

} from "react-icons/fi";
import { IoNewspaperOutline } from "react-icons/io5";
import DashboardHome from "./DashboardPages/DashboardHome";
import DashboardArticles from "./DashboardPages/DashboardArticles";
import DashboardFlux from './DashboardPages/DashboardFlux';
import SettingsView from "./DashboardPages/SettingsView";
import DashboardAdmin from './DashboardPages/DashboardAdmin';
import SynthesesView from './DashboardPages/SyntheseView';

const OPEN_W = "16rem";
const SLIM_W = "3.5rem";
const CLOSED_W = "0rem";

export const menuItems = [
    { name: "Tableau de bord", icon: <FiGrid size={20} />, element: <DashboardHome /> },
    { name: "Mes ressources", icon: <FiFileText size={20} />, element: <DashboardArticles /> },
    { name: "Mes flux", icon: <FiRss size={20} />, element: <DashboardFlux /> },
    { name: "Mes synthèses", icon: <IoNewspaperOutline size={20} />, element: <SynthesesView /> },
    { name: "Paramètres", icon: <FiSettings size={20} />, element: <SettingsView /> },
    { name: "Administration", icon: <FiShield size={20} />, admin: true, element: <DashboardAdmin /> }
];

export default function Sidebar({ activeTab, onTabChange }) {
    const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 768);
    const { user, logout } = useUser();
    const navigate = useNavigate();

    // Expose sidebar width as a CSS variable so the content area can react
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        document.documentElement.style.setProperty(
            "--sidebar-width",
            isOpen ? OPEN_W : isMobile ? CLOSED_W : SLIM_W
        );
    }, [isOpen]);

    useEffect(() => {
        const onResize = () => {
            if (!isOpen) {
                document.documentElement.style.setProperty(
                    "--sidebar-width",
                    window.innerWidth < 768 ? CLOSED_W : SLIM_W
                );
            }
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [isOpen]);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-16 left-0 z-30
                    h-[calc(100vh-4rem)]
                    bg-white border-r border-gray-300 shadow-2xl
                    flex flex-col
                    transition-[width] duration-300
                    overflow-visible
                    ${isOpen ? "w-64" : "w-0 md:w-14"}
                `}
            >
                {/* Protruding toggle — desktop only, always visible */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="hidden md:flex absolute -right-5 top-6 z-10 items-center justify-center
                               w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm
                               text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                    title={isOpen ? "Réduire" : "Ouvrir"}
                >
                    {isOpen ? <FiChevronLeft size={13} /> : <FiChevronRight size={13} />}
                </button>

                {/* Inner wrapper clips overflowing text during transition */}
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Mobile close button — visible only when open on small screens */}
                    <div className="md:hidden flex justify-end px-2 pt-3">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center w-8 h-8 rounded-xl
                                       text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            <FiChevronLeft size={18} />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-1">
                        {menuItems.map((item) => {
                            if (item.admin && !user.admin) return;
                            const active = activeTab === item.name;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => onTabChange(item.name)}
                                    title={!isOpen ? item.name : undefined}
                                    className={`
                                        w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-medium
                                        transition-colors duration-150 cursor-pointer group
                                        ${active
                                            ? "bg-blue-50 text-blue-600 font-semibold"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-blue-500"}
                                    `}
                                >
                                    <span className={`shrink-0 transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-blue-400"}`}>
                                        {item.icon}
                                    </span>
                                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                                        {item.name}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="shrink-0 border-t border-gray-300 bg-gray-50/50 px-3 pb-2 pt-1">
                        <div className={`flex items-center gap-3 px-2 py-2 ${isOpen ? "justify-between" : "justify-center"}`}>
                            {isOpen && (
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-gray-900 truncate">
                                        {user?.prenom} {user?.nom.toString().toUpperCase()}
                                    </span>
                                    <span className={`
                                        mt-1.5 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit
                                        ${user?.admin
                                            ? "bg-purple-50 text-purple-600 border border-purple-200"
                                            : "bg-blue-50 text-blue-500 border border-blue-200"}
                                    `}>
                                        {user?.admin ? <FiShield size={10} /> : <FiUser size={10} />}
                                        {user?.admin ? "Administrateur" : "Utilisateur"}
                                    </span>
                                </div>
                            )}

                            <button
                                onClick={handleLogout}
                                title="Déconnexion"
                                className="shrink-0 text-gray-400 hover:text-red-500 p-1.5 rounded-lg
                                           hover:bg-white border border-transparent hover:border-gray-100
                                           hover:shadow-sm transition-all cursor-pointer"
                            >
                                <FiLogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile floating open button (shown only when closed on mobile) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-19 left-2 z-30 md:hidden flex items-center justify-center
                               w-8 h-8 bg-white border border-gray-200 rounded-xl shadow-sm
                               text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
                >
                    <FiChevronRight size={18} />
                </button>
            )}
        </>
    );
}
