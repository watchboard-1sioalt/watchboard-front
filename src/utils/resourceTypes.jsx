import { FiRss, FiGlobe } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { FaFile } from "react-icons/fa6";

export const TYPE_META = {
    rss: { label: "RSS", icon: <FiRss size={12} /> },
    youtube: { label: "YouTube", icon: <FaYoutube size={12} /> },
    file: { label: "Fichier", icon: <FaFile size={12} /> },
    url: { label: "Site web", icon: <FiGlobe size={12} /> },
};
