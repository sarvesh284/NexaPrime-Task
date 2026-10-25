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

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5 font-bold" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center">
              Rate<span className="text-amber-600 dark:text-amber-400 font-extrabold">Local</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Home
          </Link>
          <Link
            href="/stores"
            className={`text-sm font-medium transition-colors ${
              pathname === '/stores'
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Explore Stores
          </Link>

          {user && (
            <Link
              href="/favorites"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isActive('/favorites')
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Favorites</span>
            </Link>
          )}

          {user && (
            <Link
              href="/my-ratings"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isActive('/my-ratings')
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>My Reviews</span>
            </Link>
          )}

          {user?.role === 'STORE_OWNER' && (
            <Link
              href="/owner/dashboard"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isActive('/owner/dashboard')
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
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
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 transition-colors"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        {/* User / Auth Actions + Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          {/* Accessible Theme Toggle */}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <NotificationCenter />
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-zinc-800">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded w-fit ${
                      user.role === 'STORE_OWNER'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800/60'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60'
                    }`}
                  >
                    {user.role === 'STORE_OWNER' ? 'Owner' : 'User'}
                  </span>
                </div>
              </div>

              <Link
                href="/settings"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Account Security & Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="py-2 px-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-md shadow-amber-500/20"
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
            className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/stores"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
          >
            Explore Stores
          </Link>
          {user && (
            <Link
              href="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-rose-500"
            >
              My Favorites
            </Link>
          )}
          {user && (
            <Link
              href="/my-ratings"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-amber-500"
            >
              My Reviews
            </Link>
          )}
          {user?.role === 'STORE_OWNER' && (
            <Link
              href="/owner/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-amber-500"
            >
              Owner Portal
            </Link>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white pt-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account & Security Settings</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-amber-500 text-xs font-bold text-zinc-950"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
