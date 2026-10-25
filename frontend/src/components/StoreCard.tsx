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
  isSelected?: boolean;
  onCardClick?: (store: Store) => void;
  distanceKm?: number;
  layout?: 'vertical' | 'horizontal';
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  onOpenRating,
  onToggleFavorite,
  isSelected = false,
  onCardClick,
  distanceKm,
  layout = 'vertical',
}) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'STORE_OWNER';
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [store.coverImage]);

  // Horizontal variant (optimized for Split View alongside interactive maps)
  if (layout === 'horizontal') {
    return (
      <div
        onClick={() => onCardClick?.(store)}
        className={`group relative flex flex-col sm:flex-row rounded-2xl overflow-hidden transition-all duration-300 shrink-0 ${
          onCardClick ? 'cursor-pointer' : ''
        } ${
          isSelected
            ? 'ring-2 ring-amber-500 shadow-xl border-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]'
            : 'shadow-sm hover:shadow-lg dark:shadow-md border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/90 hover:bg-slate-50/90 dark:hover:bg-zinc-900'
        } border`}
      >
        {/* Cover Thumbnail on Left (or top on mobile) */}
        <div className="relative w-full sm:w-44 h-36 sm:h-auto min-h-[140px] bg-slate-100 dark:bg-zinc-950 overflow-hidden shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-zinc-800/80">
          {store.coverImage && !imageFailed ? (
            <img
              src={getAssetUrl(store.coverImage)}
              alt={store.name}
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200/50 to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 text-slate-400 dark:text-zinc-600 p-4">
              <StoreIcon className="w-8 h-8 opacity-40 mb-1" />
              <span className="text-[10px] font-medium tracking-wider uppercase opacity-60">Store Preview</span>
            </div>
          )}

          {/* Scrim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 dark:opacity-80" />

          {/* Badges on image */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {store.coverImage && !imageFailed && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-black/60 backdrop-blur-md text-white border border-white/20">
                <Camera className="w-2.5 h-2.5 text-amber-400" />
                <span>Photo</span>
              </span>
            )}

            {onToggleFavorite && user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(store.id);
                }}
                className="p-1.5 text-white hover:text-rose-400 rounded-lg bg-black/50 backdrop-blur-md border border-white/20 hover:bg-black/70 transition-colors"
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

        {/* Content on Right */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {store.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60 truncate">
                    {store.category}
                  </span>
                )}
                {store.city && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                    {store.city}
                  </span>
                )}
                {typeof distanceKm === 'number' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                    {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                  </span>
                )}
              </div>

              {store.myRating ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  {store.myRating} ★
                </span>
              ) : null}
            </div>

            {/* Store Name */}
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
              {store.name}
            </h3>

            {/* Address */}
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
              <p className="line-clamp-1 text-xs">{store.address}</p>
            </div>

            {/* Rating Row */}
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={store.averageRating} size="sm" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {store.averageRating > 0 ? store.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                ({store.ratingCount} {store.ratingCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
            {!isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRating(store);
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>{store.myRating ? 'Update' : 'Rate'}</span>
              </button>
            )}

            <Link
              href={`/stores/${store.id}`}
              onClick={(e) => e.stopPropagation()}
              className={`py-1.5 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
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
  }

  // Vertical layout (default for multi-column grids)
  return (
    <div
      onClick={() => onCardClick?.(store)}
      className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden transition-all duration-300 shrink-0 ${
        onCardClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'ring-2 ring-amber-500 shadow-xl border-amber-500'
          : 'shadow-sm hover:shadow-xl dark:shadow-md dark:hover:shadow-2xl border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700/80'
      } bg-white dark:bg-zinc-900/80 hover:bg-slate-50/80 dark:hover:bg-zinc-900 border`}
    >
      {/* Cover Image Banner */}
      <div className="relative h-36 w-full bg-slate-100 dark:bg-zinc-950 overflow-hidden border-b border-slate-200 dark:border-zinc-800/80">
        {store.coverImage && !imageFailed ? (
          <img
            src={getAssetUrl(store.coverImage)}
            alt={store.name}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200/50 to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 text-slate-400 dark:text-zinc-600">
            <StoreIcon className="w-10 h-10 opacity-40 mb-1" />
            <span className="text-[11px] font-medium tracking-wider uppercase opacity-60">Store Preview</span>
          </div>
        )}

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 dark:opacity-80" />

        {/* Favorite & Cover Photo indicator badges on image */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {store.coverImage && !imageFailed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur-md text-white border border-white/20">
              <Camera className="w-2.5 h-2.5 text-amber-400" />
              <span>Cover</span>
            </span>
          )}

          {onToggleFavorite && user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(store.id);
              }}
              className="p-1.5 text-white hover:text-rose-400 rounded-lg bg-black/50 backdrop-blur-md border border-white/20 hover:bg-black/70 transition-colors"
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60">
                  {store.category}
                </span>
              )}
              {store.city && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100/70 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/40">
                  {store.city}
                </span>
              )}
              {typeof distanceKm === 'number' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {store.myRating ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {store.myRating} ★
                </span>
              ) : null}
            </div>
          </div>

          {/* Store Name & Address */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
            {store.name}
          </h3>

          <div className="flex items-start gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
            <p className="line-clamp-1 leading-relaxed">{store.address}</p>
          </div>

          {/* Rating Overview */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StarRating value={store.averageRating} size="sm" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {store.averageRating > 0 ? store.averageRating.toFixed(1) : '0.0'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {store.ratingCount === 1
                  ? '1 rating'
                  : store.ratingCount > 1
                  ? `${store.ratingCount} ratings`
                  : 'No ratings yet'}
              </p>
            </div>

            {store.bayesianRating !== undefined && store.ratingCount > 0 && (
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
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
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{store.myRating ? 'Update Rating' : 'Rate Store'}</span>
            </button>
          )}

          <Link
            href={`/stores/${store.id}`}
            className={`py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
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
