'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthContext';
import { LogOut, ClipboardList, LayoutDashboard, Shield } from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartCount, setCartCount] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>('');

  const fetchCartCount = async () => {
    if (!user || user.role !== 'customer') return;
    try {
      const response = await api.get('/cart');
      const count = response.data.reduce((total: number, item: any) => total + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  useEffect(() => {
    fetchCartCount();

    // Listen for cart changes
    window.addEventListener('cart-updated', fetchCartCount);
    return () => {
      window.removeEventListener('cart-updated', fetchCartCount);
    };
  }, [user]);

  // Sync navbar search with URL params
  useEffect(() => {
    const searchVal = searchParams.get('search') || '';
    setSearchValue(searchVal);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/?search=${encodeURIComponent(searchValue)}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E8E6E1] py-4 px-4 md:px-10 font-utility text-charcoal">
      <div className="flex items-center gap-8 w-full max-w-6xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 text-charcoal cursor-pointer hover:opacity-90 transition-opacity">
          <div className="size-6 text-primary flex items-center justify-center">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"></path>
              <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-charcoal text-2xl font-editorial font-medium tracking-tight">QuickBite</h2>
        </Link>

        {/* Navigation Links for Customer/Role */}
        {user && user.role === 'customer' && (
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={`hover:text-primary transition-colors ${pathname === '/' ? 'text-primary' : 'text-warm-gray'}`}
            >
              Explore
            </Link>
            <Link
              href="/orders"
              className={`hover:text-primary transition-colors ${pathname === '/orders' ? 'text-primary' : 'text-warm-gray'}`}
            >
              My Orders
            </Link>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-col flex-1 max-w-md mx-auto">
          <div className="flex w-full items-center rounded-lg bg-white shadow-soft border border-[#E8E6E1] transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
            <div className="text-warm-gray flex items-center justify-center pl-4 pr-2">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full flex-1 bg-transparent border-none focus:ring-0 text-charcoal placeholder:text-warm-gray py-2.5 px-2 text-sm outline-none"
              placeholder="Search curated restaurants..."
            />
          </div>
        </form>

        {/* Actions / User profile */}
        <div className="flex items-center gap-4 ml-auto">
          {user ? (
            <>
              {user.role === 'customer' && (
                <Link
                  href="/cart"
                  className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-50 transition-colors text-charcoal"
                  title="Shopping Cart"
                >
                  <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {user.role === 'restaurant' && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/restaurant-dashboard"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all text-charcoal border border-[#E8E6E1]"
                  >
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    <span className="hidden sm:inline">Menu Panel</span>
                  </Link>
                  <Link
                    href="/restaurant-dashboard/orders"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all text-charcoal border border-[#E8E6E1]"
                  >
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <span className="hidden sm:inline">Orders</span>
                  </Link>
                </div>
              )}

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-purple-50 transition-all text-purple-600 border border-purple-100"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Profile indicator */}
              <div className="flex items-center gap-3 border-l border-[#E8E6E1] pl-4">
                <div className="flex flex-col text-right hidden sm:block">
                  <span className="text-xs font-semibold text-charcoal leading-tight">{user.name}</span>
                  <span className="text-[10px] text-warm-gray uppercase tracking-widest leading-none font-bold mt-0.5">{user.role}</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20" title={user.name}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 text-warm-gray hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-charcoal rounded-lg hover:bg-slate-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-primary hover:bg-[#c93f10] shadow-soft transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>

  );
}
