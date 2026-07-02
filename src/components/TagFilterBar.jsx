import { useState } from "react";
import { FiFilter } from "react-icons/fi";

const TAG_LIMIT = 8;

export default function TagFilterBar({ tags, selectedIds, onToggle, onClearAll, icon: Icon = FiFilter }) {
    const [showAll, setShowAll] = useState(false);

    if (!tags || tags.length === 0) return null;

    const visible = showAll ? tags : tags.slice(0, TAG_LIMIT);

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <Icon size={14} className="text-gray-400 shrink-0" />
            {visible.map(tag => {
                const active = selectedIds.has(tag.id_tag);
                return (
                    <button
                        key={tag.id_tag}
                        onClick={() => onToggle(tag.id_tag)}
                        className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                            active
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                        }`}
                    >
                        {tag.tag}
                    </button>
                );
            })}
            {tags.length > TAG_LIMIT && (
                <button
                    onClick={() => setShowAll(v => !v)}
                    className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer font-medium"
                >
                    {showAll ? "Afficher moins" : `Afficher plus (${tags.length - TAG_LIMIT})`}
                </button>
            )}
            {selectedIds.size > 0 && (
                <button
                    onClick={onClearAll}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline"
                >
                    Tout effacer
                </button>
            )}
        </div>
    );
}
