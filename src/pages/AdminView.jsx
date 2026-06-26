import { Link } from "react-router-dom";
import SideBarView from "../components/SideBar";
import CardsAdmin from "../components/Cards/CardsAdmin";

export default function AdminView() {
    return (
        <>
            <SideBarView />
            
            <main className="flex-1 p-8 lg:p-12 ">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"></div>
                    <CardsAdmin titre= "Alban" description= "albangala" />

            </main>
        </>
    )
}