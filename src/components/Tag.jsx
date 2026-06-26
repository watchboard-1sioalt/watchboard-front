import { RxCross1 } from "react-icons/rx";

export default function Tag({ title, icon = "cross", onRemove, onTagClick, color = "bg-blue-50 text-blue-500 border border-blue-200", hoverColor = "hover:bg-blue-200 text-blue-500 border border-blue-200", className = "" }) {
    return (
        <span className={`
            inline-flex items-center align-middle gap-0.5 text-xs font-medium px-2 py-1 rounded-full w-fit
            ${color} ${className} ${onTagClick ? hoverColor + " cursor-pointer" : ""}
        `}
            onClick={onTagClick}
            role={onTagClick ? "button" : undefined}
        >
            {icon === "cross" ? (
                <span
                    className="hover:bg-gray-300 rounded-full cursor-pointer p-1"
                    onClick={onRemove}
                    role={onRemove ? "button" : undefined}
                >
                    <RxCross1 size={12} />
                </span>
            ) : (
                <span
                    className="hover:bg-gray-300 rounded-full cursor-pointer p-1"
                >
                    {icon}
                </span>
            )}
            {title}
        </span>
    )
}