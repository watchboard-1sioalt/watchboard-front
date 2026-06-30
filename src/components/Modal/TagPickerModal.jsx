import { useState, useEffect, useCallback } from "react";
import { FiPlus, FiCheck, FiSearch, FiZap } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import Modal from "./Modal";
import Tag from "../Tag";
import { useToast } from "../Toast/Toast";
import { API_BASE_URL as API } from "../../config/api";

/**
 * Modal générique de sélection / création de tag.
 *
 * onAttach(tag): Promise — appelé par le parent pour attacher le tag.
 *   Le parent gère l'appel API spécifique (ressource, flux, etc.).
 *   Si la promesse rejette, le tag n'est pas marqué comme ajouté.
 *
 * onTagAdded(tag) — appelé après un attach réussi pour mettre à jour l'état parent.
 *
 * onGenerateTags(): Promise<tag[]> — optionnel, appelé par le parent pour lancer
 *   l'auto-tag IA d'une ressource (POST /ressources/{id}/tags/generate). Doit
 *   résoudre avec la liste complète des tags désormais attachés à la ressource.
 *   N'affiche le bouton "Auto-tager" que si cette prop est fournie (ex: pas pour les flux).
 */
export default function TagPickerModal({ isOpen, onClose, currentTags = [], token, onAttach, onTagAdded, onGenerateTags }) {
    const { toast } = useToast();
    const [allTags, setAllTags] = useState([]);
    const [search, setSearch] = useState("");
    const [loadingTags, setLoadingTags] = useState(false);
    const [adding, setAdding] = useState(null); // id_tag | "new"
    const [generating, setGenerating] = useState(false);

    const currentIds = new Set(currentTags.map(t => t.id_tag));

    useEffect(() => {
        if (!isOpen) return;
        setSearch("");
        setLoadingTags(true);
        fetch(`${API}/tags/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setAllTags)
            .catch(() => setAllTags([]))
            .finally(() => setLoadingTags(false));
    }, [isOpen, token]);

    const filtered = allTags.filter(t =>
        t.tag.toLowerCase().includes(search.toLowerCase())
    );

    const hasExactMatch = allTags.some(
        t => t.tag.toLowerCase() === search.trim().toLowerCase()
    );

    const attachTag = useCallback(async (tag) => {
        setAdding(tag.id_tag);
        try {
            await onAttach(tag);
            onTagAdded(tag);
        } finally {
            setAdding(null);
        }
    }, [onAttach, onTagAdded]);

    const createAndAttach = useCallback(async () => {
        const tagName = search.trim();
        if (!tagName) return;
        setAdding("new");
        try {
            // 1. Créer le tag
            const createRes = await fetch(`${API}/tags/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ tag: tagName }),
            });
            if (!createRes.ok) throw new Error();

            // 2. Retrouver son id_tag via autocomplete
            const acRes = await fetch(`${API}/tags/autocomplete?q=${encodeURIComponent(tagName)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const suggestions = await acRes.json();
            const found = suggestions.find(t => t.tag.toLowerCase() === tagName.toLowerCase());
            if (!found) throw new Error("Tag introuvable après création");

            // 3. Déléguer l'attach au parent
            await onAttach(found);

            setAllTags(prev => [...prev, found]);
            onTagAdded(found);
            setSearch("");
        } finally {
            setAdding(null);
        }
    }, [search, token, onAttach, onTagAdded]);

    const handleAutoTag = useCallback(async () => {
        if (!onGenerateTags || generating) return;
        setGenerating(true);
        try {
            const generated = await onGenerateTags();
            const newTags = Array.isArray(generated) ? generated : [];

            setAllTags(prev => {
                const map = new Map(prev.map(t => [t.id_tag, t]));
                newTags.forEach(t => map.set(t.id_tag, t));
                return [...map.values()];
            });

            const addedCount = newTags.filter(t => !currentIds.has(t.id_tag)).length;
            newTags.forEach(t => {
                if (!currentIds.has(t.id_tag)) onTagAdded(t);
            });

            toast.success({
                title: addedCount > 0 ? "Tags générés" : "Aucun nouveau tag",
                message: addedCount > 0 ? `${addedCount} tag${addedCount > 1 ? "s" : ""} ajouté${addedCount > 1 ? "s" : ""}.` : "La ressource a déjà tous les tags suggérés.",
            });
        } catch (err) {
            toast.error({ title: "Erreur", message: err.message || "Impossible de générer des tags." });
        } finally {
            setGenerating(false);
        }
    }, [onGenerateTags, generating, currentIds, onTagAdded, toast]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un tag">
            {/* Auto-tag IA */}
            {onGenerateTags && (
                <button
                    onClick={handleAutoTag}
                    disabled={generating}
                    className="flex items-center justify-center gap-2 w-full mb-4 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                    <FiZap size={14} className={generating ? "animate-pulse" : ""} />
                    {generating ? "Génération en cours..." : "Auto-tager avec l'IA"}
                </button>
            )}

            {/* Recherche */}
            <div className="relative mb-4">
                <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un tag..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                    autoFocus
                />
            </div>

            {/* Liste */}
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-48 mb-4">
                {loadingTags ? (
                    <p className="text-sm text-gray-400 w-full text-center py-4">Chargement...</p>
                ) : filtered.length === 0 && !search ? (
                    <p className="text-sm text-gray-400 w-full text-center py-4">Aucun tag disponible.</p>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 w-full text-center py-4">Aucun résultat pour « {search} ».</p>
                ) : (
                    filtered.map(tag => {
                        const already = currentIds.has(tag.id_tag);
                        const isAdding = adding === tag.id_tag;
                        return (
                            <Tag
                                key={tag.id_tag}
                                icon={already ? <FiCheck size={12} /> : <FaPlus size={12} />}
                                onTagClick={() => !already && !isAdding && attachTag(tag)}
                                title={isAdding ? "..." : tag.tag}
                                color={already
                                    ? "bg-blue-50 text-blue-500 border border-blue-200"
                                    : "bg-gray-50 text-gray-600 border border-gray-200"
                                }
                                hoverColor="hover:bg-blue-50 hover:text-blue-600 border border-blue-300"
                            />
                        );
                    })
                )}
            </div>

            {/* Créer si pas de correspondance exacte */}
            {search.trim() && !hasExactMatch && (
                <div className="pt-3 border-t border-gray-100">
                    <button
                        onClick={createAndAttach}
                        disabled={adding === "new"}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <FiPlus size={15} />
                        {adding === "new"
                            ? "Création..."
                            : <span>Créer et ajouter <strong>« {search.trim()} »</strong></span>
                        }
                    </button>
                </div>
            )}
        </Modal>
    );
}
