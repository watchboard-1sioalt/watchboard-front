import image from "../../images/test.png";
import { useToast } from "../Toast/Toast";




export default function Cards({ couleur, titre, description, date, auteur }) {

     const { toast } = useToast();

    return (
        
        <div className={`w-full max-w-sm rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${couleur ? couleur : 'bg-white'}`}> 
            
            {/* Zone image */}
            <div className="w-full h-48 sm:h-56 overflow-hidden bg-gray-50">
                <img 
                    src={image} 
                    alt="Illustration" 
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
            </div>

            {/* Zone de contenu */}
            <div className="p-5">
                
                {/* Date et Auteur en italique */}
                <p className="text-xs italic text-gray-400 mb-1">
                    {date || "24 Juin 2026"} - Publié par {auteur || "Anonyme"}
                </p>

                {/* Bloc Titre + Icône Enregistrer */}
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                        {titre ? titre : "Titre par défaut"}
                    </h3>
                    
                    {/* Icône Enregistrer (Bookmark) */}
                    <button 
                        onClick={() => toast.success({
                            title: "Article enregistré",
                            message: "Article mis dans vos articles favoris"
                        })}
                        className="text-gray-400 hover:text-blue-400 transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-50 shrink-0"
                        title="Enregistrer l'article"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2} 
                            stroke="currentColor" 
                            className="w-5 h-5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z" />
                        </svg>
                    </button>
                </div>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {description ? description : "Description par défaut"}                
                </p>

                {/* Bouton d'action */}
                <div className="mt-5">
                    <button className="w-full rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow active:scale-[0.98] cursor-pointer">
                        En savoir plus 
                    </button>
                </div>
            </div>
        </div>
    );
}