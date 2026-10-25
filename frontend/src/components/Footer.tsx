'use client';

import React from 'react';
import Link from 'next/link';
import { Store, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-10 text-slate-500 dark:text-zinc-400 text-xs transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white">RateLocal Store Rating Platform</span>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors">
            Home
          </Link>
          <Link href="/stores" className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors">
            Stores
          </Link>
          <a
            href="http://localhost:5000/api/v1/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>OpenAPI Swagger</span>
          </a>
        </div>

        <div className="text-slate-500 dark:text-zinc-500 text-center md:text-right">
          <p>© 2026 RateLocal Maharashtra Edition. Production-Grade Implementation.</p>
        </div>
      </div>
    </footer>
  );
};
