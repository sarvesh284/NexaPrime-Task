'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { AdminAuditLog, Pagination } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);

    api
      .get<{ auditLogs: AdminAuditLog[] }>('/admin/audit-logs', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      })
      .then((res) => {
        if (res.data?.auditLogs) {
          setLogs(res.data.auditLogs);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, pagination.page, pagination.limit]);

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
            <FileText className="w-6 h-6 text-blue-400" />
            <span>Administrative Security Audit Logs</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Immutable tracking record of privileged actions, targets, actors, and metadata
          </p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-zinc-950/60">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Target</th>
                  <th className="py-3 px-4 font-semibold">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-normal">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-semibold text-white">{log.actorEmail}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">{log.actorRole}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-medium text-zinc-300">{log.targetType}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{log.targetId}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-zinc-400 font-mono text-[11px]">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <span>{JSON.stringify(log.metadata)}</span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-500 text-xs">
            <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-400">No audit logs recorded yet</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
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
    </div>
  );
}
