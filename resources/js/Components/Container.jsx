/**
 * Container component for consistent max-width and padding across the site.
 * Use this instead of manually adding `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`
 */
export default function Container({ children, className = '', as: Component = 'div' }) {
    return (
        <Component className={`container mx-auto px-4 sm:px-6 lg:px-8 ${className}`.trim()}>
            {children}
        </Component>
    );
}
