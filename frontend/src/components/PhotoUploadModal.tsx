'use client';

import React, { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, Image as ImageIcon, Trash2, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { PhotoItem } from '../types';

interface PhotoUploadModalProps {
  isOpen: boolean;
  storeId: string;
  storeName: string;
  isOwner?: boolean;
  onClose: () => void;
  onSuccess: (newPhotos: PhotoItem[]) => void;
}

interface SelectedFileItem {
  file: File;
  previewUrl: string;
  caption: string;
  id: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  storeId,
  storeName,
  isOwner,
  onClose,
  onSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanPreviews = useCallback((items: SelectedFileItem[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const handleClose = () => {
    if (uploading) return;
    cleanPreviews(selectedFiles);
    setSelectedFiles([]);
    setError(null);
    setSuccessMsg(null);
    setUploadProgress(0);
    onClose();
  };

  const processFiles = (files: FileList | File[]) => {
    setError(null);
    const newItems: SelectedFileItem[] = [];

    const fileArray = Array.from(files);

    if (selectedFiles.length + fileArray.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} photos at once.`);
      return;
    }

    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not supported. Please select JPEG, PNG, or WebP images only.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`"${file.name}" exceeds the 5 MB file size limit.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        file,
        previewUrl,
        caption: '',
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
      });
    }

    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input value so same files can be re-selected if removed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateCaption = (id: string, caption: string) => {
    setSelectedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption: caption.slice(0, 200) } : item))
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || uploading) return;

    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);
      setUploadProgress(25);

      const formData = new FormData();
      selectedFiles.forEach((item) => {
        formData.append('photos', item.file);
        formData.append('captions', item.caption.trim());
      });

      setUploadProgress(50);

      const res = await api.upload<{ photos: PhotoItem[] }>(`/stores/${storeId}/photos`, formData);

      setUploadProgress(100);
      setSuccessMsg(
        isOwner
          ? 'Official photos uploaded successfully!'
          : 'Photos uploaded successfully! Thank you for contributing to the community.'
      );

      setTimeout(() => {
        if (res.data?.photos) {
          onSuccess(res.data.photos);
        }
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      setUploadProgress(0);
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to upload photos. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-amber-400" />
              <span>Upload Photos</span>
              {isOwner && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Official Store Photos
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add photos for <span className="text-zinc-200 font-medium">{storeName}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragging
                ? 'border-amber-400 bg-amber-500/5'
                : 'border-zinc-700/80 hover:border-zinc-600 bg-zinc-950/40 hover:bg-zinc-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 text-amber-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              Click to select or drag and drop images
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Supports JPEG, PNG, or WebP &bull; Up to 5 MB per file &bull; Max 5 photos
            </p>
          </div>

          {/* Previews List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                <span>Selected Photos ({selectedFiles.length} of {MAX_FILES})</span>
                <button
                  type="button"
                  onClick={() => {
                    cleanPreviews(selectedFiles);
                    setSelectedFiles([]);
                  }}
                  disabled={uploading}
                  className="text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {selectedFiles.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                      <img
                        src={item.previewUrl}
                        alt={`Selected preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-white truncate max-w-[200px]">
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="Add caption (optional, max 200 chars)..."
                        value={item.caption}
                        onChange={(e) => updateCaption(item.id, e.target.value)}
                        disabled={uploading}
                        className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      disabled={uploading}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors shrink-0 disabled:opacity-40"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  Uploading and validating photos...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/90">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/10"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
