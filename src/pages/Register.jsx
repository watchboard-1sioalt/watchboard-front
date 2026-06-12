import Button from "../components/Inputs/Button";
import TextInput from "../components/Inputs/TextInput";

import { CiUser } from "react-icons/ci";


export default function Register() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col justify-center items-center p-8">
                <div className="flex flex-col justify-center items-center">
                    <div className="text-primary rounded-full bg-primary/30 p-4" >
                        <CiUser size={32} />
                    </div>
                    <h1 className="text-gray-600">Inscription</h1>
                </div>
                <form className="flex flex-col space-y-2 p-2 ">
                    <div className="flex-1 space-x-2">
                        <TextInput placeholder={"Nom"} />
                        <TextInput placeholder={"Prénom"} />
                    </div>
                    <TextInput placeholder={"Email"} />
                    <TextInput placeholder={"Mot de passe"} type={"password"} />
                </form>

                <Button title={"S'inscrire"} style="rounded-full mt-2" />

                <p className="text-gray-400 text-sm mt-2">OU</p>
                <a href="/register" className="text-xs text-secondary mt-1 hover:text-primary">Se connecter</a>
            </div>
        </div>
    )
}