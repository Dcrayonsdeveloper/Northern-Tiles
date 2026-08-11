<?php

namespace Database\Seeders;

use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Services\CMSService;
use Illuminate\Database\Seeder;

/**
 * Content for the static pages the footer links to.
 *
 * Two things were wrong before and are worth recording so they are not
 * reintroduced:
 *
 *  1. The content was generic e-commerce boilerplate written for a drinkware
 *     shop — BPA-free bottles, international shipping, a US-style 30-day
 *     returns promise. None of it described this business.
 *
 *  2. It was stored as body_json['sections'], a shape
 *     Public\PageController::renderBodyJson() does not understand — it only
 *     reads 'description' or 'blocks'. So every one of these pages rendered as
 *     a bare title with an empty body, which is why the footer appeared to sit
 *     directly under the header on /privacy-policy and /terms-of-service.
 *
 * Content is written as body_json['description'] holding HTML. That is the same
 * shape the admin Description field produces, so these pages stay editable in
 * the CMS rather than being frozen in code.
 *
 * NOTE: these are plain-English trade templates for an Australian supplier, not
 * legal advice. Have them reviewed before relying on them commercially.
 */
class StaticPagesSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'meta_title' => 'Privacy Policy | Northern TILE Distributors',
                'meta_description' => 'How Northern TILE Distributors collects, uses, stores and protects your personal information, in line with the Australian Privacy Principles.',
                'body_json' => ['description' => $this->privacyPolicy()],
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms-of-service',
                'meta_title' => 'Terms of Service | Northern TILE Distributors',
                'meta_description' => 'The terms that apply when you buy tiles, flooring and trade supplies from Northern TILE Distributors, including trade accounts, delivery and returns.',
                'body_json' => ['description' => $this->termsOfService()],
            ],
            [
                'title' => 'Return Policy',
                'slug' => 'return-policy',
                'meta_title' => 'Return Policy | Northern TILE Distributors',
                'meta_description' => 'How to return tiles, flooring and trade supplies to Northern TILE Distributors, what can be returned, and your rights under the Australian Consumer Law.',
                'body_json' => ['description' => $this->returnPolicy()],
            ],
            [
                'title' => 'Shipping & Delivery',
                'slug' => 'shipping',
                'meta_title' => 'Shipping & Delivery | Northern TILE Distributors',
                'meta_description' => 'Delivery across Melbourne and regional Victoria, click & collect from our Thomastown warehouse, lead times and delivery requirements.',
                'body_json' => ['description' => $this->shipping()],
            ],
            [
                'title' => 'Frequently Asked Questions',
                'slug' => 'faq',
                'meta_title' => 'FAQ | Northern TILE Distributors',
                'meta_description' => 'Common questions about ordering tiles and flooring, trade accounts, samples, wastage, shade variation, delivery and returns.',
                'body_json' => ['description' => $this->faq()],
            ],
        ];

        $cms = app(CMSService::class);

        foreach ($pages as $data) {
            $page = Page::updateOrCreate(
                ['slug' => $data['slug']],
                $data + [
                    'template' => 'default',
                    'status' => Page::STATUS_PUBLISHED,
                    'published_at' => now(),
                ],
            );

            // getPage() caches for an hour, so without this the site keeps
            // serving the old body and the seed looks like it did nothing.
            $cms->flushPageCache($page->slug, $page->full_slug);
        }

        $this->command?->info('Static pages seeded: ' . implode(', ', array_column($pages, 'slug')));
    }

    /**
     * The page template already renders the title and a "last updated" date, so
     * the body starts at the first real section.
     */
    protected function privacyPolicy(): string
    {
        return <<<'HTML'
<p>Northern TILE Distributors ("we", "us", "our") respects your privacy. This policy explains what personal information we collect, why we collect it, who we share it with and how you can access or correct it. We handle personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles.</p>

<h2>Who we are</h2>
<p>Northern TILE Distributors is a wholesale supplier of tiles, timber and hybrid flooring, natural stone and trade supplies, operating from 19/324 Settlement Road, Thomastown VIC 3074.</p>
<ul>
<li>Phone: (03) 9464 6623</li>
<li>Email: <a href="mailto:info@ntiled.com.au">info@ntiled.com.au</a></li>
</ul>

<h2>What we collect</h2>
<p>We only collect information we actually need to quote, supply and deliver your order:</p>
<ul>
<li><strong>Contact details</strong> — your name, email address, phone number and delivery or site address.</li>
<li><strong>Trade account details</strong> — your company name and ABN, and the details of the person authorised to order on the account.</li>
<li><strong>Order information</strong> — what you bought, quantities, quotes, delivery instructions and order history.</li>
<li><strong>Payment information</strong> — payments are processed by our payment provider. Card numbers are entered directly with that provider and are <strong>not</strong> stored on our systems.</li>
<li><strong>Website information</strong> — pages viewed, approximate location, browser and device type, collected through cookies and analytics tools.</li>
</ul>

<h2>How we collect it</h2>
<p>Usually directly from you — when you create an account, apply for a trade account, place an order, request a sample or quote, call us, or contact us through the website. We may also collect information from your employer if they hold the trade account you order against, and from public sources such as the Australian Business Register when we verify an ABN.</p>

<h2>Why we use it</h2>
<ul>
<li>To quote, process, invoice and deliver your order.</li>
<li>To assess and approve trade account applications, and to apply trade pricing.</li>
<li>To contact you about stock, batch availability, delivery times or a problem with an order.</li>
<li>To handle returns, warranty claims and product support.</li>
<li>To meet our tax, accounting and other legal obligations.</li>
<li>To improve the website and, where you have not opted out, to measure our advertising.</li>
</ul>
<p>We will only send you marketing where you have opted in or are an existing customer, and every marketing message includes an unsubscribe link.</p>

<h2>Who we share it with</h2>
<p>We do not sell, rent or trade your personal information. We share it only with parties who need it to deliver our service to you:</p>
<ul>
<li>Freight and courier companies, so your order can be delivered.</li>
<li>Our payment provider, to process payments and refunds.</li>
<li>Our IT, hosting, email and analytics providers.</li>
<li>Our accountants and professional advisers.</li>
<li>Government agencies or law enforcement, where we are required or permitted by law.</li>
</ul>

<h2>Cookies and analytics</h2>
<p>Our website uses cookies to keep your cart and session working and to understand how the site is used. Where enabled, we also use third-party measurement tools such as Google Analytics and the Meta Pixel, which set their own cookies and may receive information about your visit.</p>
<p>You can block or delete cookies in your browser settings. Doing so may stop parts of the site — such as the cart and checkout — from working correctly.</p>

<h2>Overseas disclosure</h2>
<p>Some of our service providers (for example hosting, email and analytics) store data on servers outside Australia. Where that happens, we take reasonable steps to ensure the information is handled consistently with the Australian Privacy Principles.</p>

<h2>Security and retention</h2>
<p>We take reasonable steps to protect personal information from misuse, loss and unauthorised access, including restricted access, encrypted connections and secure hosting. No system is perfectly secure, so we cannot guarantee absolute security.</p>
<p>We keep personal information for as long as we need it for the purpose it was collected, and for as long as we are required to keep business and tax records. After that we destroy or de-identify it.</p>

<h2>Accessing and correcting your information</h2>
<p>You can ask us for a copy of the personal information we hold about you, and ask us to correct anything that is wrong or out of date. Email <a href="mailto:info@ntiled.com.au">info@ntiled.com.au</a> or call (03) 9464 6623. We will respond within a reasonable time and will tell you if we cannot give you access, and why.</p>

<h2>Complaints</h2>
<p>If you think we have mishandled your personal information, please contact us first so we can try to resolve it. If you are not satisfied with our response, you can complain to the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">oaic.gov.au</a> or on 1300 363 992.</p>

<h2>Changes to this policy</h2>
<p>We may update this policy from time to time. The current version is always the one published on this page, and the date it was last updated is shown at the top.</p>
HTML;
    }

    protected function termsOfService(): string
    {
        return <<<'HTML'
<p>These terms apply when you buy from Northern TILE Distributors, whether in our Thomastown warehouse, over the phone or through this website. By placing an order you accept them.</p>

<h2>Prices and GST</h2>
<p>All prices are in Australian dollars. Prices shown on the retail site include GST unless clearly stated otherwise; trade portal pricing may be shown excluding GST, in which case it is labelled as such. Prices can change without notice, and a price is only locked in once we have accepted your order.</p>
<p>We take care to price and describe products accurately. If an obvious error appears — a clear pricing or typographical mistake — we may cancel the affected order and refund you in full rather than supply at the incorrect price.</p>

<h2>Orders and stock</h2>
<p>Your order is an offer to buy. A contract is formed when we accept it and confirm supply. All goods are subject to availability and to batch availability at the time of despatch.</p>
<p>Where an item is out of stock or a batch has run out, we will contact you to arrange a substitute, a back-order or a refund.</p>

<h2>Shade, batch and size variation</h2>
<p>Tiles, timber and natural stone are not uniform products. Colour, shade, veining, texture and size vary between production batches, and natural stone varies within a single batch. Screen images and samples are indicative only.</p>
<ul>
<li>Order all the material you need for a job <strong>in one order</strong>, so it comes from one batch. We cannot guarantee a matching batch on a later top-up order.</li>
<li>Check tiles for shade, calibre and quality <strong>before</strong> they are laid. Once material is installed it is taken to have been accepted, and claims for shade or size variation can no longer be made.</li>
<li>Manufacturing tolerances for size, thickness, warpage and rectification are set by the manufacturer to Australian and international standards.</li>
</ul>

<h2>Quantities and wastage</h2>
<p>You are responsible for your own measurements and quantities. We are glad to help estimate, but any figure we give is a guide only. We recommend allowing at least 10% over the measured area for cuts and breakage, and more for diagonal, herringbone or other patterned layouts.</p>

<h2>Samples</h2>
<p>Samples show general character only. The material supplied will not be an exact match for a sample, and a sample does not represent the full range of shade variation in a batch.</p>

<h2>Payment</h2>
<p>Retail orders are paid in full at the time of order. Goods remain our property until they are paid for in full, even if they have been delivered or collected.</p>

<h2>Trade accounts</h2>
<ul>
<li>Trade accounts are for businesses in the building and construction trades. An application must include a valid ABN and is subject to approval.</li>
<li>Applying does not grant access. Until we approve your application you can shop at normal retail prices; trade pricing and the trade portal switch on once approved.</li>
<li>Trade pricing is confidential and is for your business's own use. It must not be published or passed on to third parties.</li>
<li>We may vary, suspend or withdraw a trade account and its pricing at any time, including where an account is outside its agreed payment terms.</li>
<li>You are responsible for orders placed by anyone you allow to use your account, and for keeping your login secure.</li>
</ul>

<h2>Delivery and collection</h2>
<p>Delivery timeframes are estimates, not guarantees, and depend on stock, freight and site access. See our <a href="/shipping">Shipping &amp; Delivery</a> page for how delivery works.</p>
<p>Risk in the goods passes to you on delivery or collection. Please inspect goods on arrival and note any damage or shortage on the delivery paperwork, and tell us within 48 hours.</p>

<h2>Returns and cancellations</h2>
<p>Please choose carefully. We are not required to give a refund where you have simply changed your mind, ordered the wrong quantity or measured incorrectly.</p>
<p>Where we do agree to accept a return of a stock item, it must be unopened, undamaged, in original packaging and in resaleable condition, returned within 30 days with proof of purchase. A restocking fee may apply, and freight is not refundable. Special-order, clearance, cut-to-size and discontinued items cannot be returned.</p>
<p>See our <a href="/returns">Return Policy</a> for the full process.</p>

<h2>Your rights under the Australian Consumer Law</h2>
<p>Nothing in these terms excludes, restricts or modifies any consumer guarantee, right or remedy you have under the Australian Consumer Law that cannot lawfully be excluded.</p>
<p>Our goods come with guarantees that cannot be excluded under the Australian Consumer Law. You are entitled to a replacement or refund for a major failure and to compensation for any other reasonably foreseeable loss or damage. You are also entitled to have the goods repaired or replaced if they fail to be of acceptable quality and the failure does not amount to a major failure.</p>

<h2>Installation</h2>
<p>We supply materials; we do not install them. Products must be installed by a suitably qualified trade in line with the manufacturer's instructions, the relevant Australian Standards and the National Construction Code. We are not responsible for defects, failure or damage caused by incorrect preparation, installation, waterproofing, adhesive or maintenance.</p>

<h2>Liability</h2>
<p>Other than the rights described above under the Australian Consumer Law, and to the extent permitted by law, we are not liable for indirect or consequential loss, including loss of profit, delay to a project or the cost of removing and reinstalling installed material. Our liability is limited, at our option, to replacing the goods or refunding the price paid.</p>

<h2>Website content</h2>
<p>All text, images and branding on this site belong to Northern TILE Distributors or our suppliers and may not be reproduced without permission. We may change or withdraw any part of the site at any time.</p>

<h2>Privacy</h2>
<p>Personal information is handled in accordance with our <a href="/privacy-policy">Privacy Policy</a>.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of Victoria, Australia, and the courts of Victoria have jurisdiction.</p>

<h2>Contact</h2>
<p>Northern TILE Distributors, 19/324 Settlement Road, Thomastown VIC 3074<br>Phone (03) 9464 6623 &middot; <a href="mailto:info@ntiled.com.au">info@ntiled.com.au</a></p>
HTML;
    }

    protected function returnPolicy(): string
    {
        return <<<'HTML'
<p>Tiles, stone and flooring are heavy, fragile and batch-made, so returns work a little differently to most retail. Please read this before you order, and please choose carefully.</p>

<h2>Your rights come first</h2>
<p>Our goods come with guarantees that cannot be excluded under the Australian Consumer Law. If a product is faulty, significantly different from what was described, or does not do what we said it would, you are entitled to a repair, replacement or refund &mdash; and to compensation for any other reasonably foreseeable loss. Nothing on this page limits those rights.</p>

<h2>Change of mind</h2>
<p>We are not required to give a refund if you simply change your mind, order too much, or measure incorrectly. As a courtesy we will usually accept a return of stock lines if all of the following apply:</p>
<ul>
<li>It is within <strong>30 days</strong> of collection or delivery.</li>
<li>You have proof of purchase.</li>
<li>Boxes are <strong>unopened, undamaged and in original packaging</strong>, in resaleable condition.</li>
<li>The item is a current stock line, not a special order.</li>
</ul>
<p>A restocking fee of up to 20% may apply, and freight charges are not refundable. Return transport is at your cost and risk unless the return is our error.</p>

<h2>What cannot be returned</h2>
<ul>
<li>Opened, part-used or damaged boxes.</li>
<li>Special-order, indent and custom or cut-to-size items.</li>
<li>Clearance, run-out and discontinued lines.</li>
<li>Adhesives, grouts, silicones, waterproofing and other consumables once opened, or past their shelf life.</li>
<li>Anything that has been laid, cut, sealed or installed.</li>
</ul>

<h2>Damaged or incorrect deliveries</h2>
<p>Check your pallet on arrival. Note any breakage, damage or shortage on the delivery paperwork <strong>before you sign</strong>, then email us photos within <strong>48 hours</strong>. We will replace the material or credit you. Once material has been installed we can no longer claim it against freight, so please check before laying.</p>

<h2>Faulty product</h2>
<p>If you believe a product is faulty, stop laying it immediately and contact us with your order number, photos and the batch number from the box. Continuing to install material you believe is defective may affect the claim.</p>
<p>Where a manufacturing fault is confirmed, we will replace the material or refund it. Our liability is for the supplied material; it does not extend to the cost of removing and reinstalling it, except where the Australian Consumer Law requires otherwise.</p>

<h2>How to start a return</h2>
<ol>
<li>Email <a href="mailto:info@ntiled.com.au">info@ntiled.com.au</a> or call (03) 9464 6623 with your order number and what you want to return.</li>
<li>We will confirm whether it can be accepted and give you a return reference.</li>
<li>Return the goods to 19/324 Settlement Road, Thomastown VIC 3074, or arrange collection with us.</li>
<li>We inspect the goods on arrival.</li>
</ol>
<p>Please do not send anything back before we have confirmed the return.</p>

<h2>Refunds</h2>
<p>Approved refunds are processed to your original payment method within 5&ndash;7 business days of us receiving and inspecting the goods. Your bank may take a few days more to show it.</p>

<h2>Questions</h2>
<p>Call (03) 9464 6623 or email <a href="mailto:info@ntiled.com.au">info@ntiled.com.au</a>.</p>
HTML;
    }

    protected function shipping(): string
    {
        return <<<'HTML'
<p>We deliver across Melbourne and regional Victoria from our Thomastown warehouse, and you are welcome to collect.</p>

<h2>Click &amp; collect</h2>
<p>Collection from 19/324 Settlement Road, Thomastown VIC 3074 is free. We will let you know when your order is picked and ready. Please bring your order number and photo ID.</p>
<ul>
<li>Monday to Friday: 9:00am &ndash; 5:00pm</li>
<li>Saturday: 9:00am &ndash; 1:00pm</li>
<li>Sunday: closed</li>
</ul>

<h2>Delivery</h2>
<table>
<thead><tr><th>Area</th><th>Typical lead time</th><th>Cost</th></tr></thead>
<tbody>
<tr><td>Click &amp; collect &mdash; Thomastown</td><td>Usually same or next business day</td><td>Free</td></tr>
<tr><td>Melbourne metro</td><td>2 &ndash; 5 business days</td><td>Quoted on order</td></tr>
<tr><td>Regional Victoria</td><td>3 &ndash; 7 business days</td><td>Quoted on order</td></tr>
<tr><td>Interstate</td><td>By arrangement</td><td>Quoted on order</td></tr>
</tbody>
</table>
<p>Tiles and stone are heavy, palletised freight, so delivery is quoted per order based on weight, volume and address rather than charged at a flat rate. We will confirm the cost with you before despatch.</p>

<h2>Lead times</h2>
<p>Orders are picked within 1 &ndash; 2 business days where stock is on hand. Lead times above are estimates from despatch, not guarantees, and special-order or indent items take longer &mdash; we will give you an expected date when you order.</p>

<h2>What we need from you</h2>
<ul>
<li><strong>Truck access.</strong> Tell us at the time of ordering if the site cannot take a semi or a rigid truck, or if there are height, width or parking restrictions.</li>
<li><strong>Unloading.</strong> Deliveries are kerbside to the nearest safe point. Our drivers do not carry material into houses, up stairs or onto upper levels. Please have someone on site to receive and check the delivery.</li>
<li><strong>Someone present.</strong> If nobody is there to accept the delivery, a re-delivery fee may apply.</li>
</ul>

<h2>Checking your delivery</h2>
<p>Please inspect the pallet on arrival. Note any damage, breakage or shortage on the delivery paperwork before you sign, and tell us within <strong>48 hours</strong> with photos so we can lodge a freight claim. Claims made after material has been laid cannot be accepted.</p>

<h2>Problems with a delivery</h2>
<p>If a delivery is late, damaged or incomplete, call us on (03) 9464 6623 or email <a href="mailto:info@ntiled.com.au">info@ntiled.com.au</a> with your order number and we will sort it out.</p>
HTML;
    }

    protected function faq(): string
    {
        return <<<'HTML'
<h2>Ordering</h2>

<h3>Do I need an account to order?</h3>
<p>No. You can check out as a guest. An account makes it easier to reorder and to track order history, and it is required if you want trade pricing.</p>

<h3>How much extra should I order?</h3>
<p>Allow at least 10% over your measured area for cuts and breakage. For diagonal, herringbone or other patterned layouts, allow 15&ndash;20%. It is far better to have a spare box than to need a top-up from a different batch later.</p>

<h3>Why do I need to order it all at once?</h3>
<p>Tiles are made in batches, and shade varies between batches. Once a batch sells out we cannot guarantee a match, so order the whole job in one go.</p>

<h3>Can I get a sample first?</h3>
<p>Yes &mdash; contact us and we will arrange one. A sample shows general character only; the material supplied will vary in shade, veining and texture, especially with natural stone.</p>

<h3>Can I change or cancel an order?</h3>
<p>Call us as soon as possible on (03) 9464 6623. If the order has not been picked or despatched we can usually change it. Once freight is booked, cancellation may incur a fee.</p>

<h2>Trade accounts</h2>

<h3>Who can open a trade account?</h3>
<p>Builders, tilers, developers, contractors and interior designers with a registered business. You will need a valid ABN.</p>

<h3>How long does approval take?</h3>
<p>Usually 24&ndash;48 hours. You can shop at normal retail prices straight away &mdash; trade pricing and the trade portal switch on once we approve you.</p>

<h3>What do I get on a trade account?</h3>
<p>Trade pricing on our builder range, project-based pricing rather than per-tile, a private catalogue separate from the retail shop, and order history and reordering in one place.</p>

<h2>Delivery</h2>

<h3>Do you deliver?</h3>
<p>Yes, across Melbourne and regional Victoria, with interstate by arrangement. Freight is quoted per order because tiles and stone travel as palletised freight. See <a href="/shipping">Shipping &amp; Delivery</a>.</p>

<h3>Will the driver carry it inside?</h3>
<p>No. Deliveries are kerbside to the nearest safe point. Please have someone on site to receive and check the pallet.</p>

<h3>Can I collect instead?</h3>
<p>Yes, free of charge from our Thomastown warehouse. We will let you know when your order is ready.</p>

<h2>Returns and problems</h2>

<h3>Can I return tiles I didn't use?</h3>
<p>Unopened, undamaged full boxes of stock lines in resaleable condition can usually be returned within 30 days with proof of purchase, and a restocking fee may apply. Special-order, clearance and cut-to-size items cannot be returned. See our <a href="/returns">Return Policy</a>.</p>

<h3>Some tiles arrived broken. What now?</h3>
<p>Note it on the delivery paperwork before signing, then send us photos within 48 hours and we will replace them or credit you.</p>

<h3>The shade doesn't match my sample.</h3>
<p>Shade variation between a sample and a production batch is normal. Always check the actual tiles for shade and calibre <strong>before</strong> laying them &mdash; once installed, they are taken as accepted.</p>

<h2>Products and payment</h2>

<h3>What do you stock?</h3>
<p>Porcelain and ceramic tiles, hybrid flooring, engineered and solid oak timber, natural stone and pavers, and trade supplies including Mapei, ARDEX, Soudal and Durotech.</p>

<h3>What payment methods do you accept?</h3>
<p>Major credit and debit cards through our secure online checkout. Approved trade accounts may have agreed payment terms.</p>

<h3>Can I visit the showroom?</h3>
<p>Yes. We are at 19/324 Settlement Road, Thomastown VIC 3074, open Mon&ndash;Fri 9:00am&ndash;5:00pm and Sat 9:00am&ndash;1:00pm.</p>

<h2>Still stuck?</h2>
<p>Call (03) 9464 6623, email <a href="mailto:info@ntiled.com.au">info@ntiled.com.au</a>, or use our <a href="/contact">contact form</a>.</p>
HTML;
    }
}
