export default function TextInput({ placeholder, type = "text", border = "border-primary", onChange }) {
    return (
        <input type={type} className={`outline-none py-1 border-b ${border}`} placeholder={placeholder} onChange={onChange}>

        </input>
    )
}