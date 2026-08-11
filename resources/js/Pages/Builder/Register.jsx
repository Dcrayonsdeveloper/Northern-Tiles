import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link, useForm } from '@inertiajs/react';

function HardHatIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 17h20v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2Zm2-2v-2a8 8 0 0 1 5-7.42V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.58A8 8 0 0 1 20 13v2H4Z" />
        </svg>
    );
}

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

const BENEFITS = [
    'Trade pricing on our full builder range',
    'Priced per project, not per tile',
    'A private catalogue, separate from the retail shop',
    'Order history and reordering in one place',
];

export default function BuilderRegister({ isLoggedIn = false, currentUser = null }) {
    // Logged-in customers upgrading only need their company; guests fill the
    // whole form. Same endpoint handles both.
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        builder_company: '',
        builder_abn: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('builder.register.store'));
    };

    return (
        <PublicLayout>
            <Head title="Trade Account Application" />

            <div className="bg-slate-900">
                <Container>
                    <div className="py-12 text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-900">
                            <HardHatIcon className="h-3.5 w-3.5" />
                            Trade Portal
                        </span>
                        <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                            Builder &amp; Contractor Accounts
                        </h1>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70">
                            Apply for a trade account to unlock our builder pricing. Applications are
                            reviewed by our team, usually within 24&ndash;48 hours.
                        </p>
                    </div>
                </Container>
            </div>

            <Container className="py-10">
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
                    {/* ── Benefits + sign-in ── */}
                    <div>
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-base font-bold text-slate-900">What you get</h2>
                            <ul className="mt-4 space-y-3">
                                {BENEFITS.map((b) => (
                                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700">
                                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {!isLoggedIn && (
                            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
                                <h2 className="text-base font-bold text-slate-900">Already have an account?</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Sign in and we&rsquo;ll take you straight to the trade portal.
                                </p>
                                <Link
                                    href={route('login')}
                                    className="mt-4 inline-block rounded bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ── Application form ── */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-bold text-slate-900">
                            {isLoggedIn ? 'Apply with your existing account' : 'Apply for a trade account'}
                        </h2>

                        {isLoggedIn && currentUser ? (
                            <p className="mt-1 text-sm text-gray-600">
                                Applying as <span className="font-semibold text-slate-900">{currentUser.email}</span>.
                                We just need your company details.
                            </p>
                        ) : (
                            <p className="mt-1 text-sm text-gray-600">
                                This creates your account. You can shop at normal retail prices straight away
                                &mdash; trade pricing switches on once we approve you.
                            </p>
                        )}

                        <form onSubmit={submit} className="mt-5 space-y-4">
                            {!isLoggedIn && (
                                <div>
                                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Your name *</label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        autoComplete="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                </div>
                            )}

                            <div>
                                <label htmlFor="builder_company" className="mb-1 block text-sm font-medium text-gray-700">Company name *</label>
                                <input
                                    id="builder_company"
                                    type="text"
                                    required
                                    autoComplete="organization"
                                    value={data.builder_company}
                                    onChange={(e) => setData('builder_company', e.target.value)}
                                    placeholder="e.g. Northside Constructions Pty Ltd"
                                    className="w-full rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                                />
                                {errors.builder_company && <p className="mt-1 text-xs text-red-600">{errors.builder_company}</p>}
                            </div>

                            <div>
                                <label htmlFor="builder_abn" className="mb-1 block text-sm font-medium text-gray-700">Company ABN *</label>
                                <input
                                    id="builder_abn"
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    maxLength={14}
                                    value={data.builder_abn}
                                    onChange={(e) => setData('builder_abn', e.target.value)}
                                    placeholder="e.g. 51 824 753 556"
                                    className="w-full rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    11 digits. We verify this before approving trade pricing.
                                </p>
                                {errors.builder_abn && <p className="mt-1 text-xs text-red-600">{errors.builder_abn}</p>}
                            </div>

                            {!isLoggedIn && (
                                <div>
                                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                </div>
                            )}

                            <div>
                                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    autoComplete="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="e.g. 03 9464 6623"
                                    className="w-full rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                                />
                                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                            </div>

                            {!isLoggedIn && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                                        />
                                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="password_confirmation" className="mb-1 block text-sm font-medium text-gray-700">Confirm *</label>
                                        <input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="w-full rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                                        />
                                        {errors.password_confirmation && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-500">All fields are required.</p>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded bg-amber-500 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-400 disabled:opacity-60"
                            >
                                {processing ? 'Submitting…' : 'Submit Application'}
                            </button>

                            <p className="text-center text-xs text-gray-500">
                                Applications are reviewed within 24&ndash;48 hours.
                            </p>
                        </form>
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
