import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import { FiZap, FiShare2, FiRss, FiExternalLink, FiPlus, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import Modal from "../Modal/Modal";
import SaveButton from "../Inputs/SaveButton";
import SubscribeButton from "../Inputs/SubscribeButton";
import { GoEyeClosed } from "react-icons/go";
import { API_BASE_URL as API } from "../../config/api";

export default function DashboardHome() {
    const { token, user } = useUser();
    const { toast } = useToast();

    // États de la timeline globale et pagination locale
    const [allArticles, setAllArticles] = useState([]);
    const [displayedArticles, setDisplayedArticles] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [hasFeeds, setHasFeeds] = useState(true);
    const [isTimelineEmpty, setIsTimelineEmpty] = useState(false);

    // Suivi des URLs abonnées normalisées pour la gestion d'état du bouton s'abonner
    const [subscribedUrls, setSubscribedUrls] = useState(new Set());

    // Compteur d'articles consultés
    const [seenCount, setSeenCount] = useState(() => {
        const saved = localStorage.getItem("watchboard_seen_articles");
        return saved ? JSON.parse(saved).length : 0;
    });

    // États de la modale de partage
    const [shareModal, setShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [shareEmail, setShareEmail] = useState("");
    const [sharing, setSharing] = useState(false);

    const [savedMap, setSavedMap] = useState({});

    const observer = useRef();
    const viewedObserver = useRef();
    const ARTICLES_PER_PAGE = 5;

    const getArticleUrl = (article) => article.link || article.url || article.id;

    // Nettoyeur d'URL ultra-robuste pour uniformiser et lisser les écarts de sous-domaines ou slashes
    const normalizeUrl = (url) => {
        if (!url) return "";
        return url
            .toLowerCase()
            .trim()
            .replace(/^(https?:\/\/)?(www\.)?/, "")
            .replace(/\/$/, "");
    };

    // 1. MARQUAGE DES ARTICLES LUS (Sans re-déclencher l'API)
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

    // 2. SCROLL INFINI LOCAL
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

    // Liste étendue à 5 suggestions de flux RSS stables
    const suggestionsDeFlux = [
        { name: "TechCrunch", url: "https://techcrunch.com/feed/", type: "rss", desc: "L'actualité des startups et de la tech mondiale en continu." },
        { name: "Frandroid", url: "https://www.frandroid.com/feed", type: "rss", desc: "Référence francophone sur l'actualité tech, les tests et innovations." },
        { name: "Le Monde - Pixels", url: "https://www.lemonde.fr/pixels/rss_full.xml", type: "rss", desc: "Veille française sur la culture numérique et les technologies." },
        { name: "Journal du Geek", url: "https://www.journaldugeek.com/feed/", type: "rss", desc: "Actualité geek, pop culture, gadgets et nouvelles technologies." },
        { name: "Clubic", url: "https://www.clubic.com/feed/news.rss", type: "rss", desc: "Toute l'actualité du numérique, du logiciel, du matériel et des tendances." }
    ];

    // 3. CHARGEMENT ET SYNCHRONISATION DU FLUX
    const fetchTimelineDiscover = useCallback(async () => {
        setLoading(true);
        setIsTimelineEmpty(false);
        try {
            // A. Synchro des sauvegardes BDD
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

            // B. Récupération des abonnements existants de l'utilisateur
            const feedsRes = await fetch(`${API}/feeds`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (feedsRes.ok) {
                const feedsData = await feedsRes.json();
                const cleanFeeds = Array.isArray(feedsData) ? feedsData : feedsData.data ?? [];
                const urls = new Set(cleanFeeds.map(f => normalizeUrl(f.url)));
                setSubscribedUrls(urls);
            }

            // C. Route de découverte Laravel
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

    // Chargement initial unique au montage
    useEffect(() => {
        if (token) fetchTimelineDiscover();
    }, [token]);

    // Pagination de défilement local progressif
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

    const openShareModal = (article) => {
        setShareTarget(article);
        setShareEmail("");
        setShareModal(true);
    };

    const handleShare = async () => {
        if (!shareEmail.trim() || !shareTarget) return;
        setSharing(true);
        try {
            const urlKey = getArticleUrl(shareTarget);
            let ressourceId = savedMap[urlKey];

            if (!ressourceId) {
                const saveRes = await fetch(`${API}/ressources/from-rss`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        url: urlKey,
                        resume: shareTarget.description || shareTarget.summary || "Aucun résumé disponible",
                        image: shareTarget.image || shareTarget.enclosure?.url || shareTarget.cover || null,
                        nom_original: shareTarget.title || shareTarget.nom_original || undefined,
                        id_fluxrss: Number(shareTarget.id_fluxrss),
                    }),
                });
                if (!saveRes.ok) throw new Error("Erreur d'indexation pré-partage");
                const ressource = await saveRes.json();
                ressourceId = ressource.id;
                setSavedMap(prev => ({ ...prev, [urlKey]: ressource.id }));
            }

            const res = await fetch(`${API}/ressources/${ressourceId}/share`, {
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

            setSubscribedUrls(prev => {
                const next = new Set(prev);
                next.add(normalizeUrl(feed.url));
                return next;
            });

            fetchTimelineDiscover();
        } catch {
            toast.error({ title: "Erreur", message: "Impossible d'ajouter ce flux." });
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-2">

            {/* En-tête de page */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Bonjour, <span className="text-blue-600">{user?.prenom || "Alban"}</span>
                    </h1>
                    {(!hasFeeds || isTimelineEmpty) && (
                        <p className="text-xs text-gray-400 mt-0.5 font-semibold tracking-wide">
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

            {/* Grille Principale */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Colonne gauche (Articles de h-[480px]) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {hasFeeds && !isTimelineEmpty ? (
                        <div className="flex flex-col gap-6">
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
                                        className="w-full h-[480px] bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                                    >
                                        {/* Image (50% de la hauteur totale de la carte) */}
                                        <div className="w-full h-1/2 bg-gray-50 relative overflow-hidden shrink-0">
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

                                        {/* Contenu et Zone de boutons */}
                                        <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                                            <div className="space-y-1">
                                                <h2 className="text-md font-extrabold text-gray-900 tracking-tight line-clamp-2">
                                                    {article.title || article.nom_original}
                                                </h2>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-3">
                                                    {article.description || article.summary || "Aucun résumé disponible pour ce document."}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 shrink-0">
                                                <a
                                                    href={article.link || article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-950 hover:bg-blue-600 text-white text-sm font-bold tracking-wide rounded-lg transition-colors uppercase"
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
                                <div className="text-center py-2 text-sm text-gray-400 font-bold uppercase tracking-wider">Mise à jour...</div>
                            )}
                        </div>
                    ) : hasFeeds && isTimelineEmpty ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                            <FiCheckCircle size={40} className="text-emerald-500 mb-4" />
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Vous avez tout lu !</h3>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-6">
                                Aucun contenu inédit n'est disponible. Utilisez l'actualisation ou réinitialisez vos lectures.
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
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center my-auto">
                            <h3 className="text-sm font-semibold text-blue-700 mb-1 flex items-center justify-center gap-1.5">
                                <GoEyeClosed size={18} className="text-blue-400" />
                                Aucun abonnement trouvé
                            </h3>
                            <p className="text-sm text-blue-600">
                                Utilisez le volet latéral droit pour activer vos premiers flux recommandés.
                            </p>
                        </div>
                    )}
                </div>

                {/* CORRECTION : Colonne droite épurée qui s'étend sur toute la page sans card-box limitante */}
                {!isTimelineEmpty && (
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="flex flex-col gap-4 sticky top-4">
                            <div className="pb-1 px-1">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Suggestions de flux</h3>
                            </div>

                            <div className="flex flex-col gap-3">
                                {suggestionsDeFlux.map((suggested, idx) => {
                                    const isSubscribed = subscribedUrls.has(normalizeUrl(suggested.url));

                                    return (
                                        <div key={idx} className="p-4 border border-gray-200 bg-white rounded-xl shadow-xs flex flex-col gap-2 transition-shadow hover:shadow-sm">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white bg-blue-500">
                                                        RSS
                                                    </span>
                                                    <h4 className="text-sm font-semibold text-gray-900 truncate">{suggested.name}</h4>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{suggested.desc}</p>
                                            </div>

                                            <SubscribeButton
                                                isSubscribed={isSubscribed}
                                                onClick={() => handleAddSuggestedFeed(suggested)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE DE PARTAGE EMAIL */}
            <Modal
                isOpen={shareModal}
                onClose={() => setShareModal(false)}
                title={`Partager « ${shareTarget?.title || shareTarget?.nom_original || shareTarget?.url || ""} »`}
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
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors bg-white"
                    />
                </div>
            </Modal>
        </div>
    );
}