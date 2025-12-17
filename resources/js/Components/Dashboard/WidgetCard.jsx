export default function WidgetCard({ title, actions = null, children }) {
    return (
        <div className="admin-card">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
            <div className="mt-3">{children}</div>
        </div>
    );
}
