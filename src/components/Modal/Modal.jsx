import { useState, useEffect, useCallback } from "react";
import { FiX } from "react-icons/fi";

/**
 * Modal dynamique.
 *
 * items: Array de descripteurs de champs :
 *   { type: 'input' | 'textarea' | 'select', key, label, placeholder, required, maxLength, options }
 *   options (select only): [{ value, label }]
 *
 * actions: Array de boutons :
 *   { label, variant: 'primary' | 'secondary' | 'danger', onClick(values), loading, disabled }
 */
export default function Modal({ isOpen, onClose, title, items = [], actions = [], children }) {
    const [values, setValues] = useState({});

    // Reset à chaque ouverture
    useEffect(() => {
        if (isOpen) {
            const initial = {};
            items.forEach(item => { initial[item.key] = item.defaultValue ?? ""; });
            setValues(initial);
        }
    }, [isOpen]);

    const handleKey = useCallback((e) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, handleKey]);

    if (!isOpen) return null;

    const setValue = (key, value) => setValues(prev => ({ ...prev, [key]: value }));

    const VARIANT = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50",
        danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-blue-600">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Contenu custom (children) ou champs (items) */}
                {children ? (
                    <div className="px-5 py-4">{children}</div>
                ) : (
                    <div className="px-5 py-4 flex flex-col gap-4">
                        {items.map(item => (
                            <div key={item.key} className="flex flex-col gap-1.5">
                                {item.label && (
                                    <label className="text-sm font-medium text-gray-700">
                                        {item.label}
                                        {item.required && <span className="text-red-400 ml-0.5">*</span>}
                                    </label>
                                )}

                                {item.type === "textarea" ? (
                                    <textarea
                                        value={values[item.key] ?? ""}
                                        onChange={e => setValue(item.key, e.target.value)}
                                        placeholder={item.placeholder}
                                        maxLength={item.maxLength}
                                        rows={item.rows ?? 3}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none transition-colors"
                                    />
                                ) : item.type === "select" ? (
                                    <select
                                        value={values[item.key] ?? ""}
                                        onChange={e => setValue(item.key, e.target.value)}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white transition-colors cursor-pointer"
                                    >
                                        {item.placeholder && (
                                            <option value="" disabled>{item.placeholder}</option>
                                        )}
                                        {(item.options ?? []).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={item.inputType ?? "text"}
                                        value={values[item.key] ?? ""}
                                        onChange={e => setValue(item.key, e.target.value)}
                                        placeholder={item.placeholder}
                                        maxLength={item.maxLength}
                                        required={item.required}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors"
                                    />
                                )}

                                {item.hint && (
                                    <p className="text-xs text-gray-400">{item.hint}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {actions.length > 0 && (
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                        {actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => action.onClick(values)}
                                disabled={action.loading || action.disabled}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${VARIANT[action.variant ?? "secondary"]}`}
                            >
                                {action.icon && <span className="shrink-0">{action.icon}</span>}
                                {action.loading ? (action.loadingLabel ?? "...") : action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
