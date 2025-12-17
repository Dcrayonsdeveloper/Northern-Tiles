import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link } from '@inertiajs/react';

// Import E-E-A-T Components
import ProductCard from '@/Components/Catalog/ProductCard';
import ProductGrid from '@/Components/Catalog/ProductGrid';
import FavoriteButton from '@/Components/Catalog/FavoriteButton';
import BlogPostCard from '@/Components/CMS/BlogPostCard';
import AuthorBio from '@/Components/CMS/AuthorBio';
import APlusBlock from '@/Components/CMS/APlusBlock';
import MegaMenu from '@/Components/CMS/MegaMenu';
import HeroCarousel from '@/Components/Home/HeroCarousel';

// Component showcase wrapper with centered label
function ComponentShowcase({ name, children }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-center">
                <span className="inline-block rounded-full bg-brand/10 px-4 py-1 text-sm font-semibold text-brand">
                    {name}
                </span>
            </div>
            <div className="flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}

// Sample data for component demos
const sampleProduct = {
    id: 1,
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    short_description: 'High-quality sound with active noise cancellation and 30-hour battery life.',
    price: 4999,
    compare_at_price: 6999,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
    rating: 4.5,
    review_count: 128,
};

const sampleProducts = [
    { ...sampleProduct, id: 1 },
    { ...sampleProduct, id: 2, name: 'Smart Watch Pro', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop', price: 7999 },
    { ...sampleProduct, id: 3, name: 'Bluetooth Speaker', image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop', price: 2499 },
    { ...sampleProduct, id: 4, name: 'USB-C Hub', image_url: 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop', price: 1999 },
];

const sampleBlogPost = {
    id: 1,
    title: '10 Tips for Better Product Photography',
    slug: '10-tips-better-product-photography',
    excerpt: 'Learn how to capture stunning product images that convert visitors into customers.',
    featured_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
    published_at: '2025-12-15',
    reading_time: 5,
    category: { name: 'Marketing', slug: 'marketing' },
    author: { name: 'John Doe', slug: 'john-doe', avatar_url: 'https://i.pravatar.cc/100?img=1' },
};

const sampleAuthor = {
    id: 1,
    name: 'Dr. Sarah Johnson',
    slug: 'dr-sarah-johnson',
    avatar_url: 'https://i.pravatar.cc/150?img=5',
    title: 'Senior Product Analyst',
    bio: 'Dr. Sarah Johnson has over 15 years of experience in product research and consumer behavior. She holds a PhD in Marketing from Stanford University and has published numerous papers on e-commerce trends.',
    credentials: 'PhD in Marketing, Stanford University',
    expertise_areas: ['E-commerce', 'Consumer Behavior', 'Product Strategy'],
    social_links: {
        twitter: 'https://twitter.com/sarahjohnson',
        linkedin: 'https://linkedin.com/in/sarahjohnson',
    },
    is_verified: true,
    posts_count: 47,
};

const sampleAPlusContent = {
    layout: 'image-left',
    image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop',
    title: 'Crafted with Excellence',
    content: 'Our products are designed with meticulous attention to detail, using only the finest materials sourced from trusted suppliers worldwide. Each item undergoes rigorous quality testing to ensure it meets our exacting standards.',
    features: [
        'Premium quality materials',
        'Handcrafted by artisans',
        '2-year warranty included',
    ],
};

const sampleMenuItems = [
    {
        id: 1,
        label: 'Products',
        url: '/shop',
        children: [
            { id: 11, label: 'Electronics', url: '/shop/electronics' },
            { id: 12, label: 'Accessories', url: '/shop/accessories' },
            { id: 13, label: 'Home & Living', url: '/shop/home-living' },
        ],
    },
    {
        id: 2,
        label: 'Blog',
        url: '/blog',
        children: [
            { id: 21, label: 'Latest Posts', url: '/blog' },
            { id: 22, label: 'Guides', url: '/blog/category/guides' },
        ],
    },
    { id: 3, label: 'About', url: '/about' },
    { id: 4, label: 'Contact', url: '/contact' },
];

export default function Home({ featuredProducts, heroSlides = [] }) {
    return (
        <PublicLayout>
            <Head title="Home" />

            {/* Hero Carousel */}
            {heroSlides.length > 0 ? (
                <HeroCarousel slides={heroSlides} />
            ) : (
                /* Fallback Hero Section when no slides configured */
                <div className="rounded-2xl bg-white p-8 shadow-sm">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            E-E-A-T Component Showcase
                        </h1>
                        <p className="mt-3 text-gray-600">
                            Experience, Expertise, Authoritativeness, and Trustworthiness -
                            showcasing our component library designed for SEO-optimized e-commerce
                            and content-rich websites.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <Link
                                href={route('shop.index')}
                                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
                            >
                                Shop Now
                            </Link>
                            <Link
                                href={route('pages.about')}
                                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Component Showcase Grid */}
            <div className="mt-10">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
                    Component Library
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* 1. ProductCard Component */}
                    <ComponentShowcase name="ProductCard">
                        <div className="w-full max-w-xs">
                            <ProductCard product={sampleProduct} />
                        </div>
                    </ComponentShowcase>

                    {/* 2. FavoriteButton Component */}
                    <ComponentShowcase name="FavoriteButton">
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <FavoriteButton productId={1} isFavorite={false} />
                                <p className="mt-2 text-xs text-gray-500">Default</p>
                            </div>
                            <div className="text-center">
                                <FavoriteButton productId={2} isFavorite={true} />
                                <p className="mt-2 text-xs text-gray-500">Favorited</p>
                            </div>
                        </div>
                    </ComponentShowcase>

                    {/* 3. BlogPostCard Component */}
                    <ComponentShowcase name="BlogPostCard">
                        <div className="w-full max-w-sm">
                            <BlogPostCard post={sampleBlogPost} />
                        </div>
                    </ComponentShowcase>

                    {/* 4. AuthorBio Component (E-E-A-T) */}
                    <ComponentShowcase name="AuthorBio (E-E-A-T)">
                        <div className="w-full">
                            <AuthorBio author={sampleAuthor} />
                        </div>
                    </ComponentShowcase>

                    {/* 5. APlusBlock Component */}
                    <div className="md:col-span-2">
                        <ComponentShowcase name="APlusBlock (A+ Content)">
                            <div className="w-full">
                                <APlusBlock block={sampleAPlusContent} />
                            </div>
                        </ComponentShowcase>
                    </div>

                    {/* 6. ProductGrid Component */}
                    <div className="md:col-span-2">
                        <ComponentShowcase name="ProductGrid">
                            <div className="w-full">
                                <ProductGrid products={sampleProducts} columns={4} />
                            </div>
                        </ComponentShowcase>
                    </div>

                    {/* 7. MegaMenu Component */}
                    <div className="md:col-span-2">
                        <ComponentShowcase name="MegaMenu">
                            <div className="w-full">
                                <MegaMenu items={sampleMenuItems} />
                            </div>
                        </ComponentShowcase>
                    </div>
                </div>
            </div>

            {/* Featured Products Section */}
            {featuredProducts && featuredProducts.length > 0 && (
                <div className="mt-10">
                    <div className="flex items-end justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Featured Products
                        </h2>
                        <Link
                            href={route('shop.index')}
                            className="text-sm font-medium text-brand hover:text-brand/80"
                        >
                            View all
                        </Link>
                    </div>

                    <div className="mt-4">
                        <ProductGrid products={featuredProducts} columns={4} />
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
