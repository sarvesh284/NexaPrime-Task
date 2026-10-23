'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  ShieldCheck,
  Star,
  Trash2,
  Flag,
  User as UserIcon,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { PhotoItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { getAssetUrl } from '../lib/api';

interface PhotoGalleryProps {
  storeId: string;
  storeName: string;
  photos: PhotoItem[];
  loading: boolean;
  isOwner?: boolean;
  onUploadClick: () => void;
  onSetCover: (photoId: string) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onReportPhoto: (photoId: string, reason: string, details?: string) => Promise<void>;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  storeId,
  storeName,
  photos,
  loading,
  isOwner,
  onUploadClick,
  onSetCover,
  onDeletePhoto,
  onReportPhoto,
}) => {
  const { user } = useAuth();
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Report modal within gallery
  const [reportingPhotoId, setReportingPhotoId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<'INAPPROPRIATE' | 'SPAM' | 'OFFENSIVE' | 'SUSPICIOUS' | 'OTHER'>('INAPPROPRIATE');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Delete confirmation
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  // Failed image handling (graceful fallback)
  const [failedPhotoIds, setFailedPhotoIds] = useState<Record<string, boolean>>({});

  const handleImageError = useCallback((photoId: string) => {
    setFailedPhotoIds((prev) => ({ ...prev, [photoId]: true }));
  }, []);

  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  const nextPhoto = useCallback(() => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((prev) => (prev! + 1) % photos.length);
    setActionMessage(null);
  }, [activePhotoIndex, photos.length]);

  const prevPhoto = useCallback(() => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((prev) => (prev! - 1 + photos.length) % photos.length);
    setActionMessage(null);
  }, [activePhotoIndex, photos.length]);

  const closeLightbox = useCallback(() => {
    setActivePhotoIndex(null);
    setActionMessage(null);
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activePhotoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      } else if (e.key === 'ArrowLeft') {
        prevPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, closeLightbox, nextPhoto, prevPhoto]);

  const handleSetCoverClick = async (photoId: string) => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      await onSetCover(photoId);
      setActionMessage({ type: 'success', text: 'Cover photo updated successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update cover photo';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPhotoId) return;
    try {
      setActionLoading(true);
      await onDeletePhoto(deletingPhotoId);
      setDeletingPhotoId(null);
      closeLightbox();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete photo';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPhotoId) return;
    try {
      setIsSubmittingReport(true);
      await onReportPhoto(reportingPhotoId, reportReason, reportDetails);
      setReportingPhotoId(null);
      setReportDetails('');
      setActionMessage({ type: 'success', text: 'Report submitted. Our team will review this photo.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to report photo';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Helper to check if current logged in user can delete this photo
  const canDeletePhoto = (photo: PhotoItem) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (isOwner) return true;
    const uploaderId = typeof photo.userId === 'object' ? photo.userId.id || photo.userId._id : photo.userId;
    return uploaderId === user.id;
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-500" />
            <span>Store Photos</span>
            {photos.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                {photos.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Community and official photography for {storeName}
          </p>
        </div>

        <button
          onClick={onUploadClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 border border-amber-500/30 transition-all shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Add Photos</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && photos.length === 0 && (
        <div className="p-10 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-slate-200/80 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700/60 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3">
            <Camera className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No photos yet</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
            Be the first to share photos of {storeName} with the community!
          </p>
          <button
            onClick={onUploadClick}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-lg shadow-amber-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upload the First Photo</span>
          </button>
        </div>
      )}

      {/* Photos Grid */}
      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setActivePhotoIndex(index)}
              className="group relative aspect-square bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-amber-500/60 transition-all shadow-sm"
            >
              {!failedPhotoIds[photo.id] ? (
                <img
                  src={getAssetUrl(photo.url)}
                  alt={photo.caption || `${storeName} photo ${index + 1}`}
                  onError={() => handleImageError(photo.id)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 p-2 text-center">
                  <Camera className="w-7 h-7 opacity-30 mb-1" />
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium line-clamp-1">
                    {photo.caption || 'Store Photo'}
                  </span>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                <div className="flex items-center justify-between gap-1">
                  {photo.isCover && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-zinc-950">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Cover
                    </span>
                  )}
                  {photo.isOfficial && !photo.isCover && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/90 text-white">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Official
                    </span>
                  )}
                </div>

                {photo.caption && (
                  <p className="text-[11px] text-white font-medium line-clamp-2 drop-shadow">
                    {photo.caption}
                  </p>
                )}
              </div>

              {/* Always visible top badges */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                {photo.isCover && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-zinc-950 shadow">
                    Cover
                  </span>
                )}
                {photo.isOfficial && !photo.isCover && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-600/90 text-white shadow">
                    Official
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Main Container */}
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col md:flex-row bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 z-30 p-2 text-zinc-400 hover:text-white bg-black/60 hover:bg-black/80 rounded-full border border-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left/Right Prev/Next Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 text-white bg-black/60 hover:bg-black/90 rounded-full border border-white/10 transition-colors"
                  title="Previous (Left arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 md:right-[320px] top-1/2 -translate-y-1/2 z-20 p-2 text-white bg-black/60 hover:bg-black/90 rounded-full border border-white/10 transition-colors"
                  title="Next (Right arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Photo Display */}
            <div className="flex-1 flex items-center justify-center bg-black min-h-[300px] md:min-h-[500px] relative overflow-hidden">
              {!failedPhotoIds[activePhoto.id] ? (
                <img
                  src={getAssetUrl(activePhoto.url)}
                  alt={activePhoto.caption || 'Store Photo Lightbox'}
                  onError={() => handleImageError(activePhoto.id)}
                  className="max-h-[80vh] w-auto max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-zinc-600 mb-2" />
                  <p className="text-sm font-medium text-zinc-300">Image file unavailable</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    The requested image file could not be loaded from storage.
                  </p>
                </div>
              )}
            </div>

            {/* Photo Details Sidebar */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/90 p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Header status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activePhoto.isCover && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <Star className="w-3 h-3 fill-current" />
                        Cover Photo
                      </span>
                    )}
                    {activePhoto.isOfficial && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        Official Store Photo
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {activePhotoIndex! + 1} of {photos.length}
                  </span>
                </div>

                {/* Caption */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Caption
                  </h4>
                  <p className="text-sm text-white leading-relaxed">
                    {activePhoto.caption || <span className="italic text-zinc-500">No caption provided</span>}
                  </p>
                </div>

                {/* Meta details */}
                <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      Uploaded by:{' '}
                      <span className="text-zinc-200 font-medium">
                        {typeof activePhoto.userId === 'object'
                          ? activePhoto.userId.name
                          : 'Community User'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      Added on{' '}
                      {new Date(activePhoto.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Feedback */}
                {actionMessage && (
                  <div
                    className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                      actionMessage.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {actionMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{actionMessage.text}</span>
                  </div>
                )}
              </div>

                {/* Actions Bottom Bar */}
                <div className="pt-4 border-t border-zinc-800 space-y-2">
                {/* Set as Cover (Store Owner or Admin) */}
                {(isOwner || user?.role === 'ADMIN') && !activePhoto.isCover && (
                  <button
                    onClick={() => handleSetCoverClick(activePhoto.id)}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Star className="w-3.5 h-3.5" />
                    )}
                    <span>Set as Store Cover</span>
                  </button>
                )}

                {/* Delete Photo Button */}
                {canDeletePhoto(activePhoto) && (
                  <button
                    onClick={() => setDeletingPhotoId(activePhoto.id)}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                )}

                {/* Report Photo Button (For users other than uploader) */}
                {user && !canDeletePhoto(activePhoto) && (
                  <button
                    onClick={() => setReportingPhotoId(activePhoto.id)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPhotoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Photo</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Are you sure you want to permanently delete this photo from the store gallery?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPhotoId(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Photo Modal */}
      {reportingPhotoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Flag className="w-4 h-4 text-rose-500" />
                <span>Report Photo</span>
              </div>
              <button
                onClick={() => setReportingPhotoId(null)}
                className="text-slate-400 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Reason for reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="INAPPROPRIATE">Inappropriate or offensive content</option>
                  <option value="SPAM">Spam or irrelevant advertisement</option>
                  <option value="OFFENSIVE">Harassment or hate speech</option>
                  <option value="SUSPICIOUS">Misleading or fraudulent</option>
                  <option value="OTHER">Other violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe why this photo violates community guidelines..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingPhotoId(null)}
                  disabled={isSubmittingReport}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingReport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
