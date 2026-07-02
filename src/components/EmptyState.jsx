export default function EmptyState({ icon: Icon, iconSize = 40, message, subMessage, action, className = "" }) {
    return (
        <div className={`text-center py-16 text-gray-400 ${className}`}>
            {Icon && <Icon size={iconSize} className="mx-auto mb-3 opacity-30" />}
            <p className="text-sm">{message}</p>
            {subMessage && <p className="text-xs mt-1">{subMessage}</p>}
            {action && (
                <button onClick={action.onClick} className="text-xs text-blue-500 hover:text-blue-700 mt-2 cursor-pointer underline">
                    {action.label}
                </button>
            )}
        </div>
    );
}
