import { motion } from "framer-motion";
import { FiShare2 as ShareIcon } from "react-icons/fi";

export default function ShareButton({ onClick, title = "Partager par e-mail" }) {
    return (
        <motion.button
            onClick={onClick}
            title={title}
            whileHover="hover"
            whileTap="tap"
            variants={{
                hover: { 
                    scale: 1.05,
                    borderColor: "#bfdbfe",    // border-blue-200
                    color: "#3b82f6",          // text-blue-500
                    backgroundColor: "#eff6ff" // bg-blue-50
                },
                tap: { scale: 0.95 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
        >
            <motion.div
                variants={{
                    hover: { rotate: 15, scale: 1.1 } // Micro-rotation et pop de l'icône au survol
                }}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="flex items-center justify-center"
            >
                <ShareIcon size={16} />
            </motion.div>
        </motion.button>
    );
}