'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { X, ShieldCheck, Mail, Lock, User, CheckCircle2, AlertCircle, HardDrive } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg(
        'Supabase authentication is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable cloud sync.'
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg('Account created successfully! Check your email to confirm your account.');
        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
        }, 1500);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Signed in successfully! Loading your personal plant collection...');
        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#183D32]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#183D32]/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#EDF4EB] border-b border-[#C8DBC4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#183D32] flex items-center justify-center text-[#DCE8D9]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#183D32]">
                {mode === 'signin' ? 'Sign In to PlantLens' : 'Create Free Account'}
              </h3>
              <p className="text-[11px] text-[#475850]">
                Access your plant collection across all your devices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#DCE8D9] text-[#183D32] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-[#183D32]/10 bg-[#F7F8F3]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              mode === 'signin'
                ? 'bg-white text-[#183D32] border-b-2 border-[#183D32]'
                : 'text-[#73847B] hover:text-[#183D32]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#183D32] border-b-2 border-[#183D32]'
                : 'text-[#73847B] hover:text-[#183D32]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#D97706]" />
                <span>Local Device Storage Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Cloud authentication requires Supabase environment variables (<code className="font-mono bg-[#FEF3C7] px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>). All collections and observations currently persist securely in your browser&apos;s local storage.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2 text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#EDF4EB] border border-[#C8DBC4] flex items-start gap-2 text-xs text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#183D32]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73847B]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Botanical Explorer"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#183D32]/20 text-xs bg-[#F7F8F3] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#183D32]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73847B]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gardener@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#183D32]/20 text-xs bg-[#F7F8F3] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#183D32]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73847B]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#183D32]/20 text-xs bg-[#F7F8F3] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#183D32] hover:bg-[#122E26] text-[#F7F8F3] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : mode === 'signin' ? (
              <span>Sign In to Account</span>
            ) : (
              <span>Create Account</span>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#73847B] hover:text-[#183D32] font-medium"
            >
              Continue using Local Offline Storage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
