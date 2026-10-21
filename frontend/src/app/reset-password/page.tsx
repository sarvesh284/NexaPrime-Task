'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle2, ShieldAlert, KeyRound, Check, X } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../components/Toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { success, error: toastError } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password rules validation
  const hasMinLength = password.length >= 8 && password.length <= 16;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isValid = hasMinLength && hasUppercase && hasSpecialChar && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage('Missing password reset token. Please check your link.');
      return;
    }

    if (!isValid) {
      setErrorMessage('Please satisfy all password complexity criteria.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await api.post('/auth/reset-password', {
        token,
        password,
      });
      setIsSuccess(true);
      success('Password reset successfully! Please sign in.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to reset password.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Set New Password</h2>
        <p className="mt-2 text-xs text-zinc-400">
          Enter your new password below according to the platform security requirements.
        </p>
      </div>

      {!token ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-xs text-rose-200">
            No reset token detected in the URL. Please use the link sent to your email.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-xs font-semibold text-amber-400 hover:underline pt-2"
          >
            Request new reset link
          </Link>
        </div>
      ) : isSuccess ? (
        <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Password Reset Complete!</h3>
          <p className="text-xs text-zinc-300">
            Your password has been securely updated. You will be redirected to the sign-in page in a few seconds...
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 inline-block"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Password Rules Checklist */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className={hasMinLength ? 'text-emerald-300' : 'text-zinc-500'}>
                  8 to 16 characters
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasUppercase ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className={hasUppercase ? 'text-emerald-300' : 'text-zinc-500'}>
                  At least one uppercase letter (A-Z)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasSpecialChar ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className={hasSpecialChar ? 'text-emerald-300' : 'text-zinc-500'}>
                  At least one special character (!@#$%^&*...)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {passwordsMatch ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className={passwordsMatch ? 'text-emerald-300' : 'text-zinc-500'}>
                  Passwords match
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-zinc-400 text-xs">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
