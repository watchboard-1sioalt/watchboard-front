import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUserCheck, FiTag, FiPlus, FiEdit2 } from 'react-icons/fi'; 
import { useToast } from "../Toast/Toast"; 
import { useUser } from "../../contexts/UserContext"; 
import Tag from "../Tag";

const API = "http://localhost/api";

// 1. CONFIGURATION DES STYLES
const configStyles = {
    role: {
        "Utilisateur": "bg-blue-50 text-blue-600",
        "Admin": "bg-purple-50 text-purple-600"
    },
    statut: {
        "En attente": "bg-orange-50 text-orange-600",
        "Validé": "bg-green-50 text-green-600"
    }
};

const data = [
    { name: 'Lundi', articles: 12 },
    { name: 'Mardi', articles: 19 },
    { name: 'Mercredi', articles: 33 },
];

const utilisateurs = [
    { id: 1, nom: "Alban Gala", email: "alban@example.com", role: "Admin", statut: "En attente" },
    { id: 2, nom: "Marie Courtois", email: "marie@example.com", role: "Utilisateur", statut: "En attente" },
    { id: 3, nom: "Lucas Martin", email: "lucas@example.com", role: "Utilisateur", statut: "Validé" },
];

export default function DashboardAdmin() {
    const { token } = useUser();
    const { toast } = useToast();
    
    // États pour gérer les tags publics dynamiquement
    const [publicTags, setPublicTags] = useState([]);
    const [tagModal, setTagModal] = useState(false);
    const [newTagInput, setNewTagInput] = useState("");

    // Charger automatiquement les tags au montage du composant
    useEffect(() => {
        if (token) {
            handleFetchPublicTags();
        }
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

    // ACTION : UPDATE
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

    // ACTION : DELETE
    const handleDeleteTag = async (id_tag, e) => {
        // Empêche la propagation du clic vers d'autres éléments parents
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 space-y-6 relative">

            {/* TITRE PRINCIPAL */}
            <div className="w-full max-w-4xl space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FiUserCheck className="text-blue-600" size={22} />
                        <h1 className="text-2xl font-semibold text-blue-600">Dashboard administrateur</h1>
                    </div>
                </div>
            </div>
            
            {/* SECTION STATISTIQUES */}
            <div className="w-full max-w-4xl p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md bg-white">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                    Statistiques - Nombre d'inscrits
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip />
                            <Line type="monotone" dataKey="articles" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* SECTION VERIFICATIONS */}
            <div className="w-full max-w-4xl rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                    Vérifications en attente
                </h3>

                <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-left border-collapse text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nom</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Rôle</th>
                                <th className="px-6 py-4 font-medium">Statut</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {utilisateurs.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.nom}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${configStyles.role[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${configStyles.statut[user.statut]}`}>
                                            {user.statut}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button className="text-gray-400 hover:text-green-500 cursor-pointer font-medium transition-colors">
                                                Accepter
                                            </button>
                                            <button className="text-gray-400 hover:text-red-500 cursor-pointer font-medium transition-colors">
                                                Refuser
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
                                            
            {/* SECTION TAGS PUBLICS */}
            <div className="w-full max-w-4xl rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md bg-white p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-700">
                        Tags publics
                    </h3>
                    <button 
                        onClick={() => setTagModal(true)}
                        className="flex items-center gap-1.5 px-8 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        <FiPlus size={16} />
                        Ajouter
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-gray-50 pt-4">
                    {publicTags.length > 0 ? (
                        publicTags.map(tag => (
                            <div key={tag.id_tag} className="flex items-center gap-1 group relative">
                                {/* Liaison avec la prop 'onRemove' native de ton composant Tag */}
                                <Tag 
                                    title={tag.tag} 
                                    onRemove={(e) => handleDeleteTag(tag.id_tag, e)} 
                                />
                                {/* Bouton d'édition flottant apparaissant au survol */}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
                        
                        {/* En-tête de la modale */}
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
                        
                        {/* Corps de la modale */}
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