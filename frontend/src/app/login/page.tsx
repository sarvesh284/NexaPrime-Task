'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Lock, Mail, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both your email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await login(email, password);
      success('Logged in successfully!');

      if (email.includes('admin')) {
        router.push('/admin/dashboard');
      } else if (email.includes('owner')) {
        router.push('/owner/dashboard');
      } else {
        router.push('/stores');
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Invalid email or password';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-7 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl relative">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
            Access your ratings, manage your stores, or oversee the platform
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-zinc-400">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
            Register as Normal User
          </Link>
        </p>
      </div>
    </div>
  );
}
