'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, Loader2, Store as StoreIcon } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Store, StoreStats } from '../../types';
import { StoreCard } from '../../components/StoreCard';
import { RatingModal } from '../../components/RatingModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [favorites, setFavorites] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStoreForRating, setSelectedStoreForRating] = useState<Store | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    api
      .get<{ favorites: Store[] }>('/stores/favorites')
      .then((res) => {
        if (res.data?.favorites) {
          setFavorites(res.data.favorites);
        }
      })
      .catch((err) => {
        console.error('Failed to load favorites:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  const handleToggleFavorite = async (storeId: string) => {
    try {
      const res = await api.post<{ isFavorite: boolean; message: string }>(`/stores/${storeId}/favorite`);
      setFavorites((prev) => prev.filter((s) => s.id !== storeId));
      success(res.data?.message || 'Removed from favorites');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update favorites.';
      toastError(msg);
    }
  };

  const handleRatingSubmitted = (storeId: string, rating: number, storeStats?: StoreStats) => {
    setFavorites((prev) =>
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

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Heart className="w-12 h-12 text-zinc-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In to View Favorites</h2>
        <p className="text-xs text-zinc-400">
          Save your favorite stores and quickly view their ratings and reviews anytime.
        </p>
        <Link
          href="/login"
          className="inline-block py-2.5 px-6 rounded-xl bg-amber-500 font-bold text-xs text-zinc-950"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/stores"
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </Link>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            <span>My Favorite Stores</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Your personal saved collection of top rated stores
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <StoreIcon className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No favorites saved yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Explore the store directory and click the heart icon on any store to bookmark it here.
          </p>
          <div className="pt-2">
            <Link
              href="/stores"
              className="inline-block py-2.5 px-5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Explore Stores
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((store) => (
            <StoreCard
              key={store.id}
              store={{ ...store, isFavorite: true }}
              onOpenRating={(s) => setSelectedStoreForRating(s)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
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
