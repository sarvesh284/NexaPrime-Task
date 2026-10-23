'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Camera,
  Trash2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { api, ApiError, getAssetUrl } from '../../../lib/api';
import { AdminReport, Pagination, PhotoItem } from '../../../types';
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

  // Photo Moderation Queue State
  const [activeTab, setActiveTab] = useState<'reviews' | 'photos'>('reviews');
  const [adminPhotos, setAdminPhotos] = useState<PhotoItem[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoActionLoadingId, setPhotoActionLoadingId] = useState<string | null>(null);

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

  const fetchAdminPhotos = useCallback(async () => {
    try {
      setPhotosLoading(true);
      const res = await api.get<PhotoItem[]>('/admin/photos');
      if (res.data) {
        setAdminPhotos(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin photos:', err);
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN' && activeTab === 'photos') {
      fetchAdminPhotos();
    }
  }, [user, activeTab, fetchAdminPhotos]);

  const handleModeratePhoto = async (
    photoId: string,
    action: 'APPROVE' | 'REJECT' | 'DELETE'
  ) => {
    try {
      setPhotoActionLoadingId(photoId);
      const res = await api.patch<{ message: string }>(`/admin/photos/${photoId}/moderate`, {
        action,
        reason: `Admin decision: ${action}`,
      });
      success(res.data?.message || 'Moderation decision saved.');
      if (action === 'DELETE') {
        setAdminPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } else {
        setAdminPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : p
          )
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Moderation action failed.';
      toastError(msg);
    } finally {
      setPhotoActionLoadingId(null);
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'reviews'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Review Moderation ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'photos'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Photo Moderation Queue ({adminPhotos.length})</span>
        </button>
      </div>

      {/* Review Moderation Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
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
      )}

      {/* Photo Moderation Tab */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          {photosLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : adminPhotos.length > 0 ? (
            <div className="space-y-4">
              {adminPhotos.map((photo) => {
                const isBusy = photoActionLoadingId === photo.id;
                const storeObj = typeof photo.storeId === 'object' ? photo.storeId : null;
                const userObj = typeof photo.userId === 'object' ? photo.userId : null;

                return (
                  <div
                    key={photo.id}
                    className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                          Store: {storeObj?.name || 'Associated Store'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            photo.status === 'REPORTED'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                              : photo.status === 'PENDING'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : photo.status === 'APPROVED'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          Status: {photo.status}
                        </span>
                        {photo.isCover && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Cover Image
                          </span>
                        )}
                        {photo.isOfficial && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            Official Photo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Uploaded on {new Date(photo.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-video sm:aspect-square md:col-span-1 rounded-xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-zinc-700 absolute" />
                        <img
                          src={getAssetUrl(photo.url)}
                          alt={photo.caption || 'Reported photo thumbnail'}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="relative z-10 w-full h-full object-contain"
                        />
                      </div>

                      {/* Photo & Report Details */}
                      <div className="md:col-span-3 space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-zinc-500">Caption</span>
                          <p className="text-white mt-0.5 text-sm">
                            {photo.caption || <span className="text-zinc-600 italic">No caption provided</span>}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                          <div>
                            <span className="text-[10px] font-semibold uppercase text-zinc-500">Uploader</span>
                            <p className="text-zinc-200 font-medium mt-0.5">{userObj?.name || 'Community User'}</p>
                            {userObj?.email && <p className="text-[10px] text-zinc-500 font-mono">{userObj.email}</p>}
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold uppercase text-zinc-500">Store Location</span>
                            <p className="text-zinc-200 font-medium mt-0.5">{storeObj?.name || 'Store'}</p>
                            {storeObj?.address && <p className="text-[10px] text-zinc-500">{storeObj.address}</p>}
                          </div>
                        </div>

                        {/* Reported Violations */}
                        {photo.reports && photo.reports.length > 0 && (
                          <div className="space-y-2 p-3 bg-rose-950/20 rounded-xl border border-rose-900/40">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Reports Submitted ({photo.reports.length})
                            </span>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                              {photo.reports.map((rep, idx) => (
                                <div key={idx} className="text-[11px] text-zinc-300">
                                  <span className="font-semibold text-rose-300">[{rep.reason}] </span>
                                  <span>{rep.details || 'No additional comment'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Moderation Action Buttons */}
                    <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        disabled={isBusy}
                        onClick={() => handleModeratePhoto(photo.id, 'APPROVE')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Keep</span>
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => handleModeratePhoto(photo.id, 'REJECT')}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Reject Photo</span>
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => handleModeratePhoto(photo.id, 'DELETE')}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Asset Permanently</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <Camera className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Photo queue is clean</h3>
              <p className="text-xs text-zinc-400">
                No store photos are currently reported or pending moderation.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
