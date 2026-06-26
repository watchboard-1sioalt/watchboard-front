export default function TextInput({ value = "", placeholder, type = "text", border = "border-primary", onChange, required = false }) {
    return (
        <input type={type} className={`outline-none py-1 border-b ${border}`} value={value} placeholder={placeholder} onChange={onChange} required={required}>
        </input>
    )
}