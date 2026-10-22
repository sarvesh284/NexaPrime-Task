'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  User as UserIcon,
  Clock,
  Laptop,
  LogOut,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Mail,
  MapPin,
  KeyRound,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { LoginHistoryEntry } from '../../types';

export default function SettingsSecurityPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    api
      .get<{ history: LoginHistoryEntry[] }>('/auth/login-history')
      .then((res) => {
        if (res.data?.history) {
          setHistory(res.data.history);
        }
      })
      .catch((err) => console.error('Failed to load login history:', err))
      .finally(() => setLoadingHistory(false));
  }, [authLoading, user]);

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all active sessions? You will be logged out on all devices.')) {
      return;
    }

    try {
      setRevoking(true);
      await api.post('/auth/revoke-sessions');
      success('All active sessions revoked. Please log in again.');
      await logout();
      router.push('/login');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to revoke sessions.';
      toastError(msg);
    } finally {
      setRevoking(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-zinc-400 mt-1">Please log in to manage your account and security settings.</p>
        <Link
          href="/login"
          className="mt-6 inline-block py-2.5 px-5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4" />
          <span>Account & Security Center</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Security Settings</h1>
        <p className="text-zinc-400 text-xs mt-1">
          Manage your account profile, inspect recent authentication sessions, and control device access.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{user.name}</h2>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                user.role === 'ADMIN'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : user.role === 'STORE_OWNER'
                  ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
            <p className="text-zinc-500 font-medium">Registered Address</p>
            <p className="text-white font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>{user.address || 'Not specified'}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
            <p className="text-zinc-500 font-medium">Email Verification Status (SEC1)</p>
            <p className="text-white font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Verified & Protected</span>
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-semibold"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change or Reset Password (SEC2)</span>
          </Link>

          <span className="text-[11px] text-zinc-500">
            Account created {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Feature SEC4: Login Activity & Session Revocation */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-amber-400" />
              <span>Recent Login Activity (SEC4)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Audit log of recent sign-in sessions from devices and IP addresses
            </p>
          </div>

          <button
            onClick={handleRevokeAllSessions}
            disabled={revoking}
            className="py-2 px-3.5 rounded-xl bg-rose-950/60 border border-rose-800 hover:bg-rose-900 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            <span>Revoke All Other Sessions (SEC3)</span>
          </button>
        </div>

        {loadingHistory ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 bg-zinc-950/40">
                <tr>
                  <th className="py-3 px-4 font-semibold">Device / User Agent</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 max-w-xs font-medium text-white truncate" title={item.userAgent}>
                      {item.userAgent || 'Web Browser'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                      {item.ip || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        {item.status || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
            <p>No recent login sessions recorded yet</p>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Revoking all sessions invalidates all active JWT tokens by incrementing your security token version.
            Any unauthorized browser or device will be immediately disconnected.
          </p>
        </div>
      </div>
    </div>
  );
}
