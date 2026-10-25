'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Camera,
  UploadCloud,
  Check,
  Plus,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Store as StoreIcon,
} from 'lucide-react';
import { api, getAssetUrl } from '../../../lib/api';
import {
  OwnerDashboardData,
  RatingItem,
  Pagination,
  OwnerAnalyticsData,
  Store,
  PhotoItem,
} from '../../../types';
import { PhotoUploadModal } from '../../../components/PhotoUploadModal';
import { StoreFormModal } from '../../../components/StoreFormModal';
import { DeleteStoreModal } from '../../../components/DeleteStoreModal';
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

  // Owner Photos State
  const [activeTab, setActiveTab] = useState<'stores' | 'analytics' | 'photos'>('stores');
  const [ownerPhotos, setOwnerPhotos] = useState<PhotoItem[]>([]);
  const [loadingOwnerPhotos, setLoadingOwnerPhotos] = useState(false);
  const [photoUploadModalOpen, setPhotoUploadModalOpen] = useState(false);
  const [activeStoreForUpload, setActiveStoreForUpload] = useState<Store | null>(null);

  // Store Management State
  const [ownerStores, setOwnerStores] = useState<Store[]>([]);
  const [loadingOwnerStores, setLoadingOwnerStores] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [debouncedStoreSearch, setDebouncedStoreSearch] = useState('');
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('');
  const [storeStatusFilter, setStoreStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [createStoreModalOpen, setCreateStoreModalOpen] = useState(false);
  const [editStoreModal, setEditStoreModal] = useState<Store | null>(null);
  const [deleteStoreModal, setDeleteStoreModal] = useState<Store | null>(null);

  // Store search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStoreSearch(storeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [storeSearch]);

  // Search debounce for customer ratings table
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Dashboard Stats Overview
  const fetchDashboardOverview = useCallback(async () => {
    if (authLoading || user?.role !== 'STORE_OWNER') return;
    try {
      setLoadingDashboard(true);
      const res = await api.get<{ dashboard: OwnerDashboardData }>('/owner/dashboard');
      if (res.data?.dashboard) {
        setDashboard(res.data.dashboard);
      }
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, [authLoading, user]);

  // Fetch Owner Stores List
  const fetchOwnerStores = useCallback(async () => {
    if (authLoading || user?.role !== 'STORE_OWNER') return;
    try {
      setLoadingOwnerStores(true);
      const res = await api.get<{ stores: Store[] }>('/owner/stores', {
        params: {
          status: storeStatusFilter,
          search: debouncedStoreSearch || undefined,
          category: storeCategoryFilter || undefined,
          limit: 100,
        },
      });
      if (res.data?.stores) {
        setOwnerStores(res.data.stores);
      }
    } catch (err) {
      console.error('Failed to load owner stores:', err);
    } finally {
      setLoadingOwnerStores(false);
    }
  }, [authLoading, user, storeStatusFilter, debouncedStoreSearch, storeCategoryFilter]);

  useEffect(() => {
    fetchDashboardOverview();
  }, [fetchDashboardOverview]);

  useEffect(() => {
    fetchOwnerStores();
  }, [fetchOwnerStores]);

  const handleStoreSaved = (savedStore: Store, isEdit: boolean) => {
    fetchOwnerStores();
    fetchDashboardOverview();
    if (!isEdit && !selectedStoreId) {
      setSelectedStoreId(savedStore.id);
    }
  };

  const handleStoreDeleted = (deletedStoreId: string) => {
    fetchOwnerStores();
    fetchDashboardOverview();
    if (selectedStoreId === deletedStoreId) {
      setSelectedStoreId('');
    }
  };

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

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://ratelocal.onrender.com/api/v1'
          : 'http://localhost:5000/api/v1');
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



  const fetchOwnerPhotos = useCallback(async (storeIdToFetch?: string) => {
    const targetStoreId = storeIdToFetch || selectedStoreId || dashboard?.stores?.[0]?.id;
    if (!targetStoreId) return;

    try {
      setLoadingOwnerPhotos(true);
      const res = await api.get<PhotoItem[]>(`/stores/${targetStoreId}/photos`);
      if (res.data) {
        setOwnerPhotos(res.data);
      }
    } catch (err) {
      console.error('Failed to load owner photos:', err);
    } finally {
      setLoadingOwnerPhotos(false);
    }
  }, [selectedStoreId, dashboard?.stores]);

  useEffect(() => {
    if (activeTab === 'photos') {
      fetchOwnerPhotos();
    }
  }, [activeTab, fetchOwnerPhotos, selectedStoreId]);

  const handleSetOwnerCover = async (photoId: string, storeId: string) => {
    try {
      const res = await api.patch<{ coverImage: string; photoId: string }>(
        `/stores/${storeId}/photos/${photoId}/cover`
      );
      if (res.data?.coverImage && dashboard) {
        setDashboard({
          ...dashboard,
          stores: dashboard.stores.map((s) =>
            s.id === storeId ? { ...s, coverImage: res.data!.coverImage } : s
          ),
        });
      }
      setOwnerPhotos((prev) =>
        prev.map((p) => ({
          ...p,
          isCover: p.id === photoId,
        }))
      );
      success('Cover photo updated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update cover photo.';
      toastError(msg);
    }
  };

  const handleDeleteOwnerPhoto = async (photoId: string) => {
    try {
      await api.delete(`/photos/${photoId}`);
      setOwnerPhotos((prev) => prev.filter((p) => p.id !== photoId));
      success('Photo deleted.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete photo.';
      toastError(msg);
    }
  };

  const handleOpenPhotoUpload = (store: Store) => {
    setActiveStoreForUpload(store);
    setPhotoUploadModalOpen(true);
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
            Sign In with Store Owner Account
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setCreateStoreModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Store</span>
          </button>

          <button
            onClick={() => {
              const currentStore =
                ownerStores.find((s) => s.id === selectedStoreId) ||
                ownerStores[0] ||
                (dashboard?.stores?.[0] as any);
              if (currentStore) {
                setEditStoreModal(currentStore);
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

      {/* Global Overview KPI Cards */}
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'stores'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Stores / Management ({dashboard?.totalStores ?? ownerStores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Customer Reviews</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'photos'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Store Photo Gallery Management</span>
        </button>
      </div>

      {/* Tab: Store Management */}
      {activeTab === 'stores' && (
        <div className="space-y-6 animate-fade-in">
          {/* Store Management Filters Toolbar */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Search stores by name, city, address..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Category Filter */}
              <select
                value={storeCategoryFilter}
                onChange={(e) => setStoreCategoryFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="">All Categories</option>
                {Array.from(new Set(ownerStores.map((s) => s.category).filter(Boolean))).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={storeStatusFilter}
                onChange={(e) => setStoreStatusFilter(e.target.value as any)}
                className="py-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="active">Active Locations Only</option>
                <option value="archived">Archived Locations</option>
                <option value="all">All Statuses</option>
              </select>
            </div>

            <button
              onClick={() => setCreateStoreModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Store</span>
            </button>
          </div>

          {/* Stores Grid / Cards */}
          {loadingOwnerStores ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : ownerStores.length === 0 ? (
            <div className="p-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-white">
                  {storeSearch || storeCategoryFilter || storeStatusFilter !== 'active'
                    ? 'No stores match your filters'
                    : 'No Stores Registered Yet'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {storeSearch || storeCategoryFilter || storeStatusFilter !== 'active'
                    ? 'Try adjusting your search keywords or resetting the status and category filters.'
                    : 'Get started by registering your first store location on RateLocal to collect customer ratings and view analytics.'}
                </p>
              </div>
              {storeSearch || storeCategoryFilter || storeStatusFilter !== 'active' ? (
                <button
                  onClick={() => {
                    setStoreSearch('');
                    setStoreCategoryFilter('');
                    setStoreStatusFilter('active');
                  }}
                  className="py-2 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white text-xs font-semibold"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={() => setCreateStoreModalOpen(true)}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register First Store</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ownerStores.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all"
                >
                  {/* Card Media Header */}
                  <div className="relative h-40 bg-zinc-950 overflow-hidden">
                    {s.coverImage ? (
                      <img
                        src={getAssetUrl(s.coverImage)}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-purple-950/30 text-zinc-600">
                        <Building2 className="w-10 h-10 text-zinc-700 mb-1" />
                        <span className="text-[11px] font-medium text-zinc-500">No cover photo set</span>
                      </div>
                    )}
                    {/* Status Pill Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {s.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900/90 text-amber-300 border border-amber-800/80 backdrop-blur-md">
                          Archived
                        </span>
                      )}
                    </div>

                    {/* Category & City Pills */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-zinc-300 border border-zinc-700/60 backdrop-blur-md">
                        {s.category || 'Retail'}
                      </span>
                      {s.city && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/80 backdrop-blur-md">
                          {s.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {s.name}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-400 font-bold text-xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{s.averageRating ? s.averageRating.toFixed(1) : '0.0'}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 flex items-start gap-1.5 line-clamp-2">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                        <span>{s.address}</span>
                      </p>

                      {s.description && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 italic">
                          "{s.description}"
                        </p>
                      )}

                      {/* Contact Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400">
                        {s.phone && (
                          <span className="flex items-center gap-1 text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            <span>{s.phone}</span>
                          </span>
                        )}
                        {s.website && (
                          <a
                            href={s.website.startsWith('http') ? s.website : `https://${s.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-purple-400 hover:underline bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800"
                          >
                            <Globe className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">Visit Site</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Stats & Quick Actions */}
                    <div className="pt-3 border-t border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Customer Ratings</span>
                        <span className="font-bold text-white">{s.ratingCount ?? 0} total</span>
                      </div>

                      {/* Action Buttons Toolbar */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Link
                          href={`/stores/${s.id}`}
                          target="_blank"
                          className="py-1.5 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-semibold border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Public</span>
                        </Link>

                        <button
                          onClick={() => setEditStoreModal(s)}
                          className="py-1.5 px-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/20 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStoreId(s.id);
                            setActiveTab('analytics');
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-semibold border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Analytics</span>
                        </button>

                        {s.isActive !== false ? (
                          <button
                            onClick={() => setDeleteStoreModal(s)}
                            className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/20 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Archive Store</span>
                          </button>
                        ) : (
                          <span className="py-1.5 px-2.5 rounded-xl bg-zinc-950 text-zinc-600 font-semibold border border-zinc-800 flex items-center justify-center text-[10px]">
                            Archived
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Analytics & Customer Reviews */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">

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
        </div>
      )}

      {/* Photo Gallery Tab Content */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Store Selection Toolbar & Upload CTA */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400">Select Store:</span>
              <select
                value={selectedStoreId || dashboard?.stores?.[0]?.id || ''}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value);
                  fetchOwnerPhotos(e.target.value);
                }}
                className="py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                {dashboard?.stores?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city || 'Store'})
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const currentStore =
                dashboard?.stores?.find((s) => s.id === (selectedStoreId || dashboard?.stores?.[0]?.id)) ||
                dashboard?.stores?.[0];
              return (
                <button
                  onClick={() => {
                    if (currentStore) handleOpenPhotoUpload(currentStore as any);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Official Store Photos</span>
                </button>
              );
            })()}
          </div>

          {/* Current Store Cover Preview */}
          {(() => {
            const currentStore =
              dashboard?.stores?.find((s) => s.id === (selectedStoreId || dashboard?.stores?.[0]?.id)) ||
              dashboard?.stores?.[0];
            return (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-full md:w-56 h-36 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
                  <div className="absolute flex flex-col items-center justify-center text-zinc-600">
                    <Camera className="w-8 h-8 opacity-30 mb-1" />
                    <span className="text-[10px] uppercase font-semibold">Cover Photo</span>
                  </div>
                  {currentStore?.coverImage && (
                    <img
                      src={getAssetUrl(currentStore.coverImage)}
                      alt={`${currentStore.name} cover`}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="relative z-10 w-full h-full object-cover"
                    />
                  )}
                  {currentStore?.coverImage && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-zinc-950 shadow">
                      Current Cover
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 text-center md:text-left">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Store Branding & Cover
                  </span>
                  <h3 className="text-lg font-bold text-white">{currentStore?.name}</h3>
                  <p className="text-xs text-zinc-400">
                    Your cover photo is the main hero banner displayed at the top of your public store page and on store cards across search results.
                  </p>
                  <p className="text-[11px] text-zinc-500 pt-1">
                    Select any photo in your gallery below and click &quot;Set as Cover Photo&quot; to change it immediately.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Store Gallery Grid */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Store Photos Gallery ({ownerPhotos.length})</span>
              </h3>
              <span className="text-xs text-zinc-400">
                Official and community photos for this store
              </span>
            </div>

            {loadingOwnerPhotos ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : ownerPhotos.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <Camera className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">No photos uploaded for this store yet</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Upload official high-resolution photos of your interior, storefront, or products to build trust with customers!
                </p>
                {(() => {
                  const currentStore =
                    dashboard?.stores?.find((s) => s.id === (selectedStoreId || dashboard?.stores?.[0]?.id)) ||
                    dashboard?.stores?.[0];
                  return (
                    <button
                      onClick={() => {
                        if (currentStore) handleOpenPhotoUpload(currentStore as any);
                      }}
                      className="mt-2 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Photos Now</span>
                    </button>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ownerPhotos.map((photo) => {
                  const targetStoreId = selectedStoreId || dashboard?.stores?.[0]?.id || '';
                  return (
                    <div
                      key={photo.id}
                      className="group relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-zinc-700 absolute" />
                        <img
                          src={getAssetUrl(photo.url)}
                          alt={photo.caption || 'Store photo'}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {photo.isCover && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-zinc-950 shadow">
                              Cover
                            </span>
                          )}
                          {photo.isOfficial && !photo.isCover && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-600 text-white shadow">
                              Official
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 space-y-2 bg-zinc-900/90 border-t border-zinc-800">
                        <p className="text-xs text-white line-clamp-1">
                          {photo.caption || <span className="text-zinc-500 italic">No caption</span>}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>
                            {typeof photo.userId === 'object' ? photo.userId.name : 'User'}
                          </span>
                          <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-1.5">
                          {!photo.isCover ? (
                            <button
                              onClick={() => handleSetOwnerCover(photo.id, targetStoreId)}
                              className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-1"
                            >
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Set Cover</span>
                            </button>
                          ) : (
                            <span className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold bg-amber-500/20 text-amber-400 text-center">
                              Active Cover
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteOwnerPhoto(photo.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                            title="Delete photo from store"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Create / Register Store Modal */}
      <StoreFormModal
        isOpen={createStoreModalOpen}
        mode="create"
        onClose={() => setCreateStoreModalOpen(false)}
        onSuccess={(savedStore) => handleStoreSaved(savedStore, false)}
      />

      {/* Edit Store Modal */}
      <StoreFormModal
        isOpen={!!editStoreModal}
        mode="edit"
        store={editStoreModal}
        onClose={() => setEditStoreModal(null)}
        onSuccess={(savedStore) => handleStoreSaved(savedStore, true)}
      />

      {/* Delete / Archive Confirmation Modal */}
      <DeleteStoreModal
        isOpen={!!deleteStoreModal}
        store={deleteStoreModal}
        onClose={() => setDeleteStoreModal(null)}
        onSuccess={(deletedStoreId) => handleStoreDeleted(deletedStoreId)}
      />

      {/* Photo Upload Modal for Store Owner */}
      {activeStoreForUpload && (
        <PhotoUploadModal
          isOpen={photoUploadModalOpen}
          storeId={activeStoreForUpload.id}
          storeName={activeStoreForUpload.name}
          isOwner={true}
          onClose={() => {
            setPhotoUploadModalOpen(false);
            setActiveStoreForUpload(null);
          }}
          onSuccess={(newPhotos) => {
            setOwnerPhotos((prev) => [...newPhotos, ...prev]);
            fetchOwnerPhotos(activeStoreForUpload.id);
          }}
        />
      )}
    </div>
  );
}
