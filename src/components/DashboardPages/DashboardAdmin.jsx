import { useState, useEffect, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FiUserCheck, FiPlus, FiEdit2, FiUsers, FiUserX, FiShield, FiClock } from "react-icons/fi";
import { useToast } from "../Toast/Toast";
import { useUser } from "../../contexts/UserContext";
import Tag from "../Tag";

const API = "http://localhost/api";

const userKey = (u) => u.id_utilisateur ?? u.id;

function StatCard({ icon, label, value, color }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 shadow-sm bg-white">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xl font-semibold text-gray-900 leading-none">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
        </div>
    );
}

export default function DashboardAdmin() {
    const { token } = useUser();
    const { toast } = useToast();

    // ───────────────────────────── Utilisateurs ─────────────────────────────
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [actioningId, setActioningId] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(`${API}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : data.data ?? []);
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de charger les utilisateurs." });
        } finally {
            setLoadingUsers(false);
        }
    }, [token]);

    useEffect(() => { if (token) fetchUsers(); }, [token, fetchUsers]);

    const updateUserLocally = (updated) => {
        setUsers(prev => prev.map(u => userKey(u) === userKey(updated) ? { ...u, ...updated } : u));
    };

    const handleValidate = async (id) => {
        setActioningId(id);
        try {
            const res = await fetch(`${API}/admin/users/${id}/validate`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            updateUserLocally(await res.json());
            toast.success({ title: "Utilisateur validé" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de valider cet utilisateur." });
        } finally {
            setActioningId(null);
        }
    };

    const handleDisable = async (id) => {
        setActioningId(id);
        try {
            const res = await fetch(`${API}/admin/users/${id}/disable`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            updateUserLocally(await res.json());
            toast.success({ title: "Utilisateur désactivé" });
        } catch {
            toast.error({ title: "Erreur", message: "Impossible de désactiver cet utilisateur." });
        } finally {
            setActioningId(null);
        }
    };

    const pendingUsers = useMemo(() => users.filter(u => !u.validation), [users]);

    const stats = useMemo(() => ({
        total: users.length,
        validated: users.filter(u => u.validation).length,
        pending: pendingUsers.length,
        admins: users.filter(u => u.admin).length,
    }), [users, pendingUsers]);

    // Inscriptions des 7 derniers jours (à partir des vraies dates de création)
    const registrationChart = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        return days.map(day => {
            const next = new Date(day);
            next.setDate(next.getDate() + 1);
            const count = users.filter(u => {
                if (!u.created_at) return false;
                const c = new Date(u.created_at);
                return c >= day && c < next;
            }).length;
            return { name: day.toLocaleDateString("fr-FR", { weekday: "short" }), inscriptions: count };
        });
    }, [users]);

    // ───────────────────────────── Tags publics ─────────────────────────────
    const [publicTags, setPublicTags] = useState([]);
    const [tagModal, setTagModal] = useState(false);
    const [newTagInput, setNewTagInput] = useState("");

    useEffect(() => {
        if (token) handleFetchPublicTags();
    }, [token]);

    const handleDirectAddTag = async () => {
        if (!newTagInput.trim()) return;

        try {
            const res = await fetch(`${API}/tags/createpublic`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ tag: newTagInput.trim() })
            });

            if (!res.ok) throw new Error();
            const responseData = await res.json();

            const createdTag = responseData.data ? responseData.data : responseData;

            if (createdTag && (createdTag.tag || createdTag.name)) {
                setPublicTags(prev => [
                    ...prev,
                    {
                        id_tag: createdTag.id_tag || createdTag.id || Date.now(),
                        tag: createdTag.tag || createdTag.name
                    }
                ]);
                toast.success({ title: "Tag ajouté" });
            } else {
                throw new Error("Format de réponse invalide");
            }

            setNewTagInput("");
        } catch (error) {
            console.error("Erreur ajout tag:", error);
            setPublicTags(prev => [...prev, { id_tag: Date.now(), tag: newTagInput.trim() }]);
            toast.success({ title: "Tag ajouté (Local)" });
            setNewTagInput("");
        }
    };

    const handleFetchPublicTags = async () => {
        try {
            const res = await fetch(`${API}/tags/public`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Impossible de charger les tags publics");

            const rawData = await res.json();
            const cleanData = Array.isArray(rawData) ? rawData : rawData.data ?? [];

            const sanitizedTags = cleanData
                .filter(t => t && (t.tag || t.name))
                .map(t => ({
                    id_tag: t.id_tag || t.id,
                    tag: t.tag || t.name
                }));

            setPublicTags(sanitizedTags);

        } catch (error) {
            console.error("Erreur lors de la récupération :", error);
            toast.error({ title: "Erreur", message: "Impossible de récupérer les tags." });
        }
    };

    const handleUpdateTag = async (id_tag, currentTitle) => {
        const newTitle = prompt("Modifier le nom du tag :", currentTitle);
        if (!newTitle || !newTitle.trim() || newTitle.trim() === currentTitle) return;

        try {
            const res = await fetch(`${API}/tags/editpublic`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id_tag, tag: newTitle.trim() })
            });

            if (!res.ok) throw new Error();

            setPublicTags(prev => prev.map(t => t.id_tag === id_tag ? { ...t, tag: newTitle.trim() } : t));
            toast.success({ title: "Tag mis à jour" });
        } catch (error) {
            console.error("Erreur modification tag:", error);
            setPublicTags(prev => prev.map(t => t.id_tag === id_tag ? { ...t, tag: newTitle.trim() } : t));
            toast.success({ title: "Tag mis à jour " });
        }
    };

    const handleDeleteTag = async (id_tag, e) => {
        if (e && e.stopPropagation) e.stopPropagation();

        if (!confirm("Voulez-vous vraiment supprimer ce tag public ?")) return;

        try {
            const res = await fetch(`${API}/tags/deletepublic`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id_tag })
            });

            if (!res.ok) throw new Error();

            setPublicTags(prev => prev.filter(t => t.id_tag !== id_tag));
            toast.success({ title: "Tag supprimé" });
        } catch (error) {
            console.error("Erreur suppression tag:", error);
            setPublicTags(prev => prev.filter(t => t.id_tag !== id_tag));
            toast.success({ title: "Tag supprimé (Local)" });
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <FiUserCheck className="text-blue-600" size={22} />
                <h1 className="text-2xl font-semibold text-blue-600">Dashboard administrateur</h1>
            </div>

            {/* STATISTIQUES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard icon={<FiUsers size={18} className="text-blue-600" />} label="Utilisateurs" value={stats.total} color="bg-blue-50" />
                <StatCard icon={<FiUserCheck size={18} className="text-green-600" />} label="Validés" value={stats.validated} color="bg-green-50" />
                <StatCard icon={<FiClock size={18} className="text-orange-600" />} label="En attente" value={stats.pending} color="bg-orange-50" />
                <StatCard icon={<FiShield size={18} className="text-purple-600" />} label="Admins" value={stats.admins} color="bg-purple-50" />
            </div>

            <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Inscriptions (7 derniers jours)
                </h3>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={registrationChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="inscriptions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* VÉRIFICATIONS EN ATTENTE */}
            <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Vérifications en attente {pendingUsers.length > 0 && `(${pendingUsers.length})`}
                </h3>

                {loadingUsers ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
                ) : pendingUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Aucune vérification en attente.</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-left border-collapse text-sm text-gray-500">
                            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Nom</th>
                                    <th className="px-6 py-3 font-medium">Email</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingUsers.map(u => (
                                    <tr key={userKey(u)} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">{u.prenom} {u.nom}</td>
                                        <td className="px-6 py-3">{u.email}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => handleValidate(userKey(u))}
                                                disabled={actioningId === userKey(u)}
                                                className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium transition-colors disabled:opacity-50"
                                            >
                                                Valider
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* TOUS LES UTILISATEURS */}
            <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Tous les utilisateurs
                </h3>

                {loadingUsers ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
                ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Aucun utilisateur.</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-left border-collapse text-sm text-gray-500">
                            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Nom</th>
                                    <th className="px-6 py-3 font-medium">Email</th>
                                    <th className="px-6 py-3 font-medium">Rôle</th>
                                    <th className="px-6 py-3 font-medium">Statut</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={userKey(u)} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">{u.prenom} {u.nom}</td>
                                        <td className="px-6 py-3">{u.email}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${u.admin ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                                                {u.admin ? "Admin" : "Utilisateur"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${u.validation ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
                                                {u.validation ? "Validé" : "En attente"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {u.validation ? (
                                                <button
                                                    onClick={() => handleDisable(userKey(u))}
                                                    disabled={actioningId === userKey(u)}
                                                    className="flex items-center gap-1 ml-auto text-gray-400 hover:text-red-500 cursor-pointer font-medium transition-colors disabled:opacity-50"
                                                    title="Désactiver le compte"
                                                >
                                                    <FiUserX size={14} /> Désactiver
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleValidate(userKey(u))}
                                                    disabled={actioningId === userKey(u)}
                                                    className="flex items-center gap-1 ml-auto text-blue-600 hover:text-blue-700 cursor-pointer font-medium transition-colors disabled:opacity-50"
                                                    title="Valider le compte"
                                                >
                                                    <FiUserCheck size={14} /> Valider
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* TAGS PUBLICS */}
            <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Tags publics
                    </h3>
                    <button
                        onClick={() => setTagModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        <FiPlus size={16} />
                        Ajouter
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-gray-50 pt-4">
                    {publicTags.length > 0 ? (
                        publicTags.map(tag => (
                            <div key={tag.id_tag} className="flex items-center gap-1 group relative">
                                <Tag
                                    title={tag.tag}
                                    onRemove={(e) => handleDeleteTag(tag.id_tag, e)}
                                />
                                <button
                                    onClick={() => handleUpdateTag(tag.id_tag, tag.tag)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 rounded bg-white shadow-sm border border-gray-100 transition-all absolute -top-3 -right-2 z-10 cursor-pointer"
                                    title="Modifier"
                                >
                                    <FiEdit2 size={10} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic">Aucun tag public pour le moment.</p>
                    )}
                </div>
            </div>

            {tagModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }} onClick={() => setTagModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="text-base font-semibold text-blue-600">Ajouter un tag</h2>
                            <button
                                onClick={() => setTagModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded-lg hover:bg-gray-100"
                            >
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            <div className="relative mb-4">
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" height="15" width="15" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    placeholder="Rechercher ou créer un tag (Entrée)..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                                    type="text"
                                    value={newTagInput}
                                    onChange={(e) => setNewTagInput(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleDirectAddTag();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-48 mb-4">
                                {publicTags
                                    .filter(t => t && t.tag && t.tag.toLowerCase().includes((newTagInput || "").toLowerCase()))
                                    .map(t => (
                                        <div key={t.id_tag} className="flex items-center gap-1">
                                            <Tag
                                                title={t.tag}
                                                onRemove={(e) => handleDeleteTag(t.id_tag, e)}
                                            />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
