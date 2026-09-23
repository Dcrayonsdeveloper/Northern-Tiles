import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import ProductImage from '@/Components/Catalog/ProductImage';

/* ═══════════════════════════════════════════════════════════════════════
   ROOM SCENES DATA
   ═══════════════════════════════════════════════════════════════════════ */
const ROOM_SCENES = [
    {
        id: 'living-room',
        name: 'Living Room',
        image: '/images/visualizer/living-room.svg',
        floorBounds: { x: 0, y: 360, width: 800, height: 240 },
    },
    {
        id: 'bathroom',
        name: 'Bathroom',
        image: '/images/visualizer/bathroom.svg',
        floorBounds: { x: 0, y: 350, width: 800, height: 250 },
    },
    {
        id: 'kitchen',
        name: 'Kitchen',
        image: '/images/visualizer/kitchen.svg',
        floorBounds: { x: 0, y: 380, width: 800, height: 220 },
    },
    {
        id: 'bedroom',
        name: 'Bedroom',
        image: '/images/visualizer/bedroom.svg',
        floorBounds: { x: 0, y: 380, width: 800, height: 220 },
    },
    {
        id: 'entryway',
        name: 'Entryway',
        image: '/images/visualizer/entryway.svg',
        floorBounds: { x: 50, y: 400, width: 700, height: 200, perspective: true },
    },
    {
        id: 'outdoor',
        name: 'Outdoor Patio',
        image: '/images/visualizer/outdoor.svg',
        floorBounds: { x: 0, y: 300, width: 800, height: 300 },
    },
];

/* ═══════════════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════════════ */
const SearchIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const GridIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const DownloadIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ZoomInIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
);

const ZoomOutIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
    </svg>
);

/* ═══════════════════════════════════════════════════════════════════════
   TILE CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
function TileCard({ product, isSelected, onSelect }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(product)}
            className={`group relative w-full overflow-hidden rounded-lg border-2 transition-all ${
                isSelected
                    ? 'border-brand ring-2 ring-brand ring-offset-2'
                    : 'border-gray-200 hover:border-gray-300'
            }`}
        >
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
                <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
            </div>
            <div className="bg-white p-2">
                <p className="truncate text-xs font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">${parseFloat(product.price || 0).toFixed(2)}</p>
            </div>
            {isSelected && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </button>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROOM SCENE RENDERER WITH TILE PATTERN
   ═══════════════════════════════════════════════════════════════════════ */
function RoomSceneRenderer({ room, selectedTile, tileScale, groutColor, groutWidth }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [roomSvg, setRoomSvg] = useState(null);
    const [tileImage, setTileImage] = useState(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

    // Load room SVG
    useEffect(() => {
        const img = new Image();
        img.onload = () => setRoomSvg(img);
        img.src = room.image;
    }, [room.image]);

    // Load tile image
    useEffect(() => {
        if (!selectedTile?.image_url) {
            setTileImage(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => setTileImage(img);
        img.onerror = () => setTileImage(null);
        img.src = selectedTile.image_url;
    }, [selectedTile?.image_url]);

    // Resize handler
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.width * 0.75 });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Render canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !roomSvg) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = containerSize;
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Calculate scale for SVG (original is 800x600)
        const scaleX = width / 800;
        const scaleY = height / 600;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw tile pattern on floor area first
        if (tileImage && selectedTile) {
            const bounds = room.floorBounds;
            
            // Scale bounds to current canvas size
            const scaledBounds = {
                x: bounds.x * scaleX,
                y: bounds.y * scaleY,
                width: bounds.width * scaleX,
                height: bounds.height * scaleY,
            };

            // Calculate tile size with scale factor
            // Base tile size is ~80px, scaled by user preference
            const baseTileSize = 80 * tileScale;
            const tileW = baseTileSize * scaleX;
            const tileH = baseTileSize * scaleY;
            const grout = groutWidth * scaleX;

            // Save context and clip to floor area
            ctx.save();
            ctx.beginPath();
            
            if (bounds.perspective) {
                // Perspective floor (like entryway)
                const topLeft = { x: bounds.x * scaleX, y: bounds.y * scaleY };
                const topRight = { x: (bounds.x + bounds.width) * scaleX, y: bounds.y * scaleY };
                const bottomRight = { x: 750 * scaleX, y: 600 * scaleY };
                const bottomLeft = { x: 50 * scaleX, y: 600 * scaleY };
                
                ctx.moveTo(topLeft.x, topLeft.y);
                ctx.lineTo(topRight.x, topRight.y);
                ctx.lineTo(bottomRight.x, bottomRight.y);
                ctx.lineTo(bottomLeft.x, bottomLeft.y);
            } else {
                ctx.rect(scaledBounds.x, scaledBounds.y, scaledBounds.width, scaledBounds.height);
            }
            ctx.clip();

            // Draw grout background
            ctx.fillStyle = groutColor;
            ctx.fillRect(scaledBounds.x, scaledBounds.y, scaledBounds.width, scaledBounds.height);

            // Draw tiles in a grid pattern
            const startX = scaledBounds.x;
            const startY = scaledBounds.y;
            const endX = scaledBounds.x + scaledBounds.width;
            const endY = scaledBounds.y + scaledBounds.height;

            for (let y = startY; y < endY; y += tileH + grout) {
                for (let x = startX; x < endX; x += tileW + grout) {
                    ctx.drawImage(tileImage, x, y, tileW, tileH);
                }
            }

            ctx.restore();
        }

        // Draw the room SVG on top (furniture covers the floor tiles)
        ctx.drawImage(roomSvg, 0, 0, width, height);

    }, [roomSvg, tileImage, selectedTile, tileScale, groutColor, groutWidth, containerSize, room]);

    return (
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg bg-gray-100 shadow-lg">
            <canvas
                ref={canvasRef}
                className="w-full"
                style={{ aspectRatio: '4/3' }}
            />
            {!selectedTile && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="rounded-lg bg-white/90 px-6 py-4 text-center shadow-lg">
                        <GridIcon className="mx-auto h-12 w-12 text-brand/50" />
                        <p className="mt-2 text-sm font-medium text-gray-700">Select a tile to preview</p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN VISUALIZER PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function Visualizer({ products, categories }) {
    const [selectedRoom, setSelectedRoom] = useState(ROOM_SCENES[0]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [tileScale, setTileScale] = useState(1);
    const [groutColor, setGroutColor] = useState('#d4d4d4');
    const [groutWidth, setGroutWidth] = useState(2);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = !searchQuery || 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || 
            product.category?.slug === selectedCategory ||
            product.category_id === parseInt(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    // Download visualization
    const handleDownload = useCallback(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `${selectedRoom.name.toLowerCase().replace(/\s+/g, '-')}-visualization.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, [selectedRoom]);

    return (
        <PublicLayout>
            <Head title="Tile Visualizer - See Tiles in Your Space" />
            
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-[#f7f7f5] to-white py-8">
                <Container>
                    <div className="text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[3px] text-brand">Interactive Experience</p>
                        <h1 className="mt-2 text-[28px] font-light text-[#222] sm:text-[36px]">
                            Tile <span className="font-semibold">Visualizer</span>
                        </h1>
                        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
                            See how our tiles look in real room settings. Select a room, choose your tile, and customize the layout.
                        </p>
                    </div>
                </Container>
            </section>

            {/* Main Visualizer */}
            <section className="pb-16">
                <Container>
                    <div className="flex flex-col gap-6 lg:flex-row">
                        
                        {/* Left Side - Room Preview */}
                        <div className={`flex-1 transition-all ${sidebarOpen ? 'lg:w-2/3' : 'lg:w-full'}`}>
                            {/* Room Selector */}
                            <div className="mb-4 flex flex-wrap gap-2">
                                {ROOM_SCENES.map(room => (
                                    <button
                                        key={room.id}
                                        type="button"
                                        onClick={() => setSelectedRoom(room)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                            selectedRoom.id === room.id
                                                ? 'bg-brand text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {room.name}
                                    </button>
                                ))}
                            </div>

                            {/* Room Scene */}
                            <RoomSceneRenderer
                                room={selectedRoom}
                                selectedTile={selectedTile}
                                tileScale={tileScale}
                                groutColor={groutColor}
                                groutWidth={groutWidth}
                            />

                            {/* Controls */}
                            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 p-4">
                                {/* Tile Scale */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600">Tile Size:</span>
                                    <button
                                        type="button"
                                        onClick={() => setTileScale(s => Math.max(0.5, s - 0.25))}
                                        className="rounded p-1 hover:bg-gray-200"
                                    >
                                        <ZoomOutIcon className="h-5 w-5 text-gray-600" />
                                    </button>
                                    <span className="w-12 text-center text-sm">{Math.round(tileScale * 100)}%</span>
                                    <button
                                        type="button"
                                        onClick={() => setTileScale(s => Math.min(2, s + 0.25))}
                                        className="rounded p-1 hover:bg-gray-200"
                                    >
                                        <ZoomInIcon className="h-5 w-5 text-gray-600" />
                                    </button>
                                </div>

                                {/* Grout Color */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600">Grout:</span>
                                    <div className="flex gap-1">
                                        {['#ffffff', '#d4d4d4', '#9ca3af', '#525252', '#1f2937'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setGroutColor(color)}
                                                className={`h-6 w-6 rounded-full border-2 transition-all ${
                                                    groutColor === color ? 'border-brand scale-110' : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Grout color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Grout Width */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600">Grout Width:</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="6"
                                        value={groutWidth}
                                        onChange={(e) => setGroutWidth(Number(e.target.value))}
                                        className="h-2 w-20 cursor-pointer appearance-none rounded-lg bg-gray-200"
                                    />
                                    <span className="text-xs text-gray-500">{groutWidth}px</span>
                                </div>

                                {/* Download Button */}
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="ml-auto flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
                                >
                                    <DownloadIcon className="h-4 w-4" />
                                    Save Image
                                </button>
                            </div>

                            {/* Selected Tile Info */}
                            {selectedTile && (
                                <div className="mt-4 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                        <ProductImage
                                            src={selectedTile.image_url}
                                            alt={selectedTile.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{selectedTile.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            ${parseFloat(selectedTile.price || 0).toFixed(2)}
                                            {selectedTile.unit_label && ` / ${selectedTile.unit_label}`}
                                        </p>
                                    </div>
                                    <Link
                                        href={route('products.show', selectedTile.slug)}
                                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                                    >
                                        View Product
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Right Side - Tile Picker */}
                        <div className={`w-full lg:w-80 ${sidebarOpen ? '' : 'hidden lg:block'}`}>
                            <div className="sticky top-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                                {/* Header */}
                                <div className="border-b border-gray-200 p-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Select a Tile</h2>
                                    
                                    {/* Search */}
                                    <div className="relative mt-3">
                                        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search tiles..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                                        />
                                    </div>

                                    {/* Category Filter */}
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tile Grid */}
                                <div className="max-h-[60vh] overflow-y-auto p-4">
                                    {filteredProducts.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {filteredProducts.map(product => (
                                                <TileCard
                                                    key={product.id}
                                                    product={product}
                                                    isSelected={selectedTile?.id === product.id}
                                                    onSelect={setSelectedTile}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <GridIcon className="mx-auto h-12 w-12 text-gray-300" />
                                            <p className="mt-2 text-sm text-gray-500">No tiles found</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 p-4">
                                    <p className="text-center text-xs text-gray-500">
                                        Showing {filteredProducts.length} tiles
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* CTA Section */}
            <section className="bg-[#f7f7f5] py-12">
                <Container>
                    <div className="text-center">
                        <h2 className="text-2xl font-light text-[#222]">
                            Need Help <span className="font-semibold">Choosing?</span>
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600">
                            Our team of experts can help you find the perfect tiles for your project. Visit our showroom or get in touch.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-4">
                            <Link
                                href="/contact"
                                className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                            >
                                Contact Us
                            </Link>
                            <Link
                                href="/shop"
                                className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Browse All Tiles
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
