'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  CreditCard,
  User,
  Phone,
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const [createAccount, setCreateAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setCity(profile.city || '');
        setAddress(profile.address || '');
      } else {
        setFullName(user.user_metadata?.full_name || '');
      }
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/checkout',
      },
    });
    if (error) {
      setErrorMessage('Google login failed: ' + error.message);
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingFee = 50;
  const totalAmount = subtotal + (cart.length > 0 ? shippingFee : 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setErrorMessage(null);

    let userId = currentUser?.id || null;

    if (!currentUser && createAccount) {
      if (!email || !password) {
        setErrorMessage(
          'Please enter your email and password to create an account.',
        );
        setLoading(false);
        return;
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setErrorMessage(
            'This email is already registered! Please sign in first.',
          );
        } else {
          setErrorMessage('Account creation error: ' + signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        userId = signUpData.user.id;
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: fullName,
          phone,
          city,
          address,
        });
      }
    }

    const orderData = {
      user_id: userId,
      customer_name: fullName,
      customer_phone: phone,
      city: city,
      customer_address: address,
      items: cart,
      total_amount: totalAmount,
      status: 'pending',
    };

    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      setErrorMessage('Error placing order: ' + orderError.message);
      setLoading(false);
      return;
    }

    try {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: insertedOrder.id, ...orderData }),
      });
    } catch (err) {
      console.log('Telegram error:', err);
    }

    localStorage.removeItem('cart');
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className='min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-red-500 selection:text-white'>
        <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
        <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

        <div className='relative z-10 bg-[#0e1626]/90 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full text-center space-y-6'>
          <div className='w-20 h-20 bg-emerald-950/60 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/40 animate-bounce'>
            <CheckCircle2 size={40} />
          </div>
          <div className='space-y-2'>
            <h1 className='text-2xl font-black text-white'>
              Order Placed Successfully! 🎉
            </h1>
            <p className='text-xs text-slate-400 leading-relaxed'>
              Thank you for shopping with us. We will contact you shortly to
              confirm your delivery.
            </p>
          </div>
          <Link
            href='/'
            className='w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl block shadow-lg shadow-red-950/50 transition cursor-pointer'
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-16 font-sans relative selection:bg-red-500 selection:text-white'>
      {/* Custom Neon Scrollbar Styles */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #07090e;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ef4444, #3b82f6);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #dc2626, #2563eb);
        }
      `}</style>

      {/* Background Glow Orbs */}
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      {/* Navbar */}
      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between'>
          <Link
            href='/'
            className='text-base sm:text-lg font-black flex items-center gap-2.5 text-white'
          >
            <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center shadow-lg shadow-red-600/20'>
              <ShoppingBag className='w-5 h-5 text-white' />
            </div>
            <span>Online Store</span>
          </Link>
          <Link
            href='/cart'
            className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
          >
            <ArrowLeft size={16} />
            <span>Return to Cart</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className='max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10'>
        <div className='mb-8'>
          <h1 className='text-2xl sm:text-3xl font-black text-white tracking-tight'>
            Checkout & Shipping
          </h1>
          <p className='text-xs text-slate-400 mt-1'>
            Complete your delivery details to finalize the order
          </p>
        </div>

        {errorMessage && (
          <div className='mb-6 bg-red-950/40 border border-red-500/30 text-red-300 p-4 rounded-2xl text-xs font-medium backdrop-blur-md shadow-lg'>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className='space-y-6'>
          {/* Shipping Information Card */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl space-y-5'>
            <h2 className='text-base font-black text-white flex items-center gap-2.5 border-b border-slate-800 pb-4'>
              <MapPin className='w-5 h-5 text-blue-400' />
              <span>Delivery Information</span>
            </h2>

            <div>
              <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                Full Name *
              </label>
              <div className='relative'>
                <input
                  type='text'
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'
                  placeholder='Enter your full name'
                />
                <User className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Phone Number *
                </label>
                <div className='relative'>
                  <input
                    type='tel'
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'
                    placeholder='01012345678'
                    dir='ltr'
                  />
                  <Phone className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                </div>
              </div>
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Governorate / City *
                </label>
                <input
                  type='text'
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'
                  placeholder='e.g. Cairo'
                />
              </div>
            </div>

            <div>
              <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                Detailed Address *
              </label>
              <input
                type='text'
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'
                placeholder='Street name / Building number / Apartment'
              />
            </div>
          </div>







          {/* Account Creation / Auth Section */}
          {!currentUser ? (
            <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl space-y-5'>
              <label className='flex items-center gap-3 cursor-pointer select-none'>
                <input
                  type='checkbox'
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className='w-4 h-4 accent-red-600 rounded'
                />
                <span className='text-xs font-bold text-slate-200'>
                  Would you like to save your details and create an account to
                  track orders?
                </span>
              </label>

              {createAccount && (
                <div className='space-y-4 pt-4 border-t border-slate-800'>
                  {/* Google Login Button */}
                  <button
                    type='button'
                    onClick={handleGoogleLogin}
                    className='w-full py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 transition flex items-center justify-center gap-2.5 shadow-sm cursor-pointer'
                  >
                    <svg className='w-4 h-4' viewBox='0 0 24 24'>
                      <path
                        fill='#4285F4'
                        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      />
                      <path
                        fill='#34A853'
                        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      />
                      <path
                        fill='#FBBC05'
                        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
                      />
                      <path
                        fill='#EA4335'
                        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
                      />
                    </svg>
                    <span>Sign up with Google</span>
                  </button>

                  <div className='relative flex py-1 items-center'>
                    <div className='flex-grow border-t border-slate-800'></div>
                    <span className='flex-shrink mx-4 text-slate-500 text-[10px] uppercase font-semibold'>
                      Or with Email
                    </span>
                    <div className='flex-grow border-t border-slate-800'></div>
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                      Email Address *
                    </label>
                    <div className='relative'>
                      <input
                        type='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'
                        placeholder='name@example.com'
                      />
                      <Mail className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                    </div>
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                      Account Password *
                    </label>
                    <div className='relative'>
                      <input
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'
                        placeholder='••••••••'
                      />
                      <Lock className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-3xl text-xs text-emerald-300 flex items-center justify-between backdrop-blur-md shadow-lg'>
              <span className='font-medium'>
                Signed in as{' '}
                <strong className='text-white'>{currentUser.email}</strong>.
                Your details are saved for instant checkout!
              </span>
              <Link
                href='/profile'
                className='underline font-bold text-emerald-400 hover:text-white transition'
              >
                Edit Profile
              </Link>
            </div>
          )}






          {/* Order Summary & Submit Card */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl space-y-5'>
            <h2 className='text-base font-black text-white flex items-center gap-2.5 border-b border-slate-800 pb-4'>
              <CreditCard className='w-5 h-5 text-emerald-400' />
              <span>Order Summary</span>
            </h2>

            <div className='space-y-2.5 text-xs text-slate-300'>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Subtotal:</span>
                <span className='font-bold text-white'>{subtotal} EGP</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400 flex items-center gap-1'>
                  <Truck size={14} className='text-blue-400' /> Shipping Fee:
                </span>
                <span className='font-bold text-white'>{shippingFee} EGP</span>
              </div>
              <div className='border-t border-slate-800 pt-3 flex justify-between font-black text-base text-white'>
                <span>Total Amount:</span>
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-blue-400'>
                  {totalAmount} EGP
                </span>
              </div>
            </div>

            <button
              type='submit'
              disabled={loading || cart.length === 0}
              className='w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/50 transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer'
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin text-white' />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Confirm Order ({totalAmount} EGP)</span>
                </>
              )}
            </button>

            <div className='flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium'>
              <ShieldCheck className='w-4 h-4 text-emerald-400' />
              <span>Secure Cash on Delivery & Fast Dispatch</span>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
