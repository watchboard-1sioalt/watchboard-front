export default function TextInput({ placeholder, type = "text", border = "border-primary", onInput }) {
    return (
        <input type={type} className={`outline-none py-1 border-b ${border}`} placeholder={placeholder} onInput={onInput}>

        </input>
    )
}