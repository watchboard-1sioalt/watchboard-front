import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBookmark } from "react-icons/fi";
import { BsBookmarkFill } from "react-icons/bs";

const PARTICLE_COUNT = 8;
const PARTICLE_DISTANCE = 28;
const PARTICLE_COLOR = "#378ADD";
const BOUNCE_EASE = [0.34, 1.56, 0.64, 1];

export default function SaveButton({ saved = false, onSave }) {
    const [isSaved, setIsSaved] = useState(saved);
    const [saving, setSaving] = useState(false);
    const [burstKey, setBurstKey] = useState(0);

    useEffect(() => { setIsSaved(saved); }, [saved]);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        const next = !isSaved;
        setIsSaved(next);
        if (next) setBurstKey((k) => k + 1);
        try {
            await onSave(next);
        } catch {
            setIsSaved(!next);
        } finally {
            setSaving(false);
        }
    };

    return (
        <button
            onClick={handleSave}
            disabled={saving}
            title={isSaved ? "Retirer des enregistrés" : "Enregistrer l'article"}
            style={{
                position: "relative",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
            }}
        >
            <motion.div
                animate={{ scale: isSaved ? [1, 1.35, 0.92, 1] : 1 }}
                transition={{ duration: 0.4, ease: BOUNCE_EASE }}
                style={{ color: isSaved ? PARTICLE_COLOR : "#9ca3af" }}
            >
                {isSaved ? <BsBookmarkFill size={18} /> : <FiBookmark size={18} />}
            </motion.div>

            <AnimatePresence>
                {isSaved && (
                    <motion.div key={burstKey} style={{ position: "absolute", inset: 0 }}>
                        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
                            const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
                            return (
                                <motion.span
                                    key={i}
                                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                    animate={{
                                        x: Math.cos(angle) * PARTICLE_DISTANCE,
                                        y: Math.sin(angle) * PARTICLE_DISTANCE,
                                        scale: 0,
                                        opacity: 0,
                                    }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: PARTICLE_COLOR,
                                    }}
                                />
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}
