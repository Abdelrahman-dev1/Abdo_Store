'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Validation State
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg('');

    // 1. Supabase Authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMsg('Invalid email or password. Please try again.');
      return;
    }

    // 2. Role Verification
    const user = data.user;
    const userRole = user?.user_metadata?.role;

    if (userRole !== 'admin') {
      await supabase.auth.signOut();
      setLoading(false);
      setErrorMsg(
        'Access denied. This account does not have administrator privileges.',
      );
      return;
    }

    // 3. Success -> Redirect to Admin Dashboard
    setLoading(false);
    router.push('/admin');
    router.refresh();
  };

  return (
    <div className='min-h-screen w-full bg-[#07090e] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-red-500 selection:text-white relative overflow-y-auto'>
      {/* Background Animated Neon Orbs (Fixed Position so they don't distort scroll) */}
      <div className='fixed -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse' />
      <div className='fixed -bottom-32 -right-32 w-96 h-96 bg-red-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse duration-1000' />
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none' />

      {/* Main Split Container - Fully Responsive with proper padding & margin */}
      <div className='relative z-10 w-full max-w-5xl my-auto bg-[#0e1626]/90 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.7)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden'>
        {/* Left Side: Visual / Animation / Branding Side */}
        <div className='lg:col-span-5 relative bg-gradient-to-br from-[#111c30] via-[#0b101c] to-[#07090e] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80'>
          {/* Decorative Grid Lines Pattern */}
          <div className='absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none' />

          {/* Top Badge */}
          <div className='relative z-10'>
            <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300 shadow-inner'>
              <ShieldCheck className='w-3.5 h-3.5 text-emerald-400 animate-pulse' />
              <span>Secure Command Center</span>
            </div>
          </div>

          {/* Center Content */}
          <div className='relative z-10 my-8 sm:my-12 text-center lg:text-left'>
            <div className='relative w-20 h-20 mx-auto lg:mx-0 mb-6 bg-gradient-to-tr from-red-600 via-rose-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-red-600/30 group hover:scale-105 transition-transform duration-500'>
              <Lock
                className='w-10 h-10 text-white animate-bounce'
                style={{ animationDuration: '3s' }}
              />
              <div className='absolute -inset-1 bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500 rounded-3xl blur opacity-40 group-hover:opacity-80 transition duration-500 -z-10' />
            </div>

            <h2 className='text-2xl sm:text-3xl font-black tracking-tight text-white mb-3'>
              Store{' '}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-blue-400 to-emerald-400'>
                Admin Panel
              </span>
            </h2>
            <p className='text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto lg:mx-0 font-medium'>
              Manage your e-commerce platform, track orders, monitor analytics,
              and update products with absolute power and security.
            </p>

            {/* Floating Mini Interactive Visual Badge */}
            <div className='mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center gap-3.5 text-left shadow-lg max-w-xs mx-auto lg:mx-0'>
              <div className='w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0'>
                <Terminal className='w-5 h-5' />
              </div>
              <div>
                <div className='text-xs font-bold text-slate-200'>
                  System Status
                </div>
                <div className='text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5'>
                  <span className='w-2 h-2 rounded-full bg-emerald-400 animate-ping' />
                  All nodes operational
                </div>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className='relative z-10 text-xs text-slate-500 font-medium'>
            &copy; 2026 Store Management. All rights reserved.
          </div>
        </div>

        {/* Right Side: Login Form Side */}
        <div className='lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center'>
          <div className='max-w-md w-full mx-auto'>
            <div className='mb-8'>
              <h1 className='text-2xl sm:text-3xl font-black text-white tracking-tight mb-2'>
                Welcome Back! 👋
              </h1>
              <p className='text-slate-400 text-xs sm:text-sm font-medium'>
                Please enter your administrator credentials to continue.
              </p>
            </div>

            {/* Error Notification Alert */}
            {errorMsg && (
              <div className='mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-2xl flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg'>
                <AlertCircle className='w-5 h-5 flex-shrink-0 text-red-400 mt-0.5' />
                <span className='leading-relaxed font-medium'>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className='space-y-5' noValidate>
              {/* Email Field */}
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Email Address
                </label>
                <div className='relative group'>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    className={`w-full px-4 py-3.5 pl-11 pr-4 bg-[#141d2f]/90 border ${
                      emailError
                        ? 'border-red-500'
                        : 'border-slate-700/80 group-hover:border-slate-600'
                    } rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-sm transition-all duration-200 font-sans`}
                    placeholder='admin@store.com'
                  />
                  <Mail className='w-5 h-5 absolute left-3.5 top-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none' />
                </div>
                {emailError && (
                  <p className='text-red-400 text-[11px] mt-1.5 font-medium ml-1'>
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider'>
                    Password
                  </label>
                </div>
                <div className='relative group'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    className={`w-full px-4 py-3.5 pl-11 pr-11 bg-[#141d2f]/90 border ${
                      passwordError
                        ? 'border-red-500'
                        : 'border-slate-700/80 group-hover:border-slate-600'
                    } rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-white placeholder-slate-500 outline-none text-sm transition-all duration-200 font-sans`}
                    placeholder='••••••••'
                  />
                  <Lock className='w-5 h-5 absolute left-3.5 top-4 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none' />

                  {/* Show / Hide Password Toggle Button */}
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3.5 top-4 text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer'
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className='text-red-400 text-[11px] mt-1.5 font-medium ml-1'>
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={loading}
                className='relative w-full py-4 mt-2 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 hover:shadow-red-600/30 transition-all duration-300 disabled:opacity-50 text-sm flex items-center justify-center gap-2.5 overflow-hidden group cursor-pointer'
              >
                {loading ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin text-white' />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
                  </>
                )}
              </button>
            </form>

            {/* Return to Store Link */}
            <div className='mt-8 text-center border-t border-slate-800/80 pt-6'>
              <Link
                href='/'
                className='text-xs text-slate-400 hover:text-white inline-flex items-center gap-2 transition-colors duration-200 group font-medium'
              >
                <ArrowRight className='w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1' />
                <span>Return to Main Store</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
