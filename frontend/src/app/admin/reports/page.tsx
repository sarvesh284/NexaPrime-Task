'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flag,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Star,
  Check,
  EyeOff,
  Eye,
  Clock,
} from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { AdminReport, Pagination } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Toast';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [status, setStatus] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);

    api
      .get<{ reports: AdminReport[] }>('/admin/reports', {
        params: {
          status,
          page: pagination.page,
          limit: pagination.limit,
        },
      })
      .then((res) => {
        if (res.data?.reports) {
          setReports(res.data.reports);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, status, pagination.page, pagination.limit]);

  const handleModerate = async (
    reportId: string,
    action: 'HIDE_REVIEW' | 'DISMISS' | 'RESTORE_REVIEW',
    notes: string
  ) => {
    try {
      setActionLoadingId(reportId);
      const res = await api.post<{ message: string }>(`/admin/reports/${reportId}/moderate`, {
        action,
        notes,
      });

      success(res.data?.message || 'Moderation action applied.');
      // Refresh list
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status:
                  action === 'HIDE_REVIEW'
                    ? 'RESOLVED_HIDDEN'
                    : action === 'DISMISS'
                    ? 'DISMISSED'
                    : 'RESOLVED_KEPT',
              }
            : r
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Moderation failed.';
      toastError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <Link
            href="/admin/dashboard"
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Flag className="w-6 h-6 text-rose-400" />
            <span>Review Moderation Queue</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Investigate reported user reviews, enforce community guidelines, and hide abusive content
          </p>
        </div>

        {/* Filter status */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400"
        >
          <option value="PENDING">Pending Moderation Only</option>
          <option value="RESOLVED_HIDDEN">Hidden Reviews</option>
          <option value="DISMISSED">Dismissed Reports</option>
          <option value="ALL">All Reports</option>
        </select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((r) => {
            const isPending = r.status === 'PENDING';
            const isBusy = actionLoadingId === r.id;

            return (
              <div
                key={r.id}
                className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
                      Reason: {r.reason}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === 'PENDING'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          : r.status === 'RESOLVED_HIDDEN'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      Status: {r.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reported on {new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Review Details Card */}
                {r.review ? (
                  <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">
                          Store: <span className="text-amber-400">{r.review.storeName}</span>
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Author: {r.review.authorName} ({r.review.authorEmail})
                        </p>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-amber-400 text-xs bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{r.review.value} Stars</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-900">
                      <p className="text-xs text-zinc-200 leading-relaxed font-serif italic">
                        &ldquo;{r.review.comment || 'No written text'}&rdquo;
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Review has been deleted or removed.</p>
                )}

                {/* Reporter Feedback */}
                <div className="text-xs space-y-1">
                  <p className="text-zinc-400 font-medium">
                    Reported by: <span className="text-white font-semibold">{r.reporter.name}</span> ({r.reporter.email})
                  </p>
                  {r.details && (
                    <p className="text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/60">
                      <span className="font-semibold text-zinc-400">Reporter comment:</span> {r.details}
                    </p>
                  )}
                  {r.resolutionNotes && (
                    <p className="text-[11px] text-zinc-400 pt-1">
                      <span className="font-semibold">Resolution notes:</span> {r.resolutionNotes}
                    </p>
                  )}
                </div>

                {/* Moderation Actions */}
                {isPending && (
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                    <button
                      disabled={isBusy}
                      onClick={() => handleModerate(r.id, 'DISMISS', 'Report dismissed as non-violating')}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Dismiss Report</span>
                    </button>

                    <button
                      disabled={isBusy}
                      onClick={() =>
                        handleModerate(
                          r.id,
                          'HIDE_REVIEW',
                          `Hidden for violating platform policy (${r.reason})`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Review</span>
                    </button>
                  </div>
                )}

                {r.status === 'RESOLVED_HIDDEN' && (
                  <div className="pt-3 border-t border-zinc-800 flex justify-end">
                    <button
                      disabled={isBusy}
                      onClick={() => handleModerate(r.id, 'RESTORE_REVIEW', 'Restored to visible')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Restore Review to Visible</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <Flag className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">No reports found</h3>
          <p className="text-xs text-zinc-400">
            {status === 'PENDING'
              ? 'The moderation queue is currently clear!'
              : 'No reports found for this status filter.'}
          </p>
        </div>
      )}
    </div>
  );
}
