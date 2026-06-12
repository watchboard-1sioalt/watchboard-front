export default function TextInput({ placeholder, border, onInput }) {
    return (
        <input type="text" className={`py-1 border-b ${border ? border : "border-primary"}`} placeholder={placeholder} onInput={onInput}>

        </input>
    )
}