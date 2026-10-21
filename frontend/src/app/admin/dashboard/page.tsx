'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Store,
  Star,
  Flag,
  FileText,
  UserCheck,
  Building,
  ArrowRight,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { AdminKpis } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || user?.role !== 'ADMIN') return;

    api
      .get<{ kpis: AdminKpis }>('/admin/kpis')
      .then((res) => {
        if (res.data?.kpis) {
          setKpis(res.data.kpis);
        }
      })
      .catch((err) => console.error('Failed to load KPIs:', err))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
          This portal is strictly restricted to platform administrators with the ADMIN role.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="py-2.5 px-4 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs inline-block"
          >
            Sign in as Admin (sarvesh.admin@example.com)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Command Center</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Real-time platform KPIs, user moderation, store assignments, and security audit logs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
            ADMIN: {user.name}
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">{kpis?.totalUsers ?? 0}</p>
            <p className="text-[11px] text-zinc-500">Registered platform consumers</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Store Owners</span>
              <UserCheck className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white">{kpis?.totalStoreOwners ?? 0}</p>
            <p className="text-[11px] text-zinc-500">Authorized merchant accounts</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Active Stores</span>
              <Store className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">{kpis?.totalActiveStores ?? 0}</p>
            <p className="text-[11px] text-zinc-500">
              {kpis?.totalInactiveStores ? `${kpis.totalInactiveStores} inactive` : '100% active'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Platform Ratings</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-white">{kpis?.totalRatings ?? 0}</p>
              <span className="text-xs text-amber-400 font-semibold">
                ({kpis?.overallPlatformRating ? kpis.overallPlatformRating.toFixed(1) : '0.0'} ★ avg)
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Verified visible ratings</p>
          </div>
        </div>
      )}

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              User Management
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Search users, inspect roles, deactivate suspicious accounts, and manage account statuses.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/stores"
          className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              Store Management
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Create stores, assign verified owners, edit metadata, or toggle store active status.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
            <span>Manage Stores</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/reports"
          className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors flex items-center justify-between">
              <span>Review Moderation</span>
              {kpis && kpis.pendingReportsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {kpis.pendingReportsCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Inspect user reports, review offensive feedback, and take moderation actions.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
            <span>Moderation Queue</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              Security Audit Logs
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Trace all administrative actions, targets, actor metadata, and timestamps for accountability.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            <span>View Audit Logs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
