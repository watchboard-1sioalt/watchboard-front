import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import { FiRss, FiHeart, FiBookmark, FiExternalLink, FiCompass, FiVolume2, FiVolumeX } from "react-icons/fi";
import { FaYoutube, FaRegCommentDots } from "react-icons/fa";

const API = "http://localhost/api";
const ARTICLES_PER_PAGE = 5; // Nombre d'éléments chargés à la fois

export default function DashboardHome() {
    const { user, token } = useUser();
    const { toast } = useToast();

    // Données de flux globales et pagination
    const [allArticles, setAllArticles] = useState([]);
    const [displayedArticles, setDisplayedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // États d'interactions TikTok-style (Factices ou reliables à votre API locale)
    const [likedArticles, setLikedArticles] = useState(new Set());
    const [savedArticles, setSavedArticles] = useState(new Set());
    const [isMuted, setIsMuted] = useState(true);

    const observer = useRef();

    // Intersection Observer pour le Scroll Infini (Détecte le dernier élément de la liste)
    const lastArticleElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.6 }); // Déclenche dès que le bas est presque visible
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // 1. Récupération initiale de tous les flux et agrégation globale
    const fetchAndAggregateFeeds = useCallback(async () => {
        setLoading(true);
        try {
            const feedsRes = await fetch(`${API}/feeds`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!feedsRes.ok) throw new Error();
            const feeds = await feedsRes.json();

            const fetchPromises = feeds.map(async (feed) => {
                try {
                    const res = await fetch(`${API}/feeds/${feed.id_fluxrss}/articles`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) return [];
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data ?? []);
                    
                    return list.map(art => ({
                        ...art,
                        feedName: feed.name || feed.url,
                        feedImage: feed.image?.url || null,
                        isYoutube: feed.url.includes("youtube") || !!art.url?.includes("youtube.com")
                    }));
                } catch {
                    return [];
                }
            });

            const results = await Promise.all(fetchPromises);
            const flattened = results.flat();
            
            // Tri Chronologique Récent -> Ancien (Pour le feed principal)
            flattened.sort((a, b) => new Date(b.published_at || b.pubDate || 0) - new Date(a.published_at || a.pubDate || 0));
            
            setAllArticles(flattened);
            // Charger la première page immédiatement
            setDisplayedArticles(flattened.slice(0, ARTICLES_PER_PAGE));
            if (flattened.length <= ARTICLES_PER_PAGE) setHasMore(false);
        } catch {
            toast.error({ title: "Erreur", message: "Impossible d'agréger votre flux d'actualités." });
        } finally {
            setLoading(false);
        }
    }, [token, toast]);

    useEffect(() => {
        if (token) fetchAndAggregateFeeds();
    }, [token, fetchAndAggregateFeeds]);

    // 2. Gestion de la pagination (Scroll Infini)
    useEffect(() => {
        if (page === 1 || allArticles.length === 0) return;
        
        const start = (page - 1) * ARTICLES_PER_PAGE;
        const end = start + ARTICLES_PER_PAGE;
        const nextBatch = allArticles.slice(start, end);

        if (nextBatch.length > 0) {
            setDisplayedArticles(prev => [...prev, ...nextBatch]);
        }
        if (end >= allArticles.length) {
            setHasMore(false);
        }
    }, [page, allArticles]);

    // Interactions
    const toggleLike = (id) => {
        setLikedArticles(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSave = (id) => {
        setSavedArticles(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
        toast.success({ title: savedArticles.has(id) ? "Retiré des favoris" : "Enregistré dans Mes Ressources" });
    };

    // Extraction d'ID de vidéo YouTube pour générer un embed propre si besoin
    const getYoutubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1` : null;
    };

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-900">
            
            {/* PANNEAU LATÉRAL (Style Sidebar TikTok Navigation) */}
            <div className="hidden md:flex flex-col w-64 border-r border-slate-900 bg-slate-950 p-4 shrink-0">
                <div className="mb-6 px-2">
                    <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        {new Date().getHours() > 18 ? 'Bonsoir' : 'Bonjour'}, {user?.prenom || "Abonné"}
                    </h1>
                </div>
                
                <div className="flex flex-col gap-1">
                    <button className="flex items-center gap-3 px-3 py-2.5 bg-slate-900 text-blue-400 rounded-xl font-medium text-sm transition-all text-left">
                        <FiCompass size={18} /> Pour toi (Veille)
                    </button>
                    <div className="border-t border-slate-900/50 my-4" />
                    <span className="text-[11px] font-semibold text-slate-500 px-3 uppercase tracking-wider mb-2">Flux Actifs</span>
                </div>

                {/* Liste rapide des flux sources suivis */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs text-slate-400">
                    {Array.from(new Set(allArticles.map(a => a.feedName))).map((name, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-900/50 rounded-lg truncate">
                            <FiRss size={12} className="text-slate-500 shrink-0" />
                            <span className="truncate">{name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CONTENEUR DE VRAI SCROLL VERTICAL SACCADÉ (SNAP-Y) */}
            <div className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black">
                {loading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-sm tracking-wide">Génération de votre flux "Pour Toi"...</p>
                    </div>
                ) : displayedArticles.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <FiRss size={48} className="opacity-20 mb-4" />
                        <p className="text-sm">Aucune donnée disponible dans vos flux actifs.</p>
                    </div>
                ) : (
                    displayedArticles.map((article, index) => {
                        const id = article.id || article.link || index;
                        const isLiked = likedArticles.has(id);
                        const isSaved = savedArticles.has(id);
                        const embedVideo = article.isYoutube ? getYoutubeEmbedUrl(article.link || article.url) : null;

                        const isLastElement = displayedArticles.length === index + 1;

                        return (
                            <div 
                                key={id}
                                ref={isLastElement ? lastArticleElementRef : null}
                                className="w-full h-full snap-start snap-always flex items-center justify-center relative p-2 md:p-6 bg-gradient-to-b from-slate-950 to-black"
                            >
                                {/* LE CONTENU PRINCIPAL DE LA CARTE TIKTOK */}
                                <div className="w-full max-w-[480px] h-full max-h-[640px] bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden relative flex flex-col shadow-inner group">
                                    
                                    {/* Zone Médias (Vidéo YouTube Embed ou Image d'illustration) */}
                                    <div className="w-full h-3/5 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                                        {embedVideo ? (
                                            <div className="w-full h-full relative">
                                                <iframe 
                                                    src={embedVideo}
                                                    className="w-full h-full object-cover"
                                                    allow="autoplay; encrypted-media; picture-in-picture"
                                                    title={article.title}
                                                />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                                    className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white backdrop-blur-md z-20 hover:scale-110 transition-transform"
                                                >
                                                    {isMuted ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
                                                </button>
                                            </div>
                                        ) : article.image || article.enclosure?.url || article.cover ? (
                                            <img 
                                                src={article.image || article.enclosure?.url || article.cover} 
                                                alt="" 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-700">
                                                <FiRss size={44} className="opacity-40" />
                                                <span className="text-[11px] uppercase tracking-widest font-mono">Contenu Textuel</span>
                                            </div>
                                        )}

                                        {/* Type de flux badge */}
                                        <div className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-md bg-black/40 text-white flex items-center gap-1.5 border border-white/10 z-10">
                                            {article.isYoutube ? <FaYoutube className="text-red-500" /> : <FiRss className="text-blue-400" />}
                                            <span className="max-w-[120px] truncate">{article.feedName}</span>
                                        </div>
                                    </div>

                                    {/* Informations de la ressource (Bas du lecteur) */}
                                    <div className="flex-1 p-4 flex flex-col justify-between bg-linear-to-b from-slate-900/90 to-slate-950">
                                        <div className="space-y-1.5">
                                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                                {article.author && <span className="truncate font-semibold text-slate-400">@ {article.author}</span>}
                                                <span>•</span>
                                                <span>{article.published_at ? new Date(article.published_at).toLocaleDateString("fr-FR") : "Récent"}</span>
                                            </div>
                                            <h2 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                                                {article.title}
                                            </h2>
                                            <p className="text-xs text-slate-400 line-clamp-3 font-normal leading-relaxed">
                                                {article.description || article.summary || "Aucune description textuelle fournie pour cette ressource d'actualité."}
                                            </p>
                                        </div>

                                        <a 
                                            href={article.link || article.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full py-2 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl text-center text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 border border-slate-700/50"
                                        >
                                            Consulter la source <FiExternalLink size={12} />
                                        </a>
                                    </div>

                                    {/* COMPOSANT FLOTTANT DE RACCOURCIS ACTIONS (Côté Droit style TikTok) */}
                                    <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4 z-20">
                                        
                                        {/* Like Button */}
                                        <div className="flex flex-col items-center">
                                            <button 
                                                onClick={() => toggleLike(id)}
                                                className={`p-3 rounded-full transition-all duration-300 transform active:scale-75 shadow-lg backdrop-blur-md ${
                                                    isLiked ? "bg-red-500/20 text-red-500 border border-red-500/40" : "bg-black/40 text-slate-300 border border-slate-800/80 hover:text-white"
                                                }`}
                                            >
                                                <FiHeart size={18} fill={isLiked ? "currentColor" : "none"} />
                                            </button>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1">{isLiked ? 1 : 0}</span>
                                        </div>

                                        {/* Save (Ressource) Button */}
                                        <div className="flex flex-col items-center">
                                            <button 
                                                onClick={() => toggleSave(id)}
                                                className={`p-3 rounded-full transition-all duration-300 transform active:scale-75 shadow-lg backdrop-blur-md ${
                                                    isSaved ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/40" : "bg-black/40 text-slate-300 border border-slate-800/80 hover:text-white"
                                                }`}
                                            >
                                                <FiBookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                                            </button>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1">Sauve</span>
                                        </div>

                                        {/* Commentaires ou info additionnelle */}
                                        <div className="flex flex-col items-center">
                                            <button className="p-3 rounded-full bg-black/40 text-slate-300 border border-slate-800/80 shadow-lg backdrop-blur-md hover:text-white">
                                                <FaRegCommentDots size={18} />
                                            </button>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1">0</span>
                                        </div>

                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}