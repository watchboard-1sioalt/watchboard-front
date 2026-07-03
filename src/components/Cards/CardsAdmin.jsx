import image from "../../images/test.png";

export default function CardsAdmin({ titre, description, couleur }) {
    return (
        <div className={`w-full max-w-sm rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${couleur ? couleur : 'bg-white'}`}>

            <div className="p-5">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                        {titre ? titre : "Titre par défaut"}
                    </h3>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {description ? description : "Description par défaut"}
                </p>

                <div className="mt-5">
                    <button className="w-full rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-500 hover:shadow active:scale-[0.98] cursor-pointer">
                        En savoir plus
                    </button>
                </div>
            </div>
        </div>
    );
}