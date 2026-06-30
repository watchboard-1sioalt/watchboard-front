import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../contexts/UserContext"; //[cite: 1, 4]
import { useToast } from "../Toast/Toast"; //[cite: 1, 2]
import { FiZap, FiBookmark, FiShare2, FiHeart, FiRss, FiGlobe, FiExternalLink, FiPlus } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";

const API = "http://localhost/api"; //[cite: 1, 2, 3, 5, 6]

export default function DashboardHome() {
    const { token, user } = useUser(); //[cite: 1, 4]
    const { toast } = useToast(); //[cite: 1, 2]

    // États de la timeline globale
    const [allArticles, setAllArticles] = useState([]); 
    const [displayedArticles, setDisplayedArticles] = useState([]); 
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [hasFeeds, setHasFeeds] = useState(true);

    // Mappage de synchronisation des ressources (URL -> id_ressource)
    const [savedMap, setSavedMap] = useState({});
    const [likedArticles, setLikedArticles] = useState(new Set());

    const observer = useRef();
    const ARTICLES_PER_PAGE = 5;

    // Helper pour extraire l'URL unique d'un article (identique à ton DashboardFlux)
    const getArticleUrl = (article) => article.link || article.url || article.id; //[cite: 3]

    // IntersectionObserver pour le scroll infini des articles
    const lastArticleRef = useCallback(node => {
        if (loading || !hasFeeds) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.6 });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, hasFeeds]); //[cite: 7]

    // Feature suggestions si aucun flux disponible
    const suggestionsDeFlux = [
        { name: "TechCrunch", url: "https://techcrunch.com/feed/", type: "rss", desc: "L'actualité des startups et de la tech mondiale en continu." },
        { name: "Underscore_", url: "https://www.youtube.com/@underscore_", type: "youtube", desc: "Le talk-show tech incontournable présenté par Micode." },
        { name: "Le Monde - Pixels", url: "https://www.lemonde.fr/pixels/rss_full.xml", type: "rss", desc: "Veille française sur la culture numérique et les technologies." }
    ];

    // Appel direct à ton nouvel endpoint de découverte Laravel
    const fetchTimelineDiscover = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Route: GET /api/ressources -> Synchronisation des états de sauvegarde
            const ressourcesRes = await fetch(`${API}/ressources`, {
                headers: { Authorization: `Bearer ${token}` }, //[cite: 2, 6]
            });
            let initialSavedMap = {};
            if (ressourcesRes.ok) {
                const ressourcesData = await ressourcesRes.json();
                const cleanRessources = Array.isArray(ressourcesData) ? ressourcesData : ressourcesData.data ?? []; //[cite: 2, 6]
                cleanRessources.forEach(r => {
                    if (r.url) initialSavedMap[r.url] = r.id_ressource;
                });
                setSavedMap(initialSavedMap);
            }
            const articlesRes = await fetch(`${API}/feeds/articles/discover`, {
                headers: { Authorization: `Bearer ${token}` }, //[cite: 3]
            });
            if (!articlesRes.ok) throw new Error();
            const data = await articlesRes.json();
            const articlesList = Array.isArray(data) ? data : data.data ?? []; //[cite: 3]

            // Si l'API de découverte renvoie une liste vide, on bascule sur les suggestions
            if (articlesList.length === 0) {
                setHasFeeds(false);
                setLoading(false);
                return;
            }

            setHasFeeds(true);

            // 3. Séparation et regroupement pour prioriser l'affichage des visuels à l'écran
            const withPhotos = articlesList.filter(art => art.image || art.enclosure?.url || art.cover); //[cite: 3]
            const withoutPhotos = articlesList.filter(art => !(art.image || art.enclosure?.url || art.cover)); //[cite: 3]

            // Fusion finale : l'API gère le mélange général, le front place simplement les images en haut
            const prioritizedArticles = [...withPhotos, ...withoutPhotos];

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
    }, [fetchTimelineDiscover, token]);

    // Pagination locale pour alimenter le scroll infini
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

    // Sauvegarde & Retrait parfaitement synchronisés avec tes endpoints
    const handleSaveArticleToggle = async (article) => {
        const urlKey = getArticleUrl(article);
        const ressourceId = savedMap[urlKey];

        if (!ressourceId) {
            try {
                const res = await fetch(`${API}/ressources/from-rss`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, //[cite: 3]
                    body: JSON.stringify({
                        url: urlKey,
                        resume: article.description || article.summary || "Aucun résumé disponible", //[cite: 3]
                        image: article.image || article.enclosure?.url || article.cover || null, //[cite: 3]
                        nom_original: article.title || undefined, //[cite: 3]
                        id_fluxrss: Number(article.id_fluxrss), 
                    }),
                });
                if (!res.ok) throw new Error();
                const ressource = await res.json(); //[cite: 3]
                
                setSavedMap(prev => ({ ...prev, [urlKey]: ressource.id })); //[cite: 3]
                toast.success({ title: "Article enregistré dans vos ressources" });
            } catch {
                toast.error({ title: "Erreur lors de l'enregistrement" });
            }
        } else {
            try {
                const res = await fetch(`${API}/ressources/${ressourceId}/delete`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` }, //[cite: 2, 3]
                });
                if (!res.ok) throw new Error();
                setSavedMap(prev => { const next = { ...prev }; delete next[urlKey]; return next; }); //[cite: 3]
                toast.success({ title: "Article retiré de vos ressources" });
            } catch {
                toast.error({ title: "Impossible de retirer l'article" });
            }
        }
    };

    const handleAddSuggestedFeed = async (feed) => {
        try {
            const res = await fetch(`${API}/feeds`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, //[cite: 3]
                body: JSON.stringify({ url: feed.url, name: feed.name }), //[cite: 3]
            });
            if (!res.ok) throw new Error();
            
            toast.success({ title: "Flux activé !", message: `${feed.name} a été ajouté.` }); //[cite: 7]
            setPage(1);
            setAllArticles([]);
            fetchTimelineDiscover();
        } catch {
            toast.error({ title: "Erreur", message: "Impossible d'ajouter ce flux." });
        }
    };

    const toggleLike = (url) => {
        setLikedArticles(prev => {
            const next = new Set(prev);
            if (next.has(url)) next.delete(url);
            else next.add(url);
            return next;
        });
    };

    const handleShare = (url) => {
        navigator.clipboard.writeText(url || window.location.href);
        toast.success({ title: "Lien copié !" }); //[cite: 7]
    };

    return (
        <div className="w-full max-w-2xl mx-auto h-[calc(100vh-120px)] flex flex-col p-2">
            
            {/* Zone de bienvenue fixe */}
            <div className="mb-4 shrink-0 px-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Bonjour <span className="text-blue-600 uppercase">{user?.prenom || "ALBAN"}</span> 👏
                </h1>
                <p className="text-[11px] text-gray-400 font-semibold tracking-wide">
                    {hasFeeds ? "" : "Initialisez votre espace de veille"}
                </p>
            </div>

            {/* CAS 1 : TIMELINE DISPONIBLE VIA L'API DISCOVER */}
            {hasFeeds ? (
                <div className="flex-1 overflow-y-scroll snap-y snap-mandatory space-y-6 rounded-2xl scrollbar-none pb-8">
                    {displayedArticles.map((article, index) => {
                        const isLast = displayedArticles.length === index + 1;
                        const urlKey = getArticleUrl(article); 
                        const isLiked = likedArticles.has(urlKey);
                        const isSaved = !!savedMap[urlKey];
                        const artImage = article.image || article.enclosure?.url || article.cover; //[cite: 3]
                        const isYoutube = (article.link || article.url || "").includes("youtube.com");

                        return (
                            <div
                                key={urlKey}
                                ref={isLast ? lastArticleRef : null}
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
                                            href={article.link || article.url} //[cite: 3]
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2.5 bg-gray-950 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest text-center rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                        >
                                            Voir la ressource
                                            <FiExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>

                                {/* Actions basses (3 colonnes) */}
                                <div className="grid grid-cols-3 border-t border-gray-100 bg-slate-50/60 text-center shrink-0 h-12">
                                    <button
                                        onClick={() => toggleLike(urlKey)}
                                        className={`flex items-center justify-center border-r border-gray-100 transition-colors cursor-pointer ${isLiked ? 'text-red-500 bg-red-50/20' : 'text-gray-400 hover:text-red-500'}`}
                                    >
                                        <FiHeart size={18} className={`transition-transform active:scale-95 ${isLiked ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => handleSaveArticleToggle(article)}
                                        className={`flex items-center justify-center border-r border-gray-100 transition-colors cursor-pointer ${isSaved ? 'text-blue-600 bg-blue-50/20' : 'text-gray-400 hover:text-blue-600'}`}
                                    >
                                        <FiBookmark size={18} className={`transition-transform active:scale-95 ${isSaved ? 'fill-current' : ''}`} />
                                    </button>
                                    <button 
                                        onClick={() => handleShare(article.link || article.url)} //[cite: 3]
                                        className="flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                    >
                                        <FiShare2 size={18} className="active:scale-95 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {loading && (
                        <div className="text-center py-4 text-xs text-gray-400 font-bold tracking-wider uppercase">
                            Mise à jour de votre revue de presse...
                        </div>
                    )}
                </div>
            ) : (
                
                /* CAS 2 : SUGGESTIONS (Aucun abonnement configuré) */
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
        </div>
    );
}