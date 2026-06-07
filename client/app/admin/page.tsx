'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import api from '../../services/api';
import { Shield, Users, Store, ClipboardList, DollarSign, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [blockingUserId, setBlockingUserId] = useState<number | null>(null);

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data);
      setUsersList(usersRes.data);
    } catch (error) {
      console.error('Error loading admin console:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleToggleBlock = async (targetUserId: number, currentBlockedStatus: boolean) => {
    setBlockingUserId(targetUserId);
    try {
      await api.put(`/admin/users/${targetUserId}/block`, {
        is_blocked: !currentBlockedStatus
      });
      await loadAdminData();
    } catch (error) {
      console.error('Error toggling user block status:', error);
      alert('Failed to update user block status.');
    } finally {
      setBlockingUserId(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-4">Access Denied: Admin privileges required.</h2>
        <Link href="/login" className="px-5 py-2.5 rounded-xl btn-primary-gradient shadow font-bold text-sm">
          Log in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 border border-purple-200">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Admin Management Console</h1>
          <p className="text-xs text-slate-500 font-medium">Control platform users, monitor stores, and track sales revenue.</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Users */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-xl border border-blue-200/50">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalUsers}</span>
            </div>
          </div>

          {/* Card 2: Restaurants */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl border border-emerald-200/50">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Restaurants</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalRestaurants}</span>
            </div>
          </div>

          {/* Card 3: Orders */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl border border-amber-200/50">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalOrders}</span>
            </div>
          </div>

          {/* Card 4: Revenue */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-xl border border-orange-200/50">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Revenue (Completed)</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                ${stats.totalRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Users Control Board & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Users Management Board (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            User Account Management
          </h2>
          
          <div className="bg-card text-card-foreground border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border text-slate-400 uppercase font-black tracking-wider">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="p-4">
                        <div className="flex items-center space-x-2.5">
                          <span className={`h-2 w-2 rounded-full ${usr.is_blocked ? 'bg-red-500' : 'bg-green-500'}`} />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{usr.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-500">{usr.email}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 uppercase tracking-widest text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                          {usr.role}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-400">
                        {new Date(usr.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {blockingUserId === usr.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-orange-500 ml-auto" />
                        ) : (
                          <button
                            onClick={() => handleToggleBlock(usr.id, usr.is_blocked)}
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                              usr.is_blocked
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900'
                                : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                            }`}
                          >
                            <Ban className="h-3 w-3" />
                            <span>{usr.is_blocked ? 'Unblock' : 'Block'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Platform Orders (Right 1 col) */}
        {stats && (
          <div className="space-y-4">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Recent Orders
            </h2>
            <div className="bg-card text-card-foreground border border-border rounded-3xl p-5 shadow-sm space-y-4">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentOrders.map((ord: any) => (
                  <div key={ord.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          Order #{ord.id}
                        </span>
                        <span
                          className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                            ord.status === 'Delivered'
                              ? 'border-green-200 bg-green-50 text-green-600 dark:bg-green-950/20'
                              : ord.status === 'Rejected'
                              ? 'border-red-200 bg-red-50 text-red-600 dark:bg-red-950/20'
                              : 'border-yellow-200 bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {ord.customer_name} → {ord.restaurant_name}
                      </span>
                    </div>
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 text-right">
                      ${parseFloat(ord.total_amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
