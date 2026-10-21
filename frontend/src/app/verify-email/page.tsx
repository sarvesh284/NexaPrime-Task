'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldAlert, Loader2, MailCheck, ArrowRight } from 'lucide-react';
import { api, ApiError } from '../../lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [message, setMessage] = useState('Verifying your email token...');

  useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      setMessage('Missing or invalid verification token.');
      return;
    }

    api
      .post('/auth/verify-email', { token })
      .then(() => {
        setStatus('SUCCESS');
        setMessage('Your email address has been successfully verified! You have full access to all platform features.');
      })
      .catch((err: unknown) => {
        setStatus('ERROR');
        const msg = err instanceof ApiError ? err.message : 'Invalid or expired verification token.';
        setMessage(msg);
      });
  }, [token]);

  return (
    <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
        <MailCheck className="w-7 h-7" />
      </div>

      <h2 className="text-2xl font-bold text-white tracking-tight">Email Verification</h2>

      {status === 'LOADING' && (
        <div className="py-6 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs text-zinc-400">{message}</p>
        </div>
      )}

      {status === 'SUCCESS' && (
        <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Verification Complete</h3>
          <p className="text-xs text-zinc-300 leading-relaxed">{message}</p>
          <div className="pt-3">
            <Link
              href="/stores"
              className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              <span>Explore Stores</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {status === 'ERROR' && (
        <div className="p-6 rounded-xl bg-rose-950/40 border border-rose-800 space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Verification Failed</h3>
          <p className="text-xs text-zinc-300 leading-relaxed">{message}</p>
          <div className="pt-3 flex justify-center gap-3">
            <Link
              href="/login"
              className="py-2 px-4 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-zinc-400 text-xs">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
