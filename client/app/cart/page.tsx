'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import api from '../../services/api';
import { ShoppingBag, Minus, Plus, Trash2, MapPin, CreditCard, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [address, setAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Card');
  const [checkingOut, setCheckingOut] = useState<boolean>(false);

  const fetchCart = async () => {
    if (!user) return;
    try {
      const response = await api.get('/cart');
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleQuantityChange = async (foodId: number, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    try {
      await api.post('/cart/add', {
        food_id: foodId,
        quantity: newQty,
        replace: true
      });
      await fetchCart();
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      await fetchCart();
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('Please enter a delivery address.');
      return;
    }

    setCheckingOut(true);
    try {
      await api.post('/orders', {
        delivery_address: address,
        payment_method: paymentMethod
      });
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/orders');
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-4">Please log in to view your cart.</h2>
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

  // Calculate pricing
  const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 3.99 : 0;
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + deliveryFee + tax;

  const restaurantName = cartItems.length > 0 ? cartItems[0].restaurant_name : '';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-8">
        Your Cart
      </h1>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Items List (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ordering from: <span className="text-orange-500">{restaurantName}</span>
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {cartItems.length} items
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                        alt={item.food_name}
                        className="h-16 w-16 object-cover rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.food_name}</h4>
                        <span className="text-xs font-semibold text-slate-500">${parseFloat(item.price).toFixed(2)} each</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2.5 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 bg-slate-50/50 dark:bg-slate-900/30">
                        <button
                          onClick={() => handleQuantityChange(item.food_id, item.quantity, -1)}
                          className="p-0.5 text-slate-500 hover:text-orange-500 transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.food_id, item.quantity, 1)}
                          className="p-0.5 text-slate-500 hover:text-orange-500 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Item Total Price */}
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 w-16 text-right">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout & Summary (Right 1 col) */}
          <div className="space-y-6">
            <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-extrabold text-lg border-b border-slate-100 dark:border-slate-800 pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Tax (5%)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <span>Total</span>
                  <span className="text-orange-600 dark:text-orange-400">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handlePlaceOrder} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Delivery Address</span>
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-3 text-sm placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none animate-none"
                    placeholder="Enter full delivery address and special instructions..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    <span>Payment Method</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Card')}
                      className={`py-2 px-3 border text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        paymentMethod === 'Card'
                          ? 'border-orange-500 bg-orange-50/30 text-orange-600 dark:bg-orange-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`py-2 px-3 border text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        paymentMethod === 'COD'
                          ? 'border-orange-500 bg-orange-50/30 text-orange-600 dark:bg-orange-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      Cash on Delivery
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={checkingOut}
                  className="flex w-full justify-center items-center rounded-xl py-3.5 text-sm font-bold shadow-md btn-primary-gradient disabled:opacity-50 cursor-pointer pt-3"
                >
                  {checkingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-2xl max-w-xl mx-auto space-y-4">
          <ShoppingBag className="mx-auto h-16 w-16 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Cart is Empty</h2>
          <p className="text-sm text-slate-500">
            Looks like you haven't added anything to your cart yet. Let's find some delicious meals.
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl btn-primary-gradient shadow font-bold text-sm inline-block"
          >
            Explore Restaurants
          </Link>
        </div>
      )}
    </div>
  );
}
