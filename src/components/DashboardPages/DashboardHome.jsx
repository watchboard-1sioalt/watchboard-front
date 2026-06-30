import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../contexts/UserContext"; 
import { useToast } from "../Toast/Toast"; 
import { FiZap, FiBookmark, FiShare2, FiRss, FiGlobe, FiExternalLink, FiPlus, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import Modal from "../Modal/Modal"; 

const API = "http://localhost/api"; 

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

    // Compteur local uniquement pour l'affichage du badge dans l'en-tête
    const [seenCount, setSeenCount] = useState(() => {
        const saved = localStorage.getItem("watchboard_seen_articles");
        return saved ? JSON.parse(saved).length : 0;
    });

    // États de la modale de partage native
    const [shareModal, setShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [shareEmail, setShareEmail] = useState("");
    const [sharing, setSharing] = useState(false);

    const [savedMap, setSavedMap] = useState({});

    const observer = useRef();
    const viewedObserver = useRef();
    const ARTICLES_PER_PAGE = 5;

    const getArticleUrl = (article) => article.link || article.url || article.id; 

    // 1. MARQUAGE DES ARTICLES LUS : Met à jour le localStorage sans re-déclencher l'API
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

    // 2. SCROLL INFINI LOCAL : Charge la suite des données déjà stockées en mémoire
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

    // 3. LA FONCTION DE CHARGEMENT RÉSEAU
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

            // B. Route de découverte Laravel
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

            // C. Lecture du localStorage à l'instant T pour filtrer les articles vus
            const savedSeen = localStorage.getItem("watchboard_seen_articles");
            const currentSeenSet = savedSeen ? new Set(JSON.parse(savedSeen)) : new Set();

            const uniqueUnseenArticles = [];
            const trackDuplicates = new Set();

            articlesList.forEach(art => {
                const key = getArticleUrl(art);
                if (!currentSeenSet.has(key) && !trackDuplicates.has(key)) {
                    let resolvedFeedId = art.id_fluxrss || art.feed_id || 1; 

                    uniqueUnseenArticles.push({
                        ...art,
                        id_fluxrss: Number(resolvedFeedId)
                    });
                    trackDuplicates.add(key);
                }
            });

            if (uniqueUnseenArticles.length === 0 && articlesList.length > 0) {
                setIsTimelineEmpty(true);
                setLoading(false);
                return;
            }

            // D. Priorisation par image
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

    // Chargement initial unique au montage du composant
    useEffect(() => {
        if (token) fetchTimelineDiscover();
    }, [token]); 

    // Déploiement progressif des cartes lors du scroll infini local
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

    // Remise à zéro complète de l'historique de lecture
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
        <div className="w-full max-w-2xl mx-auto h-[calc(100vh-120px)] flex flex-col p-2">
            
            {/* Zone de bienvenue fixe */}
            <div className="mb-4 shrink-0 px-2 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Bonjour <span className="text-blue-600 uppercase">{user?.prenom || "ALBAN"}</span> 
                    </h1>
                    <p className="text-[11px] text-gray-400 font-semibold tracking-wide">
                        {!hasFeeds ? "Initialisez votre espace" : isTimelineEmpty ? "Revue de presse épuisée" : ""}
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    {hasFeeds && !isTimelineEmpty && (
                        <button 
                            onClick={fetchTimelineDiscover}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 font-black px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <FiRefreshCw size={11} className={loading ? "animate-spin" : ""} />
                            Actualiser le flux
                        </button>
                    )}
                    {seenCount > 0 && (
                        <button 
                            onClick={handleResetHistory}
                            className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-gray-500 font-bold px-2.5 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                            Réinitialiser ({seenCount})
                        </button>
                    )}
                </div>
            </div>

            {/* CAS 1 : TIMELINE DISPONIBLE */}
            {hasFeeds && !isTimelineEmpty ? (
                <div className="flex-1 overflow-y-scroll snap-y snap-mandatory space-y-6 rounded-2xl scrollbar-none pb-8">
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
                                className="w-full h-[450px] bg-white border border-gray-200 rounded-2xl shadow-xs snap-start flex flex-col justify-between overflow-hidden animate-fade-in"
                            >
                                {/* Miniature Photo */}
                                <div className="w-full h-40 bg-slate-100 relative shrink-0 overflow-hidden">
                                    {artImage ? (
                                        <img src={artImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                                            <FiZap size={32} className="text-blue-200 animate-pulse" />
                                        </div>
                                    )}
                                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 ${isYoutube ? 'bg-red-600' : 'bg-blue-600'} text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm`}>
                                        {isYoutube ? <FaYoutube size={11} /> : <FiRss size={11} />}
                                        {isYoutube ? "YouTube" : "RSS"}
                                    </div>
                                </div>

                                {/* Descriptif central & Bouton unique VOIR */}
                                <div className="p-4 flex-1 flex flex-col justify-between bg-white overflow-hidden">
                                    <div className="space-y-1">
                                        <h2 className="text-sm font-extrabold text-gray-900 tracking-tight line-clamp-1">
                                            {article.title || article.nom_original}
                                        </h2>
                                        <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-2">
                                            {article.description || article.summary || "Aucun résumé disponible pour ce document."}
                                        </p>
                                    </div>

                                    <div className="mt-2 shrink-0">
                                        <a
                                            href={article.link || article.url} 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2.5 bg-gray-950 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest text-center rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                        >
                                            Voir la ressource
                                            <FiExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>

                                {/* Actions basses à 2 colonnes */}
                                <div className="grid grid-cols-2 border-t border-gray-100 bg-slate-50/60 text-center shrink-0 h-12">
                                    <button
                                        onClick={() => handleSaveArticleToggle(article)}
                                        className={`flex items-center justify-center border-r border-gray-100 transition-colors cursor-pointer ${isSaved ? 'text-blue-600 bg-blue-50/20' : 'text-gray-400 hover:text-blue-600'}`}
                                        title="Enregistrer"
                                    >
                                        <FiBookmark size={18} className={`transition-transform active:scale-95 ${isSaved ? 'fill-current' : ''}`} />
                                    </button>
                                    <button 
                                        onClick={() => openShareModal(article)}
                                        className="flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                                        title="Partager par e-mail"
                                    >
                                        <FiShare2 size={18} className="active:scale-95 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {loading && (
                        <div className="text-center py-4 text-xs text-gray-400 font-bold tracking-wider uppercase">
                            Mise à jour...
                        </div>
                    )}
                </div>
            ) : hasFeeds && isTimelineEmpty ? (

                /* TIMELINE ENTIÈREMENT CONSOMMÉE */
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-2xl animate-fade-in shadow-xs">
                    <FiCheckCircle size={54} className="text-emerald-500 mb-4 animate-bounce" />
                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-2">Vous avez tout lu !</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-sm mb-6 font-medium">
                        Félicitations, aucun contenu inédit n'est disponible. Utilisez le bouton ci-dessous ou l'actualisation pour rafraîchir la timeline.
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={fetchTimelineDiscover}
                            className="px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                            <FiRefreshCw size={12} />
                            Vérifier les nouveautés
                        </button>
                        <button 
                            onClick={handleResetHistory}
                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-colors shadow-xs cursor-pointer"
                        >
                            Revoir les articles lus
                        </button>
                    </div>
                </div>
            ) : (
                
                /* CAS 2 : SUGGESTIONS */
                <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h3 className="text-xs font-black text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <FiZap size={14} className="fill-current text-yellow-400" />
                                Aucun abonnement trouvé
                            </h3>
                            <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                                Votre fil d'actualité est vide car vous n'avez pas de sources configurées. Activez l'une de nos recommandations ci-dessous pour démarrer.
                            </p>
                        </div>

                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pt-2">Suggestions recommandées</span>

                        <div className="space-y-2">
                            {suggestionsDeFlux.map((suggested, idx) => (
                                <div key={idx} className="p-3 border border-gray-100 hover:border-gray-200 rounded-xl bg-slate-50/50 flex items-center justify-between gap-3 transition-colors">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white ${suggested.type === 'youtube' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                                {suggested.type.toUpperCase()}
                                            </span>
                                            <h4 className="text-xs font-bold text-gray-900 truncate">{suggested.name}</h4>
                                        </div>
                                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 font-medium">{suggested.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddSuggestedFeed(suggested)}
                                        className="p-2 bg-white hover:bg-blue-600 border border-gray-200 hover:border-blue-600 rounded-lg text-gray-500 hover:text-white transition-all shadow-2xs shrink-0 cursor-pointer"
                                    >
                                        <FiPlus size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center pt-4 border-t border-gray-100 text-[11px] font-semibold text-gray-400">
                        Ajoutez vos propres sources à tout moment depuis l'onglet <span className="text-blue-500 font-bold">"Mes flux"</span>.
                    </div>
                </div>
            )}

            {/* MODALE DE PARTAGE EMAIL NATIVE */}
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