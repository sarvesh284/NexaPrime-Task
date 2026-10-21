'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Star, Sparkles, ArrowRight } from 'lucide-react';
import { Store } from '../types';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';

interface StoreCardProps {
  store: Store;
  onOpenRating: (store: Store) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onOpenRating }) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'STORE_OWNER';

  return (
    <div className="group relative flex flex-col justify-between bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-amber-500/5">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Active Store
          </span>

          {store.myRating ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              You rated: {store.myRating}
            </span>
          ) : user && !isOwner ? (
            <span className="text-xs text-zinc-500 font-medium">Not rated yet</span>
          ) : null}
        </div>

        {/* Store Name & Address */}
        <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
          {store.name}
        </h3>

        <div className="flex items-start gap-1.5 mt-2 text-xs text-zinc-400">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed">{store.address}</p>
        </div>

        {/* Rating Overview */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StarRating value={store.averageRating} size="sm" />
              <span className="text-sm font-bold text-white">
                {store.averageRating > 0 ? store.averageRating.toFixed(1) : '0.0'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {store.ratingCount === 1
                ? '1 rating'
                : store.ratingCount > 1
                ? `${store.ratingCount} ratings`
                : 'No ratings yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3 flex items-center gap-2">
        {!isOwner && (
          <button
            onClick={() => onOpenRating(store)}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{store.myRating ? 'Update Rating' : 'Rate Store'}</span>
          </button>
        )}

        <Link
          href={`/stores/${store.id}`}
          className={`py-2 px-3 rounded-xl border border-zinc-700/80 hover:border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
            isOwner ? 'w-full' : ''
          }`}
        >
          <span>Details</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
