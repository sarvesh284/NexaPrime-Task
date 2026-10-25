'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Tag,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Store } from '../types';
import { useToast } from './Toast';

interface StoreFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  store?: Store | null;
  onClose: () => void;
  onSuccess: (savedStore: Store, isEdit: boolean) => void;
}

const CATEGORY_OPTIONS = [
  'Retail',
  'Bakery',
  'Restaurant',
  'Cafe',
  'Grocery',
  'Electronics',
  'Healthcare',
  'Fashion & Apparel',
  'Home & Decor',
  'Automotive',
  'Services',
  'Other',
];

const CITY_OPTIONS = [
  'Pune',
  'Mumbai',
  'Nagpur',
  'Nashik',
  'Thane',
  'Aurangabad',
  'Kolhapur',
  'Solapur',
  'Other',
];

export const StoreFormModal: React.FC<StoreFormModalProps> = ({
  isOpen,
  mode,
  store,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Retail',
    customCategory: '',
    address: '',
    city: 'Pune',
    customCity: '',
    state: 'Maharashtra',
    description: '',
    phone: '',
    email: '',
    website: '',
    coverImage: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeneralError(null);
      setFieldErrors({});
      if (mode === 'edit' && store) {
        const isCustomCat = !CATEGORY_OPTIONS.includes(store.category || '');
        const isCustomCity = !CITY_OPTIONS.includes(store.city || '');

        setFormData({
          name: store.name || '',
          category: isCustomCat ? 'Other' : store.category || 'Retail',
          customCategory: isCustomCat ? store.category || '' : '',
          address: store.address || '',
          city: isCustomCity ? 'Other' : store.city || 'Pune',
          customCity: isCustomCity ? store.city || '' : '',
          state: (store as any).state || 'Maharashtra',
          description: store.description || '',
          phone: store.phone || '',
          email: store.email || '',
          website: store.website || '',
          coverImage: store.coverImage || '',
        });
      } else {
        setFormData({
          name: '',
          category: 'Retail',
          customCategory: '',
          address: '',
          city: 'Pune',
          customCity: '',
          state: 'Maharashtra',
          description: '',
          phone: '',
          email: '',
          website: '',
          coverImage: '',
        });
      }
    }
  }, [isOpen, mode, store]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Store name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Store name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Store name cannot exceed 100 characters';
    }

    if (formData.category === 'Other' && !formData.customCategory.trim()) {
      errors.category = 'Please specify the custom category';
    }

    if (!formData.address.trim()) {
      errors.address = 'Physical address is required';
    } else if (formData.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters';
    } else if (formData.address.trim().length > 400) {
      errors.address = 'Address cannot exceed 400 characters';
    }

    if (formData.city === 'Other' && !formData.customCity.trim()) {
      errors.city = 'Please specify the city';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setGeneralError(null);

      const effectiveCategory =
        formData.category === 'Other' ? formData.customCategory.trim() : formData.category;
      const effectiveCity =
        formData.city === 'Other' ? formData.customCity.trim() : formData.city;

      const payload = {
        name: formData.name.trim(),
        category: effectiveCategory,
        address: formData.address.trim(),
        city: effectiveCity,
        state: formData.state.trim() || 'Maharashtra',
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        website: formData.website.trim(),
        coverImage: formData.coverImage.trim(),
      };

      if (mode === 'create') {
        const res = await api.post<{ store: Store; message: string }>('/owner/stores', payload);
        const createdStore = res.data?.store;
        if (!createdStore) throw new Error('Failed to retrieve created store details.');
        success(res.data?.message || 'Store registered successfully!');
        onSuccess(createdStore, false);
      } else if (mode === 'edit' && store) {
        const res = await api.put<{ store: Store; message: string }>(
          `/owner/stores/${store.id}`,
          payload
        );
        const updatedStore = res.data?.store;
        if (!updatedStore) throw new Error('Failed to retrieve updated store details.');
        success(res.data?.message || 'Store profile updated successfully!');
        onSuccess(updatedStore, true);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.details && typeof err.details === 'object') {
        const details = err.details as Record<string, string[]>;
        const mappedErrors: Record<string, string> = {};
        Object.entries(details).forEach(([key, msgs]) => {
          if (Array.isArray(msgs) && msgs.length > 0) {
            mappedErrors[key] = msgs[0];
          }
        });
        setFieldErrors(mappedErrors);
        setGeneralError(err.message || 'Validation error occurred.');
      } else {
        const msg = err instanceof Error ? err.message : 'An error occurred while saving the store.';
        setGeneralError(msg);
        toastError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-white my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {mode === 'create' ? 'Register New Store' : 'Edit Store Details'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {mode === 'create'
                  ? 'Add your business location to the RateLocal community directory'
                  : `Updating profile details for "${store?.name}"`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {generalError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4 text-xs custom-scrollbar">
          {/* Store Name */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">
                Store Name <span className="text-amber-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                {formData.name.length}/100 chars
              </span>
            </div>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pune Artisan Bakery & Cafe"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                  fieldErrors.name
                    ? 'border-rose-500'
                    : 'border-slate-200 dark:border-zinc-800'
                } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors shadow-2xs`}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Category & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Category <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer shadow-2xs"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {formData.category === 'Other' && (
                <input
                  type="text"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  placeholder="Enter custom category"
                  className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              )}
              {fieldErrors.category && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.category}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                City <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer shadow-2xs"
                >
                  {CITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {formData.city === 'Other' && (
                <input
                  type="text"
                  value={formData.customCity}
                  onChange={(e) => setFormData({ ...formData, customCity: e.target.value })}
                  placeholder="Enter custom city"
                  className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              )}
              {fieldErrors.city && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.city}</p>
              )}
            </div>
          </div>

          {/* Physical Address */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">
                Physical Address <span className="text-amber-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                {formData.address.length}/400 chars
              </span>
            </div>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Shop No. 12, Ferguson College Road, Deccan Gymkhana, Pune, Maharashtra 411004"
              className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                fieldErrors.address
                  ? 'border-rose-500'
                  : 'border-slate-200 dark:border-zinc-800'
              } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none shadow-2xs`}
            />
            {fieldErrors.address && (
              <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.address}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">
                Description & Business Specialties
              </label>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                {formData.description.length}/1000 chars
              </span>
            </div>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell customers about your products, freshly baked goods, services, specialties, and operating hours..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none shadow-2xs"
            />
          </div>

          {/* Contact Details: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98220 12345"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Business Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@store.com"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                    fieldErrors.email
                      ? 'border-rose-500'
                      : 'border-slate-200 dark:border-zinc-800'
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          {/* Website & Cover Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Cover Photo URL
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50 transition-all active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'create' ? 'Registering Store...' : 'Saving Changes...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'create' ? 'Register Store' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
