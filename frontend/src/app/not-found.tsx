import Link from 'next/link';
import { Store, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-white">404</h1>
        <h2 className="text-lg font-bold text-zinc-300 mt-2">Page Not Found</h2>
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          The page or store resource you are looking for does not exist or may have been relocated.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
}
