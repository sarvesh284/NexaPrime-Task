'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Store } from '../types';
import { useToast } from './Toast';

interface DeleteStoreModalProps {
  isOpen: boolean;
  store: Store | null;
  onClose: () => void;
  onSuccess: (deletedStoreId: string) => void;
}

export const DeleteStoreModal: React.FC<DeleteStoreModalProps> = ({
  isOpen,
  store,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !store) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);

      const res = await api.delete<{ storeId: string; message: string }>(
        `/owner/stores/${store.id}`
      );

      success(
        res.data?.message ||
          `"${store.name}" was successfully archived. Rating records have been preserved.`
      );
      onSuccess(store.id);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to delete store. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Archive Store Location</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
          <p className="font-bold text-sm text-slate-900 dark:text-white">{store.name}</p>
          <p className="text-slate-500 dark:text-zinc-400">{store.category} • {store.city}</p>
          <p className="text-slate-600 dark:text-zinc-400 text-[11px] truncate">{store.address}</p>
        </div>

        {/* Informative Explanation of Soft Deletion */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Preserving Rating History & Data Integrity</span>
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            Archiving this store removes it immediately from public store listings and customer search.
            All historical customer ratings, reviews, and community analytics will be safely preserved in
            accordance with data integrity standards.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-zinc-800 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold transition-colors"
          >
            Keep Active
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirm Archive & Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
