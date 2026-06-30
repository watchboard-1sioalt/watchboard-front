import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import { FiZap, FiRss, FiExternalLink, FiPlus, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../Modal/Modal";
import SaveButton from "../Inputs/SaveButton";
import SubscribeButton from "../Inputs/SubscribeButton";
import ShareButton from "../Inputs/ShareButton";
import { API_BASE_URL as  API } from "../../config/api";

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

    // Cartographie des abonnements : { url_normalisee: id_flux }
    const [subscribedFeeds, setSubscribedFeeds] = useState({});

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

    const normalizeUrl = (url) => {
        if (!url) return "";
        return url
            .toLowerCase()
            .trim()
            .replace(/^(https?:\/\/)?(www\.)?/, "")
            .replace(/\/$/, "");
    };

    // Extracteur d'images multi-sources pour blinder l'affichage contre les variations d'API
    const getArticleImage = (article) => {
        if (!article) return null;
        if (typeof article.image === "string" && article.image.trim() !== "") return article.image;
        if (article.image && typeof article.image === "object" && article.image.url) return article.image.url;
        if (article.image_url) return article.image_url;
        if (article.enclosure && typeof article.enclosure === "object" && article.enclosure.url) return article.enclosure.url;
        if (typeof article.enclosure === "string" && article.enclosure.trim() !== "") return article.enclosure;
        if (article.cover) return article.cover;
        return null;
    };

    // 1. MARQUAGE DES ARTICLES LUS
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

            const feedsRes = await fetch(`${API}/feeds`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (feedsRes.ok) {
                const feedsData = await feedsRes.json();
                const cleanFeeds = Array.isArray(feedsData) ? feedsData : feedsData.data ?? [];
                const mapping = {};
                cleanFeeds.forEach(f => {
                    if (f.url) mapping[normalizeUrl(f.url)] = f.id || f.id_fluxrss;
                });
                setSubscribedFeeds(mapping);
                
                if (cleanFeeds.length === 0) {
                    setHasFeeds(false);
                    setAllArticles([]);
                    setDisplayedArticles([]);
                    setLoading(false);
                    return;
                }
            }

            const articlesRes = await fetch(`${API}/feeds/articles/discover`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!articlesRes.ok) {
                setHasFeeds(false);
                setLoading(false);
                return;
            }
            
            const data = await articlesRes.json();
            const articlesList = Array.isArray(data) ? data : data.data ?? [];

            if (articlesList.length === 0) {
                setHasFeeds(false);
                setAllArticles([]);
                setDisplayedArticles([]);
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

            if (uniqueUnseenArticles.length === 0) {
                setIsTimelineEmpty(true);
                setAllArticles([]);
                setDisplayedArticles([]);
                setLoading(false);
                return;
            }

            setIsTimelineEmpty(false);
            
            // Tri avec le nouvel extracteur d'image unifié
            const withPhotos = uniqueUnseenArticles.filter(art => !!getArticleImage(art));
            const withoutPhotos = uniqueUnseenArticles.filter(art => !getArticleImage(art));
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
        const artImage = getArticleImage(article);

        if (!ressourceId) {
            try {
                const res = await fetch(`${API}/ressources/from-rss`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        url: urlKey,
                        resume: article.description || article.summary || "Aucun résumé disponible",
                        image: artImage,
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

        // 1. Si la ressource n'est pas encore enregistrée en BDD
        if (!ressourceId) {
            const saveRes = await fetch(`${API}/ressources/from-rss`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    url: urlKey,
                    resume: shareTarget.description || shareTarget.summary || "Aucun résumé disponible",
                    image: getArticleImage(shareTarget),
                    nom_original: shareTarget.title || shareTarget.nom_original || undefined,
                    id_fluxrss: Number(shareTarget.id_fluxrss),
                }),
            });
            if (!saveRes.ok) throw new Error("Erreur d'indexation pré-partage");
            
            const ressource = await saveRes.json();
            
            // CORRECTION ACCÈS CLÉ PRIMAIRE : id_ressource ou id selon le retour API
            ressourceId = ressource.id_ressource || ressource.id;
            
            if (!ressourceId) {
                throw new Error("L'API n'a pas renvoyé d'identifiant de ressource valide.");
            }

            // Enregistrement dans le state local pour éviter de ré-indexer au prochain clic
            setSavedMap(prev => ({ ...prev, [urlKey]: ressourceId }));
        }

        // SÉCURITÉ EN AMONT : On bloque si l'ID est corrompu ou vaut littéralement "undefined"
        if (!ressourceId || ressourceId === "undefined") {
            throw new Error("Identifiant de ressource invalide détecté avant l'envoi.");
        }

        // 2. Envoi de la requête de partage avec un ID garanti
        const res = await fetch(`${API}/ressources/${ressourceId}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email: shareEmail.trim() }),
        });
        
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Erreur lors du partage");

        toast.success({ title: "Ressource partagée", message: `Partagée avec ${shareEmail.trim()}` });
        setShareModal(false);
    } catch (err) {
        toast.error({ title: "Erreur", message: err.message || "Impossible de partager la ressource." });
    } finally {
        setSharing(false);
    }
};

    const handleToggleSuggestion = async (feed) => {
        const normalized = normalizeUrl(feed.url);
        const existingId = subscribedFeeds[normalized];

        if (existingId) {
            try {
                const res = await fetch(`${API}/feeds/${existingId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error();
                toast.success({ title: "Flux supprimé", message: `${feed.name} a été retiré de vos abonnements.` });
                
                setSubscribedFeeds(prev => {
                    const next = { ...prev };
                    delete next[normalized];
                    return next;
                });
                fetchTimelineDiscover();
            } catch {
                toast.error({ title: "Erreur", message: "Impossible de supprimer ce flux." });
            }
        } else {
            try {
                const res = await fetch(`${API}/feeds`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ url: feed.url, name: feed.name }),
                });
                if (!res.ok) throw new Error();
                const newFeed = await res.json();
                toast.success({ title: "Flux activé !", message: `${feed.name} a été ajouté.` });
                
                setSubscribedFeeds(prev => ({
                    ...prev,
                    [normalized]: newFeed.id || newFeed.id_fluxrss || true
                }));
                fetchTimelineDiscover();
            } catch {
                toast.error({ title: "Erreur", message: "Impossible d'ajouter ce flux." });
            }
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
                </div>

                <div className="flex items-center gap-2">
                    {hasFeeds && !isTimelineEmpty && displayedArticles.length > 0 && (
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
                
                {/* Colonne gauche */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {displayedArticles.length > 0 ? (
                        <div className="flex flex-col gap-6">
                            <AnimatePresence mode="popLayout">
                                {displayedArticles.map((article, index) => {
                                    const isLast = displayedArticles.length === index + 1;
                                    const urlKey = getArticleUrl(article);
                                    const isSaved = !!savedMap[urlKey];
                                    
                                    // Utilisation du nouvel extracteur sécurisé
                                    const artImage = getArticleImage(article);
                                    const isYoutube = (article.link || article.url || "").includes("youtube.com");

                                    return (
                                        <motion.div
                                            key={urlKey}
                                            data-article-key={urlKey}
                                            ref={(node) => {
                                                if (isLast) lastArticleRef(node);
                                                if (node) viewedObserver.current?.observe(node);
                                            }}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                            transition={{ type: "spring", stiffness: 320, damping: 26 }}
                                            className="w-full h-[480px] bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                                        >
                                            {/* Image 50% */}
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

                                            {/* Texte 50% & Actions */}
                                            <div className="p-4 h-1/2 flex flex-col justify-between overflow-hidden bg-white shrink-0">
                                                <div className="space-y-1">
                                                    <h2 className="text-md font-extrabold text-gray-900 tracking-tight line-clamp-2">
                                                        {article.title || article.nom_original}
                                                    </h2>
                                                    <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-3">
                                                        {article.description || article.summary || "Aucun résumé disponible pour ce document."}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 pt-2 shrink-0">
                                                    <motion.a
                                                        href={article.link || article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        whileHover="hover"
                                                        whileTap="tap"
                                                        variants={{
                                                            hover: { scale: 1.015, backgroundColor: "#1d4ed8" }, 
                                                            tap: { scale: 0.985 }
                                                        }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 text-white text-xs font-bold tracking-wide rounded-lg uppercase cursor-pointer shadow-xs"
                                                    >
                                                        Voir la ressource
                                                        <motion.span
                                                            variants={{
                                                                hover: { x: 3, y: -3 } 
                                                            }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                        >
                                                            <FiExternalLink size={12} />
                                                        </motion.span>
                                                    </motion.a>

                                                    <SaveButton
                                                        saved={isSaved}
                                                        onSave={() => handleSaveArticleToggle(article)}
                                                    />

                                                    <ShareButton onClick={() => openShareModal(article)} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {loading && (
                                <div className="text-center py-2 text-sm text-gray-400 font-bold uppercase tracking-wider">Mise à jour...</div>
                            )}
                        </div>
                    ) : !hasFeeds ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 220, damping: 20 }}
                            className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center my-auto shadow-xs"
                        >
                            <h3 className="text-sm font-semibold text-blue-700 mb-1 flex items-center justify-center gap-1.5">
                                <FiZap size={14} className="text-yellow-400" />
                                Aucun abonnement trouvé
                            </h3>
                            <p className="text-sm text-blue-600">
                                Utilisez le volet latéral droit pour activer vos premiers flux recommandés et charger des articles.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 220, damping: 20 }}
                            className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm w-full"
                        >
                            <FiCheckCircle size={40} className="text-emerald-500 mb-4" />
                            <h3 className="text-base font-bold text-gray-900 mb-2">Vous êtes à jour ! :)</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchTimelineDiscover}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                                >
                                    <FiRefreshCw size={13} />
                                    Vérifier les nouveautés
                                </button>
                                {seenCount > 0 && (
                                    <button
                                        onClick={handleResetHistory}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                                    >
                                        Revoir les articles lus
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Suggestions latérales */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="flex flex-col gap-4 sticky top-4">
                        <div className="pb-1 px-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Suggestions de flux</h3>
                        </div>

                        <div className="flex flex-col gap-3">
                            {suggestionsDeFlux.map((suggested, idx) => {
                                const isSubscribed = !!subscribedFeeds[normalizeUrl(suggested.url)];

                                return (
                                    <motion.div 
                                        key={suggested.url} 
                                        initial={{ opacity: 0, x: 24 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 24, delay: idx * 0.04 }}
                                        className="p-4 border border-gray-200 bg-white rounded-xl shadow-xs flex flex-col gap-2 transition-shadow hover:shadow-sm"
                                    >
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
                                            onClick={() => handleToggleSuggestion(suggested)}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
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