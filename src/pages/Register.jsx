import { useState } from "react";
import { Link } from "react-router-dom"; 
import { useToast } from "../components/Toast/Toast";
import TextInput  from "../components/Inputs/TextInput"
import Button from "../components/Inputs/Button";

export default function Register() {
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const { toast } = useToast();

    const credentials = { nom, prenom, email, password };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // 2. Envoyer la requête POST à ton API backend
            const response = await fetch("http://localhost/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                },
                body: JSON.stringify(credentials), 
            });

            // 3. Lire la réponse du serveur
            const data = await response.json();

            if (response.ok) {
                if (data.token) {
                    localStorage.setItem("userToken", data.token);
                }

                toast.success({
                    title: "Inscription réussie !",
                    message: "Redirection vers la page de connexion"
                });
                console.log("Connexion réussie !", data);

                setTimeout(() => {
                    window.location.href = "/"; 
                }, 3000);

            } else {
                if (data.message?.includes("at least 8 characters")) {
                    
                    toast.error({
                        title: "Mot de passe trop court",
                        message: "Sécurité insuffisante : votre mot de passe doit contenir au moins 8 caractères."
                    });
                    setPassword('');

                } else if (data.message?.includes("The email field must be a valid email address") || data.errors?.email) {
                    
                    toast.error({
                        title: "Adresse email invalide",
                        message: "Veuillez fournir une adresse email correctement configurée."
                    });

                } else {
                    // Erreur générique au cas où le serveur renvoie un autre problème
                    toast.error({
                        title: "Erreur de validation",
                        message: data.message || "Une erreur est survenue."
                    });
                }
            }
        } catch (error) {
            // Bloc catch indispensable pour intercepter les pannes réseau
            console.error("Erreur réseau :", error);
            toast.error({
                title: "Erreur réseau",
                message: "Impossible de joindre le serveur. Veuillez réessayer plus tard."
            });
        }
    }; // Ferme proprement handleRegister

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            {/* Boîte blanche identique à celle du Login */}
            <div className="flex flex-col justify-center items-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full mx-4">
                
                {/* Header du formulaire */}
                <div className="flex flex-col justify-center items-center mb-6">
                    <div className="text-blue-600 rounded-full bg-blue-50 p-4 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Inscription</h1>
                </div>

                {/* Formulaire - Ajout du onSubmit global */}
                <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
                    
                    {/* Nom et Prénom alignés horizontalement */}
                    <div className="flex gap-2">
                        <TextInput 
                            onChange={(e) => setNom(e.target.value)}
                            type="text"
                            placeholder="Nom" 
                            required  
                                                  />
                        <TextInput 
                            onChange={(e) => setPrenom(e.target.value)}
                            type="text"
                            placeholder="Prénom" 
                            required                        />
                    </div>

                    <TextInput 
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Email" 
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50 transition-colors"
                    />
                    <TextInput 
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="Mot de passe" 
                        value={password}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50/50 transition-colors"
                    />
                    
                    {/* Bouton d'inscription natif submit */}
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
                
                {/* Redirections */}
                <Link to="/Login">
                    <button className="text-sm font-medium text-blue-600 mt-2 hover:underline cursor-pointer bg-transparent border-none">
                        Se connecter
                    </button>
                </Link>
            </div>
        </div>
    );
}