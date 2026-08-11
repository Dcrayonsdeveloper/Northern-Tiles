import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import Modal from '@/Components/Modal';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

function ClockIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function CheckCircle({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

export default function BuilderPending({ company, email }) {
    // Opens on arrival — this is the confirmation the applicant is told to
    // expect. Dismissible, and the same message stays on the page behind it
    // so it is not lost once closed.
    const [showModal, setShowModal] = useState(true);

    return (
        <PublicLayout>
            <Head title="Application Received" />

            <Container className="py-16">
                <div className="mx-auto max-w-xl text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                        <ClockIcon className="h-8 w-8 text-amber-600" />
                    </div>

                    <h1 className="mt-6 text-2xl font-bold text-slate-900">
                        Your trade account is being reviewed
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        Thanks{company ? <> , <span className="font-semibold text-slate-900">{company}</span></> : null}.
                        Our team verifies every trade application by hand, and it usually takes{' '}
                        <span className="font-semibold text-slate-900">24 to 48 hours</span>. We&rsquo;ll email{' '}
                        <span className="font-semibold text-slate-900">{email}</span> as soon as you&rsquo;re approved.
                    </p>

                    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 text-left">
                        <h2 className="text-sm font-bold text-slate-900">In the meantime</h2>
                        <ul className="mt-3 space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-start gap-2.5">
                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                You can shop and order as normal at retail prices — your account works today.
                            </li>
                            <li className="flex items-start gap-2.5">
                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                Trade pricing switches on automatically the moment we approve you. Nothing to re-do.
                            </li>
                        </ul>
                    </div>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={route('shop.index')}
                            className="rounded bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Browse the Shop
                        </Link>
                        <Link
                            href={route('pages.contact')}
                            className="rounded border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </Container>

            {/* ── Confirmation popup ── */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <div className="p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                        <ClockIcon className="h-7 w-7 text-amber-600" />
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-slate-900">
                        Application received
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        Your account will be verified within{' '}
                        <span className="font-semibold text-slate-900">24 to 48 hours</span>. We&rsquo;ll
                        email you as soon as your trade pricing is switched on.
                    </p>

                    <p className="mt-3 text-xs text-gray-500">
                        You can keep shopping at retail prices in the meantime.
                    </p>

                    <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="mt-6 w-full rounded bg-amber-500 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-400"
                    >
                        Got it
                    </button>
                </div>
            </Modal>
        </PublicLayout>
    );
}
