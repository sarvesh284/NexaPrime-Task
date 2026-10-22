'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Star,
  Users,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Building2,
  Download,
  Calendar,
  BarChart3,
  Filter,
  MessageSquare,
  Trash2,
  X,
  Settings,
  Phone,
  Globe,
  MapPin,
} from 'lucide-react';
import { api } from '../../../lib/api';
import {
  OwnerDashboardData,
  RatingItem,
  Pagination,
  OwnerAnalyticsData,
  Store,
} from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Toast';

export default function OwnerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [dashboard, setDashboard] = useState<OwnerDashboardData | null>(null);
  const [analytics, setAnalytics] = useState<OwnerAnalyticsData | null>(null);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort] = useState<'createdAt' | 'value' | 'updatedAt' | 'storeName'>('createdAt');
  const [order] = useState<'asc' | 'desc'>('desc');

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Dashboard Stats Overview
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
        if (isMounted) setLoadingDashboard(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  // Fetch Advanced Analytics
  useEffect(() => {
    if (authLoading || user?.role !== 'STORE_OWNER') return;
    let isMounted = true;
    setLoadingAnalytics(true);

    api
      .get<{ analytics: OwnerAnalyticsData }>('/owner/analytics', {
        params: {
          storeId: selectedStoreId || undefined,
          rating: selectedRating ? parseInt(selectedRating, 10) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      })
      .then((res) => {
        if (isMounted) {
          if (res.data?.analytics) {
            setAnalytics(res.data.analytics);
          }
          setLoadingAnalytics(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingAnalytics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, selectedStoreId, selectedRating, startDate, endDate]);

  // Fetch Customer Ratings List
  useEffect(() => {
    if (authLoading || user?.role !== 'STORE_OWNER') return;
    let isMounted = true;
    setLoadingRatings(true);

    api
      .get<{ ratings: RatingItem[] }>('/owner/ratings', {
        params: {
          storeId: selectedStoreId || undefined,
          rating: selectedRating ? parseInt(selectedRating, 10) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
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
        if (isMounted) setLoadingRatings(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    authLoading,
    user,
    selectedStoreId,
    selectedRating,
    startDate,
    endDate,
    debouncedSearch,
    pagination.page,
    pagination.limit,
    sort,
    order,
  ]);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const queryParams = new URLSearchParams();
      if (selectedStoreId) queryParams.append('storeId', selectedStoreId);
      if (selectedRating) queryParams.append('rating', selectedRating);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${apiUrl}/owner/ratings/export?${queryParams.toString()}`, {
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ratings-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success('CSV export generated and downloaded successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV export failed.';
      toastError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  // Reply Modal State & Handlers (O3 / R5)
  const [replyModalRating, setReplyModalRating] = useState<RatingItem | null>(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const openReplyModal = (rating: RatingItem) => {
    setReplyModalRating(rating);
    setReplyInputText(rating.ownerReply?.text || '');
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalRating) return;
    if (!replyInputText.trim()) {
      toastError('Please enter a response message.');
      return;
    }

    try {
      setIsSubmittingReply(true);
      const res = await api.post<{ ownerReply: any; message: string }>(
        `/owner/ratings/${replyModalRating.id}/reply`,
        { reply: replyInputText.trim() }
      );

      setRatings((prev) =>
        prev.map((r) =>
          r.id === replyModalRating.id
            ? { ...r, ownerReply: res.data?.ownerReply || { text: replyInputText.trim(), createdAt: new Date().toISOString() } }
            : r
        )
      );

      success(res.data?.message || 'Reply saved and customer notified.');
      setReplyModalRating(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit owner reply.';
      toastError(msg);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!replyModalRating) return;
    try {
      setIsSubmittingReply(true);
      await api.delete(`/owner/ratings/${replyModalRating.id}/reply`);

      setRatings((prev) =>
        prev.map((r) => (r.id === replyModalRating.id ? { ...r, ownerReply: undefined } : r))
      );

      success('Reply deleted successfully.');
      setReplyModalRating(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete reply.';
      toastError(msg);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Edit Store Profile Modal State & Handlers (O2)
  const [editStoreModal, setEditStoreModal] = useState<Store | null>(null);
  const [editStoreForm, setEditStoreForm] = useState({
    name: '',
    description: '',
    phone: '',
    website: '',
    address: '',
  });
  const [isSubmittingStoreProfile, setIsSubmittingStoreProfile] = useState(false);

  const openEditStoreModal = (store: Store) => {
    setEditStoreModal(store);
    setEditStoreForm({
      name: store.name || '',
      description: store.description || '',
      phone: store.phone || '',
      website: store.website || '',
      address: store.address || '',
    });
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStoreModal) return;
    if (!editStoreForm.name.trim() || !editStoreForm.address.trim()) {
      toastError('Store name and address are required.');
      return;
    }

    try {
      setIsSubmittingStoreProfile(true);
      const res = await api.patch<{ store: Store; message: string }>(
        `/owner/stores/${editStoreModal.id}`,
        editStoreForm
      );

      if (dashboard) {
        setDashboard({
          ...dashboard,
          stores: dashboard.stores.map((s) =>
            s.id === editStoreModal.id
              ? {
                  ...s,
                  name: editStoreForm.name.trim(),
                  address: editStoreForm.address.trim(),
                  description: editStoreForm.description.trim(),
                  phone: editStoreForm.phone.trim(),
                  website: editStoreForm.website.trim(),
                }
              : s
          ),
        });
      }

      success(res.data?.message || 'Store profile updated successfully.');
      setEditStoreModal(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update store profile.';
      toastError(msg);
    } finally {
      setIsSubmittingStoreProfile(false);
    }
  };

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

  const distribution = analytics?.distribution || dashboard?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalRatingsCount = analytics?.totalRatings ?? dashboard?.totalRatings ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Store Owner Portal</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Business Analytics Dashboard</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Real-time performance metrics, trend forecasts, and customer review feedback
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const currentStore = dashboard?.stores?.find((s) => s.id === selectedStoreId) || dashboard?.stores?.[0];
              if (currentStore) {
                openEditStoreModal(currentStore as any);
              } else {
                toastError('No owned stores found to edit.');
              }
            }}
            className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-purple-600/20"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Store Profile</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loadingDashboard ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Stores Managed</span>
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">{dashboard?.totalStores ?? 0}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Active locations</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Overall Rating</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <p className="text-2xl font-black text-white">
                {dashboard?.averageRating ? dashboard.averageRating.toFixed(1) : '0.0'}
              </p>
              <span className="text-xs text-zinc-500">/ 5.0</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Across all stores</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Total Ratings</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">{totalRatingsCount}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Visible reviews</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Filtered Period Ratings</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">{analytics?.periodNewRatings ?? totalRatingsCount}</p>
            <p className="text-[11px] text-zinc-500 mt-1">In selected range</p>
          </div>
        </div>
      )}

      {/* Analytics Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 font-semibold">
          <Filter className="w-4 h-4 text-amber-400" />
          <span>Filters:</span>
        </div>

        {/* Store Selector */}
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="py-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="">All Owned Stores</option>
          {dashboard?.stores?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Star Rating Selector */}
        <select
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
          className="py-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="">All Star Ratings</option>
          <option value="5">5 Stars Only</option>
          <option value="4">4 Stars Only</option>
          <option value="3">3 Stars Only</option>
          <option value="2">2 Stars Only</option>
          <option value="1">1 Star Only</option>
        </select>

        {/* Start Date */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="py-1 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="py-1 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        {(selectedStoreId || selectedRating || startDate || endDate) && (
          <button
            onClick={() => {
              setSelectedStoreId('');
              setSelectedRating('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-amber-400 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Visual Charts & Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Rating Trends Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Rating Volume Trend Over Time</span>
            </h3>
            <span className="text-[11px] text-zinc-500">Daily Breakdown</span>
          </div>

          {loadingAnalytics ? (
            <div className="h-44 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : analytics?.dailyTrends && analytics.dailyTrends.length > 0 ? (
            <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-zinc-800 overflow-x-auto">
              {analytics.dailyTrends.map((trend) => {
                const maxCount = Math.max(...analytics.dailyTrends.map((t) => t.count), 1);
                const heightPercent = Math.max(15, Math.round((trend.count / maxCount) * 100));
                return (
                  <div key={trend.date} className="flex-1 flex flex-col items-center gap-1 min-w-[36px]">
                    <span className="text-[10px] text-zinc-400 font-semibold">{trend.count}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-300 transition-all"
                      style={{ height: `${heightPercent}%` }}
                      title={`${trend.date}: ${trend.count} ratings (avg: ${trend.averageRating})`}
                    />
                    <span className="text-[9px] text-zinc-500 truncate w-full text-center">
                      {trend.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-zinc-500 text-xs space-y-1">
              <Calendar className="w-6 h-6 text-zinc-600" />
              <p>No rating activity recorded in this selected range</p>
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span>Rating Distribution</span>
          </h3>

          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const percentage = totalRatingsCount > 0 ? Math.round((count / totalRatingsCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2.5 text-xs">
                  <div className="flex items-center gap-1 w-12 text-zinc-300 font-semibold">
                    <span>{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-zinc-500 text-[11px] font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customer Ratings Log Table */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Customer Reviews & Ratings Feed</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified individual ratings and comments submitted for your stores
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search comments or customer..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400 w-60"
            />
          </div>
        </div>

        {loadingRatings ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : ratings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 bg-zinc-950/40">
                <tr>
                  <th className="py-3 px-4 font-semibold">Store</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Rating</th>
                  <th className="py-3 px-4 font-semibold">Feedback & Response</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {ratings.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {r.store?.name}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-zinc-200">{r.user?.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{r.user?.email}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {r.rating} ★
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm text-zinc-300">
                      <p className="line-clamp-2">{r.comment || <span className="text-zinc-600 italic">No written comment</span>}</p>
                      {r.ownerReply && (
                        <div className="mt-1.5 p-2 rounded-lg bg-zinc-950 border border-purple-500/30 text-[11px] text-purple-300 flex items-start gap-1.5">
                          <MessageSquare className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-purple-200">Your Reply: </span>
                            <span>{r.ownerReply.text}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openReplyModal(r)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          r.ownerReply
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-700 hover:bg-purple-900'
                            : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{r.ownerReply ? 'Edit Reply' : 'Reply'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-500 text-xs">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-400">No ratings match your filter</p>
          </div>
        )}

        {/* Table Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal (O3 / R5) */}
      {replyModalRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {replyModalRating.ownerReply ? 'Edit Review Response' : 'Reply to Customer Review'}
                </h3>
              </div>
              <button
                onClick={() => setReplyModalRating(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Review summary preview */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-zinc-200">{replyModalRating.user?.name}</span>
                <span className="text-amber-400 font-bold">{replyModalRating.rating} ★</span>
              </div>
              <p className="text-zinc-300 italic">
                "{replyModalRating.comment || 'No written text provided'}"
              </p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Your Response (Visible to the community)
                </label>
                <textarea
                  value={replyInputText}
                  onChange={(e) => setReplyInputText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Thank the customer for visiting, address their points professionally..."
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-400 resize-none leading-relaxed"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                  <span>Professional, courteous tone recommended</span>
                  <span>{replyInputText.length}/500</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {replyModalRating.ownerReply ? (
                  <button
                    type="button"
                    onClick={handleDeleteReply}
                    disabled={isSubmittingReply}
                    className="py-2 px-3 rounded-xl bg-rose-950/60 border border-rose-800 hover:bg-rose-900 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Reply</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyModalRating(null)}
                    className="py-2 px-4 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReply}
                    className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                  >
                    {isSubmittingReply && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Response</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Store Profile Modal (O2) */}
      {editStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Edit Store Profile</h3>
              </div>
              <button
                onClick={() => setEditStoreModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Store Name</label>
                <input
                  type="text"
                  value={editStoreForm.name}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, name: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Description</label>
                <textarea
                  value={editStoreForm.description}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe your store, specialties, and business hours..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editStoreForm.phone}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, phone: e.target.value })}
                    placeholder="(415) 555-0100"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={editStoreForm.website}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={editStoreForm.address}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, address: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditStoreModal(null)}
                  className="py-2 px-4 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStoreProfile}
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {isSubmittingStoreProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Store Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
