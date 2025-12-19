import { useState, useRef, useEffect } from 'react';

export default function TagInput({
    value = [],
    onChange,
    placeholder = 'Add a tag...',
    suggestions = [],
    maxTags = 10,
    allowCustom = true,
    disabled = false,
    error = null,
}) {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    const tags = Array.isArray(value) ? value : [];

    const filteredSuggestions = suggestions.filter(
        (suggestion) =>
            !tags.includes(suggestion) &&
            suggestion.toLowerCase().includes(inputValue.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addTag = (tag) => {
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag) return;
        if (tags.length >= maxTags) return;
        if (tags.includes(normalizedTag)) return;
        if (!allowCustom && !suggestions.includes(normalizedTag)) return;

        onChange([...tags, normalizedTag]);
        setInputValue('');
        setShowSuggestions(false);
        setHighlightedIndex(-1);
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
                addTag(filteredSuggestions[highlightedIndex]);
            } else if (inputValue) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev < filteredSuggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        } else if (e.key === ',' || e.key === 'Tab') {
            if (inputValue) {
                e.preventDefault();
                addTag(inputValue);
            }
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
    };

    return (
        <div ref={containerRef} className="relative">
            <div
                className={`min-h-[42px] flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 ${
                    isFocused
                        ? 'border-brand ring-2 ring-brand/20'
                        : error
                        ? 'border-red-300'
                        : 'border-gray-200'
                } ${disabled ? 'cursor-not-allowed bg-gray-50 opacity-60' : 'bg-white'}`}
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                    >
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTag(tag);
                                }}
                                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </span>
                ))}

                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setIsFocused(true);
                        setShowSuggestions(true);
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder={tags.length === 0 ? placeholder : tags.length >= maxTags ? '' : 'Add more...'}
                    disabled={disabled || tags.length >= maxTags}
                    className="min-w-[100px] flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && inputValue && (
                <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {filteredSuggestions.map((suggestion, index) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => addTag(suggestion)}
                            className={`w-full px-3 py-2 text-left text-sm ${
                                index === highlightedIndex
                                    ? 'bg-brand/10 text-brand'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}

            {/* Tag Count */}
            {maxTags && (
                <p className="mt-1 text-right text-xs text-gray-400">
                    {tags.length}/{maxTags} tags
                </p>
            )}
        </div>
    );
}
