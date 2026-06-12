import Button from "../components/Inputs/Button";
import TextInput from "../components/Inputs/TextInput";

// Page d'accueil (quand on arrive sur le site => /)
export default function Test() {

    return (
        <>
            <h1>Page de test</h1>

            <TextInput placeholder={"Entrez un truc"} />
            <Button title={"Bouton test"} />
        </>
    )
}