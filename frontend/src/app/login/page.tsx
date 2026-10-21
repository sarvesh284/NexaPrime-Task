'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Lock, Mail, Loader2, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
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

      // Redirect depending on user role
      if (email.includes('owner')) {
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

  const fillDemoAccount = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setErrorMessage(null);

    try {
      setIsLoading(true);
      await login(demoEmail, 'Password@123');
      success(`Logged in as ${demoEmail.includes('owner') ? 'Store Owner' : 'Normal User'}!`);
      if (demoEmail.includes('owner')) {
        router.push('/owner/dashboard');
      } else {
        router.push('/stores');
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h2>
          <p className="mt-2 text-xs text-zinc-400">
            Access your ratings or manage your owned stores
          </p>
        </div>

        {/* 1-Click Demo Buttons */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Instant Demo Access (1-Click)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fillDemoAccount('sarvesh.user@example.com')}
              className="py-2 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-left text-xs text-zinc-200 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-amber-300">Normal User</p>
                <p className="text-[10px] text-zinc-400">sarvesh.user</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => fillDemoAccount('sarvesh.owner@example.com')}
              className="py-2 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-left text-xs text-zinc-200 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-purple-300">Store Owner</p>
                <p className="text-[10px] text-zinc-400">sarvesh.owner</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Password
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

        <p className="text-center text-xs text-zinc-400">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-semibold text-amber-400 hover:underline">
            Register as Normal User
          </Link>
        </p>
      </div>
    </div>
  );
}
