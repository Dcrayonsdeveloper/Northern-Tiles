import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import ProductImage from '@/Components/Catalog/ProductImage';

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
    const [roomImage, setRoomImage] = useState(null);
    const [tileImage, setTileImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load room image
    useEffect(() => {
        setIsLoading(true);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setRoomImage(img);
            setIsLoading(false);
        };
        img.onerror = () => setIsLoading(false);
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

    // Render canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !roomImage) return;

        const ctx = canvas.getContext('2d');
        const imgWidth = roomImage.naturalWidth;
        const imgHeight = roomImage.naturalHeight;
        
        // Set canvas size to match image
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        // Clear canvas
        ctx.clearRect(0, 0, imgWidth, imgHeight);

        // Calculate floor bounds in pixels
        const bounds = room.floorBounds;
        const floorX = (bounds.x / 100) * imgWidth;
        const floorY = (bounds.y / 100) * imgHeight;
        const floorW = (bounds.width / 100) * imgWidth;
        const floorH = (bounds.height / 100) * imgHeight;

        // Draw tile pattern on floor area first
        if (tileImage && selectedTile) {
            // Calculate tile size - base ~100px scaled
            const baseTileSize = 100 * tileScale;
            const grout = groutWidth;

            // Save context and clip to floor area
            ctx.save();
            ctx.beginPath();
            ctx.rect(floorX, floorY, floorW, floorH);
            ctx.clip();

            // Draw grout background
            ctx.fillStyle = groutColor;
            ctx.fillRect(floorX, floorY, floorW, floorH);

            // Draw tiles in a grid pattern
            for (let y = floorY; y < floorY + floorH + baseTileSize; y += baseTileSize + grout) {
                for (let x = floorX; x < floorX + floorW + baseTileSize; x += baseTileSize + grout) {
                    ctx.drawImage(tileImage, x, y, baseTileSize, baseTileSize);
                }
            }

            ctx.restore();
        }

        // Draw the room image on top
        // The room image has transparent/semi-transparent floor that lets tiles show through
        ctx.drawImage(roomImage, 0, 0, imgWidth, imgHeight);

    }, [roomImage, tileImage, selectedTile, tileScale, groutColor, groutWidth, room]);

    return (
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg bg-gray-100 shadow-lg">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ display: isLoading ? 'none' : 'block' }}
            />
            {!selectedTile && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="rounded-lg bg-white/95 px-6 py-4 text-center shadow-lg">
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
export default function Visualizer({ rooms, products, categories }) {
    const [selectedRoom, setSelectedRoom] = useState(rooms[0] || null);
    const [selectedRoomImage, setSelectedRoomImage] = useState(null);
    const [selectedTile, setSelectedTile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [tileScale, setTileScale] = useState(1);
    const [groutColor, setGroutColor] = useState('#d4d4d4');
    const [groutWidth, setGroutWidth] = useState(2);

    // Initialize selected room image when room changes
    useEffect(() => {
        if (selectedRoom?.images?.length > 0) {
            setSelectedRoomImage(selectedRoom.images[0]);
        } else {
            setSelectedRoomImage(null);
        }
    }, [selectedRoom]);

    // Build room object for renderer using selected image
    const currentRoomData = selectedRoomImage ? {
        ...selectedRoom,
        image: selectedRoomImage.image_url,
        floorBounds: selectedRoomImage.floor_bounds || selectedRoom.floorBounds,
    } : selectedRoom;

    // Get products for the selected room only (products assigned to this room)
    const roomProducts = selectedRoom?.featuredProductIds?.length > 0
        ? products.filter(p => selectedRoom.featuredProductIds.includes(p.id))
        : [];

    // Filter by search within room products
    const filteredProducts = roomProducts.filter(product => {
        const matchesSearch = !searchQuery || 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Reset selected tile when room changes
    const handleRoomChange = (room) => {
        setSelectedRoom(room);
        setSelectedTile(null);
        setSearchQuery('');
    };

    // Download visualization
    const handleDownload = useCallback(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `${selectedRoom.name.toLowerCase().replace(/\s+/g, '-')}-tile-preview.png`;
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
                        <div className="flex-1 lg:w-2/3">
                            {/* Room Selector */}
                            <div className="mb-4 flex flex-wrap gap-2">
                                {rooms.map(room => (
                                    <button
                                        key={room.id}
                                        type="button"
                                        onClick={() => handleRoomChange(room)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                            selectedRoom?.id === room.id
                                                ? 'bg-brand text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {room.name}
                                    </button>
                                ))}
                            </div>

                            {/* Room Image Selector (when room has multiple images) */}
                            {selectedRoom?.images?.length > 1 && (
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Select View:</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {selectedRoom.images.map((img, index) => (
                                            <button
                                                key={img.id}
                                                type="button"
                                                onClick={() => setSelectedRoomImage(img)}
                                                className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                                                    selectedRoomImage?.id === img.id
                                                        ? 'border-brand ring-2 ring-brand ring-offset-1'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <img
                                                    src={img.image_url}
                                                    alt={`${selectedRoom.name} view ${index + 1}`}
                                                    className="h-14 w-20 object-cover"
                                                />
                                                {selectedRoomImage?.id === img.id && (
                                                    <div className="absolute inset-0 bg-brand/10" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Room Scene */}
                            <RoomSceneRenderer
                                room={currentRoomData}
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
                                        max="8"
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
                                    disabled={!selectedTile}
                                    className="ml-auto flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="w-full lg:w-80">
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
                                            <p className="mt-2 text-sm text-gray-500">
                                                {roomProducts.length === 0 
                                                    ? 'No tiles assigned to this room' 
                                                    : 'No tiles found'}
                                            </p>
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
