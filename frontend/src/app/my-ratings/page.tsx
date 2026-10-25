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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200/90 dark:border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
              <span>My Review History</span>
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-1">
              Track, view, and update all the ratings and feedback you have submitted on RateLocal.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-xs tabular-nums">
              {pagination.total} Total {pagination.total === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm text-slate-400 dark:text-zinc-400">Loading your review history...</span>
          </div>
        ) : ratings.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-8 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-zinc-700 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No reviews yet</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mt-1 mb-6">
              You haven&apos;t submitted any store ratings yet. Explore nearby registered stores and share your feedback!
            </p>
            <Link
              href="/stores"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-all shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-98"
            >
              Explore Stores
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all shadow-sm"
              >
                {/* Store Header & Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800/60">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/stores/${item.storeId}`}
                        className="text-base font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{item.storeName}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </Link>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/50">
                        {item.storeCategory}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/50">
                        {item.storeCity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{item.storeAddress}</span>
                    </p>
                  </div>

                  {/* Rating Stars Badge & Edit Button */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-zinc-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">{item.value}.0</span>
                    </div>

                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border border-slate-200 dark:border-zinc-800"
                      title="Edit this review"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Review Comment Body */}
                <div className="py-3.5">
                  {item.comment ? (
                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                      &quot;{item.comment}&quot;
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No written comment provided.</p>
                  )}
                </div>

                {/* Owner Reply Banner if present */}
                {item.ownerReply && (
                  <div className="mt-2 p-3.5 rounded-xl bg-purple-50/70 dark:bg-zinc-950 border border-purple-200 dark:border-purple-500/30 relative">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-purple-800 dark:text-purple-300">Response from Store Owner</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
                        {new Date(item.ownerReply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed pl-6">
                      {item.ownerReply.text}
                    </p>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-3 tabular-nums">
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
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
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
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchMyRatings(pagination.page - 1)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchMyRatings(pagination.page + 1)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
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
