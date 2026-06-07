'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import { Lock, Mail, Loader2, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  const autofillCreds = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-card rounded-3xl p-8 border border-border shadow-xl glow-orange">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back to <span className="text-orange-500">QuickBite</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Or{' '}
            <Link href="/register" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-3 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-3 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center rounded-xl py-3 text-sm font-bold shadow-md btn-primary-gradient disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <KeyRound className="h-3.5 w-3.5 text-orange-500" />
            <span>Assessor Test Logins</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              onClick={() => autofillCreds('customer1@quickbite.com', 'customer123')}
              className="flex justify-between items-center px-3 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-colors"
            >
              <div>
                <span className="font-bold block text-slate-700 dark:text-slate-300">Customer Account</span>
                <span className="text-slate-400 text-[10px]">customer1@quickbite.com</span>
              </div>
              <span className="text-[10px] bg-orange-100 dark:bg-orange-950/40 text-orange-600 px-2 py-0.5 rounded font-bold uppercase">Autofill</span>
            </button>
            <button
              onClick={() => autofillCreds('owner1@quickbite.com', 'owner123')}
              className="flex justify-between items-center px-3 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-colors"
            >
              <div>
                <span className="font-bold block text-slate-700 dark:text-slate-300">Restaurant Owner</span>
                <span className="text-slate-400 text-[10px]">owner1@quickbite.com</span>
              </div>
              <span className="text-[10px] bg-orange-100 dark:bg-orange-950/40 text-orange-600 px-2 py-0.5 rounded font-bold uppercase">Autofill</span>
            </button>
            <button
              onClick={() => autofillCreds('admin@quickbite.com', 'admin123')}
              className="flex justify-between items-center px-3 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-colors"
            >
              <div>
                <span className="font-bold block text-slate-700 dark:text-slate-300">Platform Admin</span>
                <span className="text-slate-400 text-[10px]">admin@quickbite.com</span>
              </div>
              <span className="text-[10px] bg-orange-100 dark:bg-orange-950/40 text-orange-600 px-2 py-0.5 rounded font-bold uppercase">Autofill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
