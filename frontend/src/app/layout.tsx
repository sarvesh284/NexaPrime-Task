import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/Toast';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'RateLocal — Discover & Review Local Stores',
  description: 'A modern, secure store rating platform where users discover businesses, submit ratings, and store owners analyze performance metrics.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('ratelocal_theme') || localStorage.getItem('nexaprime_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50/70 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black transition-colors duration-150 relative">
        {/* Landscape Wallpaper Theme Backdrop */}
        <div className="theme-wallpaper-layer" aria-hidden="true" />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Suspense fallback={<div className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />}>
                <Navbar />
              </Suspense>
              <main className="flex-1 flex flex-col relative z-10">
                <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20"><div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" /></div>}>
                  {children}
                </Suspense>
              </main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
