export default function APlusBlock({ block }) {
    if (!block) return null;

    const { type, content } = block;

    // Hero Block - Full width image with text overlay
    if (type === 'hero') {
        return (
            <div className="relative overflow-hidden rounded-lg bg-gray-900">
                {content.image_url && (
                    <img
                        src={content.image_url}
                        alt={content.title || 'Hero image'}
                        className="h-64 w-full object-cover opacity-60 sm:h-80"
                    />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                    {content.title && (
                        <h2 className="text-2xl font-bold sm:text-3xl">{content.title}</h2>
                    )}
                    {content.subtitle && (
                        <p className="mt-2 max-w-2xl text-sm opacity-90 sm:text-base">{content.subtitle}</p>
                    )}
                </div>
            </div>
        );
    }

    // Image with Text Block - Side by side
    if (type === 'image_text') {
        const isReversed = content.layout === 'image_right';
        return (
            <div className={`grid gap-6 md:grid-cols-2 md:items-center ${isReversed ? 'md:grid-flow-dense' : ''}`}>
                <div className={isReversed ? 'md:col-start-2' : ''}>
                    {content.image_url && (
                        <img
                            src={content.image_url}
                            alt={content.title || 'Product feature'}
                            className="h-64 w-full rounded-lg object-cover sm:h-80"
                        />
                    )}
                </div>
                <div className={isReversed ? 'md:col-start-1' : ''}>
                    {content.title && (
                        <h3 className="text-xl font-bold text-gray-900">{content.title}</h3>
                    )}
                    {content.description && (
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{content.description}</p>
                    )}
                    {content.features && content.features.length > 0 && (
                        <ul className="mt-4 space-y-2">
                            {content.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    }

    // Feature Grid Block
    if (type === 'feature_grid') {
        const columns = content.columns || 3;
        const colClass = {
            2: 'sm:grid-cols-2',
            3: 'sm:grid-cols-2 lg:grid-cols-3',
            4: 'sm:grid-cols-2 lg:grid-cols-4',
        }[columns] || 'sm:grid-cols-3';

        return (
            <div>
                {content.title && (
                    <h3 className="mb-6 text-center text-xl font-bold text-gray-900">{content.title}</h3>
                )}
                <div className={`grid gap-6 ${colClass}`}>
                    {(content.items || []).map((item, idx) => (
                        <div key={idx} className="text-center">
                            {item.icon_url && (
                                <img
                                    src={item.icon_url}
                                    alt={item.title || 'Feature icon'}
                                    className="mx-auto h-12 w-12"
                                />
                            )}
                            {item.icon && !item.icon_url && (
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                                    <span className="text-2xl">{item.icon}</span>
                                </div>
                            )}
                            {item.title && (
                                <h4 className="mt-3 font-semibold text-gray-900">{item.title}</h4>
                            )}
                            {item.description && (
                                <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Comparison Table Block
    if (type === 'comparison') {
        return (
            <div>
                {content.title && (
                    <h3 className="mb-4 text-xl font-bold text-gray-900">{content.title}</h3>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-3 pr-4 text-left font-semibold text-gray-900">Feature</th>
                                {(content.products || []).map((product, idx) => (
                                    <th key={idx} className="px-4 py-3 text-center font-semibold text-gray-900">
                                        {product.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(content.features || []).map((feature, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-3 pr-4 text-gray-600">{feature.name}</td>
                                    {(content.products || []).map((product, pIdx) => (
                                        <td key={pIdx} className="px-4 py-3 text-center">
                                            {feature.values?.[pIdx] === true ? (
                                                <svg className="mx-auto h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : feature.values?.[pIdx] === false ? (
                                                <svg className="mx-auto h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <span className="text-gray-600">{feature.values?.[pIdx] || '-'}</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Video Block
    if (type === 'video') {
        return (
            <div>
                {content.title && (
                    <h3 className="mb-4 text-xl font-bold text-gray-900">{content.title}</h3>
                )}
                <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
                    {content.video_url && (
                        <iframe
                            src={content.video_url}
                            title={content.title || 'Product video'}
                            className="absolute inset-0 h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}
                </div>
                {content.caption && (
                    <p className="mt-2 text-center text-sm text-gray-500">{content.caption}</p>
                )}
            </div>
        );
    }

    // Gallery Block
    if (type === 'gallery') {
        const images = content.images || [];
        return (
            <div>
                {content.title && (
                    <h3 className="mb-4 text-xl font-bold text-gray-900">{content.title}</h3>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {images.map((image, idx) => (
                        <div key={idx} className="overflow-hidden rounded-lg bg-gray-100">
                            <img
                                src={image.url}
                                alt={image.alt || `Gallery image ${idx + 1}`}
                                className="h-48 w-full object-cover transition-transform hover:scale-105"
                            />
                            {image.caption && (
                                <p className="p-2 text-center text-xs text-gray-500">{image.caption}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Specifications Block
    if (type === 'specifications') {
        return (
            <div>
                {content.title && (
                    <h3 className="mb-4 text-xl font-bold text-gray-900">{content.title}</h3>
                )}
                <dl className="divide-y divide-gray-100">
                    {(content.specs || []).map((spec, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-4 py-3">
                            <dt className="font-medium text-gray-900">{spec.label}</dt>
                            <dd className="col-span-2 text-gray-600">{spec.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        );
    }

    // Rich Text Block
    if (type === 'rich_text') {
        return (
            <div className="prose prose-sm max-w-none">
                {content.title && <h3>{content.title}</h3>}
                {content.html && (
                    <div dangerouslySetInnerHTML={{ __html: content.html }} />
                )}
            </div>
        );
    }

    // Testimonial Block
    if (type === 'testimonial') {
        return (
            <div className="rounded-lg bg-gray-50 p-6">
                {content.quote && (
                    <blockquote className="text-lg italic text-gray-700">
                        "{content.quote}"
                    </blockquote>
                )}
                <div className="mt-4 flex items-center gap-3">
                    {content.avatar_url && (
                        <img
                            src={content.avatar_url}
                            alt={content.author || 'Testimonial author'}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    )}
                    <div>
                        {content.author && (
                            <p className="font-semibold text-gray-900">{content.author}</p>
                        )}
                        {content.title && (
                            <p className="text-sm text-gray-500">{content.title}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // FAQ Block
    if (type === 'faq') {
        return (
            <div>
                {content.title && (
                    <h3 className="mb-4 text-xl font-bold text-gray-900">{content.title}</h3>
                )}
                <dl className="space-y-4">
                    {(content.items || []).map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 p-4">
                            <dt className="font-semibold text-gray-900">{item.question}</dt>
                            <dd className="mt-2 text-sm text-gray-600">{item.answer}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        );
    }

    // Unknown block type - render nothing
    return null;
}
