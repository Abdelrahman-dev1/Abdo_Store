'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ShoppingCart,
  Settings,
  Lock,
  LogOut,
  Home,
  DollarSign,
  Package,
  Clock,
  Unlock,
  TrendingUp,
  ArrowUpRight,
  X,
  EyeOff ,
  Boxes,
  Loader2,
  CheckCircle2,
  XCircle,
  Truck,
  Sliders,
  RefreshCw,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  // حماية أرقام Total Revenue و Total Orders بالباسورد
  const [statsUnlocked, setStatsUnlocked] = useState<boolean>(false);
  const [statsPasscodeOpen, setStatsPasscodeOpen] = useState<boolean>(false);
  const [statsPasscodeInput, setStatsPasscodeInput] = useState<string>('');
  const [statsPasscodeError, setStatsPasscodeError] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [addProductUnlocked, setAddProductUnlocked] = useState(false);
  // إحصائيات المتجر
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });

  // إعدادات التحكم في الواجهة (شريط العروض + السكاشن)
  const [topBannerText, setTopBannerText] = useState(
    '🔥 Free shipping on all orders over 1000 EGP!',
  );
  const [sectionsConfig, setSectionsConfig] = useState({
    featuredTitle: 'Featured Products',
    flashSalesTitle: 'Flash Sales',
    categoryTitle: 'Shop by Category',
    whyChooseTitle: 'Why Choose Us',
  });

  useEffect(() => {
    fetchDashboardData();
    fetchSiteSettings();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id');

      let revenue = 0;
      let pending = 0;
      let shipped = 0;
      let delivered = 0;
      let cancelled = 0;
      let orderCount = 0;

      if (!ordersError && ordersData) {
        orderCount = ordersData.length;
        ordersData.forEach((order) => {
          revenue += Number(order.total_amount) || 0;
          const status = order.status?.trim().toLowerCase();

          if (status === 'pending') {
            pending += 1;
          } else if (status === 'shipped' || status === 'shipping') {
            shipped += 1;
          } else if (status === 'delivered') {
            delivered += 1;
          } else if (status === 'cancelled') {
            cancelled += 1;
          }
        });
      }

      let productCount = 0;
      if (!productsError && productsData) {
        productCount = productsData.length;
      }

      setStats({
        totalRevenue: revenue,
        totalOrders: orderCount,
        totalProducts: productCount,
        pendingOrders: pending,
        shippedOrders: shipped,
        deliveredOrders: delivered,
        cancelledOrders: cancelled,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');

      if (!error && data) {
        data.forEach((item) => {
          if (item.key === 'top_banner' && item.value?.text) {
            setTopBannerText(item.value.text);
          }
          if (item.key === 'sections_config' && item.value) {
            setSectionsConfig(item.value);
          }
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleResetOrdersAndRevenue = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete all orders and reset revenue to zero? This action cannot be undone!',
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        const { error: err2 } = await supabase
          .from('orders')
          .delete()
          .gte('id', 0);
        if (err2) throw err2;
      }

      alert('🔄 Orders and revenue have been successfully reset to zero.');
      fetchDashboardData();
    } catch (err) {
      console.error('Error resetting orders:', err);
      alert(
        'Failed to reset orders. Check your database RLS deletion policies.',
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };
  // مصفوفة الروابط السريعة تحت الناف بار
  const quickNavModules = [
    {
      title: 'Products',
      href: '/admin/products',
      icon: ShoppingBag,
      protected: true,
      accent:
        'hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      iconStyle:
        'bg-blue-950/70 border-blue-500/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
      textHover: 'group-hover:text-blue-400',
    },
    {
      title: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : null,
      accent:
        'hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      iconStyle:
        'bg-emerald-950/70 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
      textHover: 'group-hover:text-emerald-400',
    },
    {
      title: 'Delivery',
      href: '/admin/delivery',
      icon: Truck,
      accent:
        'hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]',
      iconStyle:
        'bg-sky-950/70 border-sky-500/30 text-sky-400 group-hover:bg-sky-600 group-hover:text-white',
      textHover: 'group-hover:text-sky-400',
    },
    {
      title: 'Drivers',
      href: '/admin/drivers',
      icon: Users,
      accent:
        'hover:border-teal-500/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
      iconStyle:
        'bg-teal-950/70 border-teal-500/30 text-teal-400 group-hover:bg-teal-600 group-hover:text-white',
      textHover: 'group-hover:text-teal-400',
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      protected: true,
      accent:
        'hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      iconStyle:
        'bg-purple-950/70 border-purple-500/30 text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
      textHover: 'group-hover:text-purple-400',
    },
  ];

  // ===================================
  // ===================================
  // ===================================
  // ===================================
  // ===================================
  // عدد اليوزر المسجلين من Supabase Auth عبر RPC
  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc(
          'get_registered_users_count',
        );
        if (mounted && !error && data !== null && data !== undefined) {
          setRegisteredUsersCount(Number(data) || 0);
        }
      } catch {
        // تجاهل الأخطاء المؤقتة
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);
  // ===================================
  // ===================================
  // ===================================
  // ===================================

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-16 font-sans relative selection:bg-red-500 selection:text-white'>
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
      `}</style>

      {/* Background Orbs */}
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      {/* Admin Navbar */}
      <nav className='fixed top-0 inset-x-0 z-50 bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 grid grid-cols-3 items-center'>
          <div className='flex items-center justify-start'>
            <Link
              href='/'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <Home size={16} />
              <span className='hidden sm:inline font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent tracking-wide'>
                Storefront
              </span>
            </Link>
          </div>

          <div className='min-w-0 flex-1 text-center px-1 sm:px-0'>
            <h1 className='text-[11px] sm:text-base lg:text-lg font-extrabold tracking-tight whitespace-normal break-words leading-snug bg-gradient-to-r from-rose-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent'>
              Command Center
            </h1>
            <p className='text-[9px] sm:text-xs text-slate-300/80 font-medium whitespace-normal break-words leading-snug mt-0.5'>
              Store Management &amp; Analytics
            </p>
          </div>

          <div className='flex items-center justify-end gap-2'>
            <button
              onClick={handleLogout}
              className='flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-red-500/30 cursor-pointer shadow-sm'
            >
              <LogOut size={15} />
              <span className='hidden sm:inline'>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 pb-8 space-y-6 relative z-10 pt-24 sm:pt-26'>
        {/* Welcome Banner */}
        <div className='bg-gradient-to-r from-[#0e1626] via-[#141d2f] to-[#0e1626] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
          <div className='space-y-2'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold'>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
              <span>System Operational</span>
            </div>
            <h2 className='text-2xl sm:text-3xl font-black mt-2 text-white tracking-tight'>
              Welcome back, Administrator! 👋
            </h2>
            <p className='text-slate-400 text-xs sm:text-sm font-medium'>
              Real-time analytics, order statuses, and storefront manager.
            </p>
          </div>

          <div className='flex items-center gap-3'>
            {statsUnlocked ? (
              <Link
                href='/admin/products'
                className='px-5 py-3 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-950/50 transition flex items-center gap-2'
              >
                <span>Add Product</span>
                <ArrowUpRight size={15} />
                <span
                  role='button'
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setStatsUnlocked(false);
                    // setAddProductUnlocked(false);
                  }}
                  title='Lock Add Product'
                  className='p-1 rounded bg-black/25 hover:bg-black/40 cursor-pointer'
                >
                  {statsUnlocked ? <Unlock size={13} /> : <Lock size={13} />}
                  {/* {statsUnlocked ? <Unlock size={12} /> : <Lock size={12} />} */}
                  {/* <Lock size={12} /> */}
                </span>
              </Link>
            ) : (
              <button
                type='button'
                onClick={() => {
                  setStatsPasscodeInput('');
                  setStatsPasscodeError('');
                  setStatsPasscodeOpen(true);
                }}
                className='px-5 py-3 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-950/50 transition flex items-center gap-2 cursor-pointer'
                title='Enter admin passcode to unlock Add Product'
              >
                {statsUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
                {/* <Lock size={14} /> */}
                <span>Add Product</span>
                {/* <span className='blur-[2px] select-none'>Add Product</span> */}
                <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Compact Quick-Access Navigation Dock (تحت الناف بار مباشرة) */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
          {quickNavModules.map((item) => {
            const IconComponent = item.icon;
            const isLocked = item.protected && !statsUnlocked;

            const cardContent = (
              <>
                <div className='flex items-center gap-3 min-w-0'>
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-200 ${item.iconStyle}`}
                  >
                    <IconComponent size={18} />
                  </div>
                  <span
                    className={`font-extrabold text-xs sm:text-sm text-slate-100 truncate transition-colors duration-200 ${item.textHover}`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className='flex items-center gap-1.5 shrink-0'>
                  {item.protected && (
                    <span
                      role='button'
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          if (statsUnlocked) {
                            setStatsUnlocked(false);
                          } else {
                            setStatsPasscodeInput('');
                            setStatsPasscodeError('');
                            setStatsPasscodeOpen(true);
                          }
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (statsUnlocked) {
                          setStatsUnlocked(false);
                        } else {
                          setStatsPasscodeInput('');
                          setStatsPasscodeError('');
                          setStatsPasscodeOpen(true);
                        }
                      }}
                      title={statsUnlocked ? 'Lock' : 'Unlock'}
                      className={`p-1 rounded-md border cursor-pointer ${
                        statsUnlocked
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {statsUnlocked ? (
                        <Unlock size={12} />
                      ) : (
                        <Lock size={12} />
                      )}
                      {/* <Lock size={12} /> */}
                    </span>
                  )}
                  {item.badge && (
                    <span className='px-1.5 py-0.5 text-[10px] font-black rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'>
                      {item.badge}
                    </span>
                  )}
                  <ArrowUpRight className='w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all' />
                </div>
              </>
            );

            const sharedClassName = `group relative bg-[#0e1626]/90 backdrop-blur-xl px-3.5 py-3 rounded-2xl border border-slate-800/90 transition-all duration-200 flex items-center justify-between shadow-lg hover:-translate-y-0.5 ${item.accent} last:col-span-2 sm:last:col-span-1 cursor-pointer`;

            if (isLocked) {
              return (
                <button
                  key={item.href}
                  type='button'
                  onClick={() => {
                    setStatsPasscodeInput('');
                    setStatsPasscodeError('');
                    setStatsPasscodeOpen(true);
                  }}
                  title='Enter admin passcode to unlock'
                  className={`${sharedClassName} text-left`}
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={sharedClassName}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>

        {/* Analytics Grid Cards (Revenue, Total, Pending, Products) */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* Total Revenue (Protected with Passcode) */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/40 shadow-xl flex items-center justify-between transition-all duration-200'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                  Total Revenue
                </p>
                <button
                  type='button'
                  onClick={() => {
                    if (statsUnlocked) {
                      setStatsUnlocked(false);
                    } else {
                      setStatsPasscodeInput('');
                      setStatsPasscodeError('');
                      setStatsPasscodeOpen(true);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    statsUnlocked
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                  title={
                    statsUnlocked
                      ? 'Lock metrics'
                      : 'Enter admin passcode to reveal'
                  }
                >
                  {statsUnlocked ? (
                    <>
                      <EyeOff size={11} />
                      <span>Lock</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} />
                      <span>Unlock</span>
                    </>
                  )}
                </button>
              </div>

              <h3
                className={`text-2xl font-black text-white font-mono transition-all duration-300 ${
                  statsUnlocked ? '' : 'blur-md select-none pointer-events-none'
                }`}
              >
                {loading ? (
                  <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
                ) : (
                  `${stats.totalRevenue.toLocaleString()} EGP`
                )}
              </h3>
              <p className='text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1'>
                <TrendingUp size={12} /> Live earnings
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0'>
              <DollarSign size={24} />
            </div>
          </div>
          {/* ========================== */}

          {/* Total Orders (Protected with Passcode) */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 hover:border-blue-500/40 shadow-xl flex items-center justify-between transition-all duration-200'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                  Total Orders
                </p>
                <button
                  type='button'
                  onClick={() => {
                    if (statsUnlocked) {
                      setStatsUnlocked(false);
                    } else {
                      setStatsPasscodeInput('');
                      setStatsPasscodeError('');
                      setStatsPasscodeOpen(true);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    statsUnlocked
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                  title={
                    statsUnlocked
                      ? 'Lock metrics'
                      : 'Enter admin passcode to reveal'
                  }
                >
                  {statsUnlocked ? (
                    <>
                      <EyeOff size={11} />
                      <span>Lock</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} />
                      <span>Unlock</span>
                    </>
                  )}
                </button>
              </div>

              <h3
                className={`text-2xl font-black text-white font-mono transition-all duration-300 ${
                  statsUnlocked ? '' : 'blur-md select-none pointer-events-none'
                }`}
              >
                {loading ? (
                  <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
                ) : (
                  stats.totalOrders
                )}
              </h3>
              <p className='text-[11px] text-blue-400 font-semibold mt-1 flex items-center gap-1'>
                <ShoppingCart size={12} /> All invoices
              </p>
            </div>

            <div className='w-12 h-12 rounded-2xl bg-blue-950/50 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0'>
              <ShoppingCart size={24} />
            </div>
          </div>
          {/* ========================== */}

          {/* Passcode Modal for Total Revenue & Total Orders */}
          {statsPasscodeOpen && (
            <div
              className='fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn'
              onClick={() => setStatsPasscodeOpen(false)}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (statsPasscodeInput.trim() === '16605189') {
                    setStatsUnlocked(true);

                    setAddProductUnlocked(true);
                    setStatsPasscodeOpen(false);
                    setStatsPasscodeInput('');
                    setStatsPasscodeError('');
                  } else {
                    setStatsPasscodeError(
                      'Incorrect passcode. Please try again.',
                    );
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className='w-full max-w-sm rounded-2xl bg-[#0f172a] border border-slate-700 p-5 shadow-2xl space-y-3.5'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2.5'>
                    <span className='w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-300'>
                      <Unlock size={17} />
                    </span>
                    <div>
                      <h4 className='text-sm font-black text-white'>
                        Admin Metrics Unlock
                      </h4>
                      <p className='text-[11px] text-slate-400'>
                        Enter passcode to view revenue &amp; orders count
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => setStatsPasscodeOpen(false)}
                    className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'
                  >
                    <X size={16} />
                  </button>
                </div>

                <input
                  type='password'
                  autoFocus
                  value={statsPasscodeInput}
                  onChange={(e) => {
                    setStatsPasscodeInput(e.target.value);
                    setStatsPasscodeError('');
                  }}
                  placeholder='Enter admin passcode...'
                  className='w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 px-3 py-2 text-xs text-white font-mono outline-none'
                />

                {statsPasscodeError && (
                  <p className='text-[11px] font-bold text-rose-400'>
                    {statsPasscodeError}
                  </p>
                )}

                <div className='flex items-center justify-end gap-2 pt-1'>
                  <button
                    type='button'
                    onClick={() => setStatsPasscodeOpen(false)}
                    className='px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-black text-white cursor-pointer'
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}
          {/* ========================== */}

          {/* Registered Users (Protected with the same Passcode) */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/40 shadow-xl flex items-center justify-between transition-all duration-200'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                  Registered Users
                </p>
                <button
                  type='button'
                  onClick={() => {
                    if (statsUnlocked) {
                      setStatsUnlocked(false);
                    } else {
                      setStatsPasscodeInput('');
                      setStatsPasscodeError('');
                      setStatsPasscodeOpen(true);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    statsUnlocked
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                  title={
                    statsUnlocked
                      ? 'Lock metrics'
                      : 'Enter admin passcode to reveal'
                  }
                >
                  {statsUnlocked ? (
                    <>
                      <EyeOff size={11} />
                      <span>Lock</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} />
                      <span>Unlock</span>
                    </>
                  )}
                </button>
              </div>

              <h3
                className={`text-2xl font-black text-white font-mono transition-all duration-300 ${
                  statsUnlocked ? '' : 'blur-md select-none pointer-events-none'
                }`}
              >
                {loading ? (
                  <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
                ) : (
                  registeredUsersCount.toLocaleString()
                )}
              </h3>
              <p className='text-[11px] text-cyan-400 font-semibold mt-1 flex items-center gap-1'>
                <Users size={12} /> Registered accounts
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0'>
              <Users size={24} />
            </div>
          </div>

          {/* =========================== */}
          {/* =========================== */}
          {/* =========================== */}
          {/* =========================== */}

          {/* Inventory Items (Protected with the same Passcode) */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 shadow-xl flex items-center justify-between transition-all duration-200'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                  Inventory Items
                </p>
                <button
                  type='button'
                  onClick={() => {
                    if (statsUnlocked) {
                      setStatsUnlocked(false);
                    } else {
                      setStatsPasscodeInput('');
                      setStatsPasscodeError('');
                      setStatsPasscodeOpen(true);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    statsUnlocked
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                  title={
                    statsUnlocked
                      ? 'Lock metrics'
                      : 'Enter admin passcode to reveal'
                  }
                >
                  {statsUnlocked ? (
                    <>
                      <EyeOff size={11} />
                      <span>Lock</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} />
                      <span>Unlock</span>
                    </>
                  )}
                </button>
              </div>

              <h3
                className={`text-2xl font-black text-white font-mono transition-all duration-300 ${
                  statsUnlocked ? '' : 'blur-md select-none pointer-events-none'
                }`}
              >
                {loading ? (
                  <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
                ) : (
                  stats.totalProducts
                )}
              </h3>
              <p className='text-[11px] text-purple-400 font-semibold mt-1 flex items-center gap-1'>
                <Boxes size={12} /> Active in store
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0'>
              <Package size={24} />
            </div>
          </div>
          {/* =========================== */}
          {/* =========================== */}
          {/* =========================== */}
          {/* =========================== */}
          {/* =========================== */}
        </div>

        {/* Shipping & Order Status Breakdown Cards */}
        <div className='space-y-4'>
          <h3 className='text-base font-black text-white tracking-tight px-1'>
            Order Status Breakdown &amp; Shipping States
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-4 gap-5'>
            {/* Shipped */}
            <div className='bg-[#0e1626]/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 flex items-center justify-between shadow-lg'>
              <div>
                <p className='text-xs font-bold text-slate-400 uppercase'>
                  Shipped Orders
                </p>
                <h4 className='text-2xl font-black text-blue-400 mt-1'>
                  {stats.shippedOrders}
                </h4>
                <p className='text-[10px] text-slate-500 mt-0.5'>
                  Out for delivery
                </p>
              </div>
              <div className='w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400'>
                <Truck size={20} />
              </div>
            </div>

            {/* ==================== */}
            {/* ==================== */}
            {/* ==================== */}
            {/* ==================== */}
            {/* ==================== */}
            {/* Pending Orders */}
            <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between'>
              <div>
                <p className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-1'>
                  Pending Orders
                </p>
                <h3 className='text-2xl font-black text-white'>
                  {loading ? (
                    <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
                  ) : (
                    stats.pendingOrders
                  )}
                </h3>
                <p className='text-[11px] text-amber-400 font-semibold mt-1 flex items-center gap-1'>
                  <Clock size={12} /> Requires review
                </p>
              </div>
              <div className='w-12 h-12 rounded-2xl bg-amber-950/50 border border-amber-500/40 flex items-center justify-center text-amber-400'>
                <Clock size={24} />
              </div>
            </div>
            {/* ==================== */}
            {/* ==================== */}
            {/* ==================== */}
            {/* ==================== */}
            {/* ==================== */}

            {/* Delivered */}
            <div className='bg-[#0e1626]/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 flex items-center justify-between shadow-lg'>
              <div>
                <p className='text-xs font-bold text-slate-400 uppercase'>
                  Delivered Orders
                </p>
                <h4 className='text-2xl font-black text-emerald-400 mt-1'>
                  {stats.deliveredOrders}
                </h4>
                <p className='text-[10px] text-slate-500 mt-0.5'>
                  Successfully completed
                </p>
              </div>
              <div className='w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400'>
                <CheckCircle2 size={20} />
              </div>
            </div>

            {/* Cancelled */}
            <div className='bg-[#0e1626]/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 flex items-center justify-between shadow-lg'>
              <div>
                <p className='text-xs font-bold text-slate-400 uppercase'>
                  Cancelled Orders
                </p>
                <h4 className='text-2xl font-black text-red-400 mt-1'>
                  {stats.cancelledOrders}
                </h4>
                <p className='text-[10px] text-slate-500 mt-0.5'>
                  Declined or returned
                </p>
              </div>
              <div className='w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400'>
                <XCircle size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Store Revenue & Archive Control */}
        <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6'>
          <div className='flex items-center gap-3 border-b border-slate-800 pb-4'>
            <div className='w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400'>
              <Sliders size={20} />
            </div>
            <div>
              <h3 className='text-lg font-black text-white'>
                Store Revenue &amp; Archive Control
              </h3>
              <p className='text-xs text-slate-400'>
                Reset store revenue and clear previous orders archive to start
                fresh from zero.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-4 pt-2'>
            <div>
              <h4 className='text-sm font-bold text-slate-200'>
                Reset Store Data
              </h4>
              <p className='text-xs text-slate-400 mt-0.5'>
                This will delete all orders from the database, setting total
                revenue and order counts back to 0.
              </p>
            </div>

            <button
              type='button'
              onClick={() => {
                if (statsUnlocked) {
                  handleResetOrdersAndRevenue();
                } else {
                  setStatsPasscodeInput('');
                  setStatsPasscodeError('');
                  setStatsPasscodeOpen(true);
                }
              }}
              className='px-5 py-3 bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-400 font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/20'
              title={
                statsUnlocked
                  ? 'Reset Revenue & Orders Archive'
                  : 'Enter passcode to unlock reset action'
              }
            >
              <RefreshCw size={15} />
              <span>Reset Revenue &amp; Orders Archive</span>
              <span
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (statsUnlocked) {
                      setStatsUnlocked(false);
                    } else {
                      setStatsPasscodeInput('');
                      setStatsPasscodeError('');
                      setStatsPasscodeOpen(true);
                    }
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (statsUnlocked) {
                    setStatsUnlocked(false);
                  } else {
                    setStatsPasscodeInput('');
                    setStatsPasscodeError('');
                    setStatsPasscodeOpen(true);
                  }
                }}
                title={
                  statsUnlocked ? 'Lock reset button' : 'Unlock reset button'
                }
                className={`p-1 rounded-md border transition ${
                  statsUnlocked
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {statsUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                {/* <Lock size={12} /> */}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
