export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60 ` +
                className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
