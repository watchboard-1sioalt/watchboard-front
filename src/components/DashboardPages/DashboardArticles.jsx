import { useState, useEffect, useCallback, useMemo } from "react";
import { FiBookmark, FiTrash2, FiCheck, FiX, FiZap, FiFilter, FiPlus, FiCalendar, FiRss, FiGlobe, FiShare2, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { FaFile } from "react-icons/fa6";
import Cards from "../Cards/Cards";
import Modal from "../Modal/Modal";
import FileViewer from "../FileViewer/FileViewer";
import TagPickerModal from "../Modal/TagPickerModal";
import CreateRessourceModal from "../Modal/CreateRessourceModal";
import SearchBarView from "../SearchBarView";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import { API_BASE_URL as API } from "../../config/api";
import { LuFileType2 } from "react-icons/lu";

export default function DashboardArticles() {
    const { token } = useUser();
    const { toast } = useToast();

    const [ressources, setRessources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const [createModal, setCreateModal] = useState(false);

    const [tagModal, setTagModal] = useState(false);
    const [tagTarget, setTagTarget] = useState(null);

    const [resumeModal, setResumeModal] = useState(false);
    const [resumeTarget, setResumeTarget] = useState(null); // ressource complète
    const [resumeText, setResumeText] = useState("");
    const [savingResume, setSavingResume] = useState(false);
    const [iaResuming, setIaResuming] = useState(false);

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

    // Suppression multiple
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedForDelete, setSelectedForDelete] = useState(new Set());
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const toggleBulkMode = () => {
        setBulkMode(v => !v);
        setSelectedForDelete(new Set());
    };

    const toggleSelectForDelete = (id) => {
        setSelectedForDelete(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        setBulkDeleting(true);
        const ids = [...selectedForDelete];
        try {
            const results = await Promise.allSettled(
                ids.map(id => fetch(`${API}/ressources/${id}/delete`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => { if (!res.ok) throw new Error(); return id; }))
            );

            const deletedIds = new Set(results.filter(r => r.status === "fulfilled").map(r => r.value));
            const failedCount = results.length - deletedIds.size;

            setRessources(prev => prev.filter(r => !deletedIds.has(r.id_ressource)));

            if (deletedIds.size > 0) {
                toast.success({ title: `${deletedIds.size} ressource${deletedIds.size > 1 ? "s" : ""} supprimée${deletedIds.size > 1 ? "s" : ""}` });
            }
            if (failedCount > 0) {
                toast.error({ title: "Erreur", message: `${failedCount} suppression${failedCount > 1 ? "s ont" : " a"} échoué.` });
            }

            setConfirmBulkDelete(false);
            setBulkMode(false);
            setSelectedForDelete(new Set());
        } finally {
            setBulkDeleting(false);
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

    const handleIaResume = async () => {
        setIaResuming(true);

        try {
            const res = await fetch(`${API}/ressources/${resumeTarget.id_ressource}/resume/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            })

            const data = await res.json();
            if (!res.ok) throw new Error();
            if (data?.resume) {
                setResumeText(data?.resume)
                setRessources(prev => prev.map(r =>
                    r.id_ressource === resumeTarget.id_ressource ? { ...r, resume: data?.resume || resumeText } : r
                ));
            }
            toast.success({ title: "Résumé généré" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de généré un résumé." });
        } finally {
            setIaResuming(false);
        }
    }

    const [fileViewerOpen, setFileViewerOpen] = useState(false);
    const [fileViewerTarget, setFileViewerTarget] = useState(null);

    const openFileViewer = (r) => {
        setFileViewerTarget(r);
        setFileViewerOpen(true);
    };

    const [shareModal, setShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [shareEmail, setShareEmail] = useState("");
    const [sharing, setSharing] = useState(false);

    const openShareModal = (r) => {
        setShareTarget(r);
        setShareEmail("");
        setShareModal(true);
    };

    const handleShare = async () => {
        if (!shareEmail.trim()) return;
        setSharing(true);
        try {
            const res = await fetch(`${API}/ressources/${shareTarget.id_ressource}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: shareEmail.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Erreur");
            toast.success({ title: "Ressource partagée", message: `Partagée avec ${shareEmail.trim()}` });
            setShareModal(false);
        } catch (err) {
            toast.error({ title: "Erreur", message: err.message || "Impossible de partager la ressource." });
        } finally {
            setSharing(false);
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

    const [allTags, setAllTags] = useState([]);

    useEffect(() => {
        fetch(`${API}/tags/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setAllTags(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, [token]);

    // Tags publics + tags déjà sur les ressources (dédupliqués)
    const availableTags = useMemo(() => {
        const map = new Map();
        allTags.forEach(t => map.set(t.id_tag, t));
        ressources.forEach(r => getTags(r).forEach(t => map.set(t.id_tag, t)));
        return [...map.values()];
    }, [allTags, ressources]);

    const [selectedTagIds, setSelectedTagIds] = useState(new Set());
    const [selectedTypes, setSelectedTypes] = useState(new Set());
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState(null); // null | "today" | "week" | "month" | "year"
    const [showAllTags, setShowAllTags] = useState(false);
    const TAG_LIMIT = 8;

    const TYPE_META = {
        rss: { label: "RSS", icon: <FiRss size={12} /> },
        youtube: { label: "YouTube", icon: <FaYoutube size={12} /> },
        file: { label: "Fichier", icon: <FaFile size={12} /> },
        url: { label: "Site web", icon: <FiGlobe size={12} /> },
    };

    const availableTypes = useMemo(() => {
        const types = new Set(ressources.map(r => r.type).filter(Boolean));
        return [...types];
    }, [ressources]);

    const toggleTag = (id) => {
        setSelectedTagIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleType = (t) => {
        setSelectedTypes(prev => {
            const next = new Set(prev);
            next.has(t) ? next.delete(t) : next.add(t);
            return next;
        });
    };

    const filteredRessources = useMemo(() => {
        let result = ressources;

        if (selectedTypes.size > 0) {
            result = result.filter(r => selectedTypes.has(r.type));
        }

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

        if (dateFilter) {
            const now = new Date();
            const start = new Date();
            if (dateFilter === "today") { start.setHours(0, 0, 0, 0); }
            else if (dateFilter === "week") { start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); start.setHours(0, 0, 0, 0); }
            else if (dateFilter === "month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
            else if (dateFilter === "year") { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
            result = result.filter(r => r.created_at && new Date(r.created_at) >= start);
        }

        result = [...result].sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));

        return result;
    }, [ressources, selectedTagIds, selectedTypes, search, dateFilter]);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-col md:flex-col lg:flex-row items-center justify-between mb-6 ">
                <div className="flex items-center gap-2">
                    <FiBookmark className="text-blue-600" size={22} />
                    <h1 className="text-2xl font-semibold text-blue-600">Ressources enregistrées</h1>
                </div>
                <div className="flex items-center gap-3">
                    {!loading && ressources.length > 0 && (
                        <span className="text-sm text-gray-400">
                            {ressources.length} ressource{ressources.length > 1 ? "s" : ""}
                        </span>
                    )}
                    <div className="flex items-center gap-2 ">
                        {!loading && ressources.length > 0 && (
                            <button
                                onClick={toggleBulkMode}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${bulkMode
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <FiTrash2 size={16} />
                                {bulkMode ? "Annuler" : "Suppression multiple"}
                            </button>
                        )}
                        <button
                            onClick={() => setCreateModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                        >
                            <FiPlus size={16} />
                            Ajouter
                        </button>
                    </div>
                </div>
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
            {/* Filtre par date */}
            {!loading && ressources.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <FiCalendar size={14} className="text-gray-400 shrink-0" />
                    {[
                        { id: "today", label: "Aujourd'hui" },
                        { id: "week", label: "Cette semaine" },
                        { id: "month", label: "Ce mois" },
                        { id: "year", label: "Cette année" },
                    ].map(p => (
                        <button
                            key={p.id}
                            onClick={() => setDateFilter(prev => prev === p.id ? null : p.id)}
                            className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors cursor-pointer ${dateFilter === p.id
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            )}

            {!loading && availableTypes.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <LuFileType2 size={14} className="text-gray-400 shrink-0" />
                    {availableTypes.map(t => {
                        const meta = TYPE_META[t] ?? { label: t, icon: null };
                        const active = selectedTypes.has(t);
                        return (
                            <button
                                key={t}
                                onClick={() => toggleType(t)}
                                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-colors cursor-pointer ${active
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                    }`}
                            >
                                {meta.icon}
                                {meta.label}
                            </button>
                        );
                    })}
                    {selectedTypes.size > 0 && (
                        <button
                            onClick={() => setSelectedTypes(new Set())}
                            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline"
                        >
                            Tout afficher
                        </button>
                    )}
                </div>
            )}

            {!loading && availableTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <FiFilter size={14} className="text-gray-400 shrink-0" />
                    {(showAllTags ? availableTags : availableTags.slice(0, TAG_LIMIT)).map(tag => {
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
                    {availableTags.length > TAG_LIMIT && (
                        <button
                            onClick={() => setShowAllTags(v => !v)}
                            className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer font-medium"
                        >
                            {showAllTags ? "Afficher moins" : `Afficher plus (${availableTags.length - TAG_LIMIT})`}
                        </button>
                    )}
                    {selectedTagIds.size > 0 && (
                        <button
                            onClick={() => setSelectedTagIds(new Set())}
                            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline"
                        >
                            Tout effacer
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
                        onClick={() => { setSelectedTagIds(new Set()); setSelectedTypes(new Set()); setSearch(""); setDateFilter(null); }}
                        className="text-xs text-blue-500 hover:text-blue-700 mt-2 cursor-pointer underline"
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRessources.map(r => {
                        const isSelected = selectedForDelete.has(r.id_ressource);
                        return (
                            <div
                                key={r.id_ressource}
                                onClick={bulkMode ? () => toggleSelectForDelete(r.id_ressource) : undefined}
                                className={`relative group h-full transition-all rounded-xl ${bulkMode ? "cursor-pointer select-none" : ""} ${bulkMode && isSelected ? "ring-2 ring-red-500 scale-[0.99]" : ""}`}
                            >
                                {bulkMode && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-xs transition-colors ${isSelected ? "bg-red-600 border-red-600 text-white" : "bg-white/90 border-gray-300 text-transparent"}`}>
                                            <FiCheckCircle size={14} />
                                        </div>
                                    </div>
                                )}
                                <div className={bulkMode ? `pointer-events-none ${isSelected ? "opacity-90" : ""}` : ""}>
                                    <Cards
                                        type={r.type}
                                        titre={r.nom_original || r.url}
                                        description={r.resume}
                                        lien={r.type === "file" ? null : r.url}
                                        image={r.image}
                                        date={r.created_at
                                            ? new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                                            : undefined}
                                        tags={getTags(r)}
                                        onAddTag={() => openTagModal(r.id_ressource)}
                                        onRemoveTag={(tagId) => handleTagRemoved(r.id_ressource, tagId)}
                                        onResume={() => openResumeModal(r)}
                                        onFileOpen={r.type === "file" ? () => openFileViewer(r) : undefined}
                                    />
                                </div>

                                {!bulkMode && (
                                    <div className="absolute top-3 right-3 flex items-center gap-1">
                                        <button
                                            onClick={() => openShareModal(r)}
                                            className="transition-opacity bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm text-gray-400 hover:text-blue-500 cursor-pointer"
                                            title="Partager"
                                        >
                                            <FiShare2 size={14} />
                                        </button>
                                        {confirmDelete === r.id_ressource ? (
                                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                                                <span className="text-xs text-gray-500">Confirmer la suppression ?</span>
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
                                                className="transition-opacity bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm text-gray-400 hover:text-red-500 cursor-pointer"
                                                title="Supprimer"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Barre flottante d'action - suppression multiple */}
            {bulkMode && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-xl">
                        <span className="text-sm text-gray-600 pl-2">
                            {selectedForDelete.size} ressource{selectedForDelete.size > 1 ? "s" : ""} sélectionnée{selectedForDelete.size > 1 ? "s" : ""}
                        </span>
                        <button
                            onClick={() => setConfirmBulkDelete(true)}
                            disabled={selectedForDelete.size === 0}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <FiTrash2 size={14} />
                            Supprimer
                        </button>
                        <button
                            onClick={toggleBulkMode}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                            title="Annuler"
                        >
                            <FiXCircle size={18} />
                        </button>
                    </div>
                </div>
            )}

            <Modal
                isOpen={confirmBulkDelete}
                onClose={() => setConfirmBulkDelete(false)}
                title="Supprimer ces ressources ?"
                actions={[
                    {
                        label: bulkDeleting ? "Suppression..." : `Supprimer (${selectedForDelete.size})`,
                        variant: "danger",
                        onClick: handleBulkDelete,
                        loading: bulkDeleting,
                    },
                ]}
            >
                <p className="text-sm text-gray-600">
                    Voulez-vous vraiment supprimer ces <strong>{selectedForDelete.size}</strong> ressource{selectedForDelete.size > 1 ? "s" : ""} ? Cette action est irréversible.
                </p>
            </Modal>

            <Modal
                isOpen={resumeModal}
                onClose={() => setResumeModal(false)}
                title={resumeTarget?.nom_original || "Résumer"}
                actions={[
                    {
                        label: "Résumé IA",
                        variant: "secondary",
                        icon: <FiZap size={14} />,
                        onClick: handleIaResume,
                        loading: iaResuming

                    },
                    {
                        label: "Enregistrer le résumé",
                        variant: "primary",
                        onClick: handleSaveResume,
                        loading: (savingResume || iaResuming),
                        loadingLabel: (savingResume ? "Enregistrement..." : iaResuming ? "Chargemenet" : ""),
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

            <Modal
                isOpen={shareModal}
                onClose={() => setShareModal(false)}
                title={`Partager « ${shareTarget?.nom_original || shareTarget?.url || ""} »`}
                actions={[
                    {
                        label: sharing ? "Envoi..." : "Partager",
                        variant: "primary",
                        onClick: handleShare,
                        loading: sharing,
                    },
                ]}
            >
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Adresse e-mail du destinataire</label>
                    <input
                        type="email"
                        value={shareEmail}
                        onChange={e => setShareEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleShare()}
                        placeholder="utilisateur@exemple.com"
                        autoFocus
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                    />
                </div>
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
                onGenerateTags={async () => {
                    const res = await fetch(`${API}/ressources/${tagTarget}/tags/generate`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.message || "Erreur lors de la génération des tags.");
                    return data.tags ?? [];
                }}
            />

            <CreateRessourceModal
                isOpen={createModal}
                onClose={() => setCreateModal(false)}
                token={token}
                onCreated={(newRessource) => {
                    setRessources(prev => [newRessource, ...prev]);
                    toast.success({ title: "Ressource ajoutée" });
                }}
            />

            <FileViewer
                isOpen={fileViewerOpen}
                onClose={() => setFileViewerOpen(false)}
                ressource={fileViewerTarget}
            />
        </div>
    );
}
