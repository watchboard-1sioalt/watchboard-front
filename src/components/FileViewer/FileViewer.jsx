import { useEffect, useState, useRef, useCallback } from "react";
import { FiX, FiDownload } from "react-icons/fi";
import { useUser } from "../../contexts/UserContext";
import { API_BASE_URL as API } from "../../config/api";

const IMG_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
const VIDEO_EXTS = ["mp4", "webm", "ogg"];
const AUDIO_EXTS = ["mp3", "wav", "aac"];
const PDF_EXTS = ["pdf"];
const TXT_EXTS = ["txt", "md", "json", "csv"];
const DOCX_EXTS = ["docx"];

function getExt(filename) {
    return (filename ?? "").split(".").pop().toLowerCase();
}

export default function FileViewer({ isOpen, onClose, ressource }) {
    const { token } = useUser();
    const [objectUrl, setObjectUrl] = useState(null);
    const [textContent, setTextContent] = useState(null);
    const [blobForDocx, setBlobForDocx] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const prevUrlRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !ressource) return;

        let cancelled = false;

        setLoading(true);
        setError(null);
        setTextContent(null);
        setBlobForDocx(null);

        if (prevUrlRef.current) {
            URL.revokeObjectURL(prevUrlRef.current);
            prevUrlRef.current = null;
            setObjectUrl(null);
        }

        const load = async () => {
            try {
                const res = await fetch(`${API}/ressources/${ressource.id_ressource}/file`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    if (!cancelled) setError(
                        res.status === 403 ? "Accès refusé à ce fichier." :
                        res.status === 404 ? "Fichier introuvable." :
                        "Erreur lors du chargement."
                    );
                    return;
                }

                const blob = await res.blob();
                if (cancelled) return;

                const ext = getExt(ressource.nom_original);
                const url = URL.createObjectURL(blob);

                if (TXT_EXTS.includes(ext)) {
                    const text = await blob.text();
                    if (cancelled) { URL.revokeObjectURL(url); return; }
                    prevUrlRef.current = url;
                    setObjectUrl(url);
                    setTextContent(text);
                } else if (DOCX_EXTS.includes(ext)) {
                    if (cancelled) { URL.revokeObjectURL(url); return; }
                    prevUrlRef.current = url;
                    setObjectUrl(url);
                    setBlobForDocx(blob);
                } else {
                    if (cancelled) { URL.revokeObjectURL(url); return; }
                    prevUrlRef.current = url;
                    setObjectUrl(url);
                }
            } catch {
                if (!cancelled) setError("Impossible de charger le fichier.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => { cancelled = true; };
    }, [isOpen, ressource?.id_ressource, token]);

    useEffect(() => {
        if (!isOpen) {
            if (prevUrlRef.current) {
                URL.revokeObjectURL(prevUrlRef.current);
                prevUrlRef.current = null;
            }
            setObjectUrl(null);
            setTextContent(null);
            setBlobForDocx(null);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    const docxCallback = useCallback(async (node) => {
        if (!node || !blobForDocx) return;
        try {
            const { renderAsync } = await import("docx-preview");
            await renderAsync(blobForDocx, node);
        } catch {
            setError("Impossible d'afficher le document Word.");
        }
    }, [blobForDocx]);

    if (!isOpen) return null;

    const ext = getExt(ressource?.nom_original);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    Chargement...
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
                    {error}
                </div>
            );
        }
        if (IMG_EXTS.includes(ext) && objectUrl) {
            return (
                <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-50">
                    <img
                        src={objectUrl}
                        alt={ressource?.nom_original}
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                </div>
            );
        }
        if (VIDEO_EXTS.includes(ext) && objectUrl) {
            return (
                <div className="flex-1 flex items-center justify-center bg-black">
                    <video controls src={objectUrl} className="max-w-full max-h-full" />
                </div>
            );
        }
        if (AUDIO_EXTS.includes(ext) && objectUrl) {
            return (
                <div className="flex-1 flex items-center justify-center p-8">
                    <audio controls src={objectUrl} className="w-full max-w-md" />
                </div>
            );
        }
        if (PDF_EXTS.includes(ext) && objectUrl) {
            return (
                <iframe
                    src={objectUrl}
                    title={ressource?.nom_original}
                    className="flex-1 w-full border-0"
                />
            );
        }
        if (TXT_EXTS.includes(ext) && textContent !== null) {
            return (
                <div className="flex-1 overflow-auto p-5">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {textContent}
                    </pre>
                </div>
            );
        }
        if (DOCX_EXTS.includes(ext)) {
            return (
                <div ref={docxCallback} className="flex-1 overflow-auto p-4" />
            );
        }
        if (objectUrl) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 text-sm">
                    <p>Aperçu non disponible pour ce type de fichier.</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl flex flex-col w-full max-w-5xl"
                style={{ height: "90vh" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-semibold text-blue-600 truncate mr-4">
                        {ressource?.nom_original}
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                        {objectUrl && (
                            <a
                                href={objectUrl}
                                download={ressource?.nom_original}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FiDownload size={14} />
                                Télécharger
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded-lg hover:bg-gray-100"
                        >
                            <FiX size={18} />
                        </button>
                    </div>
                </div>

                {renderContent()}
            </div>
        </div>
    );
}
