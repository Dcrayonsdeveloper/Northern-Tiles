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

            {/* Each section manages its own container */}
            <CategoryCarousel data={category_carousel} />
            <NewArrivals data={new_arrivals} />
            <VideoSection data={video_section} />
            <DiscountTileCarousel data={discount_tile_carousel} />
            <GalleryGrid data={gallery} />
        </PublicLayout>
    );
}
