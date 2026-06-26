import { useState } from "react";
import TextInput from "../Inputs/TextInput";
import Button from "../Inputs/Button";
import { useUser } from "../../contexts/UserContext";
import { FiSettings } from "react-icons/fi";

// 1. Sous-composant pour les sections simples (Mail, Mot de passe) - AGGRANDI
function SettingsSection({ label, value, type = "text", onSave }) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);

    const handleSave = () => {
        onSave(inputValue);
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col gap-3 p-6 border-b border-gray-100 w-full">
            <div className="flex items-center justify-between w-full">
                <div>
                    <span className="text-gray-500 text-sm block font-medium mb-1">{label}</span>
                    <span className="text-lg font-semibold text-gray-800">{value || "Non renseigné"}</span>
                </div>
                <Button
                    title={isOpen ? "Annuler" : "Modifier"}
                    style={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${isOpen ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    onClick={() => setIsOpen(!isOpen)}
                />
            </div>
            {isOpen && (
                <div className="flex items-center gap-3 mt-3 p-4 bg-gray-50 rounded-xl w-full border border-gray-100">
                    <div className="flex-1">
                        <TextInput
                            onChange={(e) => setInputValue(e.target.value)}
                            type={type}
                            value={inputValue}
                            required
                        />
                    </div>
                    <Button title="Valider" style="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700" onClick={handleSave} />
                </div>
            )}
        </div>
    );
}

// 2. Sous-composant pour le Nom & Prénom - AGGRANDI
function IdentitySection({ nomInitial, prenomInitial, onSave }) {
    const [isOpen, setIsOpen] = useState(false);
    const [nom, setNom] = useState(nomInitial);
    const [prenom, setPrenom] = useState(prenomInitial);

    const handleSave = () => {
        onSave({ nom, prenom });
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col gap-3 p-6 border-b border-gray-100 w-full">
            <div className="flex items-center justify-between w-full">
                <div>
                    <span className="text-gray-500 text-sm block font-medium mb-1">Vos informations</span>
                    <span className="text-lg font-semibold text-gray-800">{prenom} {nom}</span>
                </div>
                <Button
                    title={isOpen ? "Annuler" : "Modifier"}
                    style={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${isOpen ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    onClick={() => setIsOpen(!isOpen)}
                />
            </div>

            {isOpen && (
                <div className="flex flex-col gap-4 mt-3 p-4 bg-gray-50 rounded-xl w-full border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Prénom</label>
                            <TextInput
                                onChange={(e) => setPrenom(e.target.value)}
                                type="text"
                                value={prenom}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Nom</label>
                            <TextInput
                                onChange={(e) => setNom(e.target.value)}
                                type="text"
                                value={nom}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button title="Valider" style="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 w-full md:w-auto" onClick={handleSave} />
                    </div>
                </div>
            )}
        </div>
    );
}

// 3. Composant principal - CENTRÉ ET ÉLARGI
export default function SettingsView() {
    const { user } = useUser();
    const [email, setEmail] = useState(user?.email || "");
    const [nom, setNom] = useState(user?.nom || "");
    const [prenom, setPrenom] = useState(user?.prenom || "");

    const handleSaveIdentity = (identityData) => {
        setNom(identityData.nom);
        setPrenom(identityData.prenom);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FiSettings className="text-blue-600" size={22} />
                    <h1 className="text-2xl font-semibold text-blue-600">Paramètres</h1>
                </div>
            </div>
            <div className="w-full max-w-4xl">

                <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden w-full">

                    <SettingsSection
                        label="Votre mail"
                        value={email}
                        type="email"
                        onSave={(newEmail) => setEmail(newEmail)}
                    />

                    <IdentitySection
                        nomInitial={nom}
                        prenomInitial={prenom}
                        onSave={handleSaveIdentity}
                    />

                    <SettingsSection
                        label="Mot de passe"
                        value="••••••••"
                        type="password"
                        onSave={(newPassword) => console.log("Nouveau MDP :", newPassword)}
                    />

                </div>
            </div>
            <div className="mt-5 h-0.5 w-full bg-gray-200" />
        </div>
    );
}