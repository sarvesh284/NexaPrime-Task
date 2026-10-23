'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Star, Sparkles, ArrowRight, Heart, Store as StoreIcon, Camera } from 'lucide-react';
import { Store } from '../types';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';
import { getAssetUrl } from '../lib/api';

interface StoreCardProps {
  store: Store;
  onOpenRating: (store: Store) => void;
  onToggleFavorite?: (storeId: string) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onOpenRating, onToggleFavorite }) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'STORE_OWNER';
  const [imageFailed, setImageFailed] = React.useState(false);

  return (
    <div className="group relative flex flex-col justify-between bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-amber-500/5">
      {/* Cover Image Banner */}
      <div className="relative h-36 w-full bg-zinc-950 overflow-hidden border-b border-zinc-800/80">
        {store.coverImage && !imageFailed ? (
          <img
            src={getAssetUrl(store.coverImage)}
            alt={store.name}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-600">
            <StoreIcon className="w-10 h-10 opacity-30 mb-1" />
            <span className="text-[11px] font-medium tracking-wider uppercase opacity-40">Store Preview</span>
          </div>
        )}

        {/* Gradient Scrim for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />

        {/* Favorite & Cover Photo indicator badges on image */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {store.coverImage && !imageFailed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
              <Camera className="w-2.5 h-2.5 text-amber-400" />
              <span>Cover</span>
            </span>
          )}

          {onToggleFavorite && user && (
            <button
              onClick={() => onToggleFavorite(store.id)}
              className="p-1.5 text-zinc-300 hover:text-rose-400 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-colors"
              title={store.isFavorite ? 'Remove favorite' : 'Add favorite'}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${
                  store.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Top Badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {store.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                {store.category}
              </span>
            )}
            {store.city && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800/60 text-zinc-400 border border-zinc-700/40">
                {store.city}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleFavorite && user && (
              <button
                onClick={() => onToggleFavorite(store.id)}
                className="p-1 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                title={store.isFavorite ? 'Remove favorite' : 'Add favorite'}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    store.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
              </button>
            )}

            {store.myRating ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {store.myRating} ★
              </span>
            ) : null}
          </div>
        </div>

        {/* Store Name & Address */}
        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
          {store.name}
        </h3>

        <div className="flex items-start gap-1.5 mt-1.5 text-xs text-zinc-400">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
          <p className="line-clamp-1 leading-relaxed">{store.address}</p>
        </div>

        {/* Rating Overview */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StarRating value={store.averageRating} size="sm" />
              <span className="text-sm font-bold text-white">
                {store.averageRating > 0 ? store.averageRating.toFixed(1) : '0.0'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {store.ratingCount === 1
                ? '1 rating'
                : store.ratingCount > 1
                ? `${store.ratingCount} ratings`
                : 'No ratings yet'}
            </p>
          </div>

          {store.bayesianRating !== undefined && store.ratingCount > 0 && (
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Bayesian {store.bayesianRating.toFixed(2)}
              </span>
            </div>
          )}
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
    </div>
  );
};
