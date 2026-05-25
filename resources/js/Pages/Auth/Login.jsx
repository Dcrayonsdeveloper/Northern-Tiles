import { useEffect, useRef, useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { useD } from '@/Support/dictionary';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

/**
 * Countdown timer driven by flash.retry_after from the server.
 *
 * Returns `{ countdown, isLocked }`:
 *   countdown — seconds remaining (0 = not locked)
 *   isLocked  — true while countdown > 0
 *
 * Design choices:
 *  - Cascading setTimeout instead of setInterval: each state change schedules
 *    exactly one timer, which cleans itself up via the useEffect return.
 *    No interval can "pile up" if a render is delayed.
 *  - seedRef prevents re-triggering for the same retry_after value (e.g. if
 *    the parent re-renders without a new server response).
 *  - Wall-clock accuracy is sufficient for a 60-second window; drift from
 *    setTimeout is under 1 s per minute in practice.
 */
function useLoginCountdown(retryAfter) {
    const [countdown, setCountdown] = useState(0);
    const seedRef = useRef(0);

    // Sync from server: only reset when a genuinely new retry_after arrives.
    useEffect(() => {
        const sec = retryAfter ?? 0;
        if (sec > 0 && sec !== seedRef.current) {
            seedRef.current = sec;
            setCountdown(sec);
        }
    }, [retryAfter]);

    // Tick: schedule a decrement every second while locked.
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(
            () => setCountdown((c) => Math.max(0, c - 1)),
            1000,
        );
        return () => clearTimeout(t);
    }, [countdown]);

    return { countdown, isLocked: countdown > 0 };
}

export default function Login({ status, canResetPassword }) {
    const d = useD();
    const { flash } = usePage().props;
    const { countdown, isLocked } = useLoginCountdown(flash?.retry_after);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isLocked) return;
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title={d('auth.sign_in.title')} />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="mb-4">
                <div className="text-[15px] font-semibold text-gray-900">
                    {d('auth.sign_in.title')}
                </div>
                <div className="mt-1 text-[13px] text-gray-600">
                    {d('auth.sign_in.subtitle')}
                </div>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value={d('auth.email.label')} />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password"
                        value={d('auth.password.label')}
                    />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            {d('auth.remember_me')}
                        </span>
                    </label>
                </div>

                {isLocked && (
                    <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        Too many failed attempts. Try again in{' '}
                        <span className="font-semibold tabular-nums">
                            {countdown}s
                        </span>
                        .
                    </div>
                )}

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            {d('auth.forgot_password')}
                        </Link>
                    )}

                    <PrimaryButton
                        className="ms-4"
                        disabled={processing || isLocked}
                    >
                        {isLocked
                            ? `Locked (${countdown}s)`
                            : d('auth.sign_in.button')}
                    </PrimaryButton>
                </div>

                <div className="mt-4 text-[13px] text-gray-600">
                    {d('auth.no_account')}{' '}
                    <Link
                        href={route('register')}
                        className="font-semibold text-gray-900 underline hover:text-gray-700"
                    >
                        {d('auth.sign_up.link')}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
