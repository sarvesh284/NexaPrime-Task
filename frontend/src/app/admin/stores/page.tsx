'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  UserCheck,
  Star,
  X,
} from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { AdminStore, AdminUser, Pagination } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Toast';

export default function AdminStoresPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [stores, setStores] = useState<AdminStore[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    email: '',
    address: '',
    category: 'Retail',
    city: 'San Francisco',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Assign Owner state
  const [assignStore, setAssignStore] = useState<AdminStore | null>(null);
  const [ownersList, setOwnersList] = useState<AdminUser[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);

    api
      .get<{ stores: AdminStore[] }>('/admin/stores', {
        params: {
          search: debouncedSearch || undefined,
          status,
          page: pagination.page,
          limit: pagination.limit,
        },
      })
      .then((res) => {
        if (res.data?.stores) {
          setStores(res.data.stores);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, debouncedSearch, status, pagination.page, pagination.limit]);

  // Load store owners when open assign modal
  const openAssignModal = async (store: AdminStore) => {
    setAssignStore(store);
    setSelectedOwnerId(store.owner?.id || '');
    try {
      const res = await api.get<{ users: AdminUser[] }>('/admin/users', {
        params: { role: 'STORE_OWNER', limit: 100 },
      });
      if (res.data?.users) {
        setOwnersList(res.data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const res = await api.post<{ store: AdminStore }>('/admin/stores', newStore);
      if (res.data?.store) {
        setStores((prev) => [res.data!.store, ...prev]);
        success('Store created successfully');
        setIsCreateModalOpen(false);
        setNewStore({ name: '', email: '', address: '', category: 'Retail', city: 'San Francisco' });
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create store';
      toastError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStore) return;
    try {
      setAssignLoading(true);
      await api.post(`/admin/stores/${assignStore.id}/assign-owner`, {
        ownerId: selectedOwnerId || null,
      });

      const selectedOwner = ownersList.find((o) => o.id === selectedOwnerId);
      setStores((prev) =>
        prev.map((s) =>
          s.id === assignStore.id
            ? {
                ...s,
                owner: selectedOwner
                  ? { id: selectedOwner.id, name: selectedOwner.name, email: selectedOwner.email }
                  : null,
              }
            : s
        )
      );

      success('Store owner updated successfully');
      setAssignStore(null);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to assign store owner';
      toastError(msg);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleToggleStoreStatus = async (store: AdminStore) => {
    try {
      const newStatus = !store.isActive;
      await api.patch(`/admin/stores/${store.id}`, { isActive: newStatus });
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, isActive: newStatus } : s))
      );
      success(`Store ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to toggle status';
      toastError(msg);
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
            <Building className="w-6 h-6 text-purple-400" />
            <span>Store Establishment Management</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Create physical store profiles, assign verified owners, and control operational status
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Store</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores by name, email, or address..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Store Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Stores Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : stores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-950/60">
                <tr>
                  <th className="py-3 px-4 font-semibold">Store</th>
                  <th className="py-3 px-4 font-semibold">Category / City</th>
                  <th className="py-3 px-4 font-semibold">Assigned Owner</th>
                  <th className="py-3 px-4 font-semibold">Rating</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-normal">
                {stores.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white whitespace-nowrap">{s.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate max-w-xs">{s.address}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-[10px] font-medium mr-1.5">
                        {s.category}
                      </span>
                      <span className="text-zinc-400 text-[11px]">{s.city}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {s.owner ? (
                        <div>
                          <p className="font-medium text-purple-300">{s.owner.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{s.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{s.averageRating > 0 ? s.averageRating.toFixed(1) : '0.0'}</span>
                        <span className="text-[10px] text-zinc-500">({s.ratingCount})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => openAssignModal(s)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
                      >
                        Assign Owner
                      </button>
                      <button
                        onClick={() => handleToggleStoreStatus(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                          s.isActive
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-950/80'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-950/80'
                        }`}
                      >
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-500 text-xs">
            <Building className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-400">No stores found</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add New Store Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-400" />
                <span>Create New Store</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  placeholder="e.g. Apex Tech Hardware"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Store Email</label>
                <input
                  type="email"
                  required
                  value={newStore.email}
                  onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                  placeholder="contact@store.com"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  placeholder="123 Commerce St, Suite A"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={newStore.category}
                    onChange={(e) => setNewStore({ ...newStore, category: e.target.value })}
                    placeholder="e.g. Electronics"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newStore.city}
                    onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                    placeholder="e.g. San Francisco"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Create Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Owner Modal */}
      {assignStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Assign Store Owner</span>
              </h3>
              <button onClick={() => setAssignStore(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Select a registered merchant account for{' '}
              <span className="font-semibold text-white">{assignStore.name}</span>:
            </p>

            <form onSubmit={handleAssignOwner} className="space-y-4 text-xs">
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-400"
              >
                <option value="">-- No Owner (Unassigned) --</option>
                {ownersList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.email})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignStore(null)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {assignLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
