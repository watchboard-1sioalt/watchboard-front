import { useState, useEffect, useRef } from "react";
import { FiX, FiGlobe, FiYoutube, FiFile, FiSearch, FiPlus } from "react-icons/fi";
import { FiCheck } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import Tag from "../Tag";

const API = "http://localhost/api";

function extractYoutubeId(url) {
    try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.slice(1);
        return u.searchParams.get("v") ?? u.pathname.split("/").pop() ?? null;
    } catch {
        return null;
    }
}

const TYPES = [
    { id: "url", label: "Page web", icon: <FiGlobe size={15} /> },
    { id: "youtube", label: "YouTube", icon: <FiYoutube size={15} /> },
    { id: "file", label: "Document", icon: <FiFile size={15} /> },
];

export default function CreateRessourceModal({ isOpen, onClose, token, onCreated }) {
    const [type, setType] = useState("url");
    const [url, setUrl] = useState("");
    const [nom, setNom] = useState("");
    const [resume, setResume] = useState("");
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [titleError, setTitleError] = useState(false);
    const [fetchingTitle, setFetchingTitle] = useState(false);
    const [previewThumbnail, setPreviewThumbnail] = useState(null);

    // Tags inline
    const [allTags, setAllTags] = useState([]);
    const [tagSearch, setTagSearch] = useState("");
    const [loadingTags, setLoadingTags] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]); // tags à attacher après création
    const [creatingTag, setCreatingTag] = useState(false);

    const fileRef = useRef(null);

    // Auto-remplissage du titre + thumbnail pour YouTube via oEmbed (debounce 700ms)
    useEffect(() => {
        if (type !== "youtube") return;
        if (!url.trim()) { setPreviewThumbnail(null); return; }
        let cancelled = false;
        const timer = setTimeout(async () => {
            setFetchingTitle(true);
            try {
                const res = await fetch(
                    `https://www.youtube.com/oembed?url=${encodeURIComponent(url.trim())}&format=json`
                );
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                if (data.title && !nom.trim()) setNom(data.title);
                if (data.thumbnail_url) setPreviewThumbnail(data.thumbnail_url);
            } catch {
                // CORS possible — le backend prend le relais à la création
            } finally {
                if (!cancelled) setFetchingTitle(false);
            }
        }, 700);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [url, type]);

    // Reset à chaque ouverture
    useEffect(() => {
        if (!isOpen) return;
        setType("url");
        setUrl("");
        setNom("");
        setResume("");
        setFile(null);
        setSelectedTags([]);
        setTagSearch("");
        setPreviewThumbnail(null);
        if (fileRef.current) fileRef.current.value = "";

        setLoadingTags(true);
        fetch(`${API}/tags/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setAllTags)
            .catch(() => setAllTags([]))
            .finally(() => setLoadingTags(false));
    }, [isOpen, token]);

    // Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        if (isOpen) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredTags = allTags.filter(t =>
        t.tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
    const hasExactMatch = allTags.some(t =>
        t.tag.toLowerCase() === tagSearch.trim().toLowerCase()
    );
    const selectedIds = new Set(selectedTags.map(t => t.id_tag));

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            selectedIds.has(tag.id_tag)
                ? prev.filter(t => t.id_tag !== tag.id_tag)
                : [...prev, tag]
        );
    };

    const createTag = async () => {
        const tagName = tagSearch.trim();
        if (!tagName) return;
        setCreatingTag(true);
        try {
            const res = await fetch(`${API}/tags/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ tag: tagName }),
            });
            if (!res.ok) throw new Error();
            const acRes = await fetch(`${API}/tags/autocomplete?q=${encodeURIComponent(tagName)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const suggestions = await acRes.json();
            const found = suggestions.find(t => t.tag.toLowerCase() === tagName.toLowerCase());
            if (!found) throw new Error();
            setAllTags(prev => [...prev, found]);
            setSelectedTags(prev => [...prev, found]);
            setTagSearch("");
        } finally {
            setCreatingTag(false);
        }
    };

    const attachTags = async (ressourceId) => {
        for (const tag of selectedTags) {
            await fetch(`${API}/ressources/${ressourceId}/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ tag_id: tag.id_tag }),
            });
        }
    };

    const fetchYoutubeTitle = async (videoUrl) => {
        try {
            const res = await fetch(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
            );
            if (!res.ok) return null;
            const data = await res.json();
            return data.title ?? null;
        } catch {
            return null;
        }
    };

    const handleCreate = async () => {
        setTitleError(false);

        // Titre obligatoire pour tous les types sauf YouTube (auto-fetch si vide)
        if (!nom.trim() && type !== "youtube") {
            setTitleError(true);
            return;
        }

        setSaving(true);
        try {
            let res;
            let finalNom = nom.trim();

            if (type === "file") {
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                if (finalNom) formData.append("nom_original", finalNom);
                res = await fetch(`${API}/ressources/from-file`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
            } else if (type === "youtube") {
                // Si pas de titre, on récupère le titre via oEmbed
                if (!finalNom) {
                    finalNom = (await fetchYoutubeTitle(url)) ?? "";
                }
                if (!finalNom) {
                    setTitleError(true);
                    setSaving(false);
                    return;
                }
                const videoId = extractYoutubeId(url);
                const thumbnail = videoId
                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    : undefined;
                res = await fetch(`${API}/ressources/from-youtube`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ url, nom_original: finalNom, image: thumbnail }),
                });
            } else {
                res = await fetch(`${API}/ressources/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        url,
                        nom_original: finalNom,
                        resume: resume || undefined,
                    }),
                });
            }

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message ?? "Erreur lors de la création.");
            }

            const created = await res.json();

            // Pour YouTube et fichier, l'endpoint ne prend pas de résumé → patch séparé
            if (resume.trim() && type !== "url") {
                await fetch(`${API}/ressources/${created.id_ressource}/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ resume }),
                });
                created.resume = resume;
            }

            if (selectedTags.length > 0) {
                await attachTags(created.id_ressource);
                created.tags = selectedTags;
            } else {
                created.tags = [];
            }

            onCreated(created);
            onClose();
        } catch (err) {
            // L'erreur remonte au parent via la prop onError si nécessaire
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const canSubmit = type === "file"
        ? (!!file && !!nom.trim())
        : (!!url.trim() && (type === "youtube" || !!nom.trim()));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-semibold text-blue-600">Ajouter une ressource</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Corps scrollable */}
                <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">

                    {/* Sélecteur de type */}
                    <div className="flex gap-2">
                        {TYPES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setType(t.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${type === t.id
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                    }`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Champ URL ou fichier */}
                    {type === "file" ? (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">
                                Fichier <span className="text-red-400">*</span>
                                <span className="text-xs text-gray-400 font-normal ml-1">(txt, md, pdf — max 5 Mo)</span>
                            </label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".txt,.md,.pdf"
                                onChange={e => setFile(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer file:cursor-pointer"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">
                                {type === "youtube" ? "URL YouTube" : "URL de la page"}
                                <span className="text-red-400 ml-0.5">*</span>
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder={type === "youtube" ? "https://youtube.com/watch?v=..." : "https://exemple.com/article"}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                            />
                            {type === "youtube" && previewThumbnail && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 h-36">
                                    <img
                                        src={previewThumbnail}
                                        alt="Aperçu"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Titre */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Titre
                            <span className="text-red-400 ml-0.5">*</span>
                            {type === "youtube" && (
                                <span className="text-xs text-gray-400 font-normal ml-1">(auto-récupéré si vide)</span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={nom}
                                onChange={e => { setNom(e.target.value); setTitleError(false); }}
                                maxLength={150}
                                placeholder={type === "youtube" ? "Récupération automatique..." : "Nom de la ressource"}
                                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${titleError ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-blue-400"} ${fetchingTitle ? "text-gray-400" : ""}`}
                            />
                            {fetchingTitle && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">
                                    Récupération...
                                </span>
                            )}
                        </div>
                        {titleError && (
                            <p className="text-xs text-red-500">
                                {type === "youtube"
                                    ? "Impossible de récupérer le titre automatiquement, veuillez le saisir."
                                    : "Le titre est obligatoire."}
                            </p>
                        )}
                    </div>

                    {/* Résumé */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Résumé
                            <span className="text-xs text-gray-400 font-normal ml-1">(optionnel)</span>
                        </label>
                        <textarea
                            value={resume}
                            onChange={e => setResume(e.target.value)}
                            placeholder="Un court résumé de cette ressource..."
                            rows={3}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none transition-colors"
                        />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Tags
                            <span className="text-xs text-gray-400 font-normal ml-1">(optionnel)</span>
                        </label>

                        {/* Tags sélectionnés */}
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedTags.map(tag => (
                                    <Tag
                                        key={tag.id_tag}
                                        title={tag.tag}
                                        onRemove={() => toggleTag(tag)}
                                        color="bg-blue-50 text-blue-600 border border-blue-200"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Recherche de tags */}
                        <div className="relative">
                            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={tagSearch}
                                onChange={e => setTagSearch(e.target.value)}
                                placeholder="Rechercher ou créer un tag..."
                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                            />
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                            {loadingTags ? (
                                <p className="text-xs text-gray-400 py-2">Chargement...</p>
                            ) : filteredTags.length === 0 && !tagSearch ? (
                                <p className="text-xs text-gray-400 py-2">Aucun tag disponible.</p>
                            ) : (
                                filteredTags.map(tag => {
                                    const active = selectedIds.has(tag.id_tag);
                                    return (
                                        <Tag
                                            key={tag.id_tag}
                                            title={tag.tag}
                                            icon={active ? <FiCheck size={11} /> : <FaPlus size={11} />}
                                            onTagClick={() => toggleTag(tag)}
                                            color={active
                                                ? "bg-blue-50 text-blue-500 border border-blue-200"
                                                : "bg-gray-50 text-gray-600 border border-gray-200"
                                            }
                                            hoverColor="hover:bg-blue-50 hover:text-blue-600"
                                        />
                                    );
                                })
                            )}
                        </div>

                        {/* Créer tag si pas de correspondance */}
                        {tagSearch.trim() && !hasExactMatch && (
                            <button
                                onClick={createTag}
                                disabled={creatingTag}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50 w-full"
                            >
                                <FiPlus size={14} />
                                {creatingTag ? "Création..." : <span>Créer <strong>« {tagSearch.trim()} »</strong></span>}
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={saving || !canSubmit}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {saving ? "Création..." : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
