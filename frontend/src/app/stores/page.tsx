'use client';

import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Store, Pagination, StoreStats } from '../../types';
import { StoreCard } from '../../components/StoreCard';
import { RatingModal } from '../../components/RatingModal';
import { useAuth } from '../../context/AuthContext';

export default function StoresPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<'name' | 'averageRating' | 'ratingCount'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStoreForRating, setSelectedStoreForRating] = useState<Store | null>(null);

  const [reloadTrigger, setReloadTrigger] = useState(0);

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
          const msg = err instanceof Error ? err.message : 'Failed to load stores. Make sure the backend server is running.';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, pagination.page, pagination.limit, sort, order, reloadTrigger]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-zinc-800 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Store Directory</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Browse registered stores, view community averages, and submit your verified ratings
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span>Logged in as:</span>
            <span className="font-bold text-amber-400">{user.name}</span>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores by name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-xs text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Field */}
        <div className="md:col-span-4 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'name' | 'averageRating' | 'ratingCount')}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
          >
            <option value="name">Sort by Name</option>
            <option value="averageRating">Sort by Average Rating</option>
            <option value="ratingCount">Sort by Total Ratings</option>
          </select>
        </div>

        {/* Order toggle */}
        <div className="md:col-span-2">
          <button
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{order === 'asc' ? 'Ascending (A–Z / Low)' : 'Descending (Z–A / High)'}</span>
          </button>
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
        ) : stores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onOpenRating={(s) => setSelectedStoreForRating(s)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
            <StoreIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No stores match your search</h3>
            <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
              {search
                ? `No stores found matching "${search}". Try searching for another keyword.`
                : 'No active stores available in the directory.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-xs font-semibold text-amber-400 hover:underline"
              >
                Clear Search Filter
              </button>
            )}
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
