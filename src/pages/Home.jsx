import Cards from "../components/Cards/cards";
import logo from "../images/logo.png";
import SearchBarView from "../components/SearchBarView";
import SideBarView from "../components/SideBar";
import login_photo from "../images/la-personne.png";


// Page d'accueil (quand on arrive sur le site => /)
export default function Test() {

    return (
        <>
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 h-16 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">WatchBoard</h1>
            </div>
            <div className="flex items-center gap-4">
                <SearchBarView />
                <img 
                    src={login_photo} 
                    alt="Profil" 
                    className="h-9 w-9 rounded-full object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" 
                />
            </div>
        </header>

<div className="flex flex-1 bg-gray-50/50 min-h-screen">
            <div className="flex bg-gray-50/50 min-h-screen">
                {/* La barre latérale */}
                <SideBarView />

                {/* Tout ton reste de code va ICI (header, main, cartes, footer...) */}
                <div className="flex-1 pl-64">
                    {/* Mets ton <header>, tes <Cards /> et ton <footer> ici */}
                </div>
            </div>

            <main className="flex-1 pl-64 p-8 lg:p-12">
                {/* Grille responsive qui aligne proprement tes cartes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <Cards titre="Premier Article" description="Une description personnalisée." />
                    <Cards titre="Deuxième Article" description="Une autre description pour tester." />
                    <Cards titre="Troisième Article" description="Le dernier contenu de la grille." />
                </div>
            </main>
        </div>

            <footer>
                <nav className="border-gray-100 py-4 px-4 bg-[#ebebff53]" items-center justify-between flex >
                    <p className="">©2026 WatchBoard</p>
                </nav>
            </footer>
        </>
    )
}