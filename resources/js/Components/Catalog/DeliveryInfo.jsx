import { Link } from '@inertiajs/react';

/**
 * DeliveryInfo — the delivery terms that close every product's Description,
 * on the retail and the trade product page alike.
 *
 * Rendered here rather than written into each product's stored description,
 * so a product added later carries it too and a change of rate is one edit.
 * The trade portal links in amber, so the link colour is a prop.
 */
export default function DeliveryInfo({ linkClassName = 'text-brand' }) {
    return (
        <div className="product-description">
            <h3>Delivery</h3>
            <ul>
                <li>Delivery in Victoria: please allow $100 per pallet.</li>
                <li>
                    Delivery Australia-wide available. For interstate delivery, please{' '}
                    <Link href={route('pages.contact')} className={`font-semibold hover:underline ${linkClassName}`}>
                        contact us
                    </Link>{' '}
                    for a quote on delivery charges.
                </li>
            </ul>
        </div>
    );
}
