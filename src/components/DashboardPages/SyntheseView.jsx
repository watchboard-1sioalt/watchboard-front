import { useState, useEffect, useCallback, useMemo } from "react";
import { IoNewspaperOutline } from "react-icons/io5";
import { FiRefreshCw, FiCheckCircle, FiCpu, FiPlus, FiArrowLeft, FiCalendar, FiFileText, FiDownload, FiSave, FiTag, FiSearch } from "react-icons/fi";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import Cards from "../Cards/Cards";

const API = "http://localhost/api";

export default function SyntheseView() {
    const { token } = useUser();
    const { toast } = useToast();
    
    // Navigation
    const [viewMode, setViewMode] = useState("list"); // "list" | "create"

    // États des données
    const [savedSyntheses, setSavedSyntheses] = useState([]);
    const [savedArticles, setSavedArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    
    // Filtres
    const [search, setSearch] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState(new Set());

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
            setSavedSyntheses(data);
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
    }, [token, toast]);

    useEffect(() => {
        if (token) fetchSavedSyntheses();
    }, [token, fetchSavedSyntheses]);

    // Déclencheurs de filtres
    const availableTags = useMemo(() => {
        const map = new Map();
        savedArticles.forEach(art => (art.tags ?? []).forEach(t => map.set(t.id_tag, t)));
        return [...map.values()];
    }, [savedArticles]);

    const filteredArticles = useMemo(() => {
        let result = savedArticles;
        if (selectedTagIds.size > 0) {
            result = result.filter(art => (art.tags ?? []).some(t => selectedTagIds.has(t.id_tag)));
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(art => 
                (art.nom_original || art.title || "").toLowerCase().includes(q) ||
                (art.resume || art.description || "").toLowerCase().includes(q)
            );
        }
        return result;
    }, [savedArticles, selectedTagIds, search]);

    const handleOpenCreateMode = () => {
        setViewMode("create");
        setHasGenerated(false);
        setGeneratedText("");
        setSyntheseTitle("");
        setSelectedArticles([]);
        fetchSavedArticlesOnly();
    };

    const toggleSelectArticle = (article) => {
        const key = article.id || article.id_ressource;
        setSelectedArticles(prev => {
            const isAlreadySelected = prev.some(a => (a.id || a.id_ressource) === key);
            if (isAlreadySelected) return prev.filter(a => (a.id || a.id_ressource) !== key);
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
                    articles_ids: selectedArticles.map(a => a.id || a.id_ressource)
                }),
            });
            if (!res.ok) throw new Error("Erreur lors de la sauvegarde sur le serveur.");
            
            toast.success({ title: "Document enregistré dans votre historique" });
            fetchSavedSyntheses();
            setViewMode("list");
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

    const displayArticles = hasGenerated ? selectedArticles : filteredArticles;

    // Rendu Historique
    if (viewMode === "list") {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-2.5">
                        <IoNewspaperOutline className="text-blue-600" size={26} />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Mes Synthèses</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Historique et compilation de vos documents</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenCreateMode}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
                    >
                        <FiPlus size={16} /> Créer une synthèse
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
                            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h3 className="font-semibold text-gray-900">{item.titre}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                                        <FiCalendar size={13} />
                                        {new Date(item.date).toLocaleDateString("fr-FR")}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 bg-slate-50 p-2 rounded-lg font-mono mb-2">{item.content}</p>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => {
                                            setGeneratedText(item.content);
                                            setSyntheseTitle(item.titre);
                                            setSelectedArticles([]);
                                            setHasGenerated(true);
                                            setViewMode("create");
                                        }}
                                        className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                                    >
                                        Consulter le document →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Rendu Édition / Création
    return (
        <div className="max-w-5xl mx-auto pb-24 relative">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setViewMode("list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors cursor-pointer">
                    <FiArrowLeft size={16} /> Historique
                </button>
                <span className="text-gray-300">/</span>
                <h1 className="text-xl font-semibold text-blue-600">
                    {hasGenerated ? "Articles inclus dans le rapport" : "Sélection des ressources enregistrées"}
                </h1>
            </div>

            {/* BARRE DE FILTRES (Affichée uniquement en phase de sélection) */}
            {!hasGenerated && !loadingArticles && savedArticles.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col gap-4 shadow-xs">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Filtrer mes articles enregistrés par mot-clé..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-slate-50 outline-none focus:border-blue-400 focus:bg-white transition-all"
                        />
                    </div>
                    {availableTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <FiTag className="text-gray-400 mr-1" size={13} />
                            {availableTags.map(tag => {
                                const active = selectedTagIds.has(tag.id_tag);
                                return (
                                    <button
                                        key={tag.id_tag}
                                        onClick={() => toggleTag(tag.id_tag)}
                                        className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer font-medium ${
                                            active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                                        }`}
                                    >
                                        {tag.tag}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {loadingArticles ? (
                <div className="text-center py-20 text-gray-400 text-sm">Indexation des ressources...</div>
            ) : displayArticles.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm">Aucun article enregistré ne correspond à vos filtres.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {displayArticles.map((article, i) => {
                        const key = article.id || article.id_ressource || i;
                        const isSelected = selectedArticles.some(a => (a.id || a.id_ressource) === key);

                        return (
                            <div 
                                key={key} 
                                onClick={() => !hasGenerated && toggleSelectArticle(article)}
                                className={`relative transition-all rounded-xl ${!hasGenerated ? "cursor-pointer select-none" : ""} ${
                                    isSelected && !hasGenerated ? "ring-2 ring-blue-500 scale-[0.99]" : "hover:scale-[1.01]"
                                }`}
                            >
                                {!hasGenerated && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white/90 border-gray-300 text-transparent"
                                        }`}>
                                            <FiCheckCircle size={14} />
                                        </div>
                                    </div>
                                )}
                                <div className={isSelected && !hasGenerated ? "opacity-90 pointer-events-none" : ""}>
                                    <Cards
                                        titre={article.nom_original || article.title}
                                        description={article.resume || article.description}
                                        date={article.created_at ? new Date(article.created_at).toLocaleDateString("fr-FR") : undefined}
                                        image={article.image}
                                        lien={article.url || article.lien}
                                        saved={true} 
                                        onSave={() => {}}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* BLOC DE SYNTHÈSE + CONFIG ACTIONS */}
            {hasGenerated && (
                <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-900">
                            <FiCpu className="text-blue-600" size={18} />
                            <h2 className="text-base font-semibold">Édition du rapport final</h2>
                        </div>
                        <input 
                            type="text"
                            value={syntheseTitle}
                            onChange={e => setSyntheseTitle(e.target.value)}
                            placeholder="Donnez un titre à cette synthèse (ex: Veille Stratégique SIO)..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-slate-50 outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    <textarea
                        value={generatedText}
                        onChange={(e) => setGeneratedText(e.target.value)}
                        className="w-full h-80 p-4 border border-gray-200 rounded-lg text-sm bg-slate-50/50 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-mono text-gray-700 leading-relaxed shadow-inner mb-4"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                        <button
                            onClick={() => setHasGenerated(false)}
                            className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
                        >
                            ← Ajuster la sélection de base
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 hover:bg-slate-50 text-gray-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                                <FiDownload size={14} /> Exporter en PDF
                            </button>
                            <button
                                onClick={handleSaveDocument}
                                disabled={isSavingDoc}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                                <FiSave size={14} /> 
                                {isSavingDoc ? "Sauvegarde..." : "Enregistrer la synthèse"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BOUTON FLOTTANT D'ACTION IA */}
            {selectedArticles.length > 0 && !hasGenerated && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <button
                        onClick={handleGenerateSynthese}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-xl transition-all text-sm cursor-pointer disabled:opacity-50"
                    >
                        <FiCpu size={16} className={isGenerating ? "animate-spin" : ""} />
                        {isGenerating ? "Génération IA en cours..." : `Générer une synthèse (${selectedArticles.length})`}
                    </button>
                </div>
            )}
        </div>
    );
}