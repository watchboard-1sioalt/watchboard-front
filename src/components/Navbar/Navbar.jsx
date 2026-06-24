import Logo from "../../assets/logo.png";

export default function Navbar() {
    return (
        <nav className="flex items-center justify-between m-3">
            <div className="w-12 ">
                <img src={Logo} />
            </div>
            <div className="flex flex-row space-x-4 items-center ">
                <a href="/" className="hover:text-secondary">Accueil</a>
                <a href="/feed" className="hover:text-secondary">Feed</a>
                <a className="py-2 px-3 rounded text-white bg-primary hover:bg-secondary" href="/login">Connexion</a>
            </div>
        </nav>
    )
}