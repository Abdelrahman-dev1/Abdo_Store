'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  UserPlus,
  Check,
  Trash2,
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



const pathname = usePathname();

useEffect(() => {
  setSuccess(false);
  setErrorMessage(null);
}, [pathname]);


  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
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
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

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
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0,
  );
  const shippingFee = 50;
  const totalAmount = subtotal + (cart.length > 0 ? shippingFee : 0);

  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // دالة تأكيد الطلب المضمونة والآمنة 100%
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setErrorMessage(null);

    try {
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

      // تم إزالة customer_notes ليتوافق تماماً مع جدول orders الحالي في سوبابيز
      const orderData = {
        user_id: userId,
        customer_name: fullName,
        customer_phone: phone,
        customer_email: currentUser?.email || email || '',
        city: city || 'Not specified',
        customer_address: address,
        items: cart,
        subtotal,
        shipping_cost: shippingFee,
        total_amount: totalAmount,
        payment_method: 'Cash on Delivery',
        payment_status: 'Unpaid',
        delivery_method: 'Standard Delivery',
        status: 'pending',
      };

      // 1. حفظ الطلب في قاعدة البيانات Supabase بنجاح تام
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

      // 2. إرسال إشعار التيليجرام والتحقق من النتيجة
      try {
        const telegramRes = await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: insertedOrder?.id || 'NEW-' + Date.now(),
            orderDate: insertedOrder?.created_at || new Date().toISOString(),
            ...orderData,
          }),
        });

        const telegramData = await telegramRes.json().catch(() => ({}));

        if (!telegramRes.ok || telegramData?.success === false) {
          console.error(
            'Telegram route failed:',
            telegramRes.status,
            telegramData?.error || telegramData,
          );
        } else if (telegramData?.telegram_sent === false) {
          console.warn('Telegram notification is disabled in settings.');
        }
      } catch (telegramErr) {
        console.error('Telegram notification network error:', telegramErr);
      }

      // 3. نجاح العملية وتفريغ السلة وإظهار صفحة النجاح
      localStorage.removeItem('cart');
      setCart([]);
      setLoading(false);
      setSuccess(true);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================

  if (success) {
    return (
      <div className='min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-red-500 selection:text-white'>
        <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
        <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}

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
            onClick={() => {
              setSuccess(false);
              setErrorMessage(null);
            }}
            className='w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl block shadow-lg shadow-red-950/50 transition cursor-pointer'
          >
            Return to Store
          </Link>
        </div>

        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
        {/* ================================== */}
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-16 font-sans relative selection:bg-red-500 selection:text-white'>
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between'>
          <Link
            href='/'
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className='text-sm sm:text-lg font-black flex items-center gap-2 sm:gap-3 text-white shrink-0 cursor-pointer group'
          >
            <div className='w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2px] shadow-xl shadow-red-600/30 overflow-hidden flex items-center justify-center'>
              <Image
                src='/fav-me-2.webp'
                alt='Abdo'
                width={400}
                height={400}
                className='w-full h-full object-cover object-[50%_5%] rounded-[10px] sm:rounded-[14px] transform group-hover:scale-110 transition-transform duration-500'
              />
            </div>
            <span className='text-sm sm:text-xl font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-pulse tracking-wide'>
              Abdo Store
            </span>
          </Link>

          <Link
            href='/cart'
            title='Return to Cart'
            aria-label='Return to Cart'
            className='inline-flex items-center justify-center gap-0 sm:gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 p-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm shrink-0'
          >
            <ArrowLeft size={14} className='shrink-0' />
            <span className='hidden sm:inline text-[9px] md:text-[10px] font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent tracking-wide'>
              Return to Cart
            </span>
          </Link>
        </div>
      </nav>

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
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl space-y-5'>
            <h2 className='text-base font-black text-white flex items-center gap-2.5 border-b border-slate-800 pb-4'>
              <MapPin className='w-5 h-5 text-blue-400' />
              <span>Delivery Information</span>
            </h2>

            {!currentUser ? (
              <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl space-y-5'>
                <label className='relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0e1626] to-slate-900/90 border border-blue-500/40 hover:border-red-500/60 shadow-xl shadow-blue-950/30 cursor-pointer select-none transition-all duration-300 group hover:scale-[1.01]'>
                  <input
                    type='checkbox'
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    className='sr-only peer'
                  />
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 border-2 shrink-0 ${
                      createAccount
                        ? 'bg-gradient-to-tr from-red-600 to-blue-600 border-transparent shadow-lg shadow-blue-500/40 scale-105'
                        : 'bg-slate-800/80 border-slate-600 group-hover:border-blue-400 animate-pulse'
                    }`}
                  >
                    {createAccount && (
                      <Check
                        size={18}
                        className='text-white stroke-[3] animate-in zoom-in-50 duration-200'
                      />
                    )}
                  </div>
                  <div className='flex-1 flex items-center gap-3.5'>
                    <div className='p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:text-red-400 transition-colors shrink-0'>
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <span className='text-sm font-bold text-white block tracking-tight'>
                        Create an account to track your orders 📦
                      </span>
                      <span className='text-xs text-slate-300 block mt-0.5'>
                        Save your details securely for a faster checkout next
                        time.
                      </span>
                    </div>
                  </div>
                </label>

                {createAccount && (
                  <div className='space-y-4 pt-4 border-t border-slate-800'>
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

                    <button
                      type='button'
                      onClick={async () => {
                        if (!email || !password) {
                          alert('Please enter both email and password.');
                          return;
                        }
                        try {
                          let { data, error } = await supabase.auth.signUp({
                            email,
                            password,
                          });

                          if (
                            error &&
                            error.message.includes('already registered')
                          ) {
                            const signInRes =
                              await supabase.auth.signInWithPassword({
                                email,
                                password,
                              });
                            data = signInRes.data;
                            error = signInRes.error;
                          }

                          if (error) throw error;

                          if (data.user) {
                            setCurrentUser(data.user);
                            const { data: profile } = await supabase
                              .from('profiles')
                              .select('*')
                              .eq('id', data.user.id)
                              .single();

                            if (profile) {
                              if (profile.full_name)
                                setFullName(profile.full_name);
                              if (profile.phone) setPhone(profile.phone);
                              if (profile.city) setCity(profile.city);
                              if (profile.address) setAddress(profile.address);
                            }

                            router.refresh();
                            alert('Signed in & account ready! 🎉');
                          }
                        } catch (err: any) {
                          alert(err.message || 'Authentication error');
                        }
                      }}
                      className='w-full py-2.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md'
                    >
                      <ShieldCheck size={16} className='text-blue-400' />
                      <span>Save Email & Sign In Now 🔒</span>
                    </button>
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
                Detailed Address *
              </label>
              <input
                type='text'
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition'
                placeholder='Governorate - Center/City - Village/District - Street & Building No.'
              />
            </div>
          </div>

          <div className='bg-[#0e1626]/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl space-y-6 relative overflow-hidden'>
            <div className='flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10'>
              <h2 className='text-sm sm:text-base font-black text-white flex items-center gap-2.5 tracking-tight'>
                <div className='p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'>
                  <CreditCard className='w-4 h-4' />
                </div>
                <span>Order Summary</span>
              </h2>

              <div className='flex items-center gap-2'>
                <span className='text-[11px] font-black px-3 py-1 rounded-xl bg-slate-900/90 text-blue-400 border border-slate-800 shadow-inner'>
                  {cart.reduce((acc, item) => acc + (item.quantity || 1), 0)}{' '}
                  Items
                </span>

                {cart.length > 0 && (
                  <button
                    type='button'
                    onClick={() => setCart([])}
                    className='text-[10px] font-bold px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer flex items-center gap-1'
                    title='Clear all items'
                  >
                    <Trash2 size={12} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

{cart.length > 0 ? (
  <div className='space-y-3.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar relative z-10'>
    {cart.map((item, idx) => {
      const qty = item.quantity || 1;
      const itemImage =
        item.image || item.image_url || '/placeholder.png';
      const currentPrice = item.price || 0;
      const oldPrice =
        item.oldPrice || item.original_price || currentPrice + 200;
      const itemDesc =
        item.description ||
        item.details ||
        item.short_description ||
        'High quality premium product';

      return (
        <div
          key={item.id || idx}
          className='group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-[#141d2f]/90 via-[#0e1626] to-[#141d2f]/90 border border-slate-800/90 hover:border-slate-700/80 transition-all duration-300 shadow-md'
        >
          <div className='flex items-start sm:items-center gap-3.5 min-w-0 w-full sm:w-auto flex-1'>
            <div className='relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shrink-0 shadow-md'>
              <Image
                src={itemImage}
                alt={item.name || 'Store Item'}
                width={600}
                height={600}
                className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
              />
              <span className='absolute top-1 left-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md'>
                Hot Deal
              </span>
            </div>

            <div className='min-w-0 flex-1'>
              <p className='text-xs font-black text-white tracking-tight truncate'>
                {item.name}
              </p>
              {itemDesc && (
                <p className='text-[10px] text-slate-400 line-clamp-1 mt-0.5'>
                  {itemDesc}
                </p>
              )}
              <div className='flex items-center gap-2 mt-1.5'>
                <span className='text-xs font-black text-emerald-400'>
                  {currentPrice} EGP
                </span>
                {oldPrice > currentPrice && (
                  <span className='text-[10px] text-slate-500 line-through font-semibold'>
                    {oldPrice} EGP
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60'>
            {/* أزرار التحكم بالكمية + زر حذف العنصر */}
            <div className='flex items-center gap-2'>
              <div className='flex items-center bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden p-0.5 shadow-inner'>
                <button
                  type='button'
                  onClick={() => {
                    if (qty > 1) {
                      setCart(
                        cart.map((i) =>
                          i.id === item.id
                            ? { ...i, quantity: qty - 1 }
                            : i,
                        ),
                      );
                    } else {
                      setCart(cart.filter((i) => i.id !== item.id));
                    }
                  }}
                  className='w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs font-bold cursor-pointer'
                >
                  -
                </button>
                <span className='w-7 text-center text-xs font-black text-white'>
                  {qty}
                </span>
                <button
                  type='button'
                  onClick={() => {
                    setCart(
                      cart.map((i) =>
                        i.id === item.id
                          ? { ...i, quantity: qty + 1 }
                          : i,
                      ),
                    );
                  }}
                  className='w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs font-bold cursor-pointer'
                >
                  +
                </button>
              </div>

              {/* زر علامة السلة (حذف المنتج نهائياً) */}
              <button
                type='button'
                onClick={() => {
                  setCart(cart.filter((i) => i.id !== item.id));
                }}
                title="إزالة المنتج"
                className='w-7 h-7 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all duration-200 cursor-pointer shadow-sm'
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)  : (
              <div className='text-center py-8 text-slate-400 text-xs'>
                Your cart is empty.{' '}
                <Link href='/' className='text-blue-400 underline'>
                  Shop Now
                </Link>
              </div>
            )}

            <div className='space-y-2 pt-4 border-t border-slate-800/80 text-xs text-slate-300'>
              <div className='flex justify-between'>
                <span>Subtotal</span>
                <span className='font-bold text-white'>{subtotal} EGP</span>
              </div>

              <div className='flex items-center justify-between gap-1.5 sm:gap-2 min-w-0'>
                <span className='text-[10px] sm:text-xs text-slate-400 font-medium shrink-0'>
                  Shipping Fee:
                </span>
                <span className='text-[8px] sm:text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1 py-[1px] sm:px-2 sm:py-0.5 rounded-[4px] sm:rounded-lg leading-none whitespace-nowrap'>
                  Calculated on Delivery
                </span>
              </div>

              <div className='flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800'>
                <span>Total Amount</span>
                <span className='text-emerald-400'>{totalAmount} EGP</span>
              </div>
            </div>

            <button
              type='submit'
              disabled={loading || cart.length === 0}
              className='w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-red-950/50 transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer relative z-10 group'
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin text-white' />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <CreditCard
                    size={18}
                    className='group-hover:scale-110 transition-transform'
                  />
                  <span>Confirm Order ({totalAmount} EGP)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
