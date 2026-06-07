'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import api from '../../services/api';
import { ClipboardList, Clock, Loader2, PackageCheck, AlertCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const ORDER_STATUSES = ['Pending', 'Preparing', 'Out for delivery', 'Delivered'];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-4">Please log in to view your orders.</h2>
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
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
        My Orders
      </h1>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStep = ORDER_STATUSES.indexOf(order.status);
            const isRejected = order.status === 'Rejected';

            return (
              <div
                key={order.id}
                className="bg-card text-card-foreground border border-border rounded-3xl p-6 shadow-sm space-y-6"
              >
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-950 dark:text-slate-50">
                      Order #{order.id} from <span className="text-orange-500">{order.restaurant_name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Ordered on {new Date(order.created_at).toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 block">Total Amount</span>
                    <span className="font-extrabold text-lg text-orange-600 dark:text-orange-400">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Items Ordered
                    </span>
                    <ul className="space-y-1.5">
                      {order.items?.map((item: any) => (
                        <li key={item.id} className="flex justify-between max-w-sm">
                          <span>
                            {item.food_name} <span className="text-slate-400">x{item.quantity}</span>
                          </span>
                          <span className="font-bold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Delivery Details
                    </span>
                    <p className="italic text-slate-500 max-w-sm">{order.delivery_address}</p>
                    <div className="pt-1 flex items-center space-x-1.5">
                      <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-800">
                        {order.payment_method}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  {isRejected ? (
                    <div className="flex items-center space-x-2 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>This order was rejected/cancelled by the restaurant.</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative flex items-center justify-between">
                        {/* Progress line */}
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 -z-10" />
                        <div
                          className="absolute left-0 top-1/2 h-0.5 bg-orange-500 -translate-y-1/2 transition-all duration-500 -z-10"
                          style={{
                            width: `${(Math.max(0, currentStep) / (ORDER_STATUSES.length - 1)) * 100}%`
                          }}
                        />

                        {/* Status steps */}
                        {ORDER_STATUSES.map((status, index) => {
                          const isCompleted = index <= currentStep;
                          const isActive = index === currentStep;

                          return (
                            <div key={status} className="flex flex-col items-center space-y-2 relative">
                              <div
                                className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-black shadow-sm transition-all ${
                                  isCompleted
                                    ? 'bg-orange-500 border-orange-500 text-white'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                                } ${isActive ? 'ring-4 ring-orange-200 dark:ring-orange-950 scale-110' : ''}`}
                              >
                                {index + 1}
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs font-black tracking-wider uppercase ${
                                  isActive
                                    ? 'text-orange-500'
                                    : isCompleted
                                    ? 'text-slate-700 dark:text-slate-300'
                                    : 'text-slate-400'
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-2xl max-w-xl mx-auto space-y-4">
          <ShoppingBag className="mx-auto h-16 w-16 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Orders Found</h2>
          <p className="text-sm text-slate-500">
            You haven't placed any orders yet. Try browsing our restaurant menus!
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl btn-primary-gradient shadow font-bold text-sm inline-block"
          >
            Find Food
          </Link>
        </div>
      )}
    </div>
  );
}
