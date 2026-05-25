export default function WidgetCard({ title, actions = null, children }) {
    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Card header */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
                <h3 className="truncate text-[13px] font-semibold tracking-tight text-gray-800">
                    {title}
                </h3>
                {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>

            {/* Card body */}
            <div className="flex-1 p-4">
                {children}
            </div>
        </div>
    );
}
