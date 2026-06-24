import { useState } from "react";
import { Link } from "react-router-dom"; // L'import indispensable !

export default function Register() {
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [mail, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const credentials = { nom, prenom, mail, password };


    const handleRegister = async (e) => {
    e.preventDefault();
    try {
        // 2. Envoyer la requête POST à ton API backend
        const response = await fetch("http://localhost/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json", // On prévient le serveur qu'on envoie du JSON
            },
            body: JSON.stringify(credentials), // Convertit l'objet JS en chaîne JSON
        });

    // 3. Lire la réponse du serveur
        const data = await response.json();

        if (response.ok) {
            console.log("Connexion réussie !", data);

            {/* Si ton serveur renvoie un token JWT, on le stocke pour rester connecté */}
            if (data.token) {
                localStorage.setItem("userToken", data.token);
            }

            window.location.href = "/";
        } else {
            // Le serveur a répondu mais avec une erreur (ex: mauvais mot de passe)
            alert(data.message || "Email ou mot de passe incorrect");
        }

    } catch (error) {
        // Erreur réseau (ex: le serveur backend est éteint)
        console.error("Erreur réseau :", error);
        alert("Impossible de joindre le serveur.");
    }
}

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            {/* Boîte blanche identique à celle du Login */}
            <div className="flex flex-col justify-center items-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full mx-4">
                
                {/* Header du formulaire */}
                <div className="flex flex-col justify-center items-center mb-6">
                    <div className="text-blue-600 rounded-full bg-blue-50 p-4 mb-2">
                        {/* SVG natif pour remplacer CiUser */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Inscription</h1>
                </div>

                {/* Formulaire */}
                <form className="flex flex-col space-y-3 w-full" onSubmit={(e) => { e.preventDefault(); window.location.href = "/login"; }}>
                    
                    {/* Nom et Prénom alignés horizontalement */}
                    <div className="flex gap-2">
                        <input 
                            onChange={(e) => setNom(e.target.value)}
                            type="text"
                            placeholder="Nom" 
                            required
                            className="w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50 transition-colors"
                        />
                        <input 
                            onChange={(e) => setPrenom(e.target.value)}
                            type="text"
                            placeholder="Prénom" 
                            required
                            className="w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50 transition-colors"
                        />
                    </div>

                    <input 
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Email" 
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50 transition-colors"
                    />
                    <input 
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="Mot de passe" 
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50 transition-colors"
                    />
                    
                    {/* Bouton d'inscription natif */}
                    <div className="pt-2">
                        <button 
                            type="submit"
                            className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 text-sm shadow-sm transition-colors cursor-pointer"
                        >
                            S'inscrire
                        </button>
                    </div>
                </form>

                <p className="text-gray-400 text-xs mt-4">OU</p>
                
                {/* Redirection propre vers Login */}
                <Link to="/Login">
                    <button 
                        
                        className="text-sm font-medium text-blue-600 mt-2 hover:underline cursor-pointer bg-transparent border-none"
                    >
                        Se connecter
                    </button>

                </Link>
                <Link to="/">
                <button 
                    
                    className="text-sm font-small text-gray-400 mt-2 hover:underline cursor-pointer bg-transparent border-none"
                >
                    Retourner à la page prinicpale
                </button>
                </Link>
            </div>
        </div>
    )
}