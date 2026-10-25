'use client';

import React from 'react';
import Link from 'next/link';
import { Store, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const swaggerUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')}/api/v1/docs`
    : 'http://localhost:5000/api/v1/docs';

  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xs py-8 text-slate-500 dark:text-zinc-400 text-xs transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Store className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-white">
            RateLocal <span className="text-slate-400 dark:text-zinc-500 font-normal">Platform</span>
          </span>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors">
            Home
          </Link>
          <Link href="/stores" className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors">
            Stores
          </Link>
          <a
            href={swaggerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>OpenAPI Docs</span>
          </a>
        </div>

        <div className="text-slate-400 dark:text-zinc-500 text-center md:text-right text-[11px]">
          <p>© 2026 RateLocal. Verified Local Store Ratings & Merchant Analytics.</p>
        </div>
      </div>
    </footer>
  );
};
