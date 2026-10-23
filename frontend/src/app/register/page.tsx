'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, User, Mail, Lock, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/api';

const registerValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(20, 'Name must be at least 20 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password cannot exceed 16 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(400, 'Address cannot exceed 400 characters'),
});

type RegisterFormData = z.infer<typeof registerValidationSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth } = useAuth();
  const { success, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerValidationSchema),
    mode: 'onChange',
  });

  const watchedName = watch('name') || '';
  const watchedPassword = watch('password') || '';
  const watchedAddress = watch('address') || '';

  // Password checklist checks
  const hasLength = watchedPassword.length >= 8 && watchedPassword.length <= 16;
  const hasUpper = /[A-Z]/.test(watchedPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(watchedPassword);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setServerError(null);
      await registerAuth(data);
      success('Account created successfully! Welcome to NexaPrime.');
      router.push('/stores');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      setServerError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-lg w-full space-y-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl relative">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Sign up to discover stores, submit ratings, and share reviews
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs text-center font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Full Name <span className="text-amber-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  watchedName.length >= 20 && watchedName.length <= 60
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                {watchedName.length}/60 chars (min 20)
              </span>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
              <input
                {...register('name')}
                type="text"
                placeholder="Christopher Columbus Explorer"
                className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  errors.name ? 'border-rose-500' : 'border-slate-300 dark:border-zinc-800'
                } text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Email Address <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
              <input
                {...register('email')}
                type="email"
                placeholder="user@example.com"
                className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  errors.email ? 'border-rose-500' : 'border-slate-300 dark:border-zinc-800'
                } text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Password <span className="text-amber-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">8–16 chars</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  errors.password ? 'border-rose-500' : 'border-slate-300 dark:border-zinc-800'
                } text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm`}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
            )}

            {/* Password Validation Checklist */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
              <div
                className={`flex items-center gap-1.5 ${
                  hasLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>8–16 Characters</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>1+ Uppercase (A-Z)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>1+ Special Char</span>
              </div>
            </div>
          </div>

          {/* Address Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Residential Address <span className="text-amber-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                {watchedAddress.length}/400 chars
              </span>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
              <textarea
                {...register('address')}
                rows={2}
                placeholder="100 Discovery Boulevard, Suite 400, Pune, Maharashtra 411001"
                className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  errors.address ? 'border-rose-500' : 'border-slate-300 dark:border-zinc-800'
                } text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm`}
              />
            </div>
            {errors.address && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Complete Registration</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-zinc-400">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
