'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import { api, ApiError } from '../../../lib/api';
import { AdminUser, Pagination } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Toast';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Confirmation dialog state
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      .get<{ users: AdminUser[] }>('/admin/users', {
        params: {
          search: debouncedSearch || undefined,
          role: role || undefined,
          status,
          page: pagination.page,
          limit: pagination.limit,
        },
      })
      .then((res) => {
        if (res.data?.users) {
          setUsers(res.data.users);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, debouncedSearch, role, status, pagination.page, pagination.limit]);

  const handleToggleStatus = async () => {
    if (!confirmUser) return;
    try {
      setActionLoading(true);
      const res = await api.patch<{ isActive: boolean; message: string }>(
        `/admin/users/${confirmUser.id}/status`
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === confirmUser.id ? { ...u, isActive: res.data?.isActive ?? !u.isActive } : u))
      );
      success(res.data?.message || 'User status updated successfully');
      setConfirmUser(null);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update user status';
      toastError(msg);
    } finally {
      setActionLoading(false);
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
            <Users className="w-6 h-6 text-emerald-400" />
            <span>User & Account Management</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            View platform accounts, search by identity, and manage activation statuses
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="USER">Consumers (USER)</option>
            <option value="STORE_OWNER">Merchants (STORE_OWNER)</option>
            <option value="ADMIN">Administrators (ADMIN)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="deactivated">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-950/60">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Registered</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-normal">
                {users.map((u) => {
                  const isCurrentAdmin = u.id === user.id;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        {u.name}
                        {isCurrentAdmin && (
                          <span className="ml-2 text-[10px] text-amber-400 font-normal">(You)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            u.role === 'ADMIN'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : u.role === 'STORE_OWNER'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!isCurrentAdmin && (
                          <button
                            onClick={() => setConfirmUser(u)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              u.isActive
                                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-950/80'
                                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-950/80'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-500 text-xs">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-400">No users found</p>
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

      {/* Confirmation Dialog */}
      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                confirmUser.isActive
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <UserCheck className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white">
              {confirmUser.isActive ? 'Deactivate User Account?' : 'Reactivate User Account?'}
            </h3>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to {confirmUser.isActive ? 'deactivate' : 'reactivate'}{' '}
              <span className="font-semibold text-white">{confirmUser.name}</span> (
              {confirmUser.email})?{' '}
              {confirmUser.isActive && 'Their active login sessions will be immediately revoked.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmUser(null)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleStatus}
                className={`flex-1 py-2 rounded-xl text-xs font-bold text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                  confirmUser.isActive
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
