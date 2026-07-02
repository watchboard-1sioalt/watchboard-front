import { FiTrash2, FiCheck, FiX } from "react-icons/fi";

export default function InlineDeleteConfirm({
    isConfirming,
    onRequestConfirm,
    onConfirm,
    onCancel,
    label = "Confirmer la suppression ?",
    wrapperClassName = "flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm",
    trashClassName = "text-gray-300 hover:text-red-500 transition-colors cursor-pointer",
    iconSize = 14,
}) {
    return isConfirming ? (
        <div className={wrapperClassName}>
            {label && <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>}
            <button onClick={onConfirm} className="text-blue-600 hover:text-red-600 cursor-pointer">
                <FiCheck size={iconSize} />
            </button>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <FiX size={iconSize} />
            </button>
        </div>
    ) : (
        <button onClick={onRequestConfirm} className={trashClassName} title="Supprimer">
            <FiTrash2 size={iconSize} />
        </button>
    );
}
