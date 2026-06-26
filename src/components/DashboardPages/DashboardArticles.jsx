import { useState, useEffect, useCallback, useMemo } from "react";
import { FiBookmark, FiTrash2, FiCheck, FiX, FiZap, FiFilter } from "react-icons/fi";
import Cards from "../Cards/Cards";
import Modal from "../Modal/Modal";
import TagPickerModal from "../Modal/TagPickerModal";
import SearchBarView from "../SearchBarView";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";

const API = "http://localhost/api";

export default function DashboardArticles() {
    const { token } = useUser();
    const { toast } = useToast();

    const [ressources, setRessources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const [tagModal, setTagModal] = useState(false);
    const [tagTarget, setTagTarget] = useState(null);

    const [resumeModal, setResumeModal] = useState(false);
    const [resumeTarget, setResumeTarget] = useState(null); // ressource complète
    const [resumeText, setResumeText] = useState("");
    const [savingResume, setSavingResume] = useState(false);

    const fetchRessources = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/ressources`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setRessources(Array.isArray(data) ? data : data.data ?? []);
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de charger les ressources." });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchRessources(); }, [fetchRessources]);

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/ressources/${id}/delete`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setRessources(prev => prev.filter(r => r.id_ressource !== id));
            setConfirmDelete(null);
            toast.success({ title: "Ressource supprimée" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de supprimer la ressource." });
        }
    };

    const openTagModal = (ressourceId) => {
        setTagTarget(ressourceId);
        setTagModal(true);
    };

    const openResumeModal = (r) => {
        setResumeTarget(r);
        setResumeText(r.resume ?? "");
        setResumeModal(true);
    };

    const handleSaveResume = async () => {
        setSavingResume(true);
        try {
            const res = await fetch(`${API}/ressources/${resumeTarget.id_ressource}/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ resume: resumeText }),
            });
            if (!res.ok) throw new Error();
            setRessources(prev => prev.map(r =>
                r.id_ressource === resumeTarget.id_ressource ? { ...r, resume: resumeText } : r
            ));
            toast.success({ title: "Résumé enregistré" });
            setResumeModal(false);
        } catch {
            toast.error({ title: "Erreur", message: "Impossible d'enregistrer le résumé." });
        } finally {
            setSavingResume(false);
        }
    };

    const handleTagRemoved = async (ressourceId, tagId) => {
        try {
            const res = await fetch(`${API}/ressources/${ressourceId}/tags/${tagId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setRessources(prev => prev.map(r =>
                r.id_ressource === ressourceId
                    ? { ...r, tags: (r.tags ?? []).filter(t => t.id_tag !== tagId) }
                    : r
            ));
            toast.success({ title: "Tag supprimé" })
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de retirer le tag." });
        }
    };

    const handleTagAdded = (tag) => {
        setRessources(prev => prev.map(r =>
            r.id_ressource === tagTarget
                ? { ...r, tags: [...(r.tags ?? []), tag] }
                : r
        ));
        toast.success({ title: "Tag ajouté" });
    };

    const getTags = (r) => r.tags ?? r.tag ?? [];

    // Tags uniques présents dans toutes les ressources
    const availableTags = useMemo(() => {
        const map = new Map();
        ressources.forEach(r => getTags(r).forEach(t => map.set(t.id_tag, t)));
        return [...map.values()];
    }, [ressources]);

    const [selectedTagIds, setSelectedTagIds] = useState(new Set());
    const [search, setSearch] = useState("");

    const toggleTag = (id) => {
        setSelectedTagIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const filteredRessources = useMemo(() => {
        let result = ressources;

        if (selectedTagIds.size > 0) {
            result = result.filter(r =>
                getTags(r).some(t => selectedTagIds.has(t.id_tag))
            );
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(r =>
                (r.nom_original ?? "").toLowerCase().includes(q) ||
                (r.resume ?? "").toLowerCase().includes(q)
            );
        }

        return result;
    }, [ressources, selectedTagIds, search]);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FiBookmark className="text-blue-600" size={22} />
                    <h1 className="text-2xl font-semibold text-blue-600">Ressources enregistrées</h1>
                </div>
                {!loading && ressources.length > 0 && (
                    <span className="text-sm text-gray-400">
                        {ressources.length} ressource{ressources.length > 1 ? "s" : ""}
                    </span>
                )}
            </div>
            {!loading && ressources.length > 0 && (
                <div className="mb-4">
                    <SearchBarView
                        value={search}
                        onChange={setSearch}
                        onClear={() => setSearch("")}
                        placeholder="Rechercher par titre ou résumé..."
                    />
                </div>
            )}
            {!loading && availableTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <FiFilter size={14} className="text-gray-400 shrink-0" />
                    {availableTags.map(tag => {
                        const active = selectedTagIds.has(tag.id_tag);
                        return (
                            <button
                                key={tag.id_tag}
                                onClick={() => toggleTag(tag.id_tag)}
                                className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors cursor-pointer ${active
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                    }`}
                            >
                                {tag.tag}
                            </button>
                        );
                    })}
                    {selectedTagIds.size > 0 && (
                        <button
                            onClick={() => setSelectedTagIds(new Set())}
                            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline"
                        >
                            Tout afficher
                        </button>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Chargement...</div>
            ) : ressources.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <FiBookmark size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucune ressource enregistrée.</p>
                    <p className="text-xs mt-1">Enregistrez des articles depuis vos flux RSS.</p>
                </div>
            ) : filteredRessources.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <FiFilter size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucune ressource ne correspond à votre recherche.</p>
                    <button
                        onClick={() => { setSelectedTagIds(new Set()); setSearch(""); }}
                        className="text-xs text-blue-500 hover:text-blue-700 mt-2 cursor-pointer underline"
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRessources.map(r => (
                        <div key={r.id_ressource} className="relative group">
                            <Cards
                                titre={r.nom_original || r.url}
                                description={r.resume}
                                lien={r.url}
                                image={r.image}
                                date={r.created_at
                                    ? new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                                    : undefined}
                                tags={getTags(r)}
                                onAddTag={() => openTagModal(r.id_ressource)}
                                onRemoveTag={(tagId) => handleTagRemoved(r.id_ressource, tagId)}
                                onResume={() => openResumeModal(r)}
                            />

                            <div className="absolute top-3 right-3">
                                {confirmDelete === r.id_ressource ? (
                                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                                        <span className="text-xs text-gray-500">Voulez-vous vraiment supprimer ?</span>
                                        <button
                                            onClick={() => handleDelete(r.id_ressource)}
                                            className="text-blue-600 hover:text-red-600 cursor-pointer"
                                        >
                                            <FiCheck size={14} />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDelete(r.id_ressource)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm text-gray-400 hover:text-red-500 cursor-pointer"
                                        title="Supprimer"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={resumeModal}
                onClose={() => setResumeModal(false)}
                title={resumeTarget?.nom_original || "Résumer"}
                actions={[
                    {
                        label: "IA",
                        variant: "secondary",
                        icon: <FiZap size={14} />,
                        onClick: () => { /* TODO faire la fonction d'appel du résumé IA*/ },
                        disabled: true,
                    },
                    {
                        label: "Enregistrer le résumé",
                        variant: "primary",
                        onClick: handleSaveResume,
                        loading: savingResume,
                        loadingLabel: "Enregistrement...",
                    },
                ]}
            >
                <textarea
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder="Écrivez votre résumé ici..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none transition-colors"
                />
            </Modal>

            <TagPickerModal
                isOpen={tagModal}
                onClose={() => setTagModal(false)}
                currentTags={getTags(ressources.find(r => r.id_ressource === tagTarget) ?? {})}
                token={token}
                onAttach={async (tag) => {
                    const res = await fetch(`${API}/ressources/${tagTarget}/tags`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ tag_id: tag.id_tag }),
                    });
                    if (!res.ok) throw new Error();
                }}
                onTagAdded={handleTagAdded}
            />
        </div>
    );
}
