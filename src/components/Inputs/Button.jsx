export default function Button({ title, onClick, textColor, style, bg, bgHover, disabled = false }) {
    return (
        <>
            <button title={title} onClick={onClick} className={`py-2 px-4 cursor-pointer rounded-2xl ${style} ${textColor ? textColor : "text-white"} ${bg ? bg : "bg-primary"} ${bgHover ? "hover:" + bgHover : "hover:bg-secondary"} ${disabled ? "cursor-not-allowed!" : ""}`} disabled={disabled}>
                {title}
            </button>
        </>
    )
}