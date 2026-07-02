export default function PageHeader({ icon: Icon, iconSize = 22, title, children, className = "flex items-center justify-between mb-6" }) {
    return (
        <div className={className}>
            <div className="flex items-center gap-2">
                <Icon className="text-blue-600" size={iconSize} />
                <h1 className="text-2xl font-semibold text-blue-600">{title}</h1>
            </div>
            {children}
        </div>
    );
}
