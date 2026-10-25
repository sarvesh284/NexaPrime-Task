'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Star,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Trash2,
} from 'lucide-react';
import { Store } from '../types';
import { api } from '../lib/api';
import { StoreCard } from '../components/StoreCard';
import { RatingModal } from '../components/RatingModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function HomePage() {
  const { user } = useAuth();
  const { success } = useToast();
  const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreForRating, setSelectedStoreForRating] = useState<Store | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch top rated stores
        const res = await api.get<{ stores: Store[] }>('/stores', {
          params: { sort: 'averageRating', order: 'desc', limit: 6 },
        });
        if (res.data?.stores) {
          setFeaturedStores(res.data.stores);
        }

        // Fetch user recently viewed stores if logged in
        if (user) {
          try {
            const histRes = await api.get<{ history: Store[] }>('/stores/history/views');
            if (histRes.data?.history) {
              setRecentlyViewed(histRes.data.history.slice(0, 4));
            }
          } catch {
            // Non-critical endpoint
          }
        }
      } catch (err) {
        console.error('Failed to load home page stores:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleRatingSubmitted = (storeId: string, rating: number, storeStats?: { averageRating: number; ratingCount: number }) => {
    setFeaturedStores((prev) =>
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

  const handleClearRecentlyViewed = async () => {
    try {
      await api.delete('/stores/history/views');
      setRecentlyViewed([]);
      success('Browsing history cleared.');
    } catch {
      // Non-critical
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white/75 via-slate-50/50 to-slate-100/60 dark:from-zinc-950/80 dark:via-zinc-900/40 dark:to-zinc-950/80 backdrop-blur-2xs transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Pill announcement badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold tracking-wide mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>RateLocal • Verified Maharashtra Store Ratings & Merchant Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Real Reviews for Local Stores.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500">
              Trusted Ratings.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Discover verified stores across Mumbai, Pune, Nashik, Kolhapur, and Nagpur.
            Submit authentic ratings, inspect merchant analytics, and explore stores with interactive maps.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/stores"
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 group"
            >
              <span>Explore Stores on Map</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {user ? (
              user.role === 'STORE_OWNER' ? (
                <Link
                  href="/owner/dashboard"
                  className="w-full sm:w-auto py-3 px-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold text-xs sm:text-sm transition-colors shadow-xs"
                >
                  Open Owner Dashboard
                </Link>
              ) : (
                <Link
                  href="/stores"
                  className="w-full sm:w-auto py-3 px-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold text-xs sm:text-sm transition-colors shadow-xs"
                >
                  Rate a Store
                </Link>
              )
            ) : (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Link
                  href="/login"
                  className="flex-1 sm:flex-none py-3 px-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold text-xs sm:text-sm transition-colors shadow-xs text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex-1 sm:flex-none py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm transition-colors shadow-xs text-center"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Designed for Trust, Transparency & Speed
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm mt-1.5 max-w-xl mx-auto">
            Strict verification, single-rating integrity, and real-time merchant analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Strict 1-5 Rating Rules</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed mt-2">
              Users submit integer ratings from 1 to 5 with automatic updates. Unique compound
              database indexing guarantees zero duplicate ratings per customer.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Maharashtra Interactive Map</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed mt-2">
              Real OpenStreetMap tiles centered on Maharashtra with geolocated store markers, city filters,
              and seamless list-to-map synchronization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Secure HttpOnly Architecture</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed mt-2">
              Full-featured authentication with bcrypt hashing, rate limiting, Helmet HTTP security
              headers, and CSRF origin verification.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Stores Preview */}
      <section className="py-14 bg-slate-50/60 dark:bg-zinc-900/30 border-t border-slate-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Top-Rated Maharashtra Stores</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">Explore community-rated stores across Maharashtra</p>
            </div>
            <Link
              href="/stores"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 group"
            >
              <span>View All on Map</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white dark:bg-zinc-900/60 animate-pulse border border-slate-200 dark:border-zinc-800 shadow-xs" />
              ))}
            </div>
          ) : featuredStores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onOpenRating={(s) => setSelectedStoreForRating(s)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-zinc-500 text-xs">
              No stores found in directory.
            </div>
          )}
        </div>
      </section>

      {/* Feature N5: Recently Viewed Stores */}
      {user && recentlyViewed.length > 0 && (
        <section className="py-12 bg-white dark:bg-zinc-950 border-t border-slate-200/80 dark:border-zinc-800/80 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Recently Viewed Stores</h3>
              </div>
              <button
                onClick={handleClearRecentlyViewed}
                className="text-xs text-slate-500 dark:text-zinc-500 hover:text-rose-500 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyViewed.map((store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.id}`}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all block group shadow-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-xs truncate">
                    {store.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{store.city || store.address}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 dark:border-zinc-800/60 text-xs">
                    <span className="text-slate-500 dark:text-zinc-500 text-[10px]">{store.category || 'Store'}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                      {store.averageRating > 0 ? `${store.averageRating.toFixed(1)} ★` : 'New'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
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
