import { useRef, useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

export default function ImageUploadField({
    label,
    name,
    currentUrl = null,
    onChange,
    onRemove,
    accept = 'image/*',
    hint = null,
    error = null,
    disabled = false,
    previewClassName = 'h-16 w-auto max-w-[200px]',
}) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }

        onChange(file);
    };

    const handleRemove = () => {
        setPreview(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onRemove?.();
    };

    const displayUrl = preview || currentUrl;

    return (
        <div>
            {label && <InputLabel value={label} />}

            {displayUrl && (
                <div className="mt-2 flex items-center gap-3">
                    <img
                        src={displayUrl}
                        alt={label || name}
                        className={`rounded border object-contain ${previewClassName}`}
                    />
                    {!disabled && (
                        <button
                            type="button"
                            className="btn-danger"
                            onClick={handleRemove}
                        >
                            Remove
                        </button>
                    )}
                </div>
            )}

            {!disabled && (
                <input
                    ref={inputRef}
                    type="file"
                    name={name}
                    accept={accept}
                    onChange={handleFileChange}
                    className="mt-2 block w-full text-xs text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                />
            )}

            {hint && (
                <p className="mt-1 text-xs text-gray-500">{hint}</p>
            )}

            <InputError message={error} className="mt-1" />
        </div>
    );
}
