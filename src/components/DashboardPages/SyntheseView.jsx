import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { IoNewspaperOutline } from "react-icons/io5";
import {
    FiCheckCircle, FiCpu, FiPlus, FiArrowLeft, FiCalendar, FiFileText,
    FiDownload, FiSave, FiTag, FiSearch, FiX, FiFilter, FiRss, FiGlobe, FiTrash2, FiRefreshCw, FiBold
} from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { FaFile } from "react-icons/fa6";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import Cards from "../Cards/Cards";
import EmptyState from "../EmptyState";
import InlineDeleteConfirm from "../InlineDeleteConfirm";
import TagFilterBar from "../TagFilterBar";
import { TYPE_META } from "../../utils/resourceTypes";
import { API_BASE_URL as API } from "../../config/api";

const TYPE_META = {
    rss: { label: "RSS", icon: <FiRss size={12} /> },
    youtube: { label: "YouTube", icon: <FaYoutube size={12} /> },
    file: { label: "Fichier", icon: <FaFile size={12} /> },
    url: { label: "Site web", icon: <FiGlobe size={12} /> },
};

const MIN_RESSOURCES = 2;

const getTags = (r) => r.tags ?? r.tag ?? [];
const ressourceKey = (r) => r.id_ressource ?? r.id;
const syntheseKey = (s) => s.id_synthese ?? s.id;
const syntheseLabel = (s) => {
    const text = (s.synthese ?? "").trim().replace(/<[^>]*>/g, "");
    if (text) return text.length > 60 ? text.slice(0, 60) + "..." : text;
    return "Synthèse sans contenu";
};

// MODALE DE CRÉATION / ÉDITION
function SyntheseModal({
    step, onClose,
    search, setSearch,
    availableTypes, selectedTypes, toggleType,
    availableTags, selectedTagIds, toggleTag,
    dateFilter, setDateFilter,
    resetFilters, hasActiveFilters,
    loadingArticles, filteredArticles,
    selectedArticles, toggleSelectArticle,
    onConfirmSelection, isSubmittingSelection,
    onBackToSelect,
    hasGenerated, isGenerating, onGenerate,
    generatedText, setGeneratedText,
    isSavingDoc, onSave, onExportPDF,
}) {
    const title = step === "select"
        ? "Sélectionner des ressources à synthétiser"
        : hasGenerated ? "Édition du rapport final" : "Génération de la synthèse";

    const editorRef = useRef(null);
    const generatedSectionRef = useRef(null); // Ref pour le scroll automatique

    // Initialisation du contenu HTML de l'éditeur
    useEffect(() => {
        if (editorRef.current && step === "edit" && hasGenerated) {
            if (editorRef.current.innerHTML !== generatedText) {
                editorRef.current.innerHTML = generatedText;
            }
        }
    }, [step, hasGenerated]);

    // TRANSITION : Scroll automatique et effortless dès que la synthèse est générée
    useEffect(() => {
        if (hasGenerated && generatedSectionRef.current) {
            generatedSectionRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }, [hasGenerated]);

    const execEditorCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setGeneratedText(editorRef.current.innerHTML);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-semibold text-blue-600">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded-lg hover:bg-gray-100">
                        <FiX size={18} />
                    </button>
                </div>

                {step === "select" ? (
                    <>
                        <div className="px-5 py-3 border-b border-gray-100 flex flex-col gap-2 shrink-0 overflow-y-auto max-h-56">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Rechercher par titre ou résumé..."
                                    className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                <FiCalendar className="text-gray-400 shrink-0" size={12} />
                                {[
                                    { id: "today", label: "Aujourd'hui" },
                                    { id: "week", label: "Cette semaine" },
                                    { id: "month", label: "Ce mois" },
                                    { id: "year", label: "Cette année" },
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setDateFilter(prev => prev === p.id ? null : p.id)}
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${dateFilter === p.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                                {hasActiveFilters && (
                                    <button onClick={resetFilters} className="text-gray-400 hover:text-gray-600 cursor-pointer underline">
                                        Réinitialiser
                                    </button>
                                )}
                            </div>

                            {availableTypes.length > 1 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <FiFilter className="text-gray-400 shrink-0" size={12} />
                                    {availableTypes.map(t => {
                                        const meta = TYPE_META[t] ?? { label: t, icon: null };
                                        const active = selectedTypes.has(t);
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => toggleType(t)}
                                                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"}`}
                                            >
                                                {meta.icon}{meta.label}
                                            </button>
                                        );
                                    })}
                                    {selectedTypes.size > 0 && (
                                        <button onClick={() => setSelectedTypes(new Set())} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline">
                                            Tout afficher
                                        </button>
                                    )}
                                </div>
                            )}

                            <TagFilterBar
                                tags={availableTags}
                                selectedIds={selectedTagIds}
                                onToggle={toggleTag}
                                onClearAll={() => setSelectedTagIds(new Set())}
                                icon={FiTag}
                                className="flex flex-wrap items-center gap-1.5"
                            />

                            {hasActiveFilters && (
                                <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline self-start">
                                    Réinitialiser tous les filtres
                                </button>
                            )}
                        </div>

                        <div className="px-5 py-4 overflow-y-auto flex-1">
                            {loadingArticles ? (
                                <div className="text-center py-16 text-gray-400 text-sm">Indexation des ressources...</div>
                            ) : filteredArticles.length === 0 ? (
                                <div className="text-center py-16 text-gray-400 text-sm">Aucune ressource ne correspond à vos filtres.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredArticles.map((article, i) => {
                                        const key = ressourceKey(article) ?? i;
                                        const isSelected = selectedArticles.some(a => ressourceKey(a) === key);

                                        return (
                                            <div
                                                key={key}
                                                onClick={() => toggleSelectArticle(article)}
                                                className={`relative transition-all rounded-xl cursor-pointer select-none ${isSelected ? "ring-2 ring-blue-500 scale-[0.99]" : "hover:scale-[1.01]"}`}
                                            >
                                                <div className="absolute top-2 right-2 z-10">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-xs transition-colors ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white/90 border-gray-300 text-transparent"}`}>
                                                        <FiCheckCircle size={14} />
                                                    </div>
                                                </div>
                                                <div className={`pointer-events-none ${isSelected ? "opacity-90" : ""}`}>
                                                    <Cards
                                                        type={article.type}
                                                        titre={article.nom_original || article.title}
                                                        description={article.resume || article.description}
                                                        date={article.created_at ? new Date(article.created_at).toLocaleDateString("fr-FR") : undefined}
                                                        image={article.image}
                                                        lien={article.url || article.lien}
                                                        tags={getTags(article)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 shrink-0">
                            <span className="text-xs text-gray-500">
                                {selectedArticles.length < MIN_RESSOURCES
                                    ? `Sélectionnez au moins ${MIN_RESSOURCES} ressources (${selectedArticles.length}/${MIN_RESSOURCES})`
                                    : `${selectedArticles.length} ressources sélectionnées`}
                            </span>
                            <button
                                onClick={onConfirmSelection}
                                disabled={selectedArticles.length < MIN_RESSOURCES || isSubmittingSelection}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isSubmittingSelection ? "Création..." : `Continuer (${selectedArticles.length})`}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="px-5 py-4 overflow-y-auto flex-1">
                            <button onClick={onBackToSelect} className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer underline mb-4">
                                ← Modifier la sélection ({selectedArticles.length})
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {selectedArticles.map((article, i) => {
                                    const key = ressourceKey(article) ?? i;
                                    return (
                                        <div key={key} className="h-full">
                                            <Cards
                                                type={article.type}
                                                titre={article.nom_original || article.title}
                                                description={article.resume || article.description}
                                                date={article.created_at ? new Date(article.created_at).toLocaleDateString("fr-FR") : undefined}
                                                image={article.image}
                                                lien={article.url || article.lien}
                                                tags={getTags(article)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {hasGenerated && (
                                <div
                                    ref={generatedSectionRef}
                                    className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col scroll-mt-4"
                                >
                                    <div className="flex items-center gap-1 bg-slate-100 border-b border-gray-200 px-3 py-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => execEditorCommand("bold")}
                                            className="p-1.5 text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer border border-gray-300 bg-white font-bold flex items-center justify-center"
                                        >
                                            <FiBold size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execEditorCommand("backColor", "#fef08a")}
                                            className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-yellow-200 rounded transition-colors cursor-pointer border border-yellow-300 bg-yellow-50 flex items-center justify-center gap-1"
                                        >
                                            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Surligner
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => execEditorCommand("removeFormat")}
                                            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded transition-colors cursor-pointer border border-gray-200 bg-white"
                                        >
                                            Normal
                                        </button>
                                    </div>

                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        onInput={(e) => setGeneratedText(e.target.innerHTML)}
                                        className="w-full h-64 p-4 text-sm bg-white outline-none font-sans text-gray-700 leading-relaxed shadow-inner overflow-y-auto min-h-[16rem]"
                                        placeholder="Éditez et formatez votre synthèse en direct..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 shrink-0">
                            {!hasGenerated ? (
                                <>
                                    <span className="text-xs text-gray-500">Prêt à générer la synthèse IA</span>
                                    <button
                                        onClick={onGenerate}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm cursor-pointer disabled:opacity-50"
                                    >
                                        <FiCpu size={16} className={isGenerating ? "animate-spin" : ""} />
                                        {isGenerating ? "Génération IA en cours..." : `Générer une synthèse des ${selectedArticles.length} ressources`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={onGenerate} disabled={isGenerating} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 cursor-pointer disabled:opacity-50">
                                        <FiRefreshCw size={12} className={isGenerating ? "animate-spin" : ""} /> Régénérer
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button onClick={onExportPDF} className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 hover:bg-slate-50 text-gray-700 rounded-lg text-xs font-medium transition-colors cursor-pointer">
                                            <FiDownload size={14} /> Exporter en PDF
                                        </button>
                                        <button
                                            onClick={onSave}
                                            disabled={isSavingDoc}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                        >
                                            <FiSave size={14} />
                                            {isSavingDoc ? "Sauvegarde..." : "Enregistrer la synthèse"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// VUE GLOBALE & HISTORIQUE
export default function SyntheseView() {
    const { token } = useUser();
    const { toast } = useToast();
    const authHeaders = { Authorization: `Bearer ${token}` };
    const jsonHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const [viewMode, setViewMode] = useState("list");

    const [savedSyntheses, setSavedSyntheses] = useState([]);
    const [savedArticles, setSavedArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const [activeSynthese, setActiveSynthese] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [generatingDetail, setGeneratingDetail] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState("select");
    const [currentSyntheseId, setCurrentSyntheseId] = useState(null);
    const [isSubmittingSelection, setIsSubmittingSelection] = useState(false);

    const [search, setSearch] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState(new Set());
    const [selectedTypes, setSelectedTypes] = useState(new Set());
    const [dateFilter, setDateFilter] = useState(null);

    const [selectedArticles, setSelectedArticles] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingDoc, setIsSavingDoc] = useState(false);
    const [generatedText, setGeneratedText] = useState("");
    const [hasGenerated, setHasGenerated] = useState(false);

    // États spécifiques pour l'édition WYSIWYG en vue détail
    const detailEditorRef = useRef(null);
    const [detailText, setDetailText] = useState("");
    const [isDetailDirty, setIsDetailDirty] = useState(false);
    const [isSavingDetail, setIsSavingDetail] = useState(false);

    const fetchSavedSyntheses = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`${API}/syntheses`, { headers: authHeaders });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSavedSyntheses(Array.isArray(data) ? data : data.data ?? []);
        } catch {
            setSavedSyntheses([]);
        } finally {
            setLoadingHistory(false);
        }
    }, [token]);

    const fetchSavedArticlesOnly = useCallback(async () => {
        setLoadingArticles(true);
        try {
            const res = await fetch(`${API}/ressources`, { headers: authHeaders });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSavedArticles(Array.isArray(data) ? data : data.data ?? []);
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de récupérer vos articles enregistrés." });
        } finally {
            setLoadingArticles(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchSavedSyntheses();
    }, [token, fetchSavedSyntheses]);

    // Initialisation HTML de la zone éditable du détail
    useEffect(() => {
        if (viewMode === "detail" && activeSynthese && detailEditorRef.current) {
            detailEditorRef.current.innerHTML = activeSynthese.synthese || "";
            setDetailText(activeSynthese.synthese || "");
            setIsDetailDirty(false);
        }
    }, [viewMode, activeSynthese]);

    const execDetailCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (detailEditorRef.current) {
            setDetailText(detailEditorRef.current.innerHTML);
            setIsDetailDirty(true);
        }
    };

    const handleSaveDetailEdits = async () => {
        const id = syntheseKey(activeSynthese);
        if (!id || !isDetailDirty) return;
        setIsSavingDetail(true);
        try {
            const res = await fetch(`${API}/syntheses/${id}`, {
                method: "PUT",
                headers: jsonHeaders,
                body: JSON.stringify({ synthese: detailText }),
            });
            if (!res.ok) throw new Error();
            toast.success({ title: "Modifications enregistrées" });
            setIsDetailDirty(false);
            setActiveSynthese(prev => ({ ...prev, synthese: detailText }));
            fetchSavedSyntheses();
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de sauvegarder les changements." });
        } finally {
            setIsSavingDetail(false);
        }
    };

    const availableTags = useMemo(() => {
        const map = new Map();
        savedArticles.forEach(art => getTags(art).forEach(t => map.set(t.id_tag, t)));
        return [...map.values()];
    }, [savedArticles]);

    const availableTypes = useMemo(() => {
        return [...new Set(savedArticles.map(a => a.type).filter(Boolean))];
    }, [savedArticles]);

    const filteredArticles = useMemo(() => {
        let result = savedArticles;
        if (selectedTypes.size > 0) result = result.filter(a => selectedTypes.has(a.type));
        if (selectedTagIds.size > 0) result = result.filter(art => getTags(art).some(t => selectedTagIds.has(t.id_tag)));
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(art =>
                (art.nom_original || art.title || "").toLowerCase().includes(q) ||
                (art.resume || art.description || "").toLowerCase().includes(q)
            );
        }
        if (dateFilter) {
            const now = new Date();
            const start = new Date();
            if (dateFilter === "today") start.setHours(0, 0, 0, 0);
            else if (dateFilter === "week") { start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); start.setHours(0, 0, 0, 0); }
            else if (dateFilter === "month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
            else if (dateFilter === "year") { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
            result = result.filter(a => a.created_at && new Date(a.created_at) >= start);
        }
        return [...result].sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
    }, [savedArticles, selectedTypes, selectedTagIds, search, dateFilter]);

    const resetFilters = () => {
        setSearch("");
        setSelectedTagIds(new Set());
        setSelectedTypes(new Set());
        setDateFilter(null);
    };

    const openModal = () => {
        setHasGenerated(false);
        setGeneratedText("");
        setSelectedArticles([]);
        setCurrentSyntheseId(null);
        resetFilters();
        setModalStep("select");
        setModalOpen(true);
        fetchSavedArticlesOnly();
    };

    const closeModal = () => {
        setModalOpen(false);
        if (currentSyntheseId) fetchSavedSyntheses();
    };

    const confirmSelection = async () => {
        if (selectedArticles.length < MIN_RESSOURCES) return;
        setIsSubmittingSelection(true);
        try {
            const ressourceIds = selectedArticles.map(ressourceKey);
            const isUpdate = !!currentSyntheseId;
            const res = await fetch(
                isUpdate ? `${API}/syntheses/${currentSyntheseId}` : `${API}/syntheses`,
                {
                    method: isUpdate ? "PUT" : "POST",
                    headers: jsonHeaders,
                    body: JSON.stringify({ ressource_ids: ressourceIds }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Erreur lors de la création de la synthèse.");
            }
            const data = await res.json();
            setCurrentSyntheseId(syntheseKey(data));
            setSelectedArticles(data.ressources ?? selectedArticles);
            setHasGenerated(false);
            setGeneratedText("");
            setModalStep("edit");
        } catch (err) {
            toast.error({ title: "Erreur", message: err.message });
        } finally {
            setIsSubmittingSelection(false);
        }
    };

    const toggleSelectArticle = (article) => {
        const key = ressourceKey(article);
        setSelectedArticles(prev => {
            const isAlreadySelected = prev.some(a => ressourceKey(a) === key);
            if (isAlreadySelected) return prev.filter(a => ressourceKey(a) !== key);
            return [...prev, article];
        });
    };

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

    const handleGenerateSynthese = async () => {
        if (!currentSyntheseId) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`${API}/syntheses/${currentSyntheseId}/generate`, {
                method: "POST",
                headers: authHeaders,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "L'API a renvoyé une erreur lors de la génération.");

            setGeneratedText(data.synthese || "");
            setHasGenerated(true);
            toast.success({ title: "Synthèse générée avec succès !" });
        } catch (err) {
            toast.error({ title: "Échec génération", message: err.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDocument = async () => {
        if (!currentSyntheseId || !generatedText.trim()) return;
        setIsSavingDoc(true);
        try {
            const res = await fetch(`${API}/syntheses/${currentSyntheseId}`, {
                method: "PUT",
                headers: jsonHeaders,
                body: JSON.stringify({ synthese: generatedText }),
            });
            if (!res.ok) throw new Error("Erreur lors de la sauvegarde sur le serveur.");

            toast.success({ title: "Synthèse enregistrée" });
            fetchSavedSyntheses();
            setModalOpen(false);
        } catch (err) {
            toast.error({ title: "Erreur d'enregistrement", message: err.message });
        } finally {
            setIsSavingDoc(false);
        }
    };

    const exportSyntheseToPDF = (text, date) => {
        if (!text?.trim()) return;
        const printWindow = window.open("", "_blank");
        const title = "Synthèse Documentaire Automatisée";

        printWindow.document.write(`
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: system-ui, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
                    h1 { color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 24px; }
                    .date { font-size: 12px; color: #64748b; margin-bottom: 30px; }
                    .content { white-space: pre-wrap; font-size: 14px; }
                    font[color="#fef08a"], span[style*="background-color"] { background-color: #fef08a !important; color: #1e293b !important; padding: 0 2px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="date">Générée le ${(date ? new Date(date) : new Date()).toLocaleDateString("fr-FR")}</div>
                <div class="content">${text}</div>
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleExportPDF = () => exportSyntheseToPDF(generatedText);

    const handleDeleteSynthese = async (id) => {
        try {
            const res = await fetch(`${API}/syntheses/${id}`, {
                method: "DELETE",
                headers: authHeaders,
            });
            if (!res.ok) throw new Error();
            setSavedSyntheses(prev => prev.filter(s => syntheseKey(s) !== id));
            setConfirmDelete(null);
            toast.success({ title: "Synthèse supprimée" });
            if (viewMode === "detail" && activeSynthese && syntheseKey(activeSynthese) === id) {
                setViewMode("list");
                setActiveSynthese(null);
            }
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de supprimer cette synthèse." });
        }
    };

    const handleGenerateFromDetail = async () => {
        if (!activeSynthese) return;
        const id = syntheseKey(activeSynthese);
        setGeneratingDetail(true);
        try {
            const res = await fetch(`${API}/syntheses/${id}/generate`, {
                method: "POST",
                headers: authHeaders,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Erreur lors de la génération.");
            setActiveSynthese(prev => ({ ...prev, synthese: data.synthese }));
            fetchSavedSyntheses();
            toast.success({ title: "Synthèse générée" });
        } catch (err) {
            toast.error({ title: "Échec génération", message: err.message });
        } finally {
            setGeneratingDetail(false);
        }
    };

    const openDetail = async (item) => {
        setActiveSynthese(item);
        setViewMode("detail");
        setLoadingDetail(true);
        try {
            const res = await fetch(`${API}/syntheses/${syntheseKey(item)}`, { headers: authHeaders });
            if (res.ok) {
                const data = await res.json();
                setActiveSynthese(data);
            }
        } catch {
            // fallback list state
        } finally {
            setLoadingDetail(false);
        }
    };

    const detailRessources = activeSynthese?.ressources ?? [];

    // ───────────────────────────── RENDU : DÉTAIL D'UNE SYNTHÈSE (AVEC WYSIWYG) ─────────────────────────────
    if (viewMode === "detail" && activeSynthese) {
        const id = syntheseKey(activeSynthese);
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => { setViewMode("list"); setActiveSynthese(null); }}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        <FiArrowLeft size={16} /> Synthèses
                    </button>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-xl font-semibold text-blue-600 truncate flex-1">
                        {syntheseLabel(activeSynthese)}
                    </h1>

                    {/* BOUTON ENREGISTRER CONTEXTUEL */}
                    {isDetailDirty && (
                        <button
                            onClick={handleSaveDetailEdits}
                            disabled={isSavingDetail}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                        >
                            <FiSave size={13} /> {isSavingDetail ? "Sauvegarde..." : "Enregistrer"}
                        </button>
                    )}

                    {activeSynthese.synthese && (
                        <button
                            onClick={() => exportSyntheseToPDF(activeSynthese.synthese, activeSynthese.date_creation)}
                            className="text-gray-300 hover:text-blue-500 transition-colors cursor-pointer shrink-0"
                            title="Télécharger la synthèse"
                        >
                            <FiDownload size={16} />
                        </button>
                    )}
                    {confirmDelete === id ? (
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500">Confirmer la suppression ?</span>
                            <button onClick={() => handleDeleteSynthese(id)} className="text-blue-600 hover:text-red-600 cursor-pointer">
                                <FiCheckCircle size={15} />
                            </button>
                            <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <FiX size={15} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(id)}
                            className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                            title="Supprimer cette synthèse"
                        >
                            <FiTrash2 size={16} />
                        </button>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden mb-8 flex flex-col">
                    <div className="flex items-center justify-between bg-slate-50 border-b border-gray-100 px-4 py-2 text-xs text-gray-400 shrink-0">
                        <div className="flex items-center gap-1.5 font-medium">
                            <FiCalendar size={13} />
                            {activeSynthese.date_creation
                                ? new Date(activeSynthese.date_creation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                                : ""}
                        </div>

                        {/* EDITEUR WYSIWYG INTEGRÉ DANS L'HISTORIQUE DE VUE */}
                        {activeSynthese.synthese && (
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => execDetailCommand("bold")}
                                    className="p-1 text-gray-700 hover:bg-gray-100 rounded cursor-pointer font-bold flex items-center justify-center"
                                    title="Mettre en gras"
                                >
                                    <FiBold size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => execDetailCommand("backColor", "#fef08a")}
                                    className="p-1 text-gray-700 hover:bg-yellow-100 rounded cursor-pointer flex items-center justify-center gap-0.5"
                                    title="Surligner"
                                >
                                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => execDetailCommand("removeFormat")}
                                    className="px-1 text-[10px] text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                    Nettoyer
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-5">
                        {activeSynthese.synthese ? (
                            <div
                                ref={detailEditorRef}
                                contentEditable
                                onInput={(e) => {
                                    setDetailText(e.target.innerHTML);
                                    setIsDetailDirty(true);
                                }}
                                className="text-sm text-gray-700 outline-none font-sans leading-relaxed space-y-1 min-h-[6rem]"
                                placeholder="Ajoutez votre contenu ici..."
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-6 text-center">
                                <p className="text-sm text-gray-400">Cette synthèse n'a pas encore été générée.</p>
                                <button
                                    onClick={handleGenerateFromDetail}
                                    disabled={generatingDetail}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <FiCpu size={14} className={generatingDetail ? "animate-spin" : ""} />
                                    {generatingDetail ? "Génération en cours..." : "Générer maintenant"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FiFileText size={15} className="text-blue-600" /> Ressources associées
                </h2>

                {loadingDetail ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
                ) : detailRessources.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Aucune ressource associée trouvée.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {detailRessources.map((r, i) => (
                            <div key={ressourceKey(r) ?? i} className="h-full">
                                <Cards
                                    type={r.type}
                                    titre={r.nom_original || r.title}
                                    description={r.resume || r.description}
                                    image={r.image}
                                    lien={r.url || r.lien}
                                    date={r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : undefined}
                                    tags={getTags(r)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ───────────────────────────── RENDU : LISTE DES SYNTHÈSES ─────────────────────────────
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2.5">
                    <IoNewspaperOutline className="text-blue-600" size={26} />
                    <div>
                        <h1 className="text-2xl font-bold text-blue-600">Mes Synthèses</h1>
                    </div>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
                >
                    <FiPlus size={16} /> Ajouter une synthèse
                </button>
            </div>

            {loadingHistory ? (
                <div className="text-center py-12 text-gray-400 text-sm">Chargement...</div>
            ) : savedSyntheses.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-400">
                    <FiFileText size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune synthèse enregistrée pour le moment.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {savedSyntheses.map((item) => {
                        const id = syntheseKey(item);
                        return (
                            <div key={id} className="relative group">
                                <button
                                    onClick={() => openDetail(item)}
                                    className="text-left w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <FiFileText className="text-blue-600" size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate">{syntheseLabel(item)}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">{item.ressources?.length ?? 0} ressource{(item.ressources?.length ?? 0) > 1 ? "s" : ""}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap shrink-0 pr-7">
                                            <FiCalendar size={13} />
                                            {item.date_creation ? new Date(item.date_creation).toLocaleDateString("fr-FR") : ""}
                                        </div>
                                    </div>
                                </button>

                                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                    {confirmDelete === id ? (
                                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                                            <button onClick={() => handleDeleteSynthese(id)} className="text-blue-600 hover:text-red-600 cursor-pointer">
                                                <FiCheckCircle size={14} />
                                            </button>
                                            <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                                <FiX size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDelete(id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 cursor-pointer"
                                            title="Supprimer"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modalOpen && (
                <SyntheseModal
                    step={modalStep}
                    onClose={closeModal}
                    search={search} setSearch={setSearch}
                    availableTypes={availableTypes} selectedTypes={selectedTypes} toggleType={toggleType}
                    availableTags={availableTags} // <-- Le correctif est ici (pas d'espace !)
                    selectedTagIds={selectedTagIds} toggleTag={toggleTag}
                    dateFilter={dateFilter} setDateFilter={setDateFilter}
                    resetFilters={resetFilters}
                    hasActiveFilters={selectedTagIds.size > 0 || selectedTypes.size > 0 || !!dateFilter || !!search}
                    loadingArticles={loadingArticles} filteredArticles={filteredArticles}
                    selectedArticles={selectedArticles} toggleSelectArticle={toggleSelectArticle}
                    onConfirmSelection={confirmSelection} isSubmittingSelection={isSubmittingSelection}
                    onBackToSelect={() => setModalStep("select")}
                    hasGenerated={hasGenerated} isGenerating={isGenerating}
                    onGenerate={handleGenerateSynthese}
                    generatedText={generatedText} setGeneratedText={setGeneratedText}
                    isSavingDoc={isSavingDoc} onSave={handleSaveDocument} onExportPDF={handleExportPDF}
                />
            )}
        </div>
    );
}