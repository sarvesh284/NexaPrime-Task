'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Star,
  Store as StoreIcon,
  MessageSquare,
  Calendar,
  ThumbsUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { UserRatingHistoryItem, Pagination, Store } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { RatingModal } from '../../components/RatingModal';
import { useToast } from '../../components/Toast';

export default function MyRatingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success } = useToast();
  const [ratings, setRatings] = useState<UserRatingHistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const fetchMyRatings = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await api.get<{ ratings: UserRatingHistoryItem[] }>(
        `/stores/my-ratings/history?page=${page}&limit=10`
      );
      setRatings(res.data?.ratings || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch rating history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMyRatings(1);
    }
  }, [authLoading, user, fetchMyRatings]);

  const handleEditClick = (item: UserRatingHistoryItem) => {
    setEditingStore({
      id: item.storeId,
      name: item.storeName,
      address: item.storeAddress,
      category: item.storeCategory,
      city: item.storeCity,
      isActive: true,
      ratingCount: item.storeRatingCount,
      averageRating: item.storeAverageRating,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      myRating: item.value,
    });
  };

  const handleRatingSubmitSuccess = () => {
    success('Review updated successfully!');
    setEditingStore(null);
    fetchMyRatings(pagination.page);
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center">
        <StoreIcon className="w-12 h-12 text-zinc-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sign in to view your reviews</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Access your personal rating history, edit comments, and see responses from store owners.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
              <span>My Review History</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Track, view, and update all the ratings and feedback you have submitted on RateLocal.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              {pagination.total} Total {pagination.total === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm text-zinc-400">Loading your review history...</span>
          </div>
        ) : ratings.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-800 rounded-3xl p-8 bg-zinc-900/30 flex flex-col items-center justify-center">
            <MessageSquare className="w-12 h-12 text-zinc-700 mb-3" />
            <h3 className="text-lg font-bold text-white">No reviews yet</h3>
            <p className="text-sm text-zinc-400 max-w-sm mt-1 mb-6">
              You haven't submitted any store ratings yet. Explore nearby registered stores and share your feedback!
            </p>
            <Link
              href="/stores"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold transition-all shadow-md shadow-amber-500/20"
            >
              Explore Stores
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 transition-all shadow-lg shadow-black/40"
              >
                {/* Store Header & Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/60">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/stores/${item.storeId}`}
                        className="text-base font-bold text-white hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{item.storeName}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </Link>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                        {item.storeCategory}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                        {item.storeCity}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{item.storeAddress}</span>
                    </p>
                  </div>

                  {/* Rating Stars Badge & Edit Button */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.value ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-amber-400">{item.value}.0</span>
                    </div>

                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors border border-zinc-800"
                      title="Edit this review"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Review Comment Body */}
                <div className="py-3.5">
                  {item.comment ? (
                    <p className="text-sm text-zinc-300 leading-relaxed italic">
                      "{item.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No written comment provided.</p>
                  )}
                </div>

                {/* Owner Reply Banner if present */}
                {item.ownerReply && (
                  <div className="mt-2 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 relative">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">Response from Store Owner</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(item.ownerReply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed pl-6">
                      {item.ownerReply.text}
                    </p>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/50 mt-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Reviewed {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                    {item.helpfulCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{item.helpfulCount} people found helpful</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                <span className="text-xs text-zinc-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchMyRatings(pagination.page - 1)}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchMyRatings(pagination.page + 1)}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Rating Modal */}
      {editingStore && (
        <RatingModal
          isOpen={Boolean(editingStore)}
          store={editingStore}
          onClose={() => setEditingStore(null)}
          onRatingSubmitted={handleRatingSubmitSuccess}
        />
      )}
    </div>
  );
}
