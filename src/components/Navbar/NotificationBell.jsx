import { useState, useEffect, useCallback } from "react";
import { FiBell, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import { useUser } from "../../contexts/UserContext";
import { useToast } from "../Toast/Toast";
import { API_BASE_URL as API } from "../../config/api";

export default function NotificationBell() {
    const { token } = useUser();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [shares, setShares] = useState([]);
    const [actioning, setActioning] = useState(null);

    const fetchShares = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/ressources/shared-with-me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setShares(Array.isArray(data) ? data : data.data ?? []);
        } catch { }
    }, [token]);

    useEffect(() => {
        fetchShares();
        const interval = setInterval(fetchShares, 60000);
        return () => clearInterval(interval);
    }, [fetchShares]);

    const handleAccept = async (id) => {
        setActioning(id);
        try {
            const res = await fetch(`${API}/ressources/${id}/share/duplicate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setShares(prev => prev.filter(r => r.id_ressource !== id));
            toast.success({ title: "Ressource ajoutée à vos enregistrements" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible d'accepter le partage." });
        } finally {
            setActioning(null);
        }
    };

    const handleIgnore = async (id) => {
        setActioning(id);
        try {
            const res = await fetch(`${API}/ressources/${id}/share`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            setShares(prev => prev.filter(r => r.id_ressource !== id));
            toast.success({ title: "Partage ignoré" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible d'ignorer le partage." });
        } finally {
            setActioning(null);
        }
    };

    const count = shares.length;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer rounded-lg hover:bg-gray-50"
                title="Notifications"
            >
                <FiBell size={20} />
                {count > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {count > 9 ? "9+" : count}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">Partages reçus</h3>
                            <button
                                onClick={fetchShares}
                                className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                                title="Rafraîchir"
                            >
                                <FiRefreshCw size={13} />
                            </button>
                        </div>

                        {shares.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                Aucun partage en attente
                            </div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                {shares.map(r => (
                                    <div key={r.id_ressource} className="px-4 py-3 flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {r.nom_original || r.url}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{r.url}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleAccept(r.id_ressource)}
                                                disabled={actioning === r.id_ressource}
                                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                                                title="Accepter"
                                            >
                                                <FiCheck size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleIgnore(r.id_ressource)}
                                                disabled={actioning === r.id_ressource}
                                                className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                                                title="Ignorer"
                                            >
                                                <FiX size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
