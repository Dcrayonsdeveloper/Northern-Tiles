import Container from '@/Components/Container';

/**
 * Our Services — the row of five icon cards.
 *
 * The home page shows it straight under the hero; the product page shows it
 * above Frequently Bought Together. Hybrid flooring carries a 20 year warranty
 * rather than a lifetime one, so the quality card's title is a prop, and each
 * page passes its own section spacing through className.
 */
export default function OurServices({ qualityTitle = 'Lifetime Quality Guarantee', className = 'pt-10 sm:pt-16 pb-8 bg-white' }) {
    const services = [
        {
            title: 'Expert Advice',
            desc: 'Professional guidance from our experienced team on product selection and installation.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Chat bubble */}
                    <rect x="4" y="6" width="30" height="22" rx="4" stroke="currentColor" strokeWidth="2.2" className="transition-all duration-500 group-hover:stroke-[2.8]" />
                    <path d="M12 34v6l8-6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                    {/* Lightbulb inside */}
                    <circle cx="19" cy="15" r="5" stroke="currentColor" strokeWidth="2" className="origin-center transition-transform duration-500 group-hover:scale-110" />
                    <path d="M17 20v2h4v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M19 10v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <path d="M14.5 11.5l-.7-.7M23.5 11.5l.7-.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {/* Sparkle */}
                    <circle cx="38" cy="10" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                    <circle cx="42" cy="18" r="1" fill="currentColor" className="opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '200ms' }} />
                </svg>
            ),
        },
        {
            title: 'Wholesale Pricing',
            desc: 'Trade prices for builders, contractors, and renovation professionals.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Tag shape */}
                    <path d="M6 8h18l16 16-18 18L6 26V8z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="transition-transform duration-500 origin-center group-hover:rotate-[-8deg]" />
                    <circle cx="16" cy="18" r="3" stroke="currentColor" strokeWidth="2" className="transition-all duration-500 group-hover:fill-current group-hover:opacity-30" />
                    {/* Percent sign */}
                    <circle cx="24" cy="22" r="2" stroke="currentColor" strokeWidth="1.8" className="group-hover:animate-pulse" />
                    <circle cx="30" cy="28" r="2" stroke="currentColor" strokeWidth="1.8" className="group-hover:animate-pulse" style={{ animationDelay: '150ms' }} />
                    <path d="M32 20l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    {/* Down arrow */}
                    <path d="M42 6v10m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all duration-500" />
                </svg>
            ),
        },
        {
            title: qualityTitle,
            desc: 'All products meet Australian standards with our quality promise.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Shield */}
                    <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="transition-transform duration-500 origin-bottom group-hover:scale-[1.04]" />
                    {/* Checkmark — animated stroke */}
                    <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="30" strokeDashoffset="30"
                        className="transition-all duration-700 group-hover:[stroke-dashoffset:0]"
                    />
                    {/* Shine effect */}
                    <path d="M36 8l2-2m2 6h2m-4 6l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                </svg>
            ),
        },
        {
            title: 'Fast Delivery',
            desc: 'Reliable delivery service across Melbourne and regional Victoria.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Box */}
                    <path d="M6 18l18-10 18 10v16L24 44 6 34V18z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="transition-transform duration-500 origin-center group-hover:-translate-y-1" />
                    <path d="M6 18l18 10 18-10M24 28v16" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                    {/* Clock */}
                    <circle cx="38" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="white" className="transition-transform duration-500 origin-center group-hover:scale-110" />
                    <path d="M38 6v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="origin-[38px_10px] group-hover:animate-[ticktock_1s_ease-in-out_infinite]" />
                    {/* Motion lines */}
                    <path d="M2 22h3M1 28h4M2 34h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="opacity-0 group-hover:opacity-50 transition-all duration-400 group-hover:-translate-x-1" />
                </svg>
            ),
        },
        {
            title: 'Price Beat Guarantee',
            desc: 'Found a lower price? We\'ll beat it. Best value on tiles and flooring guaranteed.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Trophy / cup */}
                    <path d="M14 8h20v14c0 6-4 10-10 10s-10-4-10-10V8z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="transition-transform duration-500 origin-bottom group-hover:scale-[1.04]" />
                    {/* Handles */}
                    <path d="M14 12H8c0 6 3 8 6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M34 12h6c0 6-3 8-6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Base */}
                    <path d="M20 32v4h8v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 36h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    {/* Dollar sign */}
                    <path d="M24 14v12M20 18c0-2 2-3 4-3s4 1 4 3-2 2.5-4 3-4 1-4 3 2 3 4 3 4-1 4-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="transition-all duration-500 group-hover:stroke-[2.5]" />
                    {/* Sparkles */}
                    <circle cx="8" cy="6" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                    <circle cx="40" cy="4" r="1" fill="currentColor" className="opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '200ms' }} />
                </svg>
            ),
        },
    ];

    return (
        <section className={className}>
            {/* Inline keyframes for clock animation */}
            <style>{`@keyframes ticktock{0%,100%{transform:rotate(0deg)}50%{transform:rotate(20deg)}}`}</style>
            <Container>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
                    {services.map((s, i) => (
                        <div key={i} className="text-center group cursor-default">
                            <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-brand/5 text-brand transition-all duration-500 group-hover:bg-brand group-hover:text-white group-hover:shadow-xl group-hover:shadow-brand/20 group-hover:-translate-y-2 group-hover:rotate-[-3deg]">
                                {s.icon}
                            </div>
                            <h3 className="mt-5 text-[15px] font-semibold text-[#222]">{s.title}</h3>
                            <p className="mt-2 text-[13px] leading-[1.7] text-[#555] max-w-[240px] mx-auto">{s.desc}</p>
                            <div className="mx-auto mt-4 h-[2px] w-0 bg-brand transition-all duration-500 group-hover:w-10" />
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
