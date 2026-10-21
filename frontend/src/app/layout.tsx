import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/Toast';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'NexaPrime Store Rating — Discover & Review Local Stores',
  description: 'A modern, secure store rating platform where users discover businesses, submit ratings, and store owners analyze performance metrics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<div className="h-16 border-b border-zinc-800 bg-zinc-950" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1 flex flex-col">
              <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20"><div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" /></div>}>
                {children}
              </Suspense>
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
