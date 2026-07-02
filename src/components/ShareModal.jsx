import Modal from "./Modal/Modal";

export default function ShareModal({ isOpen, onClose, title, email, onEmailChange, onShare, sharing }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            actions={[{
                label: sharing ? "Envoi..." : "Partager",
                variant: "primary",
                onClick: onShare,
                loading: sharing,
            }]}
        >
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Adresse e-mail du destinataire</label>
                <input
                    type="email"
                    value={email}
                    onChange={onEmailChange}
                    onKeyDown={e => e.key === "Enter" && onShare()}
                    placeholder="utilisateur@exemple.com"
                    autoFocus
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-colors bg-white"
                />
            </div>
        </Modal>
    );
}
