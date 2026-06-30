import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import { FiZap, FiShare2, FiRss, FiExternalLink, FiPlus, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import Modal from "../Modal/Modal";
import SaveButton from "../Inputs/SaveButton";

const API = "http://localhost/api";

export default function DashboardHome() {
    const { token, user } = useUser();
    const { toast } = useToast();

    const [allArticles, setAllArticles] = useState([]);
    const [displayedArticles, setDisplayedArticles] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [hasFeeds, setHasFeeds] = useState(true);
    const [isTimelineEmpty, setIsTimelineEmpty] = useState(false);

    const [seenCount, setSeenCount] = useState(() => {
        const saved = localStorage.getItem("watchboard_seen_articles");
        return saved ? JSON.parse(saved).length : 0;
    });

    const [shareModal, setShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [shareEmail, setShareEmail] = useState("");
    const [sharing, setSharing] = useState(false);

    const [savedMap, setSavedMap] = useState({});

    const observer = useRef();
    const viewedObserver = useRef();
    const ARTICLES_PER_PAGE = 5;

    const getArticleUrl = (article) => article.link || article.url || article.id;

    useEffect(() => {
        viewedObserver.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const key = entry.target.getAttribute("data-article-key");
                    if (key) {
                        const saved = localStorage.getItem("watchboard_seen_articles");
                        const currentSet = saved ? new Set(JSON.parse(saved)) : new Set();
                        if (!currentSet.has(key)) {
                            currentSet.add(key);
                            const nextArray = [...currentSet];
                            localStorage.setItem("watchboard_seen_articles", JSON.stringify(nextArray));
                            setSeenCount(nextArray.length);
                        }
                    }
                }
            });
        }, { threshold: 0.6 });

        return () => viewedObserver.current?.disconnect();
    }, []);

    const lastArticleRef = useCallback(node => {
        if (loading || !hasFeeds || isTimelineEmpty) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.6 });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, hasFeeds, isTimelineEmpty]);

    const suggestionsDeFlux = [
        { name: "TechCrunch", url: "https://techcrunch.com/feed/", type: "rss", desc: "L'actualité des startups et de la tech mondiale en continu." },
        { name: "Underscore_", url: "https://www.youtube.com/@underscore_", type: "youtube", desc: "Le talk-show tech incontournable présenté par Micode." },
        { name: "Le Monde - Pixels", url: "https://www.lemonde.fr/pixels/rss_full.xml", type: "rss", desc: "Veille française sur la culture numérique et les technologies." }
    ];

    const fetchTimelineDiscover = useCallback(async () => {
        setLoading(true);
        setIsTimelineEmpty(false);
        try {
            const ressourcesRes = await fetch(`${API}/ressources`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            let initialSavedMap = {};
            if (ressourcesRes.ok) {
                const ressourcesData = await ressourcesRes.json();
                const cleanRessources = Array.isArray(ressourcesData) ? ressourcesData : ressourcesData.data ?? [];
                cleanRessources.forEach(r => {
                    if (r.url) initialSavedMap[r.url] = r.id_ressource;
                });
                setSavedMap(initialSavedMap);
            }

            const articlesRes = await fetch(`${API}/feeds/articles/discover`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!articlesRes.ok) throw new Error();
            const data = await articlesRes.json();
            const articlesList = Array.isArray(data) ? data : data.data ?? [];

            if (articlesList.length === 0) {
                setHasFeeds(false);
                setLoading(false);
                return;
            }

            setHasFeeds(true);

            const savedSeen = localStorage.getItem("watchboard_seen_articles");
            const currentSeenSet = savedSeen ? new Set(JSON.parse(savedSeen)) : new Set();

            const uniqueUnseenArticles = [];
            const trackDuplicates = new Set();

            articlesList.forEach(art => {
                const key = getArticleUrl(art);
                if (!currentSeenSet.has(key) && !trackDuplicates.has(key)) {
                    let resolvedFeedId = art.id_fluxrss || art.feed_id || 1;
                    uniqueUnseenArticles.push({ ...art, id_fluxrss: Number(resolvedFeedId) });
                    trackDuplicates.add(key);
                }
            });

            if (uniqueUnseenArticles.length === 0 && articlesList.length > 0) {
                setIsTimelineEmpty(true);
                setLoading(false);
                return;
            }

            const withPhotos = uniqueUnseenArticles.filter(art => art.image || art.enclosure?.url || art.cover);
            const withoutPhotos = uniqueUnseenArticles.filter(art => !(art.image || art.enclosure?.url || art.cover));
            const prioritizedArticles = [...withPhotos, ...withoutPhotos];

            setPage(1);
            setAllArticles(prioritizedArticles);
            setDisplayedArticles(prioritizedArticles.slice(0, ARTICLES_PER_PAGE));
            setHasMore(prioritizedArticles.length > ARTICLES_PER_PAGE);
        } catch (error) {
            console.error("Erreur de chargement du flux discover :", error);
            setHasFeeds(false);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchTimelineDiscover();
    }, [token]);

    useEffect(() => {
        if (page > 1 && allArticles.length > 0) {
            const start = (page - 1) * ARTICLES_PER_PAGE;
            const end = start + ARTICLES_PER_PAGE;
            const nextBatch = allArticles.slice(start, end);
            if (nextBatch.length > 0) {
                setDisplayedArticles(prev => [...prev, ...nextBatch]);
                setHasMore(allArticles.length > end);
            } else {
                setHasMore(false);
            }
        }
    }, [page, allArticles]);

    const handleResetHistory = () => {
        localStorage.removeItem("watchboard_seen_articles");
        setSeenCount(0);
        fetchTimelineDiscover();
        toast.success({ title: "Historique réinitialisé" });
    };

    const handleSaveArticleToggle = async (article) => {
        const urlKey = getArticleUrl(article);
        const ressourceId = savedMap[urlKey];

        if (!ressourceId) {
            try {
                const res = await fetch(`${API}/ressources/from-rss`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        url: urlKey,
                        resume: article.description || article.summary || "Aucun résumé disponible",
                        image: article.image || article.enclosure?.url || article.cover || null,
                        nom_original: article.title || undefined,
                        id_fluxrss: Number(article.id_fluxrss),
                    }),
                });
                if (!res.ok) throw new Error();
                const ressource = await res.json();
                setSavedMap(prev => ({ ...prev, [urlKey]: ressource.id }));
                toast.success({ title: "Article enregistré dans vos ressources" });
                return ressource.id;
            } catch {
                toast.error({ title: "Erreur lors de l'enregistrement" });
                return null;
            }
        } else {
            try {
                const res = await fetch(`${API}/ressources/${ressourceId}/delete`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                setSavedMap(prev => { const next = { ...prev }; delete next[urlKey]; return next; });
                toast.success({ title: "Article retiré de vos ressources" });
                return null;
            } catch {
                toast.error({ title: "Impossible de retirer l'article" });
                return null;
            }
        }
    };

    const openShareModal = async (article) => {
        const urlKey = getArticleUrl(article);
        let ressourceId = savedMap[urlKey];

        if (!ressourceId) {
            toast.info({ title: "Indexation", message: "Génération de l'accès de partage..." });
            ressourceId = await handleSaveArticleToggle(article);
            if (!ressourceId) return;
        }

        setShareTarget({ id_ressource: ressourceId, nom_original: article.title || article.nom_original });
        setShareEmail("");
        setShareModal(true);
    };

    const handleShareSubmit = async () => {
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

    const handleAddSuggestedFeed = async (feed) => {
        try {
            const res = await fetch(`${API}/feeds`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ url: feed.url, name: feed.name }),
            });
            if (!res.ok) throw new Error();
            toast.success({ title: "Flux activé !", message: `${feed.name} a été ajouté.` });
            fetchTimelineDiscover();
        } catch {
            toast.error({ title: "Erreur", message: "Impossible d'ajouter ce flux." });
        }
    };

    return (
        <div className="max-w-2xl mx-auto">

            {/* En-tête */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Bonjour, <span className="text-blue-600">{user?.prenom || "Alban"}</span>
                    </h1>
                    {(!hasFeeds || isTimelineEmpty) && (
                        <p className="text-sm text-gray-400 mt-0.5">
                            {!hasFeeds ? "Initialisez votre espace" : "Vous avez tout lu"}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {hasFeeds && !isTimelineEmpty && (
                        <button
                            onClick={fetchTimelineDiscover}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            Actualiser
                        </button>
                    )}
                    {seenCount > 0 && (
                        <button
                            onClick={handleResetHistory}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                        >
                            Réinitialiser ({seenCount})
                        </button>
                    )}
                </div>
            </div>

            {/* CAS 1 : TIMELINE DISPONIBLE */}
            {hasFeeds && !isTimelineEmpty ? (
                <div className="flex flex-col gap-4">
                    {displayedArticles.map((article, index) => {
                        const isLast = displayedArticles.length === index + 1;
                        const urlKey = getArticleUrl(article);
                        const isSaved = !!savedMap[urlKey];
                        const artImage = article.image || article.enclosure?.url || article.cover;
                        const isYoutube = (article.link || article.url || "").includes("youtube.com");

                        return (
                            <div
                                key={urlKey}
                                data-article-key={urlKey}
                                ref={(node) => {
                                    if (isLast) lastArticleRef(node);
                                    if (node) viewedObserver.current?.observe(node);
                                }}
                                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Image */}
                                <div className="w-full h-44 bg-gray-50 relative overflow-hidden">
                                    {artImage ? (
                                        <img src={artImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FiZap size={28} className="text-gray-300" />
                                        </div>
                                    )}
                                    <div className={`absolute top-3 left-3 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white ${isYoutube ? "bg-red-500" : "bg-blue-500"}`}>
                                        {isYoutube ? <FaYoutube size={11} /> : <FiRss size={11} />}
                                        {isYoutube ? "YouTube" : "RSS"}
                                    </div>
                                </div>

                                {/* Contenu */}
                                <div className="p-4">
                                    <h2 className="text-base font-semibold text-gray-900 tracking-tight line-clamp-2 mb-1">
                                        {article.title || article.nom_original}
                                    </h2>
                                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                                        {article.description || article.summary || "Aucun résumé disponible pour ce document."}
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={article.link || article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            Voir la ressource
                                            <FiExternalLink size={13} />
                                        </a>

                                        <SaveButton
                                            saved={isSaved}
                                            onSave={() => handleSaveArticleToggle(article)}
                                        />

                                        <button
                                            onClick={() => openShareModal(article)}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-colors cursor-pointer"
                                            title="Partager par e-mail"
                                        >
                                            <FiShare2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {loading && (
                        <div className="text-center py-4 text-sm text-gray-400">Chargement...</div>
                    )}
                </div>
            ) : hasFeeds && isTimelineEmpty ? (

                /* TIMELINE ENTIÈREMENT CONSOMMÉE */
                <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                    <FiCheckCircle size={40} className="text-emerald-500 mb-4" />
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Vous avez tout lu !</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-6">
                        Aucun contenu inédit n'est disponible. Rafraîchissez la timeline ou repassez les articles déjà lus.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchTimelineDiscover}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                            <FiRefreshCw size={13} />
                            Vérifier les nouveautés
                        </button>
                        <button
                            onClick={handleResetHistory}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                            Revoir les articles lus
                        </button>
                    </div>
                </div>
            ) : (

                /* CAS 2 : SUGGESTIONS */
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                            <FiZap size={14} className="text-yellow-400" />
                            Aucun abonnement trouvé
                        </h3>
                        <p className="text-sm text-blue-600">
                            Votre fil d'actualité est vide. Activez l'une de nos recommandations ci-dessous pour démarrer.
                        </p>
                    </div>

                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Suggestions recommandées</p>

                    <div className="flex flex-col gap-2">
                        {suggestionsDeFlux.map((suggested, idx) => (
                            <div key={idx} className="p-3 border border-gray-100 hover:border-gray-200 rounded-xl bg-slate-50/50 flex items-center justify-between gap-3 transition-colors">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${suggested.type === "youtube" ? "bg-red-500" : "bg-blue-500"}`}>
                                            {suggested.type === "youtube" ? "YouTube" : "RSS"}
                                        </span>
                                        <h4 className="text-sm font-medium text-gray-900 truncate">{suggested.name}</h4>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-1">{suggested.desc}</p>
                                </div>
                                <button
                                    onClick={() => handleAddSuggestedFeed(suggested)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-blue-600 border border-gray-200 hover:border-blue-600 rounded-lg text-gray-500 hover:text-white text-xs font-medium transition-all cursor-pointer shrink-0"
                                >
                                    <FiPlus size={13} />
                                    Ajouter
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
                        Ajoutez vos propres sources depuis l'onglet <span className="text-blue-500 font-medium">Mes flux</span>.
                    </p>
                </div>
            )}

            {/* MODALE DE PARTAGE */}
            <Modal
                isOpen={shareModal}
                onClose={() => setShareModal(false)}
                title={`Partager « ${shareTarget?.nom_original || ""} »`}
                actions={[
                    {
                        label: sharing ? "Envoi..." : "Partager",
                        variant: "primary",
                        onClick: handleShareSubmit,
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
                        onKeyDown={e => e.key === "Enter" && handleShareSubmit()}
                        placeholder="utilisateur@exemple.com"
                        autoFocus
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors bg-white"
                    />
                </div>
            </Modal>
        </div>
    );
}
