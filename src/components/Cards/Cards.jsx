import { useState } from "react";
import { FiBookmark } from "react-icons/fi";
import { BsBookmarkFill } from "react-icons/bs";
import defaultImage from "../../images/test.png";
import Tag from "../Tag";
import { FaPlus } from "react-icons/fa";

export default function Cards({ couleur, titre, description, date, auteur, image, lien, tags = [], saved = false, onSave }) {
    const imgSrc = image || defaultImage;
    const [isSaved, setIsSaved] = useState(saved);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!onSave || saving) return;
        setSaving(true);
        const next = !isSaved;
        setIsSaved(next);
        try {
            await onSave(next);
        } catch {
            setIsSaved(!next);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`w-full max-w-sm rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col ${couleur ? couleur : 'bg-white'}`}>

            <div className="w-full bg-gray-50 flex items-center justify-center">
                <img
                    src={imgSrc}
                    alt="Illustration"
                    className="w-full object-contain"
                    onError={e => { e.currentTarget.src = defaultImage; }}
                />
            </div>

            <div className="p-5 flex flex-col flex-1">

                <p className="text-xs italic text-gray-400 mb-1">
                    {date || ""}
                </p>

                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                        {titre ? titre : "Titre par défaut"}
                    </h3>

                    {onSave && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-50 shrink-0 disabled:opacity-50 ${isSaved ? "text-blue-500" : "text-gray-400 hover:text-blue-400"}`}
                            title={isSaved ? "Retirer des enregistrés" : "Enregistrer l'article"}
                        >
                            {isSaved ? <BsBookmarkFill size={18} /> : <FiBookmark size={18} />}
                        </button>
                    )}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {description ? description : "Description par défaut"}
                </p>

                <div className="mt-auto pt-5">
                    <div className="flex gap-1 my-3">
                        <Tag
                            title={"Ajouter un tag"}
                            icon={<FaPlus size={12} />}
                            onTagClick={function () { console.log('clic') }}
                        />

                        {tags.map(tag => {
                            return <Tag title={tag.tag} />
                        })}
                    </div>
                    {lien ? (
                        <a
                            href={lien}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow active:scale-[0.98] cursor-pointer"
                        >
                            En savoir plus
                        </a>
                    ) : (
                        <button className="w-full rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow active:scale-[0.98] cursor-pointer">
                            En savoir plus
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
