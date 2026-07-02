import { FiEdit2 } from "react-icons/fi";
import Tag from "./Tag";

export default function EditableTag({ title, onEdit, onRemove }) {
    return (
        <div className="flex items-center gap-1 group relative">
            <Tag title={title} onRemove={onRemove} />
            <button
                onClick={onEdit}
                className="sm:opacity-100 md:opacity-100 lg:opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 rounded bg-white shadow-sm border border-gray-100 transition-all absolute -top-3 -right-2 z-10 cursor-pointer"
                title="Modifier"
            >
                <FiEdit2 size={10} />
            </button>
        </div>
    );
}
