'use client';

import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Store as StoreIcon,
  Flame,
  LayoutGrid,
  MapPin,
  Map as MapIcon,
  Navigation,
  Star,
  ExternalLink,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RatingModal } from '../../components/RatingModal';
import { StoreCard } from '../../components/StoreCard';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { Pagination, Store, StoreStats } from '../../types';

export default function StoresPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [stores, setStores] = useState<Store[]>([]);
  const [trendingStores, setTrendingStores] = useState<Store[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedMapStore, setSelectedMapStore] = useState<Store | null>(null);

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [minRating, setMinRating] = useState<number | ''>('');

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [sort, setSort] = useState<'name' | 'averageRating' | 'ratingCount' | 'bayesianRating'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStoreForRating, setSelectedStoreForRating] = useState<Store | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Fetch filter options and trending stores on mount (N4: Trending Stores)
  useEffect(() => {
    api
      .get<{ categories: string[]; cities: string[] }>('/stores/filter-options')
      .then((res) => {
        if (res.data) {
          setAvailableCategories(res.data.categories || []);
          setAvailableCities(res.data.cities || []);
        }
      })
      .catch(() => { });

    api
      .get<{ stores: Store[] }>('/stores/trending')
      .then((res) => {
        if (res.data?.stores) {
          setTrendingStores(res.data.stores);
        }
      })
      .catch(() => {});
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    api
      .get<{ stores: Store[] }>('/stores', {
        params: {
          search: debouncedSearch || undefined,
          category: category || undefined,
          city: city || undefined,
          minRating: minRating !== '' ? minRating : undefined,
          page: pagination.page,
          limit: pagination.limit,
          sort,
          order,
        },
      })
      .then((res) => {
        if (isMounted) {
          if (res.data?.stores) {
            setStores(res.data.stores);
          }
          if (res.pagination) {
            setPagination(res.pagination);
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load stores.';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    debouncedSearch,
    category,
    city,
    minRating,
    pagination.page,
    pagination.limit,
    sort,
    order,
    reloadTrigger,
  ]);

  const handleRatingSubmitted = (storeId: string, rating: number, storeStats?: StoreStats) => {
    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId
          ? {
            ...s,
            myRating: rating,
            averageRating: storeStats?.averageRating ?? s.averageRating,
            ratingCount: storeStats?.ratingCount ?? s.ratingCount,
          }
          : s
      )
    );
  };

  const handleToggleFavorite = async (storeId: string) => {
    if (!user) {
      toastError('Please sign in to save stores to your favorites.');
      return;
    }

    try {
      const res = await api.post<{ isFavorite: boolean; message: string }>(`/stores/${storeId}/favorite`);
      setStores((prev) =>
        prev.map((s) =>
          s.id === storeId ? { ...s, isFavorite: res.data?.isFavorite } : s
        )
      );
      success(res.data?.message || 'Favorites updated');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update favorites.';
      toastError(msg);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setMinRating('');
    setSort('name');
    setOrder('asc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-zinc-800 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Store Directory</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Browse registered stores, filter by category, city, and quality scores
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span>Logged in as:</span>
            <span className="font-bold text-amber-400">{user.name}</span>
          </div>
        )}
      </div>

      {/* Feature N4: Trending Stores Highlight Banner */}
      {trendingStores.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
              <span>Trending & Active Stores This Week</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">Ranked by recent verified community reviews</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {trendingStores.map((ts) => (
              <Link
                key={ts.id}
                href={`/stores/${ts.id}`}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 transition-colors shrink-0 text-xs group"
              >
                <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                  {ts.name}
                </span>
                <span className="text-[11px] text-zinc-400">{ts.city}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  {ts.averageRating > 0 ? ts.averageRating.toFixed(1) : '5.0'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Discovery Filters Bar */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by store name or address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-[11px] text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
            >
              <option value="">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="md:col-span-2">
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
            >
              <option value="">All Cities</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Min Rating Filter */}
          <div className="md:col-span-2">
            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value ? parseFloat(e.target.value) : '');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
            >
              <option value="">Any Rating</option>
              <option value="3">3+ Stars ★</option>
              <option value="4">4+ Stars ★</option>
              <option value="4.5">4.5+ Stars ★</option>
            </select>
          </div>
        </div>

        {/* Secondary Row: Sorting & Reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="name">Name</option>
              <option value="averageRating">Average Rating</option>
              <option value="ratingCount">Total Ratings</option>
              <option value="bayesianRating">Bayesian Quality Score</option>
            </select>

            <button
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{order === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {(search || category || city || minRating !== '') && (
              <button
                onClick={resetFilters}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Reset All Filters
              </button>
            )}

            {/* View Mode Switcher (S3: Map-Based Discovery) */}
            <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('map');
                  if (!selectedMapStore && stores.length > 0) {
                    setSelectedMapStore(stores[0]);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'map'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {error ? (
          <div className="p-8 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-rose-200">Unable to load stores</h3>
            <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setReloadTrigger((t) => t + 1);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-24 h-5 rounded-full bg-zinc-800" />
                  <div className="w-3/4 h-6 rounded-lg bg-zinc-800" />
                  <div className="w-full h-4 rounded-lg bg-zinc-800/60" />
                </div>
                <div className="w-full h-9 rounded-xl bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          /* Feature S3: Map-Based Discovery View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
            {/* Interactive Geolocated Map Surface */}
            <div className="lg:col-span-8 rounded-3xl bg-zinc-950 border border-zinc-800 p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(#f59e0b 1px, transparent 1px), linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)',
                  backgroundSize: '24px 24px, 48px 48px, 48px 48px',
                }}
              />

              <div className="relative z-10 flex items-center justify-between pb-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">Geolocated Discovery Map</span>
                  <span className="text-[11px] text-zinc-500">
                    ({stores.filter((s) => s.coordinates?.lat).length} mapped locations)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  GPS Active
                </span>
              </div>

              <div className="relative z-10 flex-1 my-6 min-h-[340px] rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-6 flex flex-wrap items-center justify-around gap-4 overflow-y-auto">
                {stores.map((s) => {
                  const isSelected = selectedMapStore?.id === s.id;
                  const hasCoords = !!s.coordinates?.lat;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedMapStore(s)}
                      className={`relative group p-3.5 rounded-2xl border transition-all text-left w-[180px] flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-500/10 scale-105'
                          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 font-black'
                              : 'bg-zinc-800 text-amber-400 group-hover:bg-amber-500/20'
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-amber-400">
                          {s.averageRating > 0 ? `${s.averageRating.toFixed(1)} ★` : 'New'}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-white truncate w-full">{s.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate w-full">{s.city || 'Location'}</p>

                      {hasCoords ? (
                        <span className="text-[9px] font-mono text-zinc-500 truncate w-full">
                          {s.coordinates!.lat.toFixed(2)}°N, {Math.abs(s.coordinates!.lng).toFixed(2)}°W
                        </span>
                      ) : (
                        <span className="text-[9px] text-zinc-600 italic">Address listed</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80">
                <span>Verified business location coordinates</span>
                <span className="text-zinc-400">Click a marker pin to preview store profile</span>
              </div>
            </div>

            {/* Selected Store Map Side Panel */}
            <div className="lg:col-span-4 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
              {selectedMapStore ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {selectedMapStore.category || 'Store'}
                    </span>
                    <button
                      onClick={() => handleToggleFavorite(selectedMapStore.id)}
                      className="text-xs text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      {selectedMapStore.isFavorite ? 'Saved ❤️' : 'Save Store'}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">{selectedMapStore.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{selectedMapStore.address}</span>
                    </div>
                  </div>

                  {selectedMapStore.description && (
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {selectedMapStore.description}
                    </p>
                  )}

                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-medium">Community Score</p>
                      <p className="text-lg font-black text-amber-400">
                        {selectedMapStore.averageRating > 0 ? selectedMapStore.averageRating.toFixed(1) : '0.0'} ★
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-medium">Rating Count</p>
                      <p className="text-lg font-bold text-white">{selectedMapStore.ratingCount} reviews</p>
                    </div>
                  </div>

                  {selectedMapStore.coordinates && (
                    <div className="text-[11px] text-zinc-400 font-mono bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
                      GPS: {selectedMapStore.coordinates.lat.toFixed(6)}, {selectedMapStore.coordinates.lng.toFixed(6)}
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      href={`/stores/${selectedMapStore.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      <span>View Full Store Details & Reviews</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {user && user.role === 'USER' && (
                      <button
                        onClick={() => setSelectedStoreForRating(selectedMapStore)}
                        className="w-full py-2 px-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
                      >
                        {selectedMapStore.myRating ? 'Update Your Rating' : 'Rate This Store'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-zinc-500">
                  <MapPin className="w-10 h-10 text-zinc-700 mx-auto" />
                  <h4 className="text-sm font-bold text-zinc-300">No Store Selected</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Click any store pin on the discovery map to preview its location coordinates, community rating, and profile.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : stores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onOpenRating={(s) => setSelectedStoreForRating(s)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
            <StoreIcon className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No stores match your filters</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              Try adjusting your category, city, or minimum rating filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-3 text-xs font-semibold text-amber-400 hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between border-t border-zinc-800 pt-6">
          <p className="text-xs text-zinc-400">
            Showing Page <span className="font-bold text-white">{pagination.page}</span> of{' '}
            <span className="font-bold text-white">{pagination.totalPages}</span> ({pagination.total} stores total)
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 text-amber-400">
              {pagination.page}
            </span>

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={Boolean(selectedStoreForRating)}
        onClose={() => setSelectedStoreForRating(null)}
        store={selectedStoreForRating}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </div>
  );
}
