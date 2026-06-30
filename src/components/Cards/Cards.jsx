import { useState, useEffect } from "react";
import { FiBookmark, FiRss, FiGlobe, FiImage } from "react-icons/fi";
import { BsBookmarkFill } from "react-icons/bs";
import defaultImage from "../../images/test.png";
import Tag from "../Tag";
import { FaLink, FaPlus, FaYoutube } from "react-icons/fa";
import { FaFile } from "react-icons/fa6";
import { IoIosSend } from "react-icons/io";

export default function Cards({ couleur, titre, description, date, auteur, image, lien, tags = [], saved = false, canShare = false, onSave, onAddTag, onRemoveTag, onResume, onShare, type }) {
    const [isSaved, setIsSaved] = useState(saved);
    const [saving, setSaving] = useState(false);
    const [tagsOpen, setTagsOpen] = useState(false);

    useEffect(() => { setIsSaved(saved); }, [saved]);

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
        <div className={`w-full rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col h-full ${couleur ? couleur : 'bg-white'}`}>

            <div className="w-full h-44 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center rounded-t-2xl">
                {image ? (
                    <img
                        src={image}
                        alt="Illustration"
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.src = defaultImage; }}
                    />
                ) : type === "url" ? (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                        <FiGlobe size={48} strokeWidth={1} />
                    </div>
                ) : type === "file" ? (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                        <FaFile size={44} />
                    </div>
                ) : type === "rss" ? (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                        <FiImage size={48} strokeWidth={1} />
                        <span className="text-xs font-medium text-gray-400">No image</span>
                    </div>
                ) : (
                    <img
                        src={defaultImage}
                        alt="Illustration"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">

                <p className="text-xs italic text-gray-400 mb-1 h-4 shrink-0">
                    {date || ""}
                </p>

                <div className="flex justify-between items-start gap-4 h-14 shrink-0">
                    <h3 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl line-clamp-2 overflow-hidden">
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

                <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3 h-18 shrink-0 overflow-hidden">
                    {description}
                </p>

                <div className="mt-auto pt-5 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {onAddTag && (
                            <Tag
                                title="Ajouter"
                                icon={<FaPlus size={12} />}
                                onTagClick={onAddTag}
                            />
                        )}
                        {tagsOpen
                            ? tags.map(tag => (
                                <Tag
                                    key={tag.id_tag}
                                    title={tag.tag}
                                    onRemove={onRemoveTag ? () => onRemoveTag(tag.id_tag) : undefined}
                                />
                            ))
                            : <>
                                {tags.length > 0 && (
                                    <Tag
                                        title={tags[0].tag}
                                        onRemove={onRemoveTag ? () => onRemoveTag(tags[0].id_tag) : undefined}
                                    />
                                )}
                                {tags.length > 1 && (
                                    <button
                                        onClick={() => setTagsOpen(true)}
                                        className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border border-gray-200"
                                    >
                                        +{tags.length - 1}
                                    </button>
                                )}
                            </>
                        }
                        {tagsOpen && tags.length > 1 && (
                            <button
                                onClick={() => setTagsOpen(false)}
                                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border border-gray-200"
                            >
                                Moins
                            </button>
                        )}
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
                                            (type === "file" ? "Fichier" :
                                                (type === "url" ? "Site web" : "")
                                            )
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

                    <div className="flex gap-2">
                        {onResume && (
                            <button
                                onClick={onResume}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] cursor-pointer"
                            >
                                Résumé
                            </button>
                        )}

                        {canShare && (
                            <button
                                onClick={onShare}
                                className="w-12 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] cursor-pointer text-center"
                            >
                                <IoIosSend size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
