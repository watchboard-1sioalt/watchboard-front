import { useUser } from "../../contexts/UserContext";
import Cards from "../Cards/Cards";

export default function DashboardHome() {
    const { user } = useUser()

    return (
        <>
            <h1 className="text-blue-600">{new Date().getHours() > 18 ? 'Bonsoir' : 'Bonjour'} {user.prenom}</h1>

            <div>
                {/* TODO: faire un tableau de bord */}
            </div>
        </>
    )
}