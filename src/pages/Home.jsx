import Cards from "../components/Cards/cards";
import SearchBarView from "../components/SearchBarView";
import SideBarView from "../components/SideBar";
import { useUser } from "../contexts/UserContext";

export default function Home() {
    const { user } = useUser();

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            <SideBarView />

            {/* Content shifts with the sidebar via CSS variable */}
            <div
                className="flex flex-col flex-1 transition-[padding] duration-300"
                style={{ paddingLeft: "var(--sidebar-width, 16rem)" }}
            >
                <main className="flex-1 p-8 lg:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <Cards titre="Premier Article" description="Une description personnalisée." />
                        <Cards titre="Deuxième Article" description="Une autre description pour tester." />
                        <Cards titre="Troisième Article" description="Le dernier contenu de la grille." />
                    </div>

                    <div className="mt-5 h-px w-full bg-gray-200" />

                    <section>
                        <h2 className="m-5">Vos articles enregistrés</h2>
                    </section>
                </main>

                <footer className="border-t border-gray-100 py-4 px-6 bg-[#ebebff53]">
                    <p className="text-sm text-gray-400">©2026 WatchBoard</p>
                </footer>
            </div>
        </div>
    );
}
