import Cards from "../Cards/Cards";

export default function DashboardHome() {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <Cards titre="Premier Article" description="Une description personnalisée." />
                <Cards titre="Deuxième Article" description="Une autre description pour tester." />
                <Cards titre="Troisième Article" description="Le dernier contenu de la grille." />
            </div>

            <div className="mt-5 h-px w-full bg-gray-200" />

            <section>
                <h2 className="m-5">Vos articles enregistrés</h2>
            </section>
        </>
    )
}