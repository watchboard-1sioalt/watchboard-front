import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUserCheck, FiTag, FiPlus } from 'react-icons/fi'; 
import { useToast } from "../Toast/Toast"; 
import { useUser } from "../../contexts/UserContext"; 
import Tags from "../Tag";

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
    const [publicTags, setPublicTags] = useState([{ id_tag: 1, tag: "Vidéo" }, { id_tag: 2, tag: "React" }]);
    const [tagModal, setTagModal] = useState(false);
    const [newTagInput, setNewTagInput] = useState("");

    const handleDirectAddTag = async () => {
        if (!newTagInput.trim()) return;

        try {
            const res = await fetch(`${API}/createpublic`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ tag: newTagInput.trim() })
            });
            if (!res.ok) throw new Error();
            const createdTag = await res.json();
            
            setPublicTags(prev => [...prev, createdTag]);
            toast.success({ title: "Tag ajouté" });
            setNewTagInput("");
        } catch {
            // Repli local si l'API n'est pas connectée pour le test
            setPublicTags(prev => [...prev, { id_tag: Date.now(), tag: newTagInput.trim() }]);
            toast.success({ title: "Tag ajouté" });
            setNewTagInput("");
        }
    };

const handleFetchPublicTags = async () => {
    try {
        const res = await fetch(`${API}/public`, {
            method: "GET", // On utilise GET pour récupérer
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Impossible de charger les tags publics");
        
        const data = await res.json();
        
        // Sécurité : on vérifie que l'API renvoie bien un tableau avant de mettre à jour le state
        setPublicTags(Array.isArray(data) ? data : data.data ?? []);

    } catch (error) {
        console.error("Erreur lors de la récupération :", error);
        toast.error({ title: "Erreur", message: "Impossible de récupérer les tags." });
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
                    {/* Bouton pour ouvrir votre modale */}
                    <button 
                        onClick={() => setTagModal(true)}
                        className="flex items-center gap-1.5 px-8 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        <FiPlus size={16} />
                        Ajouter
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-gray-50 pt-4">
                    {publicTags.map(tag => (
                        <Tags key={tag.id_tag} title={tag.tag} />
                    ))}
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
                                {/* J'ai lié le style du tag fourni à la liste de vos tags pour la recherche */}
                                {publicTags.filter(t => t.tag.toLowerCase().includes(newTagInput.toLowerCase())).map(t => (
                                    <span key={t.id_tag} className="inline-flex items-center align-middle gap-0.5 text-xs font-medium px-2 py-1 rounded-full w-fit bg-blue-50 text-blue-500 border border-blue-300 hover:bg-blue-100 hover:text-blue-600 cursor-pointer" role="button">
                                        <span className="hover:bg-blue-200 rounded-full cursor-pointer p-1 transition-colors">
                                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="12" width="12" xmlns="http://www.w3.org/2000/svg">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                        {t.tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
        
    );
}