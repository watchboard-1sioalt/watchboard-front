import Button from "../components/Inputs/Button";
import TextInput from "../components/Inputs/TextInput";

import { CiUser } from "react-icons/ci";

export default function Login() {

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col justify-center items-center p-8">
                <div className="flex flex-col justify-center items-center">
                    <div className="text-primary rounded-full bg-primary/30 p-4" >
                        <CiUser size={32} />
                    </div>
                    <h1 className="text-gray-600">Connexion</h1>
                </div>
                <form className="flex flex-col space-y-2 p-2 ">
                    <TextInput placeholder={"Email"} />
                    <TextInput placeholder={"Mot de passe"} type={"password"} />
                </form>

                <Button title={"Se connecter"} style="rounded-full mt-2" onClick={truc} />

                <p className="text-gray-400 text-sm mt-2">OU</p>
                <a href="/register" className="text-xs text-secondary mt-1 hover:text-primary">Créer un compte</a>
            </div>
        </div>
    )
}