'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search,
  LogOut,
  Package,
  MapPin,
  ArrowLeft,
  Loader2,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  LayoutGrid,
  Crown,
  Users as UsersIcon,
  Eye,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // حالة لتخزين البروفايل الـ VIP المفتوح حالياً
  const [expandedProfileKey, setExpandedProfileKey] = useState<string | null>(null);

  // بحث خاص بكل بروفايل VIP
  const [profileSearchQueries, setProfileSearchQueries] = useState<{ [key: string]: string }>({});
  // فلتر حالة خاص بكل بروفايل VIP
  const [profileStatusFilters, setProfileStatusFilters] = useState<{ [key: string]: string }>({});

  // فلتر حالة وشريط بحث خاص بقسم العملاء العاديين
  const [regularStatusFilter, setRegularStatusFilter] = useState('all');
  const [regularSearchQuery, setRegularSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const shippingCount = orders.filter((o) => o.status === 'shipping').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } else {
      alert('Error updating order status: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };
// ================================
// ================================
// ================================
// ================================
// ================================
const getWhatsAppLink = (order: any) => {
    // 1. تنظيف رقم الهاتف وإزالة أي رموز زائدة (مع التأكد من وجود كود الدولة لو مش موجود)
    let phone = (order.customer_phone || order.phone || '').replace(/\D/g, '');

    // لو الرقم مصري ومش بادئ بـ 20، ضيف كود مصر تلقائياً عشان الواتساب يقبله صح
    if (phone.length === 11 && phone.startsWith('01')) {
        phone = '2' + phone;
    }

    let itemsList = [];
    try {
      itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch (e) {
      itemsList = [];
    }

    // ترتيب المنتجات بشكل نظيف تحت بعضها
    const itemsFormatted = itemsList
      .map((item: any) => `• Product: ${item.name} | Qty: ${item.quantity} | Price: ${item.price} EGP | Subtotal: ${item.price * item.quantity} EGP`)
      .join('\n---\n');

    // نص الرسالة المنظم
    const message = `السلام عليكم بنكلم حضرتك بخصوص الاورد اللي طلبته من Abdo Store\n\n` +
      `Here are your order details:\n\n` +
      `${itemsFormatted}\n\n` +
      `-------------------\n` +
      `📦 Total Amount: ${order.total_amount} EGP\n` +
      `📍 Delivery Address: ${order.city ? order.city + ', ' : ''}${order.customer_address || 'Not Specified'}\n\n` +
      `Thank you for shopping with us! ✨`;

    // 2. استخدام wa.me وهو الرابط الأحدث والأكثر توافقية مع كل المتصفحات والهواتف للرسائل الجاهزة
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

// ================================
// ================================
// ================================
// ================================
// ================================
// ================================

  const statusFilteredOrders = useMemo(() => {
    if (selectedStatusFilter === 'all') return orders;
    return orders.filter((o) => o.status === selectedStatusFilter);
  }, [orders, selectedStatusFilter]);

  // دالة مساعدة ذكية وآمنة للبحث (تمنع أي أخطاء وتدعم النصوص والأرقام بدقة)
  const matchesSearch = (order: any, rawQuery: string, profileName = '', profilePhone = '') => {
    if (!rawQuery.trim()) return true;
    const q = rawQuery.trim().toLowerCase();

    const customerName = (profileName || order.customer_name || '').toLowerCase();
    const customerPhone = (profilePhone || order.customer_phone || order.phone || '').toLowerCase();
    const city = (order.city || '').toLowerCase();
    const address = (order.customer_address || '').toLowerCase();
    const orderId = (order.id || '').toLowerCase();
    const totalAmount = String(order.total_amount || '');

    if (customerName.includes(q) || customerPhone.includes(q) || city.includes(q) || address.includes(q) || orderId.includes(q) || totalAmount.includes(q)) {
      return true;
    }

    let itemsList = [];
    try {
      itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch (e) {
      itemsList = [];
    }

    return itemsList.some((item: any) => {
      const itemName = (item.name || '').toLowerCase();
      const itemPrice = String(item.price || '');
      const itemTotalPrice = String((item.price || 0) * (item.quantity || 0));
      return itemName.includes(q) || itemPrice.includes(q) || itemTotalPrice.includes(q);
    });
  };

  // تجميع البروفايلات مع تطبيق البحث العام (Global Search) على القسمين معاً
  const processedData = useMemo(() => {
    const map = new Map();

    // الخطوة 1: تجميع كل الأوردرات المفلترة حسب الحالة في بروفايلات
    statusFilteredOrders.forEach((order) => {
      const phone = (order.customer_phone || order.phone || 'unknown_phone').trim();
      const name = (order.customer_name || 'Not Specified').trim();
      const key = `${phone}_${name}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          customerName: name,
          customerPhone: phone,
          orders: [],
          totalSpent: 0,
        });
      }
      const profile = map.get(key);
      profile.orders.push(order);
      profile.totalSpent += Number(order.total_amount || 0);
    });

    const allProfiles = Array.from(map.values());

    // الخطوة 2: تطبيق البحث العام (Global Search) الشامل لو موجود
    const q = searchQuery.trim();
    let filteredProfiles = allProfiles;

    if (q) {
      filteredProfiles = allProfiles.filter((profile) => {
        // هل بيانات البروفايل (الاسم أو الهاتف) تطابق البحث؟
        const matchesProfileInfo = profile.customerName.toLowerCase().includes(q.toLowerCase()) || profile.customerPhone.toLowerCase().includes(q.toLowerCase());
        if (matchesProfileInfo) return true;

        // أو هل أي أوردر داخل هذا البروفايل يطابق البحث؟
        return profile.orders.some((order: any) => matchesSearch(order, q, profile.customerName, profile.customerPhone));
      });
    }

    // الخطوة 3: تقسيم البروفايلات إلى VIP (3 طلبات فأكثر) وعاديين (< 3 طلبات)
    const vipProfiles: any[] = [];
    const normalOrdersList: any[] = [];

    filteredProfiles.forEach((profile) => {
      if (profile.orders.length >= 3) {
        // إذا كان بحث عام، نصفي أوردرات البروفايل الـ VIP لو أوردرات معينة هي اللي طابقت
        let targetOrders = profile.orders;
        if (q) {
          targetOrders = profile.orders.filter((o: any) => matchesSearch(o, q, profile.customerName, profile.customerPhone));
          if (targetOrders.length === 0 && (profile.customerName.toLowerCase().includes(q.toLowerCase()) || profile.customerPhone.toLowerCase().includes(q.toLowerCase()))) {
            targetOrders = profile.orders; // لو اسم العميل طابق، نظهر كل أوردراته
          }
        }
        vipProfiles.push({ ...profile, orders: targetOrders });
      } else {
        // العملاء العاديين نأخذ أوردراتهم الفردية
        let targetOrders = profile.orders;
        if (q) {
          targetOrders = profile.orders.filter((o: any) => matchesSearch(o, q, profile.customerName, profile.customerPhone));
        }
        normalOrdersList.push(...targetOrders);
      }
    });

    return {
      vipProfiles,
      normalOrders: normalOrdersList,
    };
  }, [statusFilteredOrders, searchQuery]);

  return (
    <div className='min-h-screen bg-[#111827] text-slate-100 pb-14 font-sans relative selection:bg-amber-500 selection:text-white text-xs'>
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #111827;
        }
        ::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>

      {/* Admin Navbar */}
      <nav className='bg-[#1f2937]/90 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 shadow-sm'>
        <div className='max-w-6xl mx-auto px-3.5 h-14 flex items-center justify-between'>
          <Link
            href='/admin'
            className='flex items-center gap-1.5 bg-[#374151]/80 hover:bg-[#4b5563] text-slate-200 px-3 py-1 rounded-md text-xs font-medium transition border border-slate-600/50'
          >
            <ArrowLeft size={14} />
            <span className='hidden sm:inline'>Dashboard</span>
          </Link>

          <h1 className='text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2'>
            <span className='w-2 h-2 rounded-full bg-blue-400'></span>
            Orders & Profiles Management
          </h1>

          <button
            onClick={handleLogout}
            className='flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1 rounded-md text-xs font-medium transition border border-red-500/20'
          >
            <LogOut size={14} />
            <span className='hidden sm:inline'>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className='max-w-5xl mx-auto px-3 sm:px-4 py-5 space-y-4.5 relative z-10'>

        {/* Filter Stats Cards */}
        <div className='grid grid-cols-2 sm:grid-cols-5 gap-2.5'>
          <div
            onClick={() => setSelectedStatusFilter('all')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
              selectedStatusFilter === 'all' ? 'bg-blue-600/20 border-blue-500' : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-slate-400 uppercase'>All</p>
              <h4 className='text-base sm:text-lg font-black text-white mt-0.5'>{totalCount}</h4>
            </div>
            <LayoutGrid size={16} className='text-blue-400' />
          </div>

          <div
            onClick={() => setSelectedStatusFilter('pending')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
              selectedStatusFilter === 'pending' ? 'bg-amber-600/20 border-amber-500' : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-amber-400 uppercase'>Pending</p>
              <h4 className='text-base sm:text-lg font-black text-amber-300 mt-0.5'>{pendingCount}</h4>
            </div>
            <Clock3 size={16} className='text-amber-400' />
          </div>

          <div
            onClick={() => setSelectedStatusFilter('shipping')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
              selectedStatusFilter === 'shipping' ? 'bg-blue-600/20 border-blue-500' : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-blue-400 uppercase'>Shipped</p>
              <h4 className='text-base sm:text-lg font-black text-blue-300 mt-0.5'>{shippingCount}</h4>
            </div>
            <Truck size={16} className='text-blue-400' />
          </div>

          <div
            onClick={() => setSelectedStatusFilter('delivered')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
              selectedStatusFilter === 'delivered' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-emerald-400 uppercase'>Delivered</p>
              <h4 className='text-base sm:text-lg font-black text-emerald-300 mt-0.5'>{deliveredCount}</h4>
            </div>
            <CheckCircle2 size={16} className='text-emerald-400' />
          </div>

          <div
            onClick={() => setSelectedStatusFilter('cancelled')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between col-span-2 sm:col-span-1 ${
              selectedStatusFilter === 'cancelled' ? 'bg-red-600/20 border-red-500' : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-red-400 uppercase'>Cancelled</p>
              <h4 className='text-base sm:text-lg font-black text-red-300 mt-0.5'>{cancelledCount}</h4>
            </div>
            <XCircle size={16} className='text-red-400' />
          </div>
        </div>

        {/* Global Search Bar (يفلتر العملاء المميزين والعاديين معاً بدقة تامة) */}
        <div className='bg-[#1f2937]/85 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm'>
          <div className='flex items-center gap-2 text-xs font-semibold text-slate-300 w-full sm:w-auto'>
            <span className='w-2 h-2 rounded-full bg-emerald-400'></span>
            Total Filtered Records: {statusFilteredOrders.length}
          </div>

          <div className='relative w-full sm:w-80'>
            <Search size={15} className='absolute left-3 top-2.5 text-slate-400 pointer-events-none' />
            <input
              type='text'
              placeholder='Global search (Name, Phone, Product, Price)...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-9 pr-3 py-2 bg-[#111827] border border-slate-600/60 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500'
              dir='ltr'
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className='flex flex-col items-center justify-center py-20 text-slate-400 space-y-2'>
            <Loader2 className='w-7 h-7 animate-spin text-blue-500' />
            <p className='text-xs'>Loading records...</p>
          </div>
        ) : statusFilteredOrders.length === 0 ? (
          <div className='bg-[#1f2937]/70 p-12 rounded-xl border border-slate-700 text-center text-slate-400 text-xs space-y-1.5'>
            <Package className='w-10 h-10 mx-auto text-slate-500 mb-1' />
            <p className='font-bold text-slate-300'>No orders found</p>
          </div>
        ) : (
          <div className='space-y-5'>

            {/* ========================================================= */}
            {/* 1. VIP CUSTOMERS PROFILES */}
            {/* ========================================================= */}
            {processedData.vipProfiles.length > 0 && (
              <div className='space-y-3'>
                <div className='flex items-center gap-1.5 px-1'>
                  <Crown className='w-4 h-4 text-amber-400' />
                  <h3 className='text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide'>
                    VIP Customers (3+ Orders) — ({processedData.vipProfiles.length})
                  </h3>
                </div>

                <div className='grid grid-cols-1 gap-3'>
                  {processedData.vipProfiles.map((profile: any) => {
                    const isExpanded = expandedProfileKey === profile.key;
                    const profileKey = profile.key;
                    const pSearch = (profileSearchQueries[profileKey] || '').toLowerCase();
                    const pStatus = profileStatusFilters[profileKey] || 'all';

                    // حساب الأعداد الحقيقية لحالات هذا العميل بالتحديد
                    const pTotal = profile.orders.length;
                    const pPending = profile.orders.filter((o: any) => o.status === 'pending').length;
                    const pShipping = profile.orders.filter((o: any) => o.status === 'shipping').length;
                    const pDelivered = profile.orders.filter((o: any) => o.status === 'delivered').length;
                    const pCancelled = profile.orders.filter((o: any) => o.status === 'cancelled').length;

                    // فلترة طلبات البروفايل (حسب الحالة + البحث بـ ID أو اسم المنتج أو السعر)
                    const profileOrdersFiltered = profile.orders.filter((order: any) => {
                      if (pStatus !== 'all' && order.status !== pStatus) return false;
                      return matchesSearch(order, pSearch, profile.customerName, profile.customerPhone);
                    });

                    return (
                      <div
                        key={profileKey}
                        className={`bg-[#1f2937]/90 rounded-2xl border transition-all ${
                          isExpanded ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-700/80 hover:border-slate-600'
                        } p-3.5 sm:p-4 space-y-3`}
                      >
                        {/* كرت مختصر للعميل */}
                        <div className='flex items-center justify-between gap-3'>
                          <div className='flex items-center gap-3'>
                            <div className='w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs'>
                              {profile.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className='flex items-center gap-2'>
                                <h4 className='text-xs sm:text-sm font-bold text-white'>{profile.customerName}</h4>
                                <span className='bg-amber-500/20 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5'>
                                  <Crown size={10} /> VIP
                                </span>
                              </div>
                              <p className='text-[11px] text-slate-400 mt-0.5' dir='ltr'>
                                {profile.customerPhone}
                              </p>
                            </div>
                          </div>

                          <div className='flex items-center gap-2.5'>
                            <div className='text-right hidden sm:block text-[11px]'>
                              <span className='text-slate-400 block'>Orders: <strong className='text-amber-300'>{pTotal}</strong></span>
                              <span className='text-slate-400 block'>Total: <strong className='text-emerald-400'>{profile.totalSpent} EGP</strong></span>
                            </div>
                            <button
                              onClick={() => setExpandedProfileKey(isExpanded ? null : profileKey)}
                              className='flex items-center gap-1.5 bg-[#374151] hover:bg-[#4b5563] text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition border border-slate-600'
                            >
                              <Eye size={14} />
                              <span>{isExpanded ? 'Hide' : 'View Orders'}</span>
                            </button>
                          </div>
                        </div>

                        {/* معلومات سريعة للموبايل */}
                        <div className='flex sm:hidden justify-between items-center text-[11px] bg-[#111827] px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300'>
                          <span>Orders: <strong className='text-amber-300'>{pTotal}</strong></span>
                          <span>Total: <strong className='text-emerald-400'>{profile.totalSpent} EGP</strong></span>
                        </div>

                        {/* المحتوى التفصيلي عند الضغط */}
                        {isExpanded && (
                          <div className='pt-3 border-t border-slate-700/80 space-y-3 animate-fadeIn'>

                            {/* بوكسات تصفية الحالات الخاصة بهذا العميل فقط بالأعداد الحقيقية */}
                            <div className='grid grid-cols-5 gap-1.5 text-center'>
                              <div
                                onClick={() => setProfileStatusFilters({ ...profileStatusFilters, [profileKey]: 'all' })}
                                className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${pStatus === 'all' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                All ({pTotal})
                              </div>
                              <div
                                onClick={() => setProfileStatusFilters({ ...profileStatusFilters, [profileKey]: 'pending' })}
                                className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${pStatus === 'pending' ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                Pending ({pPending})
                              </div>
                              <div
                                onClick={() => setProfileStatusFilters({ ...profileStatusFilters, [profileKey]: 'shipping' })}
                                className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${pStatus === 'shipping' ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                Shipped ({pShipping})
                              </div>
                              <div
                                onClick={() => setProfileStatusFilters({ ...profileStatusFilters, [profileKey]: 'delivered' })}
                                className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${pStatus === 'delivered' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                Delivered ({pDelivered})
                              </div>
                              <div
                                onClick={() => setProfileStatusFilters({ ...profileStatusFilters, [profileKey]: 'cancelled' })}
                                className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${pStatus === 'cancelled' ? 'bg-red-600/30 border-red-500 text-red-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                Cancelled ({pCancelled})
                              </div>
                            </div>

                            {/* شريط البحث للبروفايل VIP (PERFECT) */}
                            <div className='relative'>
                              <Search size={14} className='absolute left-3 top-2.5 text-slate-400 pointer-events-none' />
                              <input
                                type='text'
                                placeholder='Search by Order ID, Product Name, or Price...'
                                value={profileSearchQueries[profileKey] || ''}
                                onChange={(e) =>
                                  setProfileSearchQueries({
                                    ...profileSearchQueries,
                                    [profileKey]: e.target.value,
                                  })
                                }
                                className='w-full pl-9 pr-3 py-1.5 bg-[#111827] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500'
                                dir='ltr'
                              />
                            </div>

                            {/* حاوية الطلبات */}
                            <div className='max-h-80 overflow-y-auto pr-1 space-y-2.5'>
                              {profileOrdersFiltered.length === 0 ? (
                                <p className='text-xs text-slate-500 text-center py-4'>No matching orders found.</p>
                              ) : (
                                profileOrdersFiltered.map((order: any) => {
                                  let itemsList = [];
                                  try {
                                    itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
                                  } catch (e) {
                                    itemsList = [];
                                  }

                                  return (
                                    <div key={order.id} className='bg-[#111827] p-3 rounded-xl border border-slate-800 space-y-2.5 text-xs'>
                                      <div className='flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5'>
                                        <div className='flex items-center gap-2'>
                                          <span className='font-bold text-[10px] text-slate-300 bg-[#1f2937] px-2 py-0.5 rounded border border-slate-700'>
                                            #{order.id.slice(0, 6).toUpperCase()}
                                          </span>
                                          <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer ${
                                              order.status === 'pending'
                                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                                : order.status === 'shipping'
                                                ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                                                : order.status === 'delivered'
                                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                                                : 'bg-red-950/40 text-red-300 border-red-500/40'
                                            }`}
                                          >
                                            <option value='pending' className='bg-[#1f2937] text-amber-300'>Pending</option>
                                            <option value='shipping' className='bg-[#1f2937] text-blue-300'>Shipping</option>
                                            <option value='delivered' className='bg-[#1f2937] text-emerald-300'>Delivered</option>
                                            <option value='cancelled' className='bg-[#1f2937] text-red-300'>Cancelled</option>
                                          </select>
                                        </div>

                                        <div className='flex items-center gap-2.5'>
                                          <span className='font-bold text-amber-300'>{order.total_amount} EGP</span>
                                          <a
                                            href={getWhatsAppLink(order)}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            title='إرسال تفاصيل الطلب عبر واتساب'
                                            className='bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/30 transition flex items-center justify-center'
                                          >
                                            <MessageCircle size={15} />
                                          </a>
                                        </div>
                                      </div>

                                      <div className='text-[11px] text-slate-300 flex items-center gap-1.5'>
                                        <MapPin size={13} className='text-red-400 flex-shrink-0' />
                                        <span className='truncate'>{order.city ? `${order.city}, ` : ''}{order.customer_address || 'No address'}</span>
                                      </div>

                                      {/* المنتجات داخل الطلب */}
                                      <div className='space-y-1.5 pt-0.5'>
                                        <p className='text-[10px] font-bold text-slate-400 uppercase'>Products ({itemsList.length}):</p>
                                        <div className='bg-[#1f2937]/50 rounded-lg p-2 divide-y divide-slate-800'>
                                          {itemsList.map((item: any, iIdx: number) => (
                                            <div key={iIdx} className='py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-[11px]'>
                                              <div className='flex items-center gap-2'>
                                                {item.image && (
                                                  <Image src={item.image} alt='item' width={28} height={28} className='w-7 h-7 object-cover rounded border border-slate-700' />
                                                )}
                                                <div>
                                                  <span className='font-medium text-slate-200 block'>{item.name}</span>
                                                  <span className='text-slate-400 text-[10px]'>Qty: {item.quantity} × {item.price} EGP</span>
                                                </div>
                                              </div>
                                              <span className='font-bold text-white text-[11px]'>{item.price * item.quantity} EGP</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. REGULAR CUSTOMERS ORDERS (Re-engineered Search & Filters) */}
            {/* ========================================================= */}
            {processedData.normalOrders.length > 0 && (
              <div className='space-y-3 pt-2'>
                <div className='flex items-center gap-1.5 px-1'>
                  <UsersIcon className='w-4 h-4 text-blue-400' />
                  <h3 className='text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wide'>
                    Regular Customers Orders — ({processedData.normalOrders.length})
                  </h3>
                </div>

                <div className='bg-[#1f2937]/80 rounded-2xl border border-slate-700/80 p-3.5 sm:p-4 space-y-3'>

                  {/* بوكسات تصفية الحالات للعملاء العاديين بالأعداد الحقيقية */}
                  {(() => {
                    const rTotal = processedData.normalOrders.length;
                    const rPending = processedData.normalOrders.filter((o: any) => o.status === 'pending').length;
                    const rShipping = processedData.normalOrders.filter((o: any) => o.status === 'shipping').length;
                    const rDelivered = processedData.normalOrders.filter((o: any) => o.status === 'delivered').length;
                    const rCancelled = processedData.normalOrders.filter((o: any) => o.status === 'cancelled').length;

                    return (
                      <div className='grid grid-cols-5 gap-1.5 text-center'>
                        <div
                          onClick={() => setRegularStatusFilter('all')}
                          className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${regularStatusFilter === 'all' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                        >
                          All ({rTotal})
                        </div>
                        <div
                          onClick={() => setRegularStatusFilter('pending')}
                          className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${regularStatusFilter === 'pending' ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                        >
                          Pending ({rPending})
                        </div>
                        <div
                          onClick={() => setRegularStatusFilter('shipping')}
                          className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${regularStatusFilter === 'shipping' ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                        >
                          Shipped ({rShipping})
                        </div>
                        <div
                          onClick={() => setRegularStatusFilter('delivered')}
                          className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${regularStatusFilter === 'delivered' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                        >
                          Delivered ({rDelivered})
                        </div>
                        <div
                          onClick={() => setRegularStatusFilter('cancelled')}
                          className={`cursor-pointer p-1.5 rounded-lg border text-[11px] ${regularStatusFilter === 'cancelled' ? 'bg-red-600/30 border-red-500 text-red-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                        >
                          Cancelled ({rCancelled})
                        </div>
                      </div>
                    );
                  })()}

                  {/* شريط البحث للعملاء العاديين (يعمل بسلاسة ويفلتر بالاسم، اسم المنتج، أو السعر) */}
                  <div className='relative'>
                    <Search size={14} className='absolute left-3 top-2.5 text-slate-400 pointer-events-none' />
                    <input
                      type='text'
                      placeholder='Search regular orders by Customer Name, Product Name, or Price...'
                      value={regularSearchQuery}
                      onChange={(e) => setRegularSearchQuery(e.target.value)}
                      className='w-full pl-9 pr-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500'
                      dir='ltr'
                    />
                  </div>

                  {/* قائمة الأوردرات للعملاء العاديين */}
                  <div className='space-y-2.5 pt-1'>
                    {processedData.normalOrders
                      .filter((order: any) => {
                        if (regularStatusFilter !== 'all' && order.status !== regularStatusFilter) return false;
                        return matchesSearch(order, regularSearchQuery);
                      })
                      .map((order: any) => {
                        let itemsList = [];
                        try {
                          itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
                        } catch (e) {
                          itemsList = [];
                        }

                        return (
                          <div key={order.id} className='bg-[#111827] p-3 rounded-xl border border-slate-800 space-y-2.5 text-xs'>
                            <div className='flex items-center justify-between gap-2.5 border-b border-slate-800 pb-2.5'>
                              <div className='flex items-center gap-2'>
                                <span className='font-bold text-[10px] text-slate-300 bg-[#1f2937] px-2 py-0.5 rounded border border-slate-700'>
                                  #{order.id.slice(0, 6).toUpperCase()}
                                </span>
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer ${
                                    order.status === 'pending'
                                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                      : order.status === 'shipping'
                                      ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                                      : order.status === 'delivered'
                                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                                      : 'bg-red-950/40 text-red-300 border-red-500/40'
                                  }`}
                                >
                                  <option value='pending' className='bg-[#1f2937] text-amber-300'>Pending</option>
                                  <option value='shipping' className='bg-[#1f2937] text-blue-300'>Shipping</option>
                                  <option value='delivered' className='bg-[#1f2937] text-emerald-300'>Delivered</option>
                                  <option value='cancelled' className='bg-[#1f2937] text-red-300'>Cancelled</option>
                                </select>
                              </div>

                              <div className='flex items-center gap-2.5'>
                                <span className='font-bold text-sm text-white'>{order.total_amount} EGP</span>
                                <a
                                  href={getWhatsAppLink(order)}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  title='إرسال تفاصيل الطلب عبر واتساب'
                                  className='bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/30 transition flex items-center justify-center'
                                >
                                  <MessageCircle size={15} />
                                </a>
                              </div>
                            </div>

                            {/* معلومات العميل */}
                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 bg-[#1f2937]/50 p-2.5 rounded-lg'>
                              <div><strong className='text-slate-400'>Customer:</strong> {order.customer_name || 'N/A'}</div>
                              <div dir='ltr'><strong className='text-slate-400'>Phone:</strong> {order.customer_phone || order.phone || 'N/A'}</div>
                              <div><strong className='text-slate-400'>Address:</strong> {order.city ? `${order.city}, ` : ''}{order.customer_address || 'N/A'}</div>
                            </div>

                            {/* المنتجات */}
                            <div className='space-y-1.5'>
                              <p className='text-[10px] font-bold text-slate-400 uppercase'>Products ({itemsList.length}):</p>
                              <div className='bg-[#1f2937]/40 rounded-lg p-2 divide-y divide-slate-800'>
                                {itemsList.map((item: any, iIdx: number) => (
                                  <div key={iIdx} className='py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-[11px]'>
                                    <div className='flex items-center gap-2'>
                                      {item.image && (
                                        <Image src={item.image} alt='item' width={28} height={28} className='w-7 h-7 object-cover rounded border border-slate-700' />
                                      )}
                                      <div>
                                        <span className='font-medium text-slate-200 block'>{item.name}</span>
                                        <span className='text-slate-400 text-[10px]'>Qty: {item.quantity} × {item.price} EGP</span>
                                      </div>
                                    </div>
                                    <span className='font-bold text-white text-[11px]'>{item.price * item.quantity} EGP</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
