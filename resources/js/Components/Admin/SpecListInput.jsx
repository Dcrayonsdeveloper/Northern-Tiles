import { useMemo, useRef, useState } from 'react';
import { COLOUR_NAMES, colourHex, parseSpecList } from '@/Support/colours';

/**
 * Add/remove editor for the spec fields the storefront renders as pickers —
 * Colours and Finish.
 *
 * These are stored as a single delimited string ("Black, Charcoal, Carbon") and
 * parsed back into swatches on the product page, so this component is purely a
 * nicer way to edit that string: it always serialises to the same format, and
 * the value it emits is a plain string, exactly as the old text input produced.
 * Nothing downstream needed to change.
 */
export default function SpecListInput({
    label,
    value,
    onChange,
    format,
    withSwatches = false,
    suggestions = [],
    placeholder = 'Type and press Enter',
    hint,
}) {
    const [draft, setDraft] = useState('');
    const inputRef = useRef(null);

    const items = useMemo(() => parseSpecList(value, format.split), [value, format.split]);

    // Separator is derived from the value being edited, so a product stored with
    // commas stays comma-separated instead of being rewritten on first edit.
    const commit = (next) => onChange(next.join(format.join(value)));

    const add = (raw) => {
        // A pasted "Black, Charcoal" should become two chips, not one, so split
        // the incoming text on the same separator we serialise with.
        const candidates = parseSpecList(raw, format.split);
        if (candidates.length === 0) return;

        const seen = items.map((i) => i.toLowerCase());
        const additions = [];
        for (const c of candidates) {
            if (!seen.includes(c.toLowerCase()) && !additions.some((a) => a.toLowerCase() === c.toLowerCase())) {
                additions.push(c);
            }
        }

        if (additions.length) commit([...items, ...additions]);
        setDraft('');
    };

    const removeAt = (index) => commit(items.filter((_, i) => i !== index));

    const move = (index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        commit(next);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
            return;
        }
        // Backspace on an empty box removes the last chip — standard tag-input
        // behaviour, and quicker than reaching for the ×.
        if (e.key === 'Backspace' && draft === '' && items.length) {
            e.preventDefault();
            removeAt(items.length - 1);
        }
    };

    const unknown = withSwatches ? items.filter((i) => !colourHex(i)) : [];
    const listId = withSwatches ? `spec-suggest-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined;

    return (
        <div>
            <label className="block text-xs font-medium text-gray-700">{label}</label>

            {/* ── Chips ── */}
            <div className="mt-1 flex flex-wrap gap-1.5 rounded border border-gray-300 bg-white p-2 min-h-[42px]">
                {items.length === 0 && (
                    <span className="px-1 text-xs text-gray-400 self-center">None yet — add one below</span>
                )}

                {items.map((item, i) => {
                    const hex = withSwatches ? colourHex(item) : null;
                    return (
                        <span
                            key={`${item}-${i}`}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1.5 pr-1 text-xs text-gray-800"
                        >
                            {withSwatches && (
                                <span
                                    className="h-4 w-4 shrink-0 rounded-full border border-gray-300"
                                    style={hex ? { backgroundColor: hex } : undefined}
                                    title={hex ? item : `${item} — no swatch colour, shows initials on the site`}
                                >
                                    {!hex && (
                                        <span className="flex h-full w-full items-center justify-center text-[7px] font-bold text-gray-500">
                                            {item.slice(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </span>
                            )}

                            <span className="font-medium">{item}</span>

                            {/* Order matters — it is the order shown on the product page. */}
                            <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                    type="button"
                                    onClick={() => move(i, -1)}
                                    disabled={i === 0}
                                    className="px-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                    title="Move left"
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(i, 1)}
                                    disabled={i === items.length - 1}
                                    className="px-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                    title="Move right"
                                >
                                    ›
                                </button>
                            </span>

                            <button
                                type="button"
                                onClick={() => removeAt(i)}
                                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600"
                                title={`Remove ${item}`}
                                aria-label={`Remove ${item}`}
                            >
                                ×
                            </button>
                        </span>
                    );
                })}
            </div>

            {/* ── Add box ── */}
            <div className="mt-1.5 flex gap-1.5">
                <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={() => draft.trim() && add(draft)}
                    list={listId}
                    placeholder={placeholder}
                    className="admin-input flex-1 text-xs"
                />
                <button
                    type="button"
                    onClick={() => add(draft)}
                    disabled={!draft.trim()}
                    className="rounded bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                >
                    Add
                </button>
            </div>

            {listId && (
                <datalist id={listId}>
                    {suggestions.map((s) => (
                        <option key={s} value={s.replace(/\b\w/g, (c) => c.toUpperCase())} />
                    ))}
                </datalist>
            )}

            {hint && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}

            {unknown.length > 0 && (
                <p className="mt-1 text-[10px] text-amber-600">
                    No swatch colour for {unknown.join(', ')} — these show as initials on the product page.
                </p>
            )}
        </div>
    );
}

export { COLOUR_NAMES };
