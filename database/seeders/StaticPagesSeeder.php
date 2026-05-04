<?php

namespace Database\Seeders;

use App\Domain\CMS\Models\Page;
use Illuminate\Database\Seeder;

class StaticPagesSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'meta_title' => 'Privacy Policy - Northern TILE Distributors',
                'meta_description' => 'Learn how Northern TILE Distributors collects, uses, and protects your personal information.',
                'body_json' => $this->getPrivacyPolicyContent(),
                'template' => 'default',
                'status' => Page::STATUS_PUBLISHED,
                'published_at' => now(),
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms-of-service',
                'meta_title' => 'Terms of Service - Northern TILE Distributors',
                'meta_description' => 'Read the terms and conditions for using Northern TILE Distributors services and products.',
                'body_json' => $this->getTermsOfServiceContent(),
                'template' => 'default',
                'status' => Page::STATUS_PUBLISHED,
                'published_at' => now(),
            ],
            [
                'title' => 'Return Policy',
                'slug' => 'return-policy',
                'meta_title' => 'Return Policy - Northern TILE Distributors',
                'meta_description' => 'Learn about our hassle-free return and refund policy.',
                'body_json' => $this->getReturnPolicyContent(),
                'template' => 'default',
                'status' => Page::STATUS_PUBLISHED,
                'published_at' => now(),
            ],
            [
                'title' => 'Shipping Information',
                'slug' => 'shipping',
                'meta_title' => 'Shipping Information - Northern TILE Distributors',
                'meta_description' => 'Everything you need to know about shipping, delivery times, and tracking.',
                'body_json' => $this->getShippingContent(),
                'template' => 'default',
                'status' => Page::STATUS_PUBLISHED,
                'published_at' => now(),
            ],
            [
                'title' => 'Frequently Asked Questions',
                'slug' => 'faq',
                'meta_title' => 'FAQ - Northern TILE Distributors',
                'meta_description' => 'Find answers to common questions about Northern TILE Distributors products and services.',
                'body_json' => $this->getFaqContent(),
                'template' => 'default',
                'status' => Page::STATUS_PUBLISHED,
                'published_at' => now(),
            ],
        ];

        foreach ($pages as $pageData) {
            Page::updateOrCreate(
                ['slug' => $pageData['slug']],
                $pageData
            );
        }

        $this->command->info('Static pages seeded successfully!');
    }

    protected function getPrivacyPolicyContent(): array
    {
        return [
            'sections' => [
                [
                    'type' => 'rich_text',
                    'content' => '<h2>Privacy Policy</h2>
<p>Last updated: ' . now()->format('F d, Y') . '</p>

<h3>Information We Collect</h3>
<p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>

<h3>How We Use Your Information</h3>
<p>We use the information we collect to:</p>
<ul>
<li>Process and fulfill your orders</li>
<li>Send you order confirmations and shipping updates</li>
<li>Respond to your comments and questions</li>
<li>Improve our products and services</li>
</ul>

<h3>Information Sharing</h3>
<p>We do not sell, trade, or rent your personal information to third parties. We may share your information with service providers who assist us in operating our website and conducting our business.</p>

<h3>Data Security</h3>
<p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h3>Contact Us</h3>
<p>If you have any questions about this Privacy Policy, please contact us through our contact page.</p>',
                ],
            ],
        ];
    }

    protected function getTermsOfServiceContent(): array
    {
        return [
            'sections' => [
                [
                    'type' => 'rich_text',
                    'content' => '<h2>Terms of Service</h2>
<p>Last updated: ' . now()->format('F d, Y') . '</p>

<h3>Acceptance of Terms</h3>
<p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h3>Products and Services</h3>
<p>All products displayed on our website are subject to availability. We reserve the right to discontinue any product at any time.</p>

<h3>Pricing</h3>
<p>All prices are subject to change without notice. We make every effort to ensure accuracy but errors may occur.</p>

<h3>Payment</h3>
<p>Payment must be received before order processing. We accept major credit cards and other payment methods as displayed at checkout.</p>

<h3>Limitation of Liability</h3>
<p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.</p>

<h3>Changes to Terms</h3>
<p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.</p>',
                ],
            ],
        ];
    }

    protected function getReturnPolicyContent(): array
    {
        return [
            'sections' => [
                [
                    'type' => 'rich_text',
                    'content' => '<h2>Return Policy</h2>
<p>We want you to be completely satisfied with your purchase.</p>

<h3>Return Window</h3>
<p>You may return most items within 30 days of delivery for a full refund. Items must be unused and in their original packaging.</p>

<h3>Non-Returnable Items</h3>
<p>The following items cannot be returned:</p>
<ul>
<li>Personalized or customized products</li>
<li>Items marked as final sale</li>
<li>Products that have been used or damaged by the customer</li>
</ul>

<h3>How to Return</h3>
<ol>
<li>Contact our customer service team to initiate a return</li>
<li>Pack the item securely in its original packaging</li>
<li>Ship the item back using the provided return label</li>
</ol>

<h3>Refund Processing</h3>
<p>Once we receive your return, we will inspect the item and process your refund within 5-7 business days. Refunds will be credited to your original payment method.</p>

<h3>Exchanges</h3>
<p>If you need a different size or color, please return the original item and place a new order.</p>',
                ],
            ],
        ];
    }

    protected function getShippingContent(): array
    {
        return [
            'sections' => [
                [
                    'type' => 'rich_text',
                    'content' => '<h2>Shipping Information</h2>

<h3>Processing Time</h3>
<p>Orders are typically processed within 1-2 business days. You will receive a confirmation email with tracking information once your order ships.</p>

<h3>Shipping Options</h3>
<table>
<tr><th>Method</th><th>Delivery Time</th><th>Cost</th></tr>
<tr><td>Standard Shipping</td><td>5-7 business days</td><td>Free over $50</td></tr>
<tr><td>Express Shipping</td><td>2-3 business days</td><td>$12.99</td></tr>
<tr><td>Next Day Delivery</td><td>1 business day</td><td>$24.99</td></tr>
</table>

<h3>Order Tracking</h3>
<p>Once your order ships, you will receive an email with tracking information. You can also track your order through your account dashboard.</p>

<h3>International Shipping</h3>
<p>We currently ship to select international destinations. International shipping rates and delivery times vary by location.</p>

<h3>Delivery Issues</h3>
<p>If your package is lost, damaged, or delayed, please contact our customer service team for assistance.</p>',
                ],
            ],
        ];
    }

    protected function getFaqContent(): array
    {
        return [
            'sections' => [
                [
                    'type' => 'rich_text',
                    'content' => '<h2>Frequently Asked Questions</h2>

<h3>Orders & Payment</h3>

<h4>What payment methods do you accept?</h4>
<p>We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and other digital payment methods.</p>

<h4>Can I modify or cancel my order?</h4>
<p>Orders can be modified or cancelled within 1 hour of placement. After that, please contact customer service as orders may have already been processed.</p>

<h3>Shipping</h3>

<h4>How long does shipping take?</h4>
<p>Standard shipping takes 5-7 business days. Express options are available for faster delivery.</p>

<h4>Do you ship internationally?</h4>
<p>Yes, we ship to select international destinations. Shipping rates and times vary by location.</p>

<h3>Returns & Refunds</h3>

<h4>What is your return policy?</h4>
<p>We accept returns within 30 days of delivery for unused items in original packaging.</p>

<h4>How long does it take to receive my refund?</h4>
<p>Refunds are processed within 5-7 business days after we receive your return.</p>

<h3>Products</h3>

<h4>Are your products BPA-free?</h4>
<p>Yes, all our drinkware products are BPA-free and made with food-grade materials.</p>

<h4>Do you offer warranties?</h4>
<p>Yes, most of our products come with a 1-year warranty against manufacturing defects.</p>

<h3>Contact</h3>
<p>Still have questions? <a href="/contact">Contact us</a> and we\'ll be happy to help!</p>',
                ],
            ],
        ];
    }
}
