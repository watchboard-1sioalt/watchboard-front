import { MdBlock } from "react-icons/md";

export default function Unverified() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col justify-center items-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full mx-4">
                <div className="flex flex-col justify-center items-center mb-6">
                    <div className="text-red-600 rounded-full bg-blue-50 p-4">
                        <MdBlock size={64} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Validation en attente</h1>
                </div>
                <p className="text-sm text-gray-600 text-center">Votre compte est en attente d'une validation par un administrateur.</p>
            </div>
        </div>
    )
}