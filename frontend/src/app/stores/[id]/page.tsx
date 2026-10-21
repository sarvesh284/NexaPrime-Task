'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Star,
  Sparkles,
  Loader2,
  AlertCircle,
  Heart,
  ThumbsUp,
  Flag,
  MessageSquare,
  Clock,
  User as UserIcon,
  X,
  ShieldAlert,
} from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { Store, StoreStats, Review, RatingDistribution } from '../../../types';
import { StarRating } from '../../../components/StarRating';
import { RatingModal } from '../../../components/RatingModal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Toast';

function StoreDetailContent() {
  const routeParams = useParams();
  const storeId = routeParams?.id as string;
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [userRatingComment, setUserRatingComment] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [distribution, setDistribution] = useState<RatingDistribution>({
    1: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    5: { count: 0, percentage: 0 },
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSort, setReviewSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');

  // Report modal state
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<'INAPPROPRIATE' | 'SPAM' | 'OFFENSIVE' | 'SUSPICIOUS' | 'OTHER'>('INAPPROPRIATE');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchStore = useCallback(async () => {
    if (!storeId) return;
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
  }, [storeId]);

  const fetchReviews = useCallback(async () => {
    if (!storeId) return;
    try {
      setReviewsLoading(true);
      const res = await api.get<{
        reviews: Review[];
        distribution: RatingDistribution;
      }>(`/stores/${storeId}/reviews`, {
        params: { sort: reviewSort, limit: 20 },
      });
      if (res.data) {
        setReviews(res.data.reviews || []);
        if (res.data.distribution) {
          setDistribution(res.data.distribution);
        }
      }
    } catch (err) {
      console.error('Failed to fetch store reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [storeId, reviewSort]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Fetch current user rating details
  useEffect(() => {
    if (user && storeId) {
      api.get<{ myRating: number | null; comment: string | null }>(`/stores/${storeId}/my-rating`)
        .then((res) => {
          if (res.data) {
            setUserRatingComment(res.data.comment || null);
          }
        })
        .catch(() => {});
    }
  }, [user, storeId]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toastError('Please sign in to save stores to your favorites.');
      return;
    }

    try {
      const res = await api.post<{ isFavorite: boolean; message: string }>(`/stores/${storeId}/favorite`);
      if (store) {
        setStore({ ...store, isFavorite: res.data?.isFavorite });
      }
      success(res.data?.message || 'Favorites updated');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update favorites.';
      toastError(msg);
    }
  };

  const handleRatingSubmitted = (_id: string, rating: number, storeStats?: StoreStats) => {
    if (store) {
      setStore({
        ...store,
        myRating: rating,
        averageRating: storeStats?.averageRating ?? store.averageRating,
        ratingCount: storeStats?.ratingCount ?? store.ratingCount,
      });
    }
    fetchReviews();
  };

  const handleToggleHelpful = async (reviewId: string) => {
    if (!user) {
      toastError('Please sign in to vote on reviews.');
      return;
    }

    try {
      const res = await api.post<{ helpfulCount: number; hasVotedHelpful: boolean }>(
        `/stores/reviews/${reviewId}/helpful`
      );

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                helpfulCount: res.data?.helpfulCount ?? r.helpfulCount,
                hasVotedHelpful: res.data?.hasVotedHelpful ?? false,
              }
            : r
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Unable to record helpful vote.';
      toastError(msg);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReviewId) return;

    if (!user) {
      toastError('Please sign in to submit a review report.');
      return;
    }

    try {
      setIsSubmittingReport(true);
      await api.post(`/stores/reviews/${reportingReviewId}/report`, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });

      success('Report submitted. Our moderation team will investigate.');
      setReportingReviewId(null);
      setReportDetails('');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to report review.';
      toastError(msg);
    } finally {
      setIsSubmittingReport(false);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Back Link */}
      <Link
        href="/stores"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Store Directory</span>
      </Link>

      {/* Main Store Banner Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                Verified Store
              </span>
              {store.category && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {store.category}
                </span>
              )}
              {store.city && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                  {store.city}
                </span>
              )}
              {store.myRating && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Your Rating: {store.myRating} ★
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{store.name}</span>
              <button
                onClick={handleToggleFavorite}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-700 transition-colors"
                title={store.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    store.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
              </button>
            </h1>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
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
              <span>{store.myRating ? 'Update Your Review' : 'Rate This Store'}</span>
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium">Average Community Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-white">
                {store.averageRating > 0 ? store.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs text-zinc-500 font-medium">/ 5.0</span>
            </div>
            <div className="mt-1">
              <StarRating value={store.averageRating} size="md" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium">Total Reviews</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-white">{store.ratingCount}</span>
              <span className="text-xs text-zinc-500 font-medium">ratings</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {store.ratingCount === 0 ? 'Be the first user to submit a rating!' : 'Verified community feedback'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium">Your Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-400">
                {store.myRating ? `${store.myRating}.0` : '—'}
              </span>
              {store.myRating && <span className="text-xs text-zinc-500 font-medium">/ 5.0</span>}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {store.myRating ? 'You can update your review anytime' : 'Sign in as user to submit your rating'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature E: Star Rating Distribution Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4">Rating Breakdown</h3>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const data = distribution[star] || { count: 0, percentage: 0 };
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <div className="w-16 flex items-center gap-1 font-semibold text-zinc-300">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
                <div className="w-16 text-right text-zinc-400 font-medium">
                  {data.count} ({data.percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature B: Written Review Comments & Moderation Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <span>Customer Reviews & Feedback</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified community reviews for {store.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 font-medium">Sort by:</label>
            <select
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-400">No written reviews yet</p>
            <p className="text-xs text-zinc-500">
              Be the first customer to leave written feedback for this store!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{rev.user.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StarRating value={rev.value} size="sm" />
                    <span className="text-xs font-bold text-amber-400">{rev.value}.0</span>
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-zinc-300 leading-relaxed pl-11">
                    {rev.comment}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 pl-11">
                  <button
                    onClick={() => handleToggleHelpful(rev.id)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${
                      rev.hasVotedHelpful
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({rev.helpfulCount})</span>
                  </button>

                  <button
                    onClick={() => setReportingReviewId(rev.id)}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Report Modal */}
      {reportingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Report Inappropriate Review</span>
              </h3>
              <button
                onClick={() => setReportingReviewId(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Reason for reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="INAPPROPRIATE">Inappropriate / Obscene Content</option>
                  <option value="SPAM">Commercial Spam or Advertising</option>
                  <option value="OFFENSIVE">Harassment or Hate Speech</option>
                  <option value="SUSPICIOUS">Suspicious / Fake Review</option>
                  <option value="OTHER">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Explain why this review violates platform standards..."
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingReviewId(null)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Submit Report</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating & Review Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        store={{
          id: store.id,
          name: store.name,
          myRating: store.myRating,
          myComment: userRatingComment,
        }}
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
