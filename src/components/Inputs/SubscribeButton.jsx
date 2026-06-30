import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiCheckCircle } from "react-icons/fi";

export default function SubscribeButton({ isSubscribed, onClick }) {
    return (
        <motion.button
            layout // Anime fluidement le changement de taille si le texte ou les paddings changent
            onClick={onClick}
            whileHover={isSubscribed ? {} : { scale: 1.02 }}
            whileTap={isSubscribed ? {} : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            animate={{
                backgroundColor: isSubscribed ? "#f0fdf4" : "#ffffff", // bg-green-50 vs bg-white
                borderColor: isSubscribed ? "#bbf7d0" : "#e5e7eb",     // border-green-200 vs border-gray-200
                color: isSubscribed ? "#16a34a" : "#6b7280",           // text-green-600 vs text-gray-500
            }}
            className={`w-full flex items-center justify-center py-1.5 border rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                !isSubscribed 
                    ? "hover:bg-blue-600 hover:text-white hover:border-blue-600 cursor-pointer shadow-2xs" 
                    : "select-none"
            }`}
        >
            <AnimatePresence mode="wait">
                {isSubscribed ? (
                    <motion.div
                        key="subscribed"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center justify-center gap-1"
                    >
                        <FiCheckCircle size={13} className="shrink-0" />
                        <span>Abonné</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="unsubscribed"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center justify-center gap-1"
                    >
                        <FiPlus size={13} className="shrink-0" />
                        <span>S'abonner</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}