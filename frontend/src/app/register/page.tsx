'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, type Resolver, type FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import {
  Store,
  User as UserIcon,
  Mail,
  Lock,
  MapPin,
  Loader2,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/api';
import { UserRole } from '../../types';

const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;

const registerValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters')
    .refine((val) => val.length > 0, 'Name cannot be empty after trimming'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be between 8 and 16 characters')
    .max(16, 'Password must be between 8 and 16 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter and at least one special character'
    ),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(400, 'Address must not exceed 400 characters'),
  role: z.enum(['USER', 'STORE_OWNER']),
});

type RegisterFormData = z.infer<typeof registerValidationSchema>;

const safeZodResolver: Resolver<RegisterFormData> = (values) => {
  try {
    const result = registerValidationSchema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const formErrors: FieldErrors<RegisterFormData> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof RegisterFormData;
      if (field && !formErrors[field]) {
        formErrors[field] = {
          type: issue.code || 'validation',
          message: issue.message,
        };
      }
    }
    return { values: {} as any, errors: formErrors };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Validation failed';
    return { values: {} as any, errors: { root: { type: 'validation', message: msg } } };
  }
};

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerAuth } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeRole, setActiveRole] = useState<UserRole>('USER');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: safeZodResolver,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      role: 'USER',
    },
  });

  // Sync role from query parameters if present (e.g. /register?role=STORE_OWNER)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'STORE_OWNER') {
      setActiveRole('STORE_OWNER');
      setValue('role', 'STORE_OWNER', { shouldValidate: true });
    } else if (roleParam === 'USER') {
      setActiveRole('USER');
      setValue('role', 'USER', { shouldValidate: true });
    }
  }, [searchParams, setValue]);

  const watchedName = watch('name') || '';
  const watchedPassword = watch('password') || '';
  const watchedAddress = watch('address') || '';

  // Password checklist checks
  const hasLength = watchedPassword.length >= 8 && watchedPassword.length <= 16;
  const hasUpper = /[A-Z]/.test(watchedPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(watchedPassword);

  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
    setValue('role', newRole, { shouldValidate: true });
    setServerError(null);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setServerError(null);

      // Verify synchronously with safeParse
      const parseResult = registerValidationSchema.safeParse({
        ...data,
        role: activeRole,
      });
      if (!parseResult.success) {
        return;
      }

      // Register with user-selected role (USER or STORE_OWNER)
      const newUser = await registerAuth({
        name: parseResult.data.name,
        email: parseResult.data.email,
        password: parseResult.data.password,
        address: parseResult.data.address,
        role: parseResult.data.role,
      });

      success(`Welcome to RateLocal, ${newUser.name}!`);

      if (newUser.role === 'STORE_OWNER') {
        router.push('/owner/dashboard');
      } else {
        router.push('/stores');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.details && typeof err.details === 'object') {
        const details = err.details as Record<string, string[]>;
        let hasFieldErr = false;
        Object.entries(details).forEach(([field, msgs]) => {
          if (Array.isArray(msgs) && msgs.length > 0) {
            setError(field as any, { type: 'server', message: msgs[0] });
            hasFieldErr = true;
          }
        });
        if (hasFieldErr) {
          setServerError(err.message || 'Please correct the highlighted fields.');
          toastError(err.message || 'Please correct the highlighted fields.');
          return;
        }
      }
      const msg = err instanceof ApiError ? err.message : 'Registration failed. Please check your information.';
      setServerError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-lg w-full space-y-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-8 shadow-sm dark:shadow-xl relative">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {activeRole === 'STORE_OWNER'
              ? 'Register your business account to list and manage stores, track ratings, and inspect analytics'
              : 'Join RateLocal to explore businesses, rate stores, and share community reviews'}
          </p>
        </div>

        {/* Account Type Selector: Normal Customer vs Store Owner */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 text-center">
            Register As
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => handleRoleChange('USER')}
              className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === 'USER'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Normal Customer</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('STORE_OWNER')}
              className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === 'STORE_OWNER'
                  ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Store Owner</span>
            </button>
          </div>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs text-center font-medium shadow-xs">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('role')} />
          {/* Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Full Name <span className="text-amber-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  watchedName.length >= 2 && watchedName.length <= 60
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                {watchedName.length}/60 chars (min 2)
              </span>
            </div>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
              <input
                {...register('name')}
                type="text"
                placeholder={activeRole === 'STORE_OWNER' ? 'Rajesh Patil' : 'Alexander Montgomery'}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-zinc-800'
                } text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs`}
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
                placeholder={activeRole === 'STORE_OWNER' ? 'owner@business.com' : 'customer@example.com'}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-zinc-800'
                } text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs`}
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
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-zinc-800'
                } text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs`}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
            )}

            {/* Password Validation Checklist */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
              <div
                className={`flex items-center gap-1.5 ${
                  hasLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>8–16 Characters</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>1+ Uppercase (A-Z)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-zinc-500'
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
                {activeRole === 'STORE_OWNER' ? 'Business / Office Address' : 'Residential Address'}{' '}
                <span className="text-amber-500">*</span>
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
                placeholder={activeRole === 'STORE_OWNER' ? 'Shop 4, Ferguson College Road, Deccan Gymkhana, Pune, Maharashtra 411004' : '100 Discovery Boulevard, Suite 400, Pune, Maharashtra 411001'}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  errors.address ? 'border-rose-500' : 'border-slate-200 dark:border-zinc-800'
                } text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs`}
              />
            </div>
            {errors.address && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>{activeRole === 'STORE_OWNER' ? 'Complete Store Owner Registration' : 'Complete Customer Registration'}</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
