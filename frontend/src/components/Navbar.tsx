'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ExternalLink,
  Heart,
  Star,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { NotificationCenter } from './NotificationCenter';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    success('You have successfully logged out.');
  };

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-zinc-950 shadow-sm group-hover:scale-105 transition-transform">
            <Store className="w-4 h-4 font-bold" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center">
              Rate<span className="text-amber-600 dark:text-amber-400 font-extrabold">Local</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/'
                ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900/60'
            }`}
          >
            Home
          </Link>
          <Link
            href="/stores"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/stores'
                ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900/60'
            }`}
          >
            Explore Stores
          </Link>

          {user && (
            <Link
              href="/favorites"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/favorites')
                  ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900/60'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Favorites</span>
            </Link>
          )}

          {user && (
            <Link
              href="/my-ratings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/my-ratings')
                  ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900/60'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>My Reviews</span>
            </Link>
          )}

          {user?.role === 'STORE_OWNER' && (
            <Link
              href="/owner/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/owner/dashboard')
                  ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Owner Portal</span>
            </Link>
          )}

          <a
            href={
              process.env.NEXT_PUBLIC_API_URL
                ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')}/api/v1/docs`
                : 'http://localhost:5000/api/v1/docs'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors ml-1"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </nav>

        {/* User / Auth Actions + Theme Toggle */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Accessible Theme Toggle */}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <div className="flex items-center gap-2 pl-2.5 border-l border-slate-200 dark:border-zinc-800">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[120px] truncate leading-tight">
                    {user.name}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded w-fit leading-tight mt-0.5 ${
                      user.role === 'STORE_OWNER'
                        ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
                    }`}
                  >
                    {user.role === 'STORE_OWNER' ? 'Owner' : 'Customer'}
                  </span>
                </div>
              </div>

              <Link
                href="/settings"
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Account Security & Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="py-1.5 px-3.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 transition-colors shadow-xs"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu and ThemeToggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === '/'
                ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            href="/stores"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === '/stores'
                ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Explore Stores
          </Link>

          {user && (
            <Link
              href="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Favorites</span>
            </Link>
          )}

          {user && (
            <Link
              href="/my-ratings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>My Reviews</span>
            </Link>
          )}

          {user?.role === 'STORE_OWNER' && (
            <Link
              href="/owner/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Owner Portal</span>
            </Link>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="p-2 text-rose-500 hover:text-rose-600"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-lg text-xs font-semibold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-amber-500 dark:text-zinc-950"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
