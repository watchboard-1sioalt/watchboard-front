import { FiSearch, FiX } from "react-icons/fi";

export default function SearchBarView({ value, onChange, onClear, placeholder = "Rechercher..." }) {
    return (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 transition-colors">
            <FiSearch size={15} className="text-gray-400 shrink-0" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
            />
            {value && (
                <button
                    onClick={onClear}
                    title="Effacer"
                    className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                >
                    <FiX size={15} />
                </button>
            )}
        </div>
    );
}
