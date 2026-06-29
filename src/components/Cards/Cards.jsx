import { useState } from "react";
import { FiBookmark, FiRss } from "react-icons/fi";
import { BsBookmarkFill } from "react-icons/bs";
import defaultImage from "../../images/test.png";
import Tag from "../Tag";
import { FaLink, FaPlus, FaYoutube } from "react-icons/fa";
import { FaFile } from "react-icons/fa6";

export default function Cards({ couleur, titre, description, date, auteur, image, lien, tags = [], saved = false, onSave, onAddTag, onRemoveTag, onResume, type }) {
    let imgSrc;
    if (image) imgSrc = image;
    else {
        if (type === "file") imgSrc = defaultImage;
        else if (type === "youtube") imgSrc = defaultImage;
        else if (type === "url") imgSrc = defaultImage;
        else imgSrc = defaultImage
    }
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

            <div className="w-full h-44 bg-gray-50 overflow-hidden shrink-0">
                <img
                    src={imgSrc}
                    alt="Illustration"
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.src = defaultImage; }}
                />
            </div>

            <div className="p-5 flex flex-col flex-1">

                <p className="text-xs italic text-gray-400 mb-1">
                    {date || ""}
                </p>

                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl line-clamp-2">
                        {titre}
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

                <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3">
                    {description}
                </p>

                <div className="mt-auto pt-5 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1 mb-1 max-h-20 overflow-y-auto">
                        {onAddTag && (
                            <Tag
                                title={"Ajouter un tag"}
                                icon={<FaPlus size={12} />}
                                onTagClick={onAddTag}
                            />
                        )}

                        {tags.map(tag => (
                            <Tag
                                key={tag.id_tag}
                                title={tag.tag}
                                onRemove={onRemoveTag ? () => onRemoveTag(tag.id_tag) : undefined}
                            />
                        ))}
                    </div>
                    {type && (
                        <div className="mb-2">
                            <Tag
                                key={"r_type"}
                                icon={
                                    type === "rss" ? <FiRss /> :
                                        (type === "youtube" ? <FaYoutube /> :
                                            (type === "file" ? <FaFile /> :
                                                (type === "url" ? <FaLink /> : "")
                                            )
                                        )
                                }
                                title={
                                    type === "rss" ? "RSS" :
                                        (type === "youtube" ? "Youtube" :
                                            (type === "file" ? "Fichier" : "")
                                        )
                                }
                            />
                        </div>
                    )}
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

                    {onResume && (
                        <button
                            onClick={onResume}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] cursor-pointer"
                        >
                            Résumé
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
