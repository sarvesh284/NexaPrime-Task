'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, ArrowRight, CheckCircle, Sparkles, Clock, Trash2, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { Store, StoreStats } from '../types';
import { StoreCard } from '../components/StoreCard';
import { RatingModal } from '../components/RatingModal';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentlyViewed, setRecentlyViewed] = useState<Store[]>([]);
  const [selectedStoreForRating, setSelectedStoreForRating] = useState<Store | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get<{ stores: Store[] }>('/stores', {
          params: { limit: 3, sort: 'averageRating', order: 'desc' },
        });
        if (res.data?.stores) {
          setFeaturedStores(res.data.stores);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch recently viewed stores (N5)
  useEffect(() => {
    if (user) {
      api
        .get<{ stores: Store[] }>('/stores/recently-viewed')
        .then((res) => {
          if (res.data?.stores) {
            const uniqueMap = new Map<string, Store>();
            res.data.stores.forEach((s) => {
              if (s && s.id && !uniqueMap.has(s.id)) {
                uniqueMap.set(s.id, s);
              }
            });
            setRecentlyViewed(Array.from(uniqueMap.values()));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleClearRecentlyViewed = async () => {
    try {
      await api.delete('/stores/recently-viewed');
      setRecentlyViewed([]);
    } catch {}
  };

  const handleRatingSubmitted = (storeId: string, rating: number, storeStats?: StoreStats) => {
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 border-b border-slate-200 dark:border-zinc-800/80 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.12),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>RateLocal Store Rating Platform &bull; Maharashtra Edition</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Real Reviews for Real Stores.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500">
              Trusted Maharashtra Ratings.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Discover verified local stores across Mumbai, Pune, Nashik, Kolhapur, and Nagpur.
            Submit genuine ratings, view community photos, and explore stores on an interactive map.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/stores"
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Explore Interactive Map & Stores</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {user ? (
              user.role === 'STORE_OWNER' ? (
                <Link
                  href="/owner/dashboard"
                  className="w-full sm:w-auto py-3.5 px-7 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white hover:bg-slate-50 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold text-sm transition-colors shadow-sm"
                >
                  Open Owner Dashboard
                </Link>
              ) : (
                <Link
                  href="/stores"
                  className="w-full sm:w-auto py-3.5 px-7 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white hover:bg-slate-50 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold text-sm transition-colors shadow-sm"
                >
                  Rate a Store
                </Link>
              )
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="py-3.5 px-7 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white hover:bg-slate-50 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold text-sm transition-colors shadow-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="py-3.5 px-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Engineered for Reliability & Scale
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 text-sm mt-2">
            Built strictly in accordance with production-grade security, testing, and modern responsive design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-5">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Strict 1-5 Rating Rules</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
              Users submit integer ratings from 1 to 5 with automatic updates. Unique compound
              database indexing guarantees zero duplicate ratings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-5">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Maharashtra Leaflet Map</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
              Real OpenStreetMap tiles centered on Maharashtra with geolocated store markers, city filters,
              and seamless list-to-map synchronization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Secure HttpOnly Cookies</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
              Full-featured authentication with bcrypt hashing, rate limiting, Helmet HTTP security
              headers, and CSRF origin verification.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Stores Preview */}
      <section className="py-16 bg-slate-50/70 dark:bg-zinc-900/30 border-t border-slate-200 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Top-Rated Maharashtra Stores</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Discover popular local establishments rated by the community</p>
            </div>
            <Link
              href="/stores"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1"
            >
              <span>View All Stores on Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white dark:bg-zinc-900/60 animate-pulse border border-slate-200 dark:border-zinc-800 shadow-sm" />
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
            <div className="text-center py-12 text-slate-500 dark:text-zinc-500 text-sm">
              No stores found. Run the seed script to populate sample stores.
            </div>
          )}
        </div>
      </section>

      {/* Feature N5: Recently Viewed Stores */}
      {user && recentlyViewed.length > 0 && (
        <section className="py-14 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800/80 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recently Viewed Stores</h3>
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
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all block group shadow-sm"
                >
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-sm truncate">
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
