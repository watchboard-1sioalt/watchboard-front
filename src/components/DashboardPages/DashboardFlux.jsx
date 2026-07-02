import { useState, useEffect, useCallback, useMemo } from "react";
import { FiRss, FiPlus, FiEdit2, FiCheck, FiX, FiExternalLink, FiArrowLeft, FiRefreshCw, FiTag, FiGlobe } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import Tag from "../Tag";
import Cards from "../Cards/Cards";
import TagPickerModal from "../Modal/TagPickerModal";
import SearchBarView from "../SearchBarView";
import PageHeader from "../PageHeader";
import TagFilterBar from "../TagFilterBar";
import EmptyState from "../EmptyState";
import InlineDeleteConfirm from "../InlineDeleteConfirm";
import { API_BASE_URL as API } from "../../config/api";

function FeedArticlesView({ feed, token, onBack }) {
    const { toast } = useToast();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedMap, setSavedMap] = useState({});

    const articleKey = (article) => article.link || article.url || article.id;

    const handleSaveArticle = useCallback(async (article, save) => {
        const key = articleKey(article);
        if (save) {
            const res = await fetch(`${API}/ressources/from-rss`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    url: article.link || article.url,
                    resume: article.description,
                    image: article.image || article.enclosure?.url || article.cover,
                    nom_original: article.title || undefined,
                    id_fluxrss: feed.id_fluxrss,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Erreur lors de l'enregistrement");
            }
            const ressource = await res.json();
            setSavedMap(prev => ({ ...prev, [key]: ressource.id_ressource }));
            toast.success({ title: "Article enregistré" });
        } else {
            const ressourceId = savedMap[key];
            if (!ressourceId) throw new Error("ID introuvable");
            const res = await fetch(`${API}/ressources/${ressourceId}/delete`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setSavedMap(prev => { const next = { ...prev }; delete next[key]; return next; });
            toast.success({ title: "Article retiré" });
        }
    }, [token, feed.id_fluxrss, savedMap]);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/feeds/${feed.id_fluxrss}/articles`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.data ?? [];
            list.sort((a, b) => {
                const da = new Date(a.published_at ?? a.pubDate ?? 0);
                const db = new Date(b.published_at ?? b.pubDate ?? 0);
                return db - da;
            });
            setArticles(list);
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de charger les articles." });
        } finally {
            setLoading(false);
        }
    }, [feed.id_fluxrss, token]);

    useEffect(() => {
        fetchArticles();
        fetch(`${API}/ressources`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : data.data ?? [];
                const map = {};
                list.forEach(r => { if (r.url) map[r.url] = r.id_ressource; });
                setSavedMap(map);
            })
            .catch(() => { });
    }, [fetchArticles, token]);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                    <FiArrowLeft size={16} />
                    Flux
                </button>
                <span className="text-gray-300">/</span>
                <div className="flex items-center gap-2 min-w-0">
                    {feed.image ? (
                        <img
                            src={feed.image.url}
                            alt=""
                            className="w-7 h-7 rounded object-cover shrink-0"
                            onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                    ) : feed.url.includes("youtube") ? (
                        <FaYoutube className="text-red-600 shrink-0" size={18} />
                    ) : (
                        <FiRss className="text-blue-600 shrink-0" size={18} />
                    )}
                    <h1 className="text-xl font-semibold text-blue-600 truncate">
                        {feed.name || feed.url}
                    </h1>
                </div>
                <button
                    onClick={fetchArticles}
                    className="ml-auto text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Rafraîchir"
                >
                    <FiRefreshCw size={16} />
                </button>
            </div>

            <a
                href={feed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 mb-4 transition-colors"
            >
                <FiExternalLink size={11} />
                {feed.url}
            </a>

            {feed.tags && feed.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                    {feed.tags.map(tag => (
                        <Tag key={tag.id_tag} title={tag.tag} />
                    ))}
                </div>
            )}

            {loading ? (
                <div className="text-center py-20 text-gray-400 text-sm">Chargement des articles...</div>
            ) : articles.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <FiRss size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun article trouvé pour ce flux.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {articles.map((article, i) => (
                        <Cards
                            key={article.id ?? article.link ?? i}
                            titre={article.title}
                            description={article.description || article.summary}
                            date={
                                article.published_at
                                    ? new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                                    : article.pubDate || undefined
                            }
                            auteur={article.author}
                            image={article.image || article.enclosure?.url || article.cover}
                            lien={article.link || article.url}
                            saved={!!savedMap[articleKey(article)]}
                            onSave={(save) => handleSaveArticle(article, save)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DashboardFlux() {
    const { token } = useUser();
    const { toast } = useToast();

    const [feeds, setFeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeed, setSelectedFeed] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newType, setNewType] = useState("rss");
    const [newUrl, setNewUrl] = useState("");
    const [newName, setNewName] = useState("");
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(null);
    const [editName, setEditName] = useState("");
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [tagModal, setTagModal] = useState(false);
    const [tagTarget, setTagTarget] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState(new Set());
    const [allTags, setAllTags] = useState([]);

    const authHeaders = useCallback(() => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    }), [token]);

    const fetchFeeds = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/feeds`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            setFeeds(await res.json());
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de charger les flux." });
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => { fetchFeeds(); }, [fetchFeeds]);

    useEffect(() => {
        fetch(`${API}/tags/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setAllTags(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, [token]);

    const availableTags = useMemo(() => {
        const map = new Map();
        allTags.forEach(t => map.set(t.id_tag, t));
        feeds.forEach(f => (f.tags ?? []).forEach(t => map.set(t.id_tag, t)));
        return [...map.values()];
    }, [allTags, feeds]);

    const filteredFeeds = useMemo(() => {
        let result = feeds;
        if (selectedTagIds.size > 0) {
            result = result.filter(f => (f.tags ?? []).some(t => selectedTagIds.has(t.id_tag)));
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(f =>
                (f.name ?? "").toLowerCase().includes(q) ||
                (f.url ?? "").toLowerCase().includes(q)
            );
        }
        return result;
    }, [feeds, selectedTagIds, search]);

    if (selectedFeed) {
        return (
            <FeedArticlesView
                feed={selectedFeed}
                token={token}
                onBack={() => setSelectedFeed(null)}
            />
        );
    }

    const handleAdd = async (e) => {
        e.preventDefault();

        if (feeds.some(f => f.url === newUrl)) {
            toast.error({ title: "Erreur", message: "Ce flux existe déjà." });
            return;
        }

        setAdding(true);
        try {
            const body = { url: newUrl };
            if (newName.trim()) body.name = newName.trim();
            const res = await fetch(`${API}/feeds`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Erreur");
            }
            const data = await res.json();
            setFeeds(prev => [data, ...prev]);
            setNewUrl("");
            setNewName("");
            setNewType("rss");
            setShowAddForm(false);
            toast.success({ title: "Flux ajouté", message: "Votre flux a été ajouté avec succès." });
        } catch (err) {
            toast.error({ title: "Erreur", message: err.message || "Impossible d'ajouter le flux." });
        } finally {
            setAdding(false);
        }
    };

    const handleSaveEdit = async (id) => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`${API}/feeds/${id}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({ name: editName.trim() }),
            });
            if (!res.ok) throw new Error();
            setFeeds(prev => prev.map(f => f.id_fluxrss === id ? { ...f, name: editName.trim() } : f));
            setEditing(null);
            toast.success({ title: "Flux renommé" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de renommer le flux." });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/feeds/${id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error();
            setFeeds(prev => prev.filter(f => f.id_fluxrss !== id));
            setConfirmDelete(null);
            toast.success({ title: "Flux supprimé" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de supprimer le flux." });
        }
    };

    const handleDetachTag = async (feedId, tagId) => {
        try {
            const res = await fetch(`${API}/feeds/${feedId}/tags/${tagId}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error();
            setFeeds(prev => prev.map(f =>
                f.id_fluxrss === feedId
                    ? { ...f, tags: f.tags.filter(t => t.id_tag !== tagId) }
                    : f
            ));
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de retirer le tag." });
        }
    };

    const handleTagAdded = (tag) => {
        setFeeds(prev => prev.map(f =>
            f.id_fluxrss === tagTarget ? { ...f, tags: [...(f.tags ?? []), tag] } : f
        ));
        toast.success({ title: "Tag ajouté" });
    };

    const toggleTag = (id) => {
        setSelectedTagIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader icon={FiRss} title="Vos flux RSS">
                <button
                    onClick={() => setShowAddForm(v => !v)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                >
                    <FiPlus size={16} />
                    Ajouter un flux
                </button>
            </PageHeader>

            {!loading && feeds.length > 0 && (
                <div className="mb-4">
                    <SearchBarView
                        value={search}
                        onChange={setSearch}
                        onClear={() => setSearch("")}
                        placeholder="Rechercher par nom ou URL..."
                    />
                </div>
            )}

            {!loading && (
                <TagFilterBar
                    tags={availableTags}
                    selectedIds={selectedTagIds}
                    onToggle={toggleTag}
                    onClearAll={() => setSelectedTagIds(new Set())}
                    icon={FiTag}
                />
            )}

            {showAddForm && (
                <form onSubmit={handleAdd} className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
                    <h2 className="text-sm font-semibold text-blue-800">Nouveau flux</h2>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { setNewType("rss"); setNewUrl(""); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${newType === "rss" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"}`}
                        >
                            <FiGlobe size={14} /> Flux RSS
                        </button>
                        <button
                            type="button"
                            onClick={() => { setNewType("youtube"); setNewUrl(""); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${newType === "youtube" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-500"}`}
                        >
                            <FaYoutube size={15} /> Chaîne YouTube
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="url"
                            value={newUrl}
                            onChange={e => setNewUrl(e.target.value)}
                            placeholder={newType === "youtube"
                                ? "https://www.youtube.com/@nomdelachaine"
                                : "https://exemple.com/feed.xml"}
                            required
                            className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
                        />
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Nom personnalisé (optionnel)"
                            maxLength={150}
                            className="sm:w-56 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
                        />
                    </div>

                    {newType === "youtube" && (
                        <p className="text-xs text-blue-600 opacity-70">
                            Formats acceptés : youtube.com/@handle, youtube.com/channel/UC…, youtube.com/c/nom
                        </p>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => { setShowAddForm(false); setNewUrl(""); setNewName(""); setNewType("rss"); }}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={adding}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                            {adding ? "Ajout en cours..." : "Ajouter"}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Chargement...</div>
            ) : feeds.length === 0 ? (
                <EmptyState
                    icon={FiRss}
                    message="Vous n'avez pas encore de flux RSS."
                    subMessage="Ajoutez votre premier flux avec le bouton ci-dessus."
                />
            ) : filteredFeeds.length === 0 ? (
                <EmptyState
                    icon={FiTag}
                    iconSize={36}
                    message="Aucun flux ne correspond à votre recherche."
                    action={{ label: "Réinitialiser les filtres", onClick: () => { setSelectedTagIds(new Set()); setSearch(""); } }}
                />
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredFeeds.map(feed => (
                        <div
                            key={feed.id_fluxrss}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {editing === feed.id_fluxrss ? (
                                        <div className="flex items-center gap-2 mb-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter") handleSaveEdit(feed.id_fluxrss);
                                                    if (e.key === "Escape") setEditing(null);
                                                }}
                                                autoFocus
                                                maxLength={150}
                                                className="flex-1 text-sm font-medium border-b border-blue-400 outline-none px-1 py-0.5 bg-transparent"
                                            />
                                            <button
                                                onClick={() => handleSaveEdit(feed.id_fluxrss)}
                                                disabled={saving}
                                                className="text-green-600 hover:text-green-700 cursor-pointer disabled:opacity-50"
                                                title="Enregistrer"
                                            >
                                                <FiCheck size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditing(null)}
                                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                                title="Annuler"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mb-1">
                                            {feed.image ? (
                                                <img
                                                    src={feed.image}
                                                    alt=""
                                                    className="w-6 h-6 rounded object-cover shrink-0"
                                                    onError={e => { e.currentTarget.style.display = "none"; }}
                                                />
                                            ) : feed.url.includes("youtube") ? (
                                                <FaYoutube className="text-red-600 shrink-0" size={18} />
                                            ) : (
                                                <FiRss className="text-blue-600 shrink-0" size={18} />
                                            )}
                                            <button
                                                onClick={() => setSelectedFeed(feed)}
                                                className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate text-left cursor-pointer"
                                            >
                                                {feed.name || feed.url}
                                            </button>
                                            <button
                                                onClick={() => { setEditing(feed.id_fluxrss); setEditName(feed.name || ""); }}
                                                className="text-gray-300 hover:text-blue-500 cursor-pointer transition-colors shrink-0"
                                                title="Renommer"
                                            >
                                                <FiEdit2 size={13} />
                                            </button>
                                        </div>
                                    )}

                                    <a
                                        href={feed.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 w-fit transition-colors"
                                    >
                                        <FiExternalLink size={11} />
                                        <span className="truncate max-w-xs sm:max-w-md">{feed.url}</span>
                                    </a>

                                    {feed.tags && feed.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {feed.tags.map(tag => (
                                                <Tag
                                                    key={tag.id_tag}
                                                    title={tag.tag}
                                                    onRemove={() => handleDetachTag(feed.id_fluxrss, tag.id_tag)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedFeed(feed)}
                                        className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 rounded-lg px-2.5 py-1 transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                        Voir les ressources
                                    </button>

                                    <button
                                        onClick={() => { setTagTarget(feed.id_fluxrss); setTagModal(true); }}
                                        className="text-gray-300 hover:text-blue-500 transition-colors cursor-pointer"
                                        title="Ajouter un tag"
                                    >
                                        <FiTag size={16} />
                                    </button>

                                    <InlineDeleteConfirm
                                        isConfirming={confirmDelete === feed.id_fluxrss}
                                        onRequestConfirm={() => setConfirmDelete(feed.id_fluxrss)}
                                        onConfirm={() => handleDelete(feed.id_fluxrss)}
                                        onCancel={() => setConfirmDelete(null)}
                                        wrapperClassName="flex items-center gap-2"
                                        trashClassName="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                        iconSize={15}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TagPickerModal
                isOpen={tagModal}
                onClose={() => setTagModal(false)}
                currentTags={feeds.find(f => f.id_fluxrss === tagTarget)?.tags ?? []}
                token={token}
                onAttach={async (tag) => {
                    const res = await fetch(`${API}/feeds/${tagTarget}/tags`, {
                        method: "POST",
                        headers: authHeaders(),
                        body: JSON.stringify({ tag_id: tag.id_tag }),
                    });
                    if (!res.ok) throw new Error();
                }}
                onTagAdded={handleTagAdded}
            />
        </div>
    );
}
