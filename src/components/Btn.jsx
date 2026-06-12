export function BtnBase({ titre }) {
    return (
        <>
            <button className="px-4 py-2 rounded-full bg-primary cursor-pointer">
                {titre}
            </button>
        </>
    )
}

export function BtnStyle({ titre }) {
    return (
        <>
            <button className="px-4 py-2 rounded-full bg-secondary cursor-pointer">
                {titre}
            </button>
        </>
    )
}