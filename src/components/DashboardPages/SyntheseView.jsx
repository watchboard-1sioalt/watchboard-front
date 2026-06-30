import { useState, useEffect, useCallback, useMemo } from "react";
import { IoNewspaperOutline } from "react-icons/io5";
import {
    FiCheckCircle, FiCpu, FiPlus, FiArrowLeft, FiCalendar, FiFileText,
    FiDownload, FiSave, FiTag, FiSearch, FiX, FiFilter, FiRss, FiGlobe
} from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { FaFile } from "react-icons/fa6";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import Cards from "../Cards/Cards";
import { API_BASE_URL as API } from "../../config/api";

const TYPE_META = {
    rss: { label: "RSS", icon: <FiRss size={12} /> },
    youtube: { label: "YouTube", icon: <FaYoutube size={12} /> },
    file: { label: "Fichier", icon: <FaFile size={12} /> },
    url: { label: "Site web", icon: <FiGlobe size={12} /> },
};

const getTags = (r) => r.tags ?? r.tag ?? [];
const ressourceKey = (r) => r.id_ressource ?? r.id;
const syntheseKey = (s) => s.id_synthese ?? s.id;

function SyntheseModal({
    step, onClose,
    // Sélection
    search, setSearch,
    availableTypes, selectedTypes, toggleType,
    availableTags, selectedTagIds, toggleTag,
    dateFilter, setDateFilter,
    resetFilters, hasActiveFilters,
    loadingArticles, filteredArticles,
    selectedArticles, toggleSelectArticle,
    onConfirmSelection,
    // Génération / édition
    onBackToSelect,
    hasGenerated, isGenerating, onGenerate, onRegenerate,
    generatedText, setGeneratedText,
    syntheseTitle, setSyntheseTitle,
    isSavingDoc, onSave, onExportPDF,
}) {
    const title = step === "select"
        ? "Sélectionner des ressources à synthétiser"
        : hasGenerated ? "Édition du rapport final" : "Génération de la synthèse";

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
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {step === "select" ? (
                    <>
                        <div className="px-5 py-3 border-b border-gray-100 flex flex-col gap-2 shrink-0 max-h-28 overflow-y-auto">
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

                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                {availableTypes.length > 1 && (
                                    <>
                                        <FiFilter className="text-gray-400" size={12} />
                                        {availableTypes.map(t => {
                                            const meta = TYPE_META[t] ?? { label: t, icon: null };
                                            const active = selectedTypes.has(t);
                                            return (
                                                <button
                                                    key={t}
                                                    onClick={() => toggleType(t)}
                                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors cursor-pointer font-medium ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}
                                                >
                                                    {meta.icon}{meta.label}
                                                </button>
                                            );
                                        })}
                                        <span className="w-px h-3 bg-gray-200 mx-0.5" />
                                    </>
                                )}

                                {availableTags.length > 0 && (
                                    <>
                                        <FiTag className="text-gray-400" size={12} />
                                        {availableTags.map(tag => {
                                            const active = selectedTagIds.has(tag.id_tag);
                                            return (
                                                <button
                                                    key={tag.id_tag}
                                                    onClick={() => toggleTag(tag.id_tag)}
                                                    className={`px-2 py-0.5 rounded-full border transition-colors cursor-pointer font-medium ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}
                                                >
                                                    {tag.tag}
                                                </button>
                                            );
                                        })}
                                        <span className="w-px h-3 bg-gray-200 mx-0.5" />
                                    </>
                                )}

                                <FiCalendar className="text-gray-400" size={12} />
                                {[
                                    { id: "today", label: "Aujourd'hui" },
                                    { id: "week", label: "Cette semaine" },
                                    { id: "month", label: "Ce mois" },
                                    { id: "year", label: "Cette année" },
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setDateFilter(prev => prev === p.id ? null : p.id)}
                                        className={`px-2 py-0.5 rounded-full border transition-colors cursor-pointer font-medium ${dateFilter === p.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        className="text-gray-400 hover:text-gray-600 cursor-pointer underline"
                                    >
                                        Réinitialiser
                                    </button>
                                )}
                            </div>
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
                            <button
                                onClick={onConfirmSelection}
                                disabled={selectedArticles.length === 0}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Continuer ({selectedArticles.length})
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="px-5 py-4 overflow-y-auto flex-1">
                            <button
                                onClick={onBackToSelect}
                                className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer underline mb-4"
                            >
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
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                    <div className="flex flex-col gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <FiCpu className="text-blue-600" size={18} />
                                            <h3 className="text-sm font-semibold">Rapport généré</h3>
                                        </div>
                                        <input
                                            type="text"
                                            value={syntheseTitle}
                                            onChange={e => setSyntheseTitle(e.target.value)}
                                            placeholder="Donnez un titre à cette synthèse (ex: Veille Stratégique SIO)..."
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>

                                    <textarea
                                        value={generatedText}
                                        onChange={(e) => setGeneratedText(e.target.value)}
                                        className="w-full h-64 p-4 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-mono text-gray-700 leading-relaxed shadow-inner"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 shrink-0">
                            {!hasGenerated ? (
                                <>
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
                                    <button
                                        onClick={onRegenerate}
                                        className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                    >
                                        ← Régénérer
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={onExportPDF}
                                            className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 hover:bg-slate-50 text-gray-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                        >
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

export default function SyntheseView() {
    const { token } = useUser();
    const { toast } = useToast();

    // Navigation (page de fond)
    const [viewMode, setViewMode] = useState("list"); // "list" | "detail"

    // États des données
    const [savedSyntheses, setSavedSyntheses] = useState([]);
    const [savedArticles, setSavedArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Détail d'une synthèse consultée
    const [activeSynthese, setActiveSynthese] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Modal de création (sélection -> génération -> édition)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState("select"); // "select" | "edit"

    // Filtres (dans la popup de sélection)
    const [search, setSearch] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState(new Set());
    const [selectedTypes, setSelectedTypes] = useState(new Set());
    const [dateFilter, setDateFilter] = useState(null); // null | "today" | "week" | "month" | "year"

    // Sélection, Édition & Sauvegarde
    const [selectedArticles, setSelectedArticles] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingDoc, setIsSavingDoc] = useState(false);
    const [generatedText, setGeneratedText] = useState("");
    const [syntheseTitle, setSyntheseTitle] = useState("");
    const [hasGenerated, setHasGenerated] = useState(false);

    // 1. Charger l'historique des synthèses
    const fetchSavedSyntheses = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`${API}/syntheses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSavedSyntheses(Array.isArray(data) ? data : data.data ?? []);
        } catch {
            setSavedSyntheses([]);
        } finally {
            setLoadingHistory(false);
        }
    }, [token]);

    // 2. Charger UNIQUEMENT les articles enregistrés (Ressources)
    const fetchSavedArticlesOnly = useCallback(async () => {
        setLoadingArticles(true);
        try {
            const res = await fetch(`${API}/ressources`, {
                headers: { Authorization: `Bearer ${token}` },
            });
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

    // Déclencheurs de filtres (comme dans "Mes ressources")
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

        if (selectedTypes.size > 0) {
            result = result.filter(a => selectedTypes.has(a.type));
        }

        if (selectedTagIds.size > 0) {
            result = result.filter(art => getTags(art).some(t => selectedTagIds.has(t.id_tag)));
        }

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
            if (dateFilter === "today") { start.setHours(0, 0, 0, 0); }
            else if (dateFilter === "week") { start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); start.setHours(0, 0, 0, 0); }
            else if (dateFilter === "month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
            else if (dateFilter === "year") { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
            result = result.filter(a => a.created_at && new Date(a.created_at) >= start);
        }

        return result;
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
        setSyntheseTitle("");
        setSelectedArticles([]);
        resetFilters();
        setModalStep("select");
        setModalOpen(true);
        fetchSavedArticlesOnly();
    };

    const closeModal = () => setModalOpen(false);

    const confirmSelection = () => {
        if (selectedArticles.length === 0) return;
        setModalStep("edit");
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

    // Appels API stricts (Aucun faux texte)
    const handleGenerateSynthese = async () => {
        if (selectedArticles.length === 0) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`${API}/syntheses/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    articles: selectedArticles.map(a => ({
                        title: a.nom_original || a.title,
                        description: a.resume || a.description,
                        url: a.url || a.lien
                    }))
                }),
            });
            if (!res.ok) throw new Error("L'API a renvoyé une erreur lors de la génération.");
            const data = await res.json();

            setGeneratedText(data.synthese || data.content || "");
            setHasGenerated(true);
            toast.success({ title: "Synthèse calculée avec succès !" });
        } catch (err) {
            toast.error({ title: "Échec génération", message: err.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDocument = async () => {
        if (!generatedText.trim()) return;
        setIsSavingDoc(true);
        try {
            const res = await fetch(`${API}/syntheses`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    titre: syntheseTitle.trim() || `Synthèse du ${new Date().toLocaleDateString("fr-FR")}`,
                    content: generatedText,
                    articles_ids: selectedArticles.map(ressourceKey)
                }),
            });
            if (!res.ok) throw new Error("Erreur lors de la sauvegarde sur le serveur.");

            toast.success({ title: "Document enregistré dans votre historique" });
            fetchSavedSyntheses();
            setModalOpen(false);
        } catch (err) {
            toast.error({ title: "Erreur d'enregistrement", message: err.message });
        } finally {
            setIsSavingDoc(false);
        }
    };

    // Export PDF Propre (Exclut l'interface du Dashboard)
    const handleExportPDF = () => {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
            <head>
                <title>${syntheseTitle || "Synthese_IA"}</title>
                <style>
                    body { font-family: system-ui, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
                    h1 { color: #2563eb; border-b: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 24px; }
                    .date { font-size: 12px; color: #64748b; margin-bottom: 30px; }
                    .content { white-space: pre-wrap; font-size: 14px; }
                </style>
            </head>
            <body>
                <h1>${syntheseTitle || "Synthèse Documentaire Automatisée"}</h1>
                <div class="date">Généré le ${new Date().toLocaleDateString("fr-FR")}</div>
                <div class="content">${generatedText}</div>
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const openDetail = async (item) => {
        setActiveSynthese(item);
        setViewMode("detail");
        setLoadingDetail(true);
        try {
            const res = await fetch(`${API}/syntheses/${syntheseKey(item)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setActiveSynthese(data);
            }
        } catch {
            // on garde l'item déjà disponible depuis la liste
        } finally {
            setLoadingDetail(false);
        }
    };

    const detailRessources = activeSynthese?.ressources ?? activeSynthese?.articles ?? [];

    // ───────────────────────────── Rendu : Détail d'une synthèse ─────────────────────────────
    if (viewMode === "detail" && activeSynthese) {
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
                    <h1 className="text-xl font-semibold text-blue-600 truncate">
                        {activeSynthese.titre || "Synthèse"}
                    </h1>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs mb-8">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                        <FiCalendar size={13} />
                        {activeSynthese.date || activeSynthese.date_creation
                            ? new Date(activeSynthese.date || activeSynthese.date_creation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                            : ""}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {activeSynthese.content || activeSynthese.synthese}
                    </p>
                </div>

                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FiFileText size={15} className="text-blue-600" />
                    Ressources associées
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

    // ───────────────────────────── Rendu : Historique ─────────────────────────────
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
                    {savedSyntheses.map((item) => (
                        <button
                            key={syntheseKey(item)}
                            onClick={() => openDetail(item)}
                            className="text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <FiFileText className="text-blue-600" size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{item.titre}</h3>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{item.content || item.synthese}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap shrink-0">
                                    <FiCalendar size={13} />
                                    {new Date(item.date || item.date_creation).toLocaleDateString("fr-FR")}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {modalOpen && (
                <SyntheseModal
                    step={modalStep}
                    onClose={closeModal}
                    search={search} setSearch={setSearch}
                    availableTypes={availableTypes} selectedTypes={selectedTypes} toggleType={toggleType}
                    availableTags={availableTags} selectedTagIds={selectedTagIds} toggleTag={toggleTag}
                    dateFilter={dateFilter} setDateFilter={setDateFilter}
                    resetFilters={resetFilters}
                    hasActiveFilters={selectedTagIds.size > 0 || selectedTypes.size > 0 || !!dateFilter || !!search}
                    loadingArticles={loadingArticles} filteredArticles={filteredArticles}
                    selectedArticles={selectedArticles} toggleSelectArticle={toggleSelectArticle}
                    onConfirmSelection={confirmSelection}
                    onBackToSelect={() => setModalStep("select")}
                    hasGenerated={hasGenerated} isGenerating={isGenerating}
                    onGenerate={handleGenerateSynthese}
                    onRegenerate={() => setHasGenerated(false)}
                    generatedText={generatedText} setGeneratedText={setGeneratedText}
                    syntheseTitle={syntheseTitle} setSyntheseTitle={setSyntheseTitle}
                    isSavingDoc={isSavingDoc} onSave={handleSaveDocument} onExportPDF={handleExportPDF}
                />
            )}
        </div>
    );
}
