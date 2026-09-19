import { forwardRef, useState } from 'react';
import TextInput from '@/Components/TextInput';

function EyeIcon({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
        </svg>
    );
}

function EyeSlashIcon({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.774 3.162 10.066 7.498a10.52 10.52 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
            />
        </svg>
    );
}

/**
 * Password field with a show/hide toggle.
 *
 * The button sits inside the field, so the input carries extra end padding to
 * stop a long password running underneath it.
 *
 * `unstyled` swaps TextInput for a plain input, for the builder and admin forms
 * that bring their own input classes — TextInput's base classes (h-10, text-xs,
 * border-gray-200) would otherwise fight them, and Tailwind resolves such
 * conflicts by stylesheet order rather than by the order they are written here.
 *
 * The toggle is deliberately left in the tab order: someone typing a password
 * they cannot see is exactly who needs to reach it without a mouse. It is a
 * `type="button"` so it never submits the form it sits in.
 */
export default forwardRef(function PasswordInput(
    { className = '', unstyled = false, isFocused = false, ...props },
    ref,
) {
    const [visible, setVisible] = useState(false);

    const field = unstyled ? (
        <input
            {...props}
            ref={ref}
            type={visible ? 'text' : 'password'}
            autoFocus={isFocused || undefined}
            className={'pe-10 ' + className}
        />
    ) : (
        <TextInput
            {...props}
            ref={ref}
            isFocused={isFocused}
            type={visible ? 'text' : 'password'}
            className={'pe-10 ' + className}
        />
    );

    return (
        <div className="relative">
            {field}

            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 end-0 flex items-center rounded-e-md px-3 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:text-gray-700 focus-visible:ring-2 focus-visible:ring-brand/30"
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                title={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? (
                    <EyeSlashIcon className="h-4 w-4" />
                ) : (
                    <EyeIcon className="h-4 w-4" />
                )}
            </button>
        </div>
    );
});
