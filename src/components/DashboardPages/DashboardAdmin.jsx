import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


                    const data = [
                    { name: 'Lundi', articles: 12 },
                    { name: 'Mardi', articles: 19 },
                    { name: 'Mercredi', articles: 32 },
                    { name: 'Mercredi', articles: 33 },
                    { name: 'Mercredi', articles: 1 },
                    ];


                        const utilisateurs = [
        { id: 1, nom: "Alban Gala", email: "alban@example.com", role: "Admin", statut: "Validé" },
        { id: 2, nom: "Marie Courtois", email: "marie@example.com", role: "Utilisateur", statut: "En attente" },
        { id: 3, nom: "Lucas Martin", email: "lucas@example.com", role: "Utilisateur", statut: "Validé" },
    ];

export default function DashboardAdmin() {

    return (
        <>
        <h1>Dashboard administrateur</h1>
            <div className="w-full max-w rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md bg-gray-100}> ">
                <h3 className="text-center">Statistiques - Nombre d'inscrits</h3>



                        <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="articles" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                        </div>

            </div>
                        <div className="w-170 max-w rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md bg-gray-100}> ">
                <h3 className="text-center">Verifications en attente</h3>


    
        <div className="w-full max-w-4xl mx-auto mt-8">
            {/* Conteneur pour gérer le défilement horizontal sur mobile */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-left border-collapse bg-white text-sm text-gray-500">
                    
                    {/* En-tête du tableau */}
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium">Nom</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Rôle</th>
                            <th className="px-6 py-4 font-medium">Statut</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>

                    {/* Corps du tableau */}
                    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                        {utilisateurs.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                                {/* Nom */}
                                <td className="px-6 py-4 font-medium text-gray-900">{user.nom}</td>
                                
                                {/* Email */}
                                <td className="px-6 py-4">{user.email}</td>
                                
                                {/* Rôle */}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                        user.role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                
                                {/* Statut */}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                        user.statut === 'Validé' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {user.statut}
                                    </span>
                                </td>

                                {/* Actions (Boutons de modification/suppression) */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button className="text-gray-400 hover:text-blue-500 cursor-pointer font-medium">
                                            Modifier
                                        </button>
                                        <button className="text-gray-400 hover:text-red-500 cursor-pointer font-medium">
                                            Supprimer
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>

                <div className="w-full max-w-4xl mx-auto mt-8">
            {/* Conteneur pour gérer le défilement horizontal sur mobile */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-left border-collapse bg-white text-sm text-gray-500">
                    
                    {/* En-tête du tableau */}
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium">Tags</th>
                            <th className="px-6 py-4 font-medium">Uti</th>
                            <th className="px-6 py-4 font-medium">Rôle</th>
                            <th className="px-6 py-4 font-medium">Statut</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>

                    {/* Corps du tableau */}
                    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                        {utilisateurs.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                                {/* Nom */}
                                <td className="px-6 py-4 font-medium text-gray-900">{user.nom}</td>
                                
                                {/* Email */}
                                <td className="px-6 py-4">{user.email}</td>
                                
                                {/* Rôle */}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                        user.role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                
                                {/* Statut */}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                        user.statut === 'Validé' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {user.statut}
                                    </span>
                                </td>

                                {/* Actions (Boutons de modification/suppression) */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button className="text-gray-400 hover:text-blue-500 cursor-pointer font-medium">
                                            Modifier
                                        </button>
                                        <button className="text-gray-400 hover:text-red-500 cursor-pointer font-medium">
                                            Supprimer
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
        

            </div>
        </>
    )
}