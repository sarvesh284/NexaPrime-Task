'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
  Columns,
  Loader2,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { RatingModal } from '../../components/RatingModal';
import { StoreCard } from '../../components/StoreCard';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, getAssetUrl } from '../../lib/api';
import { Pagination, Store, StoreStats } from '../../types';

// Dynamically import MaharashtraMap without SSR to guarantee safety with Leaflet window APIs
const MaharashtraMap = dynamic(
  () => import('../../components/MaharashtraMap').then((mod) => mod.MaharashtraMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] rounded-2xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 animate-pulse flex flex-col items-center justify-center p-6 text-slate-500 dark:text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-semibold">Loading Maharashtra Interactive Map & Stores...</p>
      </div>
    ),
  }
);

// Prominent Maharashtra Hub Cities for fast filtering
const MAHARASHTRA_CITIES = [
  'Mumbai',
  'Pune',
  'Nagpur',
  'Nashik',
  'Kolhapur',
  'Sangli',
  'Chhatrapati Sambhajinagar',
  'Satara',
  'Solapur',
];

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function StoresPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [stores, setStores] = useState<Store[]>([]);
  const [trendingStores, setTrendingStores] = useState<Store[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'split' | 'map'>('grid');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 18,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [minRating, setMinRating] = useState<number | ''>('');

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [sort, setSort] = useState<'name' | 'averageRating' | 'ratingCount' | 'bayesianRating' | 'distance'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User geolocation state (Near Me)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [selectedStoreForRating, setSelectedStoreForRating] = useState<Store | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Fetch filter options and trending stores on mount
  useEffect(() => {
    api
      .get<{ categories: string[]; cities: string[] }>('/stores/filter-options')
      .then((res) => {
        if (res.data) {
          setAvailableCategories(res.data.categories || []);
          // Combine API cities with Maharashtra hub cities without duplicates
          const combinedCities = Array.from(
            new Set([...MAHARASHTRA_CITIES, ...(res.data.cities || [])])
          ).sort();
          setAvailableCities(combinedCities);
        }
      })
      .catch(() => {
        setAvailableCities(MAHARASHTRA_CITIES);
      });

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

  // Fetch stores from backend
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api
      .get<{ stores: Store[] }>('/stores', {
        params: {
          search: debouncedSearch || undefined,
          category: category || undefined,
          city: city || undefined,
          minRating: minRating !== '' ? minRating : undefined,
          page: pagination.page,
          limit: pagination.limit,
          sort: sort === 'distance' ? 'name' : sort,
          order,
        },
      })
      .then((res) => {
        if (isMounted) {
          if (res.data?.stores) {
            setStores(res.data.stores);
            // Default select the first mapped store if none selected
            if (!selectedStoreId && res.data.stores.length > 0) {
              const firstMapped = res.data.stores.find((s) => s.coordinates?.lat);
              if (firstMapped) {
                setSelectedStoreId(firstMapped.id);
              }
            }
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

  // Compute store distances if userLocation is known
  const displayedStores = useMemo(() => {
    const list = stores.map((s) => {
      if (userLocation && s.coordinates?.lat && s.coordinates?.lng) {
        const d = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          s.coordinates.lat,
          s.coordinates.lng
        );
        return { ...s, distanceKm: d };
      }
      return { ...s, distanceKm: undefined };
    });

    if (sort === 'distance' && userLocation) {
      return [...list].sort((a, b) => {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return order === 'asc' ? a.distanceKm - b.distanceKm : b.distanceKm - a.distanceKm;
      });
    }

    return list;
  }, [stores, userLocation, sort, order]);

  // Find currently selected store object
  const selectedStore = useMemo(() => {
    return displayedStores.find((s) => s.id === selectedStoreId) || null;
  }, [displayedStores, selectedStoreId]);

  // Handle rating submission
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

  // Toggle favorite
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

  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setMinRating('');
    setSort('name');
    setOrder('asc');
    setUserLocation(null);
  };

  // Explicit user geolocation request
  const handleRequestNearMe = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toastError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setSort('distance');
        setOrder('asc');
        setIsLocating(false);
        success('Location detected! Stores sorted by distance from you.');
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not retrieve your location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can filter by Maharashtra cities manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Current location is unavailable on your device.';
        }
        toastError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [success, toastError]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 transition-colors">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Maharashtra Store Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Interactive Map Active
            </span>
          </div>
          <p className="text-slate-600 dark:text-zinc-400 text-sm mt-1">
            Explore verified stores across Maharashtra cities with real-time ratings, photo galleries, and GPS mapping.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 shadow-sm">
            <span>Signed in as:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{user.name}</span>
          </div>
        )}
      </div>

      {/* Trending Stores Highlight Banner */}
      {trendingStores.length > 0 && (
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>Trending & Top-Rated Maharashtra Stores This Week</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              Ranked by community verified reviews
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {trendingStores.map((ts) => (
              <Link
                key={ts.id}
                href={`/stores/${ts.id}`}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors shrink-0 text-xs shadow-sm group"
              >
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {ts.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">{ts.city}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
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
          {/* Search by name or address */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              id="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search store name, address, or landmark..."
              className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
            />
            {search && (
              <button
                id="search-clear-btn"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-[11px] text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              id="category-filter-select"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer shadow-sm"
            >
              <option value="">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Maharashtra City Filter */}
          <div className="md:col-span-2">
            <select
              id="city-filter-select"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer shadow-sm"
            >
              <option value="">All Maharashtra Cities</option>
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
              id="rating-filter-select"
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value ? parseFloat(e.target.value) : '');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer shadow-sm"
            >
              <option value="">Any Rating</option>
              <option value="3">3+ Stars ★</option>
              <option value="4">4+ Stars ★</option>
              <option value="4.5">4.5+ Stars ★</option>
            </select>
          </div>
        </div>

        {/* Secondary Row: Sorting, Near Me, View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Near Me Geolocation Button */}
            <button
              id="near-me-btn"
              onClick={handleRequestNearMe}
              disabled={isLocating}
              className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                userLocation
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}
              title="Locate my position and sort stores by proximity"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-blue-500" />
              )}
              <span>{userLocation ? 'Near Me (Active)' : 'Near Me'}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
            >
              <option value="name">Store Name</option>
              <option value="averageRating">Average Rating</option>
              <option value="ratingCount">Review Count</option>
              <option value="bayesianRating">Bayesian Quality Score</option>
              {userLocation && <option value="distance">Proximity (Distance)</option>}
            </select>

            <button
              id="order-toggle-btn"
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              className="py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{order === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {(search || category || city || minRating !== '' || userLocation) && (
              <button
                id="reset-filters-btn"
                onClick={resetFilters}
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold"
              >
                Reset All Filters
              </button>
            )}

            {/* View Mode Switcher: Grid View | Split View | Map View */}
            <div className="flex items-center rounded-xl bg-slate-200/80 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 p-0.5 shadow-sm">
              <button
                id="view-mode-grid"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View stores in multi-column grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              <button
                id="view-mode-split"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'split'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View interactive map and store list side-by-side"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>

              <button
                id="view-mode-map"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'map'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Full-page Maharashtra map view"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        {error ? (
          <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-rose-800 dark:text-rose-200">Unable to load stores</h3>
            <p className="text-xs text-rose-600 dark:text-rose-300/80 mt-1">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setReloadTrigger((t) => t + 1);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 animate-pulse p-6 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-3">
                  <div className="w-24 h-5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                  <div className="w-3/4 h-6 rounded-lg bg-slate-200 dark:bg-zinc-800" />
                  <div className="w-full h-4 rounded-lg bg-slate-100 dark:bg-zinc-800/60" />
                </div>
                <div className="w-full h-9 rounded-xl bg-slate-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : viewMode === 'split' ? (
          /* Split View: Interactive Map (left/top) + Synchronized Store Cards List (right/bottom) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
            {/* Interactive Real Leaflet Map */}
            <div className="lg:col-span-7 h-[450px] lg:h-[680px] sticky top-20 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-zinc-800">
              <MaharashtraMap
                stores={displayedStores}
                selectedStoreId={selectedStoreId}
                onSelectStore={(st) => setSelectedStoreId(st.id)}
                onNearMeLocation={(coords) => {
                  setUserLocation(coords);
                  setSort('distance');
                  setOrder('asc');
                }}
              />
            </div>

            {/* Scrollable Synchronized Store Cards List */}
            <div className="lg:col-span-5 flex flex-col space-y-4 max-h-[680px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between px-1 py-1">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {displayedStores.length} Stores Found
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-500">
                  Click a store card to pan on map
                </span>
              </div>

              {displayedStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  isSelected={store.id === selectedStoreId}
                  onCardClick={(s) => setSelectedStoreId(s.id)}
                  distanceKm={(store as any).distanceKm}
                  onOpenRating={(s) => setSelectedStoreForRating(s)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        ) : viewMode === 'map' ? (
          /* Full Map View: Large interactive surface with Selected Store Card Drawer */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
            {/* Real Interactive Leaflet Map Surface */}
            <div className="lg:col-span-8 h-[520px] lg:h-[640px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800">
              <MaharashtraMap
                stores={displayedStores}
                selectedStoreId={selectedStoreId}
                onSelectStore={(st) => setSelectedStoreId(st.id)}
                onNearMeLocation={(coords) => {
                  setUserLocation(coords);
                  setSort('distance');
                  setOrder('asc');
                }}
              />
            </div>

            {/* Selected Store Inspector & Quick Action Panel */}
            <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-xl">
              {selectedStore ? (
                <div className="space-y-4">
                  {/* Category & Favorite Header */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {selectedStore.category || 'Store'}
                    </span>
                    <button
                      onClick={() => handleToggleFavorite(selectedStore.id)}
                      className="text-xs text-slate-500 dark:text-zinc-400 hover:text-rose-500 transition-colors"
                    >
                      {selectedStore.isFavorite ? 'Saved ❤️' : 'Save Store'}
                    </button>
                  </div>

                  {/* Thumbnail Preview */}
                  {selectedStore.coverImage && (
                    <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                      <img
                        src={getAssetUrl(selectedStore.coverImage)}
                        alt={selectedStore.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedStore.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{selectedStore.address}</span>
                    </div>
                  </div>

                  {selectedStore.description && (
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                      {selectedStore.description}
                    </p>
                  )}

                  {/* Scores Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                        Community Rating
                      </p>
                      <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                        {selectedStore.averageRating > 0 ? selectedStore.averageRating.toFixed(1) : '0.0'} ★
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Reviews</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedStore.ratingCount} ratings
                      </p>
                    </div>
                  </div>

                  {/* GPS & Distance Data */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800/80">
                    <span>
                      {selectedStore.coordinates
                        ? `GPS: ${selectedStore.coordinates.lat.toFixed(4)}, ${selectedStore.coordinates.lng.toFixed(4)}`
                        : 'No coordinates stored'}
                    </span>
                    {(selectedStore as any).distanceKm !== undefined && (
                      <span className="font-sans font-bold text-blue-600 dark:text-blue-400">
                        {(selectedStore as any).distanceKm.toFixed(1)} km away
                      </span>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      href={`/stores/${selectedStore.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      <span>View Full Store Details & Reviews</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {user && user.role === 'USER' && (
                      <button
                        onClick={() => setSelectedStoreForRating(selectedStore)}
                        className="w-full py-2 px-4 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-semibold text-xs transition-colors"
                      >
                        {selectedStore.myRating ? 'Update Your Rating' : 'Rate This Store'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500 dark:text-zinc-500">
                  <MapPin className="w-10 h-10 text-slate-400 dark:text-zinc-700 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                    No Store Selected
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Click any marker pin on the Maharashtra map to inspect its location, verified community rating, and photo gallery.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : displayedStores.length > 0 ? (
          /* Multi-column Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                distanceKm={(store as any).distanceKm}
                onOpenRating={(s) => setSelectedStoreForRating(s)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60 space-y-2 shadow-sm">
            <StoreIcon className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No stores match your filters
            </h3>
            <p className="text-slate-500 dark:text-zinc-400 text-xs max-w-sm mx-auto">
              Try adjusting your category, city, or minimum rating filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-zinc-800 pt-6">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Showing Page <span className="font-bold text-slate-900 dark:text-white">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{pagination.totalPages}</span> ({pagination.total} stores total)
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-amber-700 dark:text-amber-400">
              {pagination.page}
            </span>

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
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
