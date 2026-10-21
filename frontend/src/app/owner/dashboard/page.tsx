'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Store as StoreIcon,
  Star,
  Users,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Building2,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { OwnerDashboardData, RatingItem, Pagination } from '../../../types';
import { StarRating } from '../../../components/StarRating';
import { useAuth } from '../../../context/AuthContext';

export default function OwnerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [dashboard, setDashboard] = useState<OwnerDashboardData | null>(null);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort] = useState<'createdAt' | 'value' | 'updatedAt' | 'storeName'>('createdAt');
  const [order] = useState<'asc' | 'desc'>('desc');

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Dashboard Stats
  useEffect(() => {
    if (authLoading || user?.role !== 'STORE_OWNER') return;
    let isMounted = true;

    api
      .get<{ dashboard: OwnerDashboardData }>('/owner/dashboard')
      .then((res) => {
        if (isMounted) {
          if (res.data?.dashboard) {
            setDashboard(res.data.dashboard);
          }
          setLoadingDashboard(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingDashboard(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  // Fetch Customer Ratings
  useEffect(() => {
    if (authLoading || user?.role !== 'STORE_OWNER') return;
    let isMounted = true;

    api
      .get<{ ratings: RatingItem[] }>('/owner/ratings', {
        params: {
          storeId: selectedStoreId || undefined,
          search: debouncedSearch || undefined,
          page: pagination.page,
          limit: pagination.limit,
          sort,
          order,
        },
      })
      .then((res) => {
        if (isMounted) {
          if (res.data?.ratings) {
            setRatings(res.data.ratings);
          }
          if (res.pagination) {
            setPagination(res.pagination);
          }
          setLoadingRatings(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingRatings(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, selectedStoreId, debouncedSearch, pagination.page, pagination.limit, sort, order]);

  // Loading state for auth
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  // Not logged in or not a store owner
  if (!user || user.role !== 'STORE_OWNER') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white">Owner Access Required</h2>
        <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
          The dashboard is exclusively reserved for registered store owners to track their business
          analytics and customer feedback.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login"
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-xs"
          >
            Sign In with Demo Owner Account (sarvesh.owner@example.com)
          </Link>
          <Link
            href="/stores"
            className="py-2 px-4 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium"
          >
            Return to Store Directory
          </Link>
        </div>
      </div>
    );
  }

  const distribution = dashboard?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalRatingsCount = dashboard?.totalRatings || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Store Owner Portal</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Business Analytics Dashboard</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Real-time performance metrics and customer rating breakdown for your establishments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-white">{user.name}</p>
            <p className="text-[11px] text-zinc-400">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-950 border border-purple-800 text-purple-300 flex items-center justify-center text-xs font-bold">
            SO
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loadingDashboard ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Stores Managed</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          <p className="text-3xl font-black text-white mt-4">{dashboard?.totalStores ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Active registered establishments</p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Overall Average Rating</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-black text-white">
              {dashboard?.averageRating ? dashboard.averageRating.toFixed(1) : '0.0'}
            </p>
            <span className="text-xs text-zinc-500 font-medium">/ 5.0</span>
          </div>
          <div className="mt-2">
            <StarRating value={dashboard?.averageRating || 0} size="sm" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Customer Ratings</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4">{totalRatingsCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Unique customer submissions</p>
        </div>
      </div>
      )}

      {/* Analytics & Owned Stores Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Rating Distribution Visualizer */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Rating Distribution (1–5 Stars)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Breakdown of customer feedback scores across your stores
            </p>

            <div className="mt-6 space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percentage = totalRatingsCount > 0 ? Math.round((count / totalRatingsCount) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 w-14 shrink-0 font-semibold text-zinc-300">
                      <span>{star}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>

                    <div className="flex-1 h-3 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          star >= 4
                            ? 'bg-amber-400'
                            : star === 3
                            ? 'bg-yellow-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="w-16 text-right shrink-0 text-zinc-400 font-mono text-[11px]">
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 text-center">
            Calculated exclusively from verified database rating records
          </div>
        </div>

        {/* Owned Stores Overview */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-purple-400" />
            <span>Owned Stores Overview</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Quick statistics for each of your active locations
          </p>

          <div className="mt-4 space-y-3">
            {dashboard?.stores && dashboard.stores.length > 0 ? (
              dashboard.stores.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{s.name}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{s.address}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-white">
                          {s.averageRating > 0 ? s.averageRating.toFixed(1) : '0.0'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{s.totalRatings} ratings</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStoreId(s.id === selectedStoreId ? '' : s.id);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                        selectedStoreId === s.id
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {selectedStoreId === s.id ? 'Viewing Filter' : 'Filter Ratings'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-6 text-center">No owned stores found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Ratings Table Section */}
      <div className="mt-10 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Customer Rating Logs</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Detailed list of individual user ratings with customer names, emails, and dates
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by store */}
            <select
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="">All Owned Stores</option>
              {dashboard?.stores?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Search user/store */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer or store..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400 w-52"
              />
            </div>
          </div>
        </div>

        {/* Ratings Table */}
        <div className="mt-4 overflow-x-auto">
          {loadingRatings ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : ratings.length > 0 ? (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 bg-zinc-950/40">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Store</th>
                  <th className="py-3 px-4 font-semibold">Rating</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-normal">
                {ratings.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {r.user?.name || 'Anonymous User'}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {r.user?.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                      {r.store?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {r.rating} Stars
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-zinc-500 text-xs">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="font-semibold text-zinc-400">No ratings found</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {selectedStoreId || search
                  ? 'No ratings match your filter criteria.'
                  : 'No customers have rated your stores yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Table Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} ratings total)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
