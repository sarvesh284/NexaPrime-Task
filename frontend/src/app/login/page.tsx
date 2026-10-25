'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store, Lock, Mail, Loader2, ShieldAlert, User as UserIcon, Layers, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/api';
import { UserRole } from '../../types';

type RoleFilterOption = 'ALL' | UserRole;

const ROLE_DISPLAY_NAMES: Record<RoleFilterOption, string> = {
  ALL: 'Auto-detect',
  USER: 'Customer',
  STORE_OWNER: 'Store Owner',
};

const DEMO_PRESETS: Record<UserRole, { email: string; label: string }> = {
  USER: { email: 'sarvesh.user@example.com', label: 'Customer' },
  STORE_OWNER: { email: 'sarvesh.owner@example.com', label: 'Store Owner' },
};

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleFilterOption>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'USER' || roleParam === 'STORE_OWNER') {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const handleSelectDemo = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(DEMO_PRESETS[role].email);
    setPassword('Password@123');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both your email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Authenticate via server
      const authenticatedUser = await login(email, password);

      // Verify selected UI role filter against authoritative server-verified role
      if (selectedRole !== 'ALL' && authenticatedUser.role !== selectedRole) {
        await logout();
        const expectedRoleName = ROLE_DISPLAY_NAMES[selectedRole];
        const actualRoleName = ROLE_DISPLAY_NAMES[authenticatedUser.role];
        const mismatchMsg = `Access Denied: Account Role Mismatch. This account is registered as a ${actualRoleName}, but you selected ${expectedRoleName}. Please select "${actualRoleName}" or "Auto-detect" to sign in.`;
        setErrorMessage(mismatchMsg);
        toastError(mismatchMsg);
        return;
      }

      success(`Welcome back, ${authenticatedUser.name}!`);

      // Authoritative role-based redirection
      if (authenticatedUser.role === 'STORE_OWNER') {
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
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-8 shadow-sm dark:shadow-xl relative">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Access your ratings, manage your stores, or oversee platform operations
          </p>
        </div>

        {/* Role Selector / UI Filter Tabs */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 text-center">
            Sign in as Account Type
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('ALL');
                setErrorMessage(null);
              }}
              className={`py-1.5 px-2 rounded-lg font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                selectedRole === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">Any</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('USER');
                setErrorMessage(null);
              }}
              className={`py-1.5 px-2 rounded-lg font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                selectedRole === 'USER'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="text-[11px]">Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('STORE_OWNER');
                setErrorMessage(null);
              }}
              className={`py-1.5 px-2 rounded-lg font-medium transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                selectedRole === 'STORE_OWNER'
                  ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span className="text-[11px]">Store Owner</span>
            </button>
          </div>
          {selectedRole !== 'ALL' && (
            <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500 mt-1">
              Account role verification active: Account must be registered as {ROLE_DISPLAY_NAMES[selectedRole]}
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-start gap-2 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs"
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
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline transition-colors font-medium"
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying and signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quick Presentation Demo Helper */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 text-center mb-2">
            Demo Presentation Logins:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleSelectDemo('USER')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold transition-colors"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo('STORE_OWNER')}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[11px] font-semibold transition-colors"
            >
              Store Owner
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-zinc-400">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
