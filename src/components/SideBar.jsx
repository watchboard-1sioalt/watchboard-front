import { useState } from "react";

export default function Sidebar({ mail, prenom }) {    // Permet de savoir quel onglet est actuellement sélectionné
    const [activeTab, setActiveTab] = useState("Tableau de bord");

    const menuItems = [
        { name: "Tableau de bord", icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
        )},
        { name: "Articles", icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
        )},
        { name: "Statistiques", icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )},
        { name: "Paramètres", icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )},
    ];

    return (
// Dans ton fichier Sidebar, change la balise <aside> pour mettre ça :
    <aside className="fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white text-gray-700 flex flex-col justify-between border-r border-gray-100 shadow-sm z-50">            
            {/* Zone Haute : Menu */}
            <div className="px-4 py-6">
                
                {/* Liste des onglets de navigation */}
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isSelected = activeTab === item.name;
                        return (
                            <button
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group ${
                                    isSelected 
                                        ? "bg-blue-50 text-blue-600 font-semibold" 
                                        : "hover:bg-gray-50 text-gray-500 hover:text-blue-500"
                                }`}
                            >
                                {/* Icône réactive */}
                                <span className={`${isSelected ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600 transition-colors"}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

                {/* Zone Basse : Section Profil de l'utilisateur */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100/70 transition-colors duration-200 cursor-pointer">
                        <div className="flex items-center gap-3">
                            {/* Infos utilisateur */}
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                                    {prenom || "Prenom test"}
                                </span>
                                <span className="text-xs text-gray-400 truncate max-w-[120px]">
                                    {mail || "mail@mail.com"}
                                </span>
                            </div>
                        </div>

                    {/* Icône de déconnexion */}
                    <button className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors shadow-none hover:shadow-sm border border-transparent hover:border-gray-100" title="Déconnexion">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>

        </aside>
    );
}