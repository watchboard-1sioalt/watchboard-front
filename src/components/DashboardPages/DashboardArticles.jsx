import { useState, useEffect, useCallback } from "react";
import { FiBookmark, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import Cards from "../Cards/Cards";

const API = "http://localhost/api";


export default function DashboardArticles() {
    const { token } = useUser();
    const { toast } = useToast();

    const [ressources, setRessources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${token}`,
    }), [token]);

    const fetchRessources = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/ressources`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setRessources(Array.isArray(data) ? data : data.data ?? []);
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de charger les ressources." });
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => { fetchRessources(); }, [fetchRessources]);

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/ressources/${id}/delete`, {
                method: "POST",
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error();
            setRessources(prev => prev.filter(r => r.id_ressource !== id));
            setConfirmDelete(null);
            toast.success({ title: "Ressource supprimée" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de supprimer la ressource." });
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FiBookmark className="text-blue-600" size={22} />
                    <h1 className="text-2xl font-semibold text-blue-600">Ressources enregistrées</h1>
                </div>
                {!loading && ressources.length > 0 && (
                    <span className="text-sm text-gray-400">{ressources.length} ressource{ressources.length > 1 ? "s" : ""}</span>
                )}
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Chargement...</div>
            ) : ressources.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <FiBookmark size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucune ressource enregistrée.</p>
                    <p className="text-xs mt-1">Enregistrez des articles depuis vos flux RSS.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ressources.map(r => (
                        <div key={r.id_ressource} className="relative group">
                            <Cards
                                titre={r.nom_original || r.url}
                                lien={r.url}
                                tags={r.tags}
                                date={r.created_at
                                    ? new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                                    : undefined}
                            />

                            <div className="absolute top-3 right-3">
                                {confirmDelete === r.id_ressource ? (
                                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                                        <span className="text-xs text-gray-500">Supprimer ?</span>
                                        <button
                                            onClick={() => handleDelete(r.id_ressource)}
                                            className="text-red-600 hover:text-red-700 cursor-pointer"
                                        >
                                            <FiCheck size={14} />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDelete(r.id_ressource)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm text-gray-400 hover:text-red-500 cursor-pointer"
                                        title="Supprimer"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
