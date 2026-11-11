'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ShoppingCart,
  Settings,
  LogOut,
  Home,
  DollarSign,
  Package,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Boxes,
  Loader2,
  CheckCircle2,
  XCircle,
  Truck,
  Sliders,
  Save,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

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

          // دعم مرن لمختلف مسميات حالات الشحن (shipped أو shipping)
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await supabase.from('site_settings').upsert({
        key: 'top_banner',
        value: { text: topBannerText, active: true },
      });

      await supabase.from('site_settings').upsert({
        key: 'sections_config',
        value: sectionsConfig,
      });

      alert('✅ Successfully updated frontend settings!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('❌ Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // طريقة تصفير الأرباح والطلبات بالكامل والبداية من الصفر
  const handleResetOrdersAndRevenue = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete all orders and reset revenue to zero? This action cannot be undone!',
    );
    if (!confirmed) return;

    try {
      // حذف جميع الطلبات من جدول orders (مما يجعل الأرباح والطلبات صفراً تلقائياً)
      const { error } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        // طريقة بديلة في حال كان الـ id رقمي وليس UUID
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
    window.location.href = '/admin/login';
  };

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
      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 grid grid-cols-3 items-center'>
          <div className='flex items-center justify-start'>
            <Link
              href='/'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <Home size={16} />
              <span className='hidden sm:inline'>Storefront</span>
            </Link>
          </div>

          <div className='text-center'>
            <h1 className='text-sm sm:text-base font-black text-white tracking-tight'>
              Command Center
            </h1>
            <p className='text-[10px] sm:text-[11px] text-slate-400 font-medium'>
              Store Management & Analytics
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
      <main className='max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10'>
        {/* Welcome Banner */}
        <div className='bg-gradient-to-r from-[#0e1626] via-[#141d2f] to-[#0e1626] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
          <div className='space-y-2'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold'>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
              <span>System Operational</span>
            </div>
            <h2 className='text-2xl sm:text-3xl font-black text-white tracking-tight'>
              Welcome back, Administrator! 👋
            </h2>
            <p className='text-slate-400 text-xs sm:text-sm font-medium'>
              Real-time analytics, order statuses, and storefront manager.
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <Link
              href='/admin/products'
              className='px-5 py-3 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-950/50 transition flex items-center gap-2'
            >
              <span>Add Product</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        {/* Analytics Grid Cards (Revenue, Total, Pending, Products) */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
          {/* Total Revenue */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between'>
            <div>
              <p className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-1'>
                Total Revenue
              </p>
              <h3 className='text-2xl font-black text-white'>
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
            <div className='w-12 h-12 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400'>
              <DollarSign size={24} />
            </div>
          </div>

          {/* Total Orders */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between'>
            <div>
              <p className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-1'>
                Total Orders
              </p>
              <h3 className='text-2xl font-black text-white'>
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
            <div className='w-12 h-12 rounded-2xl bg-blue-950/50 border border-blue-500/40 flex items-center justify-center text-blue-400'>
              <ShoppingCart size={24} />
            </div>
          </div>

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

          {/* Inventory Items */}
          <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between'>
            <div>
              <p className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-1'>
                Inventory Items
              </p>
              <h3 className='text-2xl font-black text-white'>
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
            <div className='w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-500/40 flex items-center justify-center text-purple-400'>
              <Package size={24} />
            </div>
          </div>
        </div>

        {/* Shipping & Order Status Breakdown Cards */}
        <div className='space-y-4'>
          <h3 className='text-base font-black text-white tracking-tight px-1'>
            Order Status Breakdown & Shipping States
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-5'>
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

        {/* Frontend Control Center (تفعيل زر تصفير الأرباح والطلبات) */}
        <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6'>
          <div className='flex items-center gap-3 border-b border-slate-800 pb-4'>
            <div className='w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400'>
              <Sliders size={20} />
            </div>
            <div>
              <h3 className='text-lg font-black text-white'>
                Store Revenue & Archive Control
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
              onClick={handleResetOrdersAndRevenue}
              className='px-5 py-3 bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-400 font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/20'
            >
              <RefreshCw size={15} />
              <span>Reset Revenue & Orders Archive</span>
            </button>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className='space-y-4'>
          <h3 className='text-base font-black text-white tracking-tight px-1'>
            Management Modules
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Products Module Card */}
            <Link
              href='/admin/products'
              className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1'
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='w-14 h-14 rounded-2xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-lg'>
                  <ShoppingBag size={28} />
                </div>
                <ArrowUpRight className='w-5 h-5 text-slate-500 group-hover:text-white transition-colors' />
              </div>
              <div>
                <h4 className='font-black text-lg text-white mb-1 group-hover:text-blue-400 transition-colors'>
                  Product Management
                </h4>
                <p className='text-xs text-slate-400 font-medium leading-relaxed'>
                  Add new items, upload images, manage inventory stock, and set
                  discounts.
                </p>
              </div>
            </Link>

            {/* Orders Module Card */}
            <Link
              href='/admin/orders'
              className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1'
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-lg'>
                  <ShoppingCart size={28} />
                </div>
                <ArrowUpRight className='w-5 h-5 text-slate-500 group-hover:text-white transition-colors' />
              </div>
              <div>
                <h4 className='font-black text-lg text-white mb-1 group-hover:text-emerald-400 transition-colors'>
                  Customer Orders
                </h4>
                <p className='text-xs text-slate-400 font-medium leading-relaxed'>
                  Review customer invoices, track delivery statuses, and update
                  orders in real-time.
                </p>
              </div>
            </Link>

            {/* Settings Module Card */}
            <Link
              href='/admin/settings'
              className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1'
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-lg'>
                  <Settings size={28} />
                </div>
                <ArrowUpRight className='w-5 h-5 text-slate-500 group-hover:text-white transition-colors' />
              </div>
              <div>
                <h4 className='font-black text-lg text-white mb-1 group-hover:text-purple-400 transition-colors'>
                  Store Configuration
                </h4>
                <p className='text-xs text-slate-400 font-medium leading-relaxed'>
                  Configure store name, currency, WhatsApp phone, shipping cost,
                  taxes, and maintenance mode.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
