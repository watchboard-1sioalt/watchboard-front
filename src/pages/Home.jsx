import { useState, useEffect } from "react";
import SideBarView, { menuItems } from "../components/SideBar";
import { useUser } from "../contexts/UserContext";

export default function Home() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("Tableau de bord");

    const activeItem = menuItems.find((item) => item.name === activeTab);

    useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [activeTab]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            <SideBarView activeTab={activeTab} onTabChange={setActiveTab} />
            <main
                className="flex-1 transition-[margin-left] duration-300 p-5 pl-8"
                style={{ marginLeft: "calc(var(--sidebar-width, 0)" }}
            >
                {activeItem?.element ?? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        {activeTab} - page à venir
                    </div>
                )}
            </main>
        </div>
    );
}
