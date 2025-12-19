import PublicLayout from '@/Layouts/PublicLayout';
import { Head } from '@inertiajs/react';

// Home Section Components
import HeroCarousel from '@/Components/Home/HeroCarousel';
import CategoryCarousel from '@/Components/Home/CategoryCarousel';
import NewArrivals from '@/Components/Home/NewArrivals';
import VideoSection from '@/Components/Home/VideoSection';
import DiscountTileCarousel from '@/Components/Home/DiscountTileCarousel';
import GalleryGrid from '@/Components/Home/GalleryGrid';

export default function Home({
    hero_slider,
    category_carousel,
    new_arrivals,
    video_section,
    discount_tile_carousel,
    gallery,
}) {
    return (
        <PublicLayout>
            <Head title="Home" />

            {/* Hero Slider - Always first, contains the only H1 */}
            <HeroCarousel slides={hero_slider?.slides || []} />

            {/* Content sections with max-width container */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Category Carousel */}
                <CategoryCarousel data={category_carousel} />

                {/* New Arrivals */}
                <NewArrivals data={new_arrivals} />

                {/* Video Section - Lazy loaded */}
                <VideoSection data={video_section} />

                {/* Discount Tile Carousel - Lazy loaded */}
                <DiscountTileCarousel data={discount_tile_carousel} />

                {/* Gallery Grid - Lazy loaded */}
                <GalleryGrid data={gallery} />
            </div>
        </PublicLayout>
    );
}
