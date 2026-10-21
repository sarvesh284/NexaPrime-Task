'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { StarRating } from './StarRating';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { StoreStats } from '../types';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    myRating?: number | null;
    myComment?: string | null;
  } | null;
  onRatingSubmitted: (storeId: string, rating: number, storeStats?: StoreStats) => void;
}

const RATING_DESCRIPTIONS: Record<number, { label: string; desc: string }> = {
  1: { label: 'Poor', desc: 'Significantly below expectations' },
  2: { label: 'Fair', desc: 'Could be much better' },
  3: { label: 'Good', desc: 'Met standard expectations' },
  4: { label: 'Very Good', desc: 'Above average experience' },
  5: { label: 'Excellent', desc: 'Exceptional quality and service' },
};

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  store,
  onRatingSubmitted,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [userSelectedRating, setUserSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setComment(store.myComment || '');
      setUserSelectedRating(store.myRating || null);
    }
  }, [store]);

  if (!isOpen || !store) return null;

  const currentActiveRating = userSelectedRating !== null ? userSelectedRating : (store.myRating || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be logged in as a normal user to submit a rating.');
      return;
    }

    if (user.role === 'STORE_OWNER') {
      setErrorMessage('Store owners cannot rate stores. Please log in with a standard user account.');
      return;
    }

    if (currentActiveRating < 1 || currentActiveRating > 5) {
      setErrorMessage('Please select a star rating between 1 and 5.');
      return;
    }

    if (comment.length > 500) {
      setErrorMessage('Comment cannot exceed 500 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await api.put<{
        rating: { id: string; value: number; comment?: string };
        storeStats: StoreStats;
      }>(`/stores/${store.id}/rating`, {
        rating: currentActiveRating,
        comment: comment.trim() || undefined,
      });

      success(
        store.myRating
          ? `Your review for ${store.name} was successfully updated!`
          : `Thanks for reviewing ${store.name}!`
      );

      onRatingSubmitted(store.id, currentActiveRating, res.data?.storeStats);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to submit rating. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUserSelectedRating(null);
    setComment('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{store.myRating ? 'Update Review & Comment' : 'Rate & Review'}</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1 line-clamp-1">{store.name}</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 w-full flex flex-col items-center justify-center">
            <StarRating
              value={currentActiveRating}
              totalStars={5}
              interactive={true}
              size="lg"
              onChange={(rating) => {
                setUserSelectedRating(rating);
                setErrorMessage(null);
              }}
            />

            {currentActiveRating > 0 && (
              <div className="mt-3 text-center animate-fade-in">
                <span className="text-sm font-semibold text-amber-300">
                  {currentActiveRating} Star{currentActiveRating > 1 ? 's' : ''} — {RATING_DESCRIPTIONS[currentActiveRating]?.label}
                </span>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {RATING_DESCRIPTIONS[currentActiveRating]?.desc}
                </p>
              </div>
            )}
          </div>

          {/* Written Comment Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Written Feedback (Optional)</span>
              </label>
              <span className={`text-[11px] ${comment.length > 500 ? 'text-rose-400 font-bold' : 'text-zinc-500'}`}>
                {comment.length} / 500
              </span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Share details of your experience (cleanliness, staff, product variety, atmosphere)..."
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors resize-none placeholder:text-zinc-600"
            />
          </div>

          {store.myRating && (
            <p className="text-xs text-zinc-400">
              Your previous rating was{' '}
              <span className="font-semibold text-amber-400">{store.myRating} ★</span>.
              Submitting will update your existing score and comment.
            </p>
          )}

          {errorMessage && (
            <div className="w-full p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="w-full flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || currentActiveRating === 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{store.myRating ? 'Update Review' : 'Submit Review'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
