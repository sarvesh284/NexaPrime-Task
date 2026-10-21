'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Star, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { Store, StoreStats } from '../../../types';
import { StarRating } from '../../../components/StarRating';
import { RatingModal } from '../../../components/RatingModal';
import { useAuth } from '../../../context/AuthContext';

function StoreDetailContent() {
  const routeParams = useParams();
  const storeId = routeParams?.id as string;
  const { user } = useAuth();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    const fetchStore = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ store: Store }>(`/stores/${storeId}`);
        if (res.data?.store) {
          setStore(res.data.store);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Store not found or inactive';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeId]);

  const handleRatingSubmitted = (_id: string, rating: number, storeStats?: StoreStats) => {
    if (store) {
      setStore({
        ...store,
        myRating: rating,
        averageRating: storeStats?.averageRating ?? store.averageRating,
        ratingCount: storeStats?.ratingCount ?? store.ratingCount,
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 w-full animate-pulse space-y-6">
        <div className="w-24 h-6 rounded bg-zinc-800" />
        <div className="w-2/3 h-10 rounded bg-zinc-800" />
        <div className="h-40 rounded-2xl bg-zinc-900 border border-zinc-800" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Store Not Found</h2>
        <p className="text-xs text-zinc-400 mt-1">{error || 'This store does not exist or has been deactivated.'}</p>
        <Link
          href="/stores"
          className="mt-6 inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store Directory</span>
        </Link>
      </div>
    );
  }

  const isOwner = user?.role === 'STORE_OWNER';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Back Link */}
      <Link
        href="/stores"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Stores</span>
      </Link>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                Verified Store
              </span>
              {store.myRating && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Your Rating: {store.myRating} ★
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{store.name}</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
              <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>{store.address}</span>
            </div>
          </div>

          {!isOwner && (
            <button
              onClick={() => setRatingModalOpen(true)}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{store.myRating ? 'Update Your Rating' : 'Rate This Store'}</span>
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium">Average Community Score</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-white">
                {store.averageRating > 0 ? store.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs text-zinc-500 font-medium">/ 5.0</span>
            </div>
            <div className="mt-2">
              <StarRating value={store.averageRating} size="md" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium">Total Reviews</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-white">{store.ratingCount}</span>
              <span className="text-xs text-zinc-500 font-medium">submissions</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {store.ratingCount === 0 ? 'Be the first user to submit a rating!' : 'Verified unique user ratings'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium">Your Score</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-amber-400">
                {store.myRating ? `${store.myRating}.0` : '—'}
              </span>
              {store.myRating && <span className="text-xs text-zinc-500 font-medium">/ 5.0</span>}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {store.myRating ? 'You can update your rating anytime' : 'Sign in as user to submit your rating'}
            </p>
          </div>
        </div>
      </div>

      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        store={store}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </div>
  );
}

export default function StoreDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 w-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <StoreDetailContent />
    </Suspense>
  );
}
