import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const ToastContext = createContext(null);

// SVG donnés par une ia
const ICONS = {
    success: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    error: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    warning: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    info: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
};

const TYPE_STYLES = {
    success: {
        container: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800",
        icon: "text-emerald-600 dark:text-emerald-400",
        title: "text-emerald-900 dark:text-emerald-100",
        message: "text-emerald-700 dark:text-emerald-300",
        progress: "bg-emerald-500",
        close: "text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200",
    },
    error: {
        container: "bg-red-50 border-red-200 dark:bg-red-950/60 dark:border-red-800",
        icon: "text-red-600 dark:text-red-400",
        title: "text-red-900 dark:text-red-100",
        message: "text-red-700 dark:text-red-300",
        progress: "bg-red-500",
        close: "text-red-400 hover:text-red-600 dark:hover:text-red-200",
    },
    warning: {
        container: "bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800",
        icon: "text-amber-600 dark:text-amber-400",
        title: "text-amber-900 dark:text-amber-100",
        message: "text-amber-700 dark:text-amber-300",
        progress: "bg-amber-500",
        close: "text-amber-400 hover:text-amber-600 dark:hover:text-amber-200",
    },
    info: {
        container: "bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:border-blue-800",
        icon: "text-blue-600 dark:text-blue-400",
        title: "text-blue-900 dark:text-blue-100",
        message: "text-blue-700 dark:text-blue-300",
        progress: "bg-blue-500",
        close: "text-blue-400 hover:text-blue-600 dark:hover:text-blue-200",
    },
};


function ToastItem({ toast, onRemove }) {
    const { id, type = "info", title, message, duration = 4000 } = toast;
    const styles = TYPE_STYLES[type];
    const [progress, setProgress] = useState(100);
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const remainingRef = useRef(duration);

    const startTimer = useCallback(() => {
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.max(0, 100 - (elapsed / remainingRef.current) * 100);
            setProgress(pct);
            if (pct <= 0) dismiss();
        }, 30);
    }, []);

    const pauseTimer = () => {
        clearInterval(intervalRef.current);
        remainingRef.current -= Date.now() - startTimeRef.current;
    };

    const dismiss = useCallback(() => {
        clearInterval(intervalRef.current);
        setLeaving(true);
        setTimeout(() => onRemove(id), 350);
    }, [id, onRemove]);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        startTimer();
        return () => clearInterval(intervalRef.current);
    }, []);

    const base =
        "relative flex items-start gap-3 w-full max-w-sm rounded-xl border px-4 py-3.5 shadow-lg transition-all duration-350 ease-in-out";
    const state = leaving
        ? "opacity-0 translate-x-full scale-95"
        : visible
            ? "opacity-100 translate-x-0 scale-100"
            : "opacity-0 translate-x-full scale-95";

    return (
        <div
            className={`${base} ${styles.container} ${state}`}
            role="alert"
            aria-live="assertive"
            onMouseEnter={pauseTimer}
            onMouseLeave={startTimer}
        >

            <span className={`mt-0.5 shrink-0 ${styles.icon}`} aria-hidden="true">
                {ICONS[type]}
            </span>

            {/*contenu */}
            <div className="flex-1 min-w-0 pr-1">
                {title && (
                    <p className={`text-sm font-semibold leading-snug ${styles.title}`}>
                        {title}
                    </p>
                )}
                {message && (
                    <p className={`text-sm leading-snug mt-0.5 ${styles.message}`}>
                        {message}
                    </p>
                )}
            </div>

            <button
                onClick={dismiss}
                className={`shrink-0 mt-0.5 transition-colors ${styles.close}`}
                aria-label="Fermer la notification"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            <div
                className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl transition-[width] ease-linear ${styles.progress}`}
                style={{ width: `${progress}%`, transitionDuration: "30ms" }}
                aria-hidden="true"
            />
        </div>
    );
}


const POSITION_CLASSES = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};

function ToastContainer({ toasts, position = "top-right", removeToast }) {
    const pos = POSITION_CLASSES[position] ?? POSITION_CLASSES["top-right"];
    return (
        <div
            className={`fixed z-50 flex flex-col gap-2.5 ${pos}`}
            style={{ maxWidth: "calc(100vw - 2rem)" }}
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onRemove={removeToast} />
            ))}
        </div>
    );
}


/**
 * Wraps your app to enable toasts everywhere.
 * @param {{ position?: string, children: React.ReactNode }} props
 */
export function ToastProvider({ children, position = "top-right" }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { ...toast, id }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} position={position} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}



/**
 * Returns { toast, dismiss } helpers.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success({ title: "Enregistré", message: "Vos modifications ont été sauvegardées." });
 *   toast.error({ title: "Erreur", message: "Une erreur est survenue.", duration: 6000 });
 *   toast.warning({ message: "Attention, cette action est irréversible." });
 *   toast.info({ title: "Mise à jour disponible" });
 */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");

    const make = (type) => (options) =>
        ctx.addToast({ type, ...options });

    return {
        toast: {
            success: make("success"),
            error: make("error"),
            warning: make("warning"),
            info: make("info"),
        },
        dismiss: ctx.removeToast,
    };
}