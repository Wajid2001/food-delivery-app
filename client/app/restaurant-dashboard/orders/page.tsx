'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../components/AuthContext';
import api from '../../../services/api';
import { ClipboardList, Clock, MapPin, User, Check, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching restaurant orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    setActionLoadingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!user || user.role !== 'restaurant') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-4">Access Denied: Restaurant Owner account required.</h2>
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
        Restaurant Orders Queue
      </h1>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const isPending = order.status === 'Pending';
            const isPreparing = order.status === 'Preparing';
            const isOutForDelivery = order.status === 'Out for delivery';
            const isDelivered = order.status === 'Delivered';
            const isRejected = order.status === 'Rejected';

            return (
              <div
                key={order.id}
                className={`bg-card text-card-foreground border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${
                  isRejected ? 'border-red-200 dark:border-red-950 bg-red-50/10' : 'border-border'
                }`}
              >
                {/* Info (Left) */}
                <div className="space-y-4 flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-950 dark:text-slate-50">
                      Order #{order.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(order.created_at).toLocaleString()}</span>
                    </span>
                    
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isPending
                          ? 'border-yellow-200 bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20'
                          : isPreparing
                          ? 'border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                          : isOutForDelivery
                          ? 'border-purple-200 bg-purple-50 text-purple-600 dark:bg-purple-950/20'
                          : isDelivered
                          ? 'border-green-200 bg-green-50 text-green-600 dark:bg-green-950/20'
                          : 'border-red-200 bg-red-50 text-red-600 dark:bg-red-950/20'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Customer and Delivery details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-800 dark:text-slate-200">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{order.delivery_address}</span>
                      </div>
                    </div>

                    <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                        Ordered Items
                      </span>
                      <ul className="space-y-0.5 text-[11px]">
                        {order.items?.map((item: any) => (
                          <li key={item.id} className="truncate max-w-[200px]">
                            {item.food_name} <span className="text-slate-400">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Status Update Actions (Right) */}
                <div className="flex flex-col items-end shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                  <div className="text-right mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Payout
                    </span>
                    <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>

                  {actionLoadingId === order.id ? (
                    <div className="flex items-center space-x-2 text-xs text-orange-500 font-bold">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full justify-end">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Rejected')}
                            className="flex items-center space-x-1 px-3 py-2 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                            className="flex items-center space-x-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Accept</span>
                          </button>
                        </>
                      )}

                      {isPreparing && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Out for delivery')}
                          className="flex items-center space-x-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                        >
                          <span>Ship Order</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {isOutForDelivery && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                          className="flex items-center space-x-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {(isDelivered || isRejected) && (
                        <span className="text-xs text-slate-400 font-semibold italic py-2">
                          Order Completed
                        </span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-2xl max-w-xl mx-auto space-y-4">
          <ClipboardList className="mx-auto h-16 w-16 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Orders Received</h2>
          <p className="text-sm text-slate-500">
            Keep this tab open. Incoming customer orders will appear here in real-time.
          </p>
        </div>
      )}
    </div>
  );
}
