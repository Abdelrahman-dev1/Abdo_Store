'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Package,
  Clock,
  Truck,
  LogOut,
  XCircle,
  MessageCircle,
  Loader2,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [promoRules, setPromoRules] = useState<any[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [portfolioRules, setPortfolioRules] = useState<any[]>([]);
  const [showAllPortfolioOffers, setShowAllPortfolioOffers] = useState(false);

  // Search, price range filter, and order detail modals states (placed before any early return)
  const [searchQuery, setSearchQuery] = useState('');
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeNotesOrder, setActiveNotesOrder] = useState<any | null>(null);
  const [activeItemsOrder, setActiveItemsOrder] = useState<any | null>(null);

  // Time filter state (All Time / Today / Week / Month)
  const [timeFilter, setTimeFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');

  // Optimized Cloudinary thumbnail URL for ordered item icons
  const getOptimizedThumbUrl = useCallback((url?: string) => {
    if (!url) return '';
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/w_64,h_64,c_fill,q_auto,f_auto/');
    }
    return url;
  }, []);

  // Distinct color themes per order card for clear visual separation
  const ORDER_CARD_THEMES = useMemo(
    () => [
      'from-[#162238] to-[#11192b] border-blue-500/35 hover:border-blue-400/60',
      'from-[#1b1c36] to-[#121326] border-indigo-500/35 hover:border-indigo-400/60',
      'from-[#13252d] to-[#0f1a20] border-cyan-500/35 hover:border-cyan-400/60',
      'from-[#241933] to-[#171122] border-fuchsia-500/35 hover:border-fuchsia-400/60',
      'from-[#132724] to-[#0e1b19] border-teal-500/35 hover:border-teal-400/60',
    ],
    [],
  );

  const getOrderItemsList = useCallback((order: any): any[] => {
    if (Array.isArray(order?.items)) return order.items;
    if (typeof order?.items === 'string') {
      try {
        const parsed = JSON.parse(order.items);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, []);

  const getOrderNotesText = useCallback((order: any): string => {
    return (order?.customer_notes || order?.notes || '').toString().trim();
  }, []);

  const getStatusBucket = useCallback((status: string) => {
    if (status === 'pending') return 'pending';
    if (
      status === 'shipped' ||
      status === 'shipping' ||
      status === 'processing' ||
      status === 'جاري الشحن'
    ) {
      return 'shipped';
    }
    if (
      status === 'delivered' ||
      status === 'completed' ||
      status === 'تم التسليم'
    ) {
      return 'completed';
    }
    if (status === 'cancelled' || status === 'ملغي') {
      return 'cancelled';
    }
    return 'other';
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('promo_rules')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('priority', { ascending: true });

      if (!active || error) return;
      setPortfolioRules(data ?? []);
    })();

    return () => {
      active = false;
    };
  }, []);


// ================================
// ================================
// ================================
// ================================
const attachDeliveryFeesToOrders = useCallback(async (rawOrders: any[]) => {
  if (!Array.isArray(rawOrders) || rawOrders.length === 0) return rawOrders;
  const orderIds = rawOrders.map((o) => o.id).filter(Boolean);
  if (orderIds.length === 0) return rawOrders;

  const { data: deliveriesData, error } = await supabase
    .from('deliveries')
    .select('order_id, delivery_fee')
    .in('order_id', orderIds);

  if (error || !deliveriesData) return rawOrders;

  const feeByOrderId = new Map<string, number>();
  for (const row of deliveriesData) {
    if (
      row?.order_id &&
      row?.delivery_fee !== null &&
      row?.delivery_fee !== undefined
    ) {
      feeByOrderId.set(String(row.order_id), Number(row.delivery_fee));
    }
  }

  return rawOrders.map((ord) => {
    const hasAdminFee = feeByOrderId.has(String(ord.id));
    const adminFee = hasAdminFee
      ? feeByOrderId.get(String(ord.id))!
      : undefined;
    return {
      ...ord,
      delivery_fee: hasAdminFee ? adminFee : ord.delivery_fee,
    };
  });
}, []);


// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================
// ================================











const fetchOrders = useCallback(
  async (userId: string) => {
    const { data: userOrders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && userOrders) {
      const ordersWithFees = await attachDeliveryFeesToOrders(userOrders);
      setOrders(ordersWithFees);
    }
    setLoading(false);
  },
  [attachDeliveryFeesToOrders],
);

useEffect(() => {
  let active = true;

  (async () => {
    const [userRes, promosRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('promo_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true }),
    ]);

    if (!active) return;

    setPromoRules(promosRes.data ?? []);

    const currentUser = userRes.data?.user;
    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);

    const [profileRes, ordersRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle(),
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false }),
    ]);

    if (!active) return;

    const profileData = profileRes.data;
    if (profileData) {
      setFullName(
        profileData.full_name || currentUser.user_metadata?.full_name || '',
      );
      setPhone(profileData.phone || '');
      setAddress(profileData.address || '');
    } else {
      setFullName(currentUser.user_metadata?.full_name || '');
    }

    if (!ordersRes.error && ordersRes.data) {
      const ordersWithFees = await attachDeliveryFeesToOrders(ordersRes.data);
      if (!active) return;
      setOrders(ordersWithFees);
    }
    setLoading(false);
  })();

  return () => {
    active = false;
  };
}, [router, attachDeliveryFeesToOrders]);

  const orderStats = useMemo(() => {
    let pending = 0;
    let shipped = 0;
    let completed = 0;
    let cancelled = 0;

    for (const o of orders) {
      if (o.status === 'pending') pending += 1;
      else if (
        o.status === 'shipped' ||
        o.status === 'shipping' ||
        o.status === 'processing' ||
        o.status === 'جاري الشحن'
      ) {
        shipped += 1;
      } else if (
        o.status === 'delivered' ||
        o.status === 'completed' ||
        o.status === 'تم التسليم'
      ) {
        completed += 1;
      } else if (o.status === 'cancelled' || o.status === 'ملغي') {
        cancelled += 1;
      }
    }

    return {
      total: orders.length,
      pending,
      shipped,
      completed,
      cancelled,
    };
  }, [orders]);

  const completedOrdersCount = orderStats.completed;

  const loyaltyCycleInfo = useMemo(() => {
    const cycleRules = promoRules.filter(
      (r) => r.condition_type === 'completed_orders_cycle',
    );
    const hasFirstOrderRule = promoRules.some(
      (r) => r.condition_type === 'first_order',
    );

    const activeCycleRule = cycleRules[0];
    const everyN = Math.max(
      1,
      Number(activeCycleRule?.condition_config?.every_n_orders ?? 6),
    );
    const startAfter = Math.max(
      0,
      Number(activeCycleRule?.condition_config?.start_after_completed ?? 5),
    );

    const positionInCycle = completedOrdersCount % everyN;
    const remainingForNextReward =
      positionInCycle === 0 && completedOrdersCount > 0
        ? 0
        : everyN - positionInCycle;

    const progressPercent = Math.min(
      100,
      Math.round((positionInCycle / everyN) * 100),
    );

    const isEligibleNow = Boolean(
      activeCycleRule &&
      completedOrdersCount >= startAfter &&
      completedOrdersCount > 0 &&
      completedOrdersCount % everyN === 0,
    );

    return {
      activeCycleRule,
      hasFirstOrderRule,
      everyN,
      startAfter,
      positionInCycle,
      remainingForNextReward,
      progressPercent,
      isEligibleNow,
    };
  }, [promoRules, completedOrdersCount]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((order) => {
      if (orderFilter === 'pending') return order.status === 'pending';
      if (orderFilter === 'shipped') {
        return (
          order.status === 'shipped' ||
          order.status === 'shipping' ||
          order.status === 'processing' ||
          order.status === 'جاري الشحن'
        );
      }
      if (orderFilter === 'completed') {
        return (
          order.status === 'delivered' ||
          order.status === 'completed' ||
          order.status === 'تم التسليم'
        );
      }
      if (orderFilter === 'cancelled') {
        return order.status === 'cancelled' || order.status === 'ملغي';
      }
      return true;
    });
  }, [orders, orderFilter]);

  // Time-filtered orders (All Time / Today / Week / Month)
  const timeFilteredOrders = useMemo(() => {
    if (timeFilter === 'all') return orders;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return orders.filter((order: any) => {
      const createdAt = new Date(order?.created_at || 0).getTime();
      if (Number.isNaN(createdAt)) return false;

      if (timeFilter === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return createdAt >= startOfToday.getTime();
      }
      if (timeFilter === 'week') {
        return now - createdAt <= 7 * dayMs;
      }
      if (timeFilter === 'month') {
        return now - createdAt <= 30 * dayMs;
      }
      return true;
    });
  }, [orders, timeFilter]);

  // Search + price range on top of timeFilteredOrders (avoids mixing phone numbers with prices)
  // Search + price range on top of timeFilteredOrders:
  // Order number / ID / name / phone / product name work directly; #price or $price targets price cleanly.
  const searchAndPriceFilteredOrders = useMemo(() => {
    const rawQ = searchQuery.trim();
    const q = rawQ.toLowerCase();
    const cleanedOrderQuery = q.replace(/^#/, '').trim();
    const isPriceMode = rawQ.startsWith('#') || rawQ.startsWith('$');
    const numericPart = rawQ.replace(/^[#$]\s*/, '');
    const numericTarget = Number(numericPart);
    const hasNumericTarget = numericPart !== '' && !Number.isNaN(numericTarget);

    const parsedMin = minPrice.trim() !== '' ? Number(minPrice) : null;
    const parsedMax = maxPrice.trim() !== '' ? Number(maxPrice) : null;
    const hasMin = parsedMin !== null && !Number.isNaN(parsedMin);
    const hasMax = parsedMax !== null && !Number.isNaN(parsedMax);

    return timeFilteredOrders.filter((order: any) => {
      const items = getOrderItemsList(order);
      const totalAmount = Number(order?.total_amount ?? order?.subtotal ?? 0);
      const orderNumStr = String(order?.order_number ?? '').toLowerCase();
      const orderIdStr = String(order?.id ?? '').toLowerCase();
      const customerNameStr = String(
        order?.customer_name || order?.name || '',
      ).toLowerCase();
      const phoneStr = String(
        order?.customer_phone || order?.phone || '',
      ).toLowerCase();
      const itemNamesStr = items
        .map((item: any) => String(item?.name || '').toLowerCase())
        .join(' ');

      let matchesSearch = true;
      if (q) {
        if (isPriceMode && hasNumericTarget) {
          const matchesItemPrice = items.some(
            (item: any) => Number(item?.price) === numericTarget,
          );
          const matchesOrderNumber =
            Boolean(cleanedOrderQuery) && orderNumStr === cleanedOrderQuery;
          matchesSearch =
            totalAmount === numericTarget ||
            matchesItemPrice ||
            matchesOrderNumber;
        } else {
          matchesSearch =
            orderNumStr.includes(q) ||
            orderIdStr.includes(q) ||
            customerNameStr.includes(q) ||
            phoneStr.includes(q) ||
            itemNamesStr.includes(q);
        }
      }

      let matchesPriceRange = true;
      if (hasMin || hasMax) {
        const anyItemInRange = items.some((item: any) => {
          const p = Number(item?.price);
          if (Number.isNaN(p)) return false;
          if (hasMin && p < parsedMin!) return false;
          if (hasMax && p > parsedMax!) return false;
          return true;
        });

        const orderTotalInRange =
          (!hasMin || totalAmount >= parsedMin!) &&
          (!hasMax || totalAmount <= parsedMax!);

        matchesPriceRange = anyItemInRange || orderTotalInRange;
      }

      return matchesSearch && matchesPriceRange;
    });
  }, [timeFilteredOrders, searchQuery, minPrice, maxPrice, getOrderItemsList]);

  // Dynamic counts for status filter boxes based on Time + Search + Price Range
  const dynamicStatusCounts = useMemo(() => {
    let pending = 0;
    let shipped = 0;
    let completed = 0;
    let cancelled = 0;

    for (const o of searchAndPriceFilteredOrders) {
      const bucket = getStatusBucket(o.status);
      if (bucket === 'pending') pending += 1;
      else if (bucket === 'shipped') shipped += 1;
      else if (bucket === 'completed') completed += 1;
      else if (bucket === 'cancelled') cancelled += 1;
    }

    return {
      total: searchAndPriceFilteredOrders.length,
      pending,
      shipped,
      completed,
      cancelled,
    };
  }, [searchAndPriceFilteredOrders, getStatusBucket]);

  // Combined search + price range + time + status filtering
  const visibleOrders = useMemo(() => {
    if (orderFilter === 'all') return searchAndPriceFilteredOrders;
    return searchAndPriceFilteredOrders.filter(
      (order: any) => getStatusBucket(order.status) === orderFilter,
    );
  }, [searchAndPriceFilteredOrders, orderFilter, getStatusBucket]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      phone,
      address,
      updated_at: new Date().toISOString(),
    });

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert('Error saving profile: ' + error.message);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (!error && user?.id) {
      alert('Order cancelled successfully.');
      fetchOrders(user.id);
    } else if (error) {
      alert('Error cancelling order: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className='bg-amber-950/40 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 w-fit'>
            <Clock size={11} /> Pending Review
          </span>
        );
      case 'shipping':
      case 'shipped':
      case 'processing':
      case 'جاري الشحن':
        return (
          <span className='bg-blue-950/40 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 w-fit'>
            <Truck size={11} /> Shipping
          </span>
        );
      case 'delivered':
      case 'completed':
      case 'تم التسليم':
        return (
          <span className='bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 w-fit'>
            <CheckCircle2 size={11} /> Delivered
          </span>
        );
      case 'cancelled':
      case 'ملغي':
        return (
          <span className='bg-red-950/40 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 w-fit'>
            <XCircle size={11} /> Cancelled
          </span>
        );
      default:
        return (
          <span className='bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold border border-slate-700'>
            {status}
          </span>
        );
    }
  };
// ================================
// ================================
// ================================
// ================================
// ================================

// ================================
// ================================
// ================================
// ================================
// ================================
  if (loading) {
    return (
      <div className='min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
        <p className='text-xs font-medium'>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-16 font-sans relative selection:bg-red-500 selection:text-white'>
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      <nav className='bg-[#0e1626]/95 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between'>
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
            <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2px] shadow-lg shadow-red-600/20 overflow-hidden flex items-center justify-center'>
              <Image
                src='/fav-me-3.webp'
                alt='Abdo'
                width={96}
                height={96}
                priority
                sizes='(max-width: 640px) 32px, 40px'
                className='w-full h-full object-cover object-[50%_5%] rounded-[10px] transform group-hover:scale-110 transition-transform duration-500'
              />
            </div>
            <span className='text-xs sm:text-lg font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent tracking-wide'>
              Abdo Store
            </span>
          </Link>

          <div className='flex items-center gap-2'>
            <Link
              href='/'
              className='flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <ArrowLeft size={14} />
              <span className='hidden sm:inline'>Storefront</span>
            </Link>
            <button
              onClick={handleLogout}
              className='flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition border border-red-500/30 shadow-sm cursor-pointer'
            >
              <LogOut size={13} />
              <span className='hidden sm:inline'>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className='max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10 space-y-6 sm:space-y-8'>
        <section className='bg-[#0e1626]/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800/95 shadow-xl space-y-4'>
          <div className='border-b border-slate-800/80 pb-3 flex items-center gap-2.5'>
            <User className='w-5 h-5 text-blue-400' />
            <div className='text-left'>
              <h1 className='text-sm sm:text-base font-black text-white'>
                Profile & Delivery Address
              </h1>
              <p
                dir='ltr'
                className='mt-0.5 text-[11px] sm:text-xs font-normal leading-relaxed text-slate-400'
              >
                كل تفاصيل{' '}
                <span className='font-medium text-sky-300/90'>رحلتك معانا</span>{' '}
                منظمة بدقة في مكان واحد —{' '}
                <span className='font-medium text-slate-200'>
                  مكافآتك، طلباتك، والبحث بسهولة
                </span>
                .
              </p>
            </div>
          </div>

          {success && (
            <div className='bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-2.5 sm:p-3 rounded-xl text-xs flex items-center gap-2 backdrop-blur-md'>
              <CheckCircle2 size={15} /> Profile details saved successfully!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className='space-y-3.5'>
            <div>
              <label className='block text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1'>
                Email Address
              </label>
              <div className='relative'>
                <input
                  type='text'
                  disabled
                  value={user?.email || ''}
                  className='w-full px-3.5 py-2.5 pl-10 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed'
                />
                <Mail className='w-4 h-4 absolute left-3 top-3 text-slate-600' />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1'>
                  Full Name *
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className='w-full px-3.5 py-2.5 pl-10 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                    placeholder='Enter your full name'
                    required
                  />
                  <User className='w-4 h-4 absolute left-3 top-3 text-slate-400' />
                </div>
              </div>

              <div>
                <label className='block text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1'>
                  Phone Number *
                </label>
                <div className='relative'>
                  <input
                    type='tel'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='w-full px-3.5 py-2.5 pl-10 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                    placeholder='01012345678'
                    dir='ltr'
                    required
                  />
                  <Phone className='w-4 h-4 absolute left-3 top-3 text-slate-400' />
                </div>
              </div>
            </div>

            <div>
              <label className='block text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1'>
                Detailed Address *
              </label>
              <div className='relative'>
                <input
                  type='text'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className='w-full px-3.5 py-2.5 pl-10 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                  placeholder='Street name / Building number / Apartment'
                  required
                />
                <MapPin className='w-4 h-4 absolute left-3 top-3 text-slate-400' />
              </div>
            </div>

            <button
              type='submit'
              disabled={saving}
              className='w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950/40 transition duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50'
            >
              {saving ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin text-white' />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Profile Details</span>
                </>
              )}
            </button>
          </form>
        </section>

        <section className='space-y-3.5'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5'>
            <div>
              <h2 className='text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2'>
                <Package className='w-4 h-4 sm:w-5 sm:h-5 text-blue-400 animate-pulse' />
                <span>Order History & Invoices</span>
              </h2>
              <p className='text-[10px] sm:text-xs text-slate-400 mt-0.5'>
                تتبع مشترياتك السابقة، وتحديثات حالة الطلبات، والفواتير
                التفصيلية
              </p>
            </div>

            <div className='flex flex-col sm:items-end gap-1'>
              <p
                dir='rtl'
                className='text-xs text-emerald-200 font-medium text-right'
              >
                أيقونة الواتساب متاحة في كل طلب للمتابعة والاستفسار بسهولة.
              </p>
              <span className='text-[11px] text-sky-300 font-semibold tracking-wide italic'>
                ⚡ Admin will reply to you soon
              </span>
            </div>
          </div>
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {(() => {
            const doneCount = Number(completedOrdersCount ?? 0);

            const activeCycleRule = portfolioRules.find(
              (r) => r.condition_type === 'completed_orders_cycle',
            );
            const activeFirstOrderRule = portfolioRules.find(
              (r) => r.condition_type === 'first_order',
            );

            const hasActiveLoyaltyCounter = Boolean(
              activeCycleRule || activeFirstOrderRule,
            );

            const cycleEveryN = activeCycleRule
              ? Math.max(
                  1,
                  Number(
                    activeCycleRule.condition_config?.required_completed ?? 5,
                  ) + 1,
                )
              : 6;
            const cycleStartAfter = activeCycleRule
              ? Math.max(
                  0,
                  Number(
                    activeCycleRule.condition_config?.required_completed ?? 5,
                  ),
                )
              : 0;
            const remainingCycle = activeCycleRule
              ? Math.max(0, cycleStartAfter - doneCount)
              : 0;
            const cycleProgress = activeCycleRule
              ? Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round(
                      (doneCount / Math.max(1, cycleStartAfter)) * 100,
                    ),
                  ),
                )
              : 0;

            const buildFriendlyOffer = (rule: any) => {
              const cfg = rule.condition_config || {};
              const shortDesc = rule.description
                ? String(rule.description).trim()
                : '';

              const rewardLabel =
                rule.custom_reward_label ||
                (rule.reward_type === 'free_shipping'
                  ? 'شحن مجاني'
                  : rule.reward_type === 'shipping_discount_percent'
                    ? `خصم ${Number(rule.reward_value ?? 50)}% على الشحن`
                    : rule.reward_type === 'fixed_discount'
                      ? `خصم ${Number(rule.reward_value ?? 0)} ج`
                      : rule.reward_type === 'percent_discount'
                        ? `خصم ${Number(rule.reward_value ?? 0)}%`
                        : rule.title || 'مكافأة مميزة');

              let conditionLine = '';
              let progress = 0;
              let done = false;

              if (rule.condition_type === 'first_order') {
                done = doneCount === 0;
                progress = done ? 100 : 100;
                conditionLine = done
                  ? `أول طلب لك مؤهل للحصول على (${rewardLabel}).`
                  : 'هذا العرض مخصص لأول طلب يتم إتمامه في المتجر.';
              } else if (rule.condition_type === 'completed_orders_cycle') {
                const req = Math.max(1, Number(cfg.required_completed ?? 5));
                const rem = Math.max(0, req - doneCount);
                done = doneCount >= req;
                progress = Math.min(
                  100,
                  Math.max(0, Math.round((doneCount / req) * 100)),
                );
                conditionLine = done
                  ? `مبروك! أتممت ${doneCount} طلبات مكتملة وتستحق (${rewardLabel}).`
                  : `أتممت ${doneCount} من ${req} طلبات مكتملة — متبقي ${rem} ${
                      rem === 1 ? 'طلب مكتمل' : 'طلبات مكتملة'
                    } للوصول لـ (${rewardLabel}).`;
              } else if (rule.condition_type === 'min_items_count') {
                const minItems = Math.max(1, Number(cfg.min_items ?? 1));
                progress = 0;
                conditionLine = `أضف ${minItems} ${
                  minItems === 1 ? 'قطعة' : 'قطع'
                } أو أكثر في سلتك وقت الشراء للحصول على (${rewardLabel}).`;
              } else if (rule.condition_type === 'min_order_amount') {
                const minAmt = Math.max(0, Number(cfg.min_amount ?? 0));
                progress = 0;
                conditionLine = `عند وصول قيمة طلبك إلى ${minAmt} ج أو أكثر ستحصل على (${rewardLabel}).`;
              } else if (rule.condition_type === 'days_of_week') {
                progress = 50;
                conditionLine = `العرض (${rewardLabel}) متاح في أيام محددة من الأسبوع عند إتمام طلبك.`;
              } else if (rule.condition_type === 'time_window') {
                progress = 50;
                conditionLine = `العرض (${rewardLabel}) متاح خلال ساعات محددة (${cfg.start_hour ?? '00:00'} - ${cfg.end_hour ?? '05:00'}).`;
              } else {
                const freeCondition =
                  rule.custom_condition_label ||
                  cfg.note ||
                  'شرط مخصص من المتجر';
                const nums = (String(freeCondition).match(/\d+/g) || [])
                  .map((n) => Number(n))
                  .filter((n) => n > 0 && n <= 100);
                const targetFromText = nums.length > 0 ? Math.max(...nums) : 0;

                if (targetFromText > 0) {
                  done = doneCount >= targetFromText;
                  const rem = Math.max(0, targetFromText - doneCount);
                  progress = Math.min(
                    100,
                    Math.max(0, Math.round((doneCount / targetFromText) * 100)),
                  );
                  conditionLine = done
                    ? `مبروك! حققت شرط (${freeCondition}) وتستحق (${rewardLabel}).`
                    : `${freeCondition} — رصيد طلباتك المكتملة ${doneCount}/${targetFromText} (متبقي ${rem}).`;
                } else {
                  progress = 60;
                  conditionLine = freeCondition;
                }
              }

              return {
                id: rule.id,
                title: rule.title || 'عرض مميز',
                shortDesc,
                reward: rewardLabel,
                conditionLine,
                progress,
                done,
              };
            };

            const offers = portfolioRules.map(buildFriendlyOffer);
            const firstOffer = offers[0];
            const restOffers = offers.slice(1);

            if (!hasActiveLoyaltyCounter && offers.length === 0) {
              return null;
            }

            return (
              <div className='relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-[#131d31] via-[#0e1626] to-[#131d31] p-3.5 sm:p-4 shadow-xl shadow-black/25 space-y-3.5'>
                <div className='absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 opacity-95' />

                {hasActiveLoyaltyCounter && (
                  <>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5'>
                      <div className='space-y-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <span className='inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-sm animate-bounce'>
                            🎁
                          </span>
                          <h3 className='text-xs sm:text-sm font-black text-white'>
                            عدّاد الولاء والمكافآت
                          </h3>
                        </div>

                        <p className='text-[11px] sm:text-xs text-slate-200 pr-9 leading-relaxed'>
                          {doneCount === 0 && activeFirstOrderRule
                            ? 'أهلاً بك! أول طلب لك مؤهل لعرض العميل الجديد، وبعد إتمامه يبدأ احتساب عدّاد الولاء تلقائياً.'
                            : activeCycleRule && doneCount >= cycleStartAfter
                              ? `مبروك! أتممت ${doneCount} طلبات مكتملة وتستحق الآن مكافأة: ${
                                  activeCycleRule.custom_reward_label ||
                                  activeCycleRule.title ||
                                  'مكافأة الولاء'
                                }.`
                              : activeCycleRule
                                ? `أتممت ${doneCount} طلب مكتمل — متبقي ${remainingCycle} ${
                                    remainingCycle === 1
                                      ? 'طلب مكتمل'
                                      : 'طلبات مكتملة'
                                  } للوصول للمكافأة القادمة.`
                                : `أتممت ${doneCount} طلب مكتمل.`}
                        </p>
                      </div>

                      <div className='flex items-center gap-2 self-end sm:self-center shrink-0'>
                        <span className='text-[10.5px] sm:text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'>
                          {doneCount} مكتمل
                        </span>
                        {activeCycleRule && (
                          <span className='text-[10.5px] sm:text-[11px] font-black px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30'>
                            {cycleProgress}%
                          </span>
                        )}
                      </div>
                    </div>

                    {activeCycleRule && (
                      <div className='space-y-1.5'>
                        <div className='h-2 w-full overflow-hidden rounded-full bg-slate-800/90 border border-slate-700/60 p-[1px]'>
                          <div
                            className='h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-all duration-500'
                            style={{ width: `${cycleProgress}%` }}
                          />
                        </div>
                        <div className='flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-semibold'>
                          <span>
                            الدورة: كل {cycleEveryN} طلبات · يبدأ بعد{' '}
                            {cycleStartAfter} مكتملين
                          </span>
                          <span className='text-amber-300/90'>
                            وضّح مكافأتك للأدمن عند تأكيد الطلب
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {firstOffer && (
                  <div
                    className={`${
                      hasActiveLoyaltyCounter
                        ? 'border-t border-slate-800/90 pt-3'
                        : ''
                    } space-y-2.5`}
                  >
                    <div className='rounded-xl border border-slate-700/70 bg-[#152036]/90 p-3 space-y-2 transition-all duration-300 hover:border-cyan-400/40'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-xs font-black text-white truncate'>
                          {firstOffer.title}
                        </span>
                        <span className='shrink-0 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-extrabold text-cyan-200'>
                          {firstOffer.reward}
                        </span>
                      </div>

                      {firstOffer.shortDesc && (
                        <p className='text-[10.5px] text-amber-200/90 leading-relaxed'>
                          {firstOffer.shortDesc}
                        </p>
                      )}

                      <p className='text-[11px] text-slate-200 leading-relaxed'>
                        {firstOffer.conditionLine}
                      </p>

                      <div className='space-y-1'>
                        <div className='flex items-center justify-between text-[10px] font-bold text-slate-300'>
                          <span>نسبة التقدم</span>
                          <span className='text-cyan-300'>
                            {firstOffer.progress}%
                          </span>
                        </div>
                        <div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-800'>
                          <div
                            className='h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 transition-all duration-500'
                            style={{ width: `${firstOffer.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {restOffers.length > 0 && (
                      <>
                        <div className='flex items-center justify-between gap-2'>
                          <button
                            type='button'
                            onClick={() =>
                              setShowAllPortfolioOffers((prev) => !prev)
                            }
                            className='group inline-flex w-full sm:w-auto items-center justify-between sm:justify-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-emerald-500/15 hover:from-cyan-500/25 hover:to-emerald-500/25 px-3.5 py-2 text-[11px] sm:text-xs font-black text-cyan-200 transition-all duration-300 cursor-pointer shadow-sm'
                          >
                            <span className='inline-flex items-center gap-2'>
                              <span className='inline-flex h-5 w-5 items-center justify-center rounded-md bg-cyan-400/20 text-cyan-300 animate-pulse'>
                                ⚡
                              </span>
                              <span>
                                {showAllPortfolioOffers
                                  ? 'إخفاء باقي العروض'
                                  : `اكتشف باقي العروض (${restOffers.length})`}
                              </span>
                            </span>
                            <span
                              className={`text-xs transition-transform duration-300 ${
                                showAllPortfolioOffers
                                  ? 'rotate-180 text-rose-300'
                                  : 'animate-bounce text-cyan-300'
                              }`}
                            >
                              ▼
                            </span>
                          </button>
                        </div>

                        {showAllPortfolioOffers && (
                          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1'>
                            {restOffers.map((offer, idx) => {
                              const barColor = [
                                'from-cyan-400 to-blue-500',
                                'from-emerald-400 to-teal-500',
                                'from-amber-400 to-rose-500',
                              ][idx % 3];

                              return (
                                <div
                                  key={offer.id}
                                  className='rounded-xl border border-slate-700/70 bg-[#121b2d] p-3 space-y-2 transition-all duration-300 hover:border-cyan-400/45 hover:-translate-y-0.5'
                                >
                                  <div className='flex items-center justify-between gap-2'>
                                    <span className='text-xs font-black text-white truncate'>
                                      {offer.title}
                                    </span>
                                    <span className='shrink-0 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-200'>
                                      {offer.reward}
                                    </span>
                                  </div>

                                  {offer.shortDesc && (
                                    <p className='text-[10.5px] text-amber-200/90 leading-relaxed'>
                                      {offer.shortDesc}
                                    </p>
                                  )}

                                  <p className='text-[11px] text-slate-200 leading-relaxed'>
                                    {offer.conditionLine}
                                  </p>

                                  <div className='space-y-1'>
                                    <div className='flex items-center justify-between text-[10px] font-bold text-slate-300'>
                                      <span>التقدم</span>
                                      <span className='text-emerald-300'>
                                        {offer.progress}%
                                      </span>
                                    </div>
                                    <div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-800'>
                                      <div
                                        className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                                        style={{ width: `${offer.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* ================================= */}
          {/* Time Filter Boxes (All Time / Today / Week / Month) */}
          <div className='grid grid-cols-4 gap-1.5 sm:gap-2'>
            {(
              [
                { key: 'all', label: 'All Time', icon: '🗓️' },
                { key: 'today', label: 'Today', icon: '⚡' },
                { key: 'week', label: 'Week', icon: '📅' },
                { key: 'month', label: 'Month', icon: '🌙' },
              ] as const
            ).map((tf) => {
              const activeTime = timeFilter === tf.key;
              return (
                <button
                  key={tf.key}
                  type='button'
                  onClick={() => setTimeFilter(tf.key)}
                  className={`px-2 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                    activeTime
                      ? 'bg-sky-950/50 border-sky-400/70 text-white shadow-md shadow-sky-950/40'
                      : 'bg-[#121b2e] border-slate-700/60 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className='text-[10px] sm:text-[11px] font-bold truncate'>
                    {tf.label}
                  </span>
                  <span className='text-xs shrink-0'>{tf.icon}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar + Price Range Icon Trigger */}
          <div className='space-y-2 relative z-20'>
            <div className='relative flex items-center'>
              <span className='absolute left-3 text-xs text-blue-400 animate-pulse pointer-events-none'>
                🔍
              </span>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search product, order #, phone, name, or #price...'
                className='w-full bg-[#0f172a] text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-8 pr-20 py-2.5 border border-blue-500/50 hover:border-blue-400/75 focus:outline-none focus:border-sky-400 shadow-md shadow-blue-950/30 transition-all'
              />

              <div className='absolute right-2 flex items-center gap-1'>
                {(searchQuery ||
                  minPrice ||
                  maxPrice ||
                  timeFilter !== 'all') && (
                  <button
                    type='button'
                    onClick={() => {
                      setSearchQuery('');
                      setMinPrice('');
                      setMaxPrice('');
                      setTimeFilter('all');
                      setOrderFilter('all');
                    }}
                    title='Reset all filters'
                    className='px-1.5 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer'
                  >
                    Clear
                  </button>
                )}

                <button
                  type='button'
                  onClick={() => setIsPriceFilterOpen((prev) => !prev)}
                  title='Filter by price range'
                  className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    isPriceFilterOpen || minPrice || maxPrice
                      ? 'bg-blue-600/30 border-blue-400/70 text-blue-200 animate-pulse'
                      : 'bg-slate-800/90 border-blue-500/40 text-blue-300 hover:text-white hover:border-blue-400'
                  }`}
                >
                  <span>💲</span>
                  <span className='text-[10px] hidden sm:inline'>Range</span>
                </button>
              </div>
            </div>

            {isPriceFilterOpen && (
              <div className='bg-[#121c30] border border-blue-500/40 rounded-xl p-2.5 shadow-lg flex flex-wrap sm:flex-nowrap items-center gap-2'>
                <div className='flex-1 min-w-[110px]'>
                  <label className='block text-[10px] font-bold text-slate-400 mb-1'>
                    Min Price (EGP)
                  </label>
                  <input
                    type='number'
                    min='0'
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder='0'
                    className='w-full bg-[#0b1120] text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700/70 focus:outline-none focus:border-blue-500'
                  />
                </div>

                <div className='flex-1 min-w-[110px]'>
                  <label className='block text-[10px] font-bold text-slate-400 mb-1'>
                    Max Price (EGP)
                  </label>
                  <input
                    type='number'
                    min='0'
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder='Any'
                    className='w-full bg-[#0b1120] text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700/70 focus:outline-none focus:border-blue-500'
                  />
                </div>

                <button
                  type='button'
                  onClick={() => setIsPriceFilterOpen(false)}
                  className='self-end px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition cursor-pointer shrink-0'
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Status Filter Boxes (Synced dynamically with Time + Search + Price Range) */}
          <div className='grid grid-cols-2 sm:grid-cols-5 gap-2'>
            <button
              type='button'
              onClick={() => setOrderFilter('all')}
              className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border ${
                orderFilter === 'all'
                  ? 'bg-blue-950/40 border-blue-500/60 shadow-blue-950/30'
                  : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div>
                <span className='text-[9px] sm:text-[10px] text-slate-300 uppercase font-bold tracking-wider'>
                  All
                </span>
                <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                  {dynamicStatusCounts.total}
                </p>
              </div>
              <div className='w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs'>
                📦
              </div>
            </button>

            <button
              type='button'
              onClick={() => setOrderFilter('pending')}
              className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border ${
                orderFilter === 'pending'
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-950/30'
                  : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div>
                <span className='text-[9px] sm:text-[10px] text-amber-400 uppercase font-bold tracking-wider'>
                  Pending
                </span>
                <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                  {dynamicStatusCounts.pending}
                </p>
              </div>
              <div className='w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs'>
                ⏳
              </div>
            </button>

            <button
              type='button'
              onClick={() => setOrderFilter('shipped')}
              className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border ${
                orderFilter === 'shipped'
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-indigo-950/30'
                  : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div>
                <span className='text-[9px] sm:text-[10px] text-indigo-400 uppercase font-bold tracking-wider'>
                  Shipped
                </span>
                <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                  {dynamicStatusCounts.shipped}
                </p>
              </div>
              <div className='w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs'>
                🚀
              </div>
            </button>

            <button
              type='button'
              onClick={() => setOrderFilter('completed')}
              className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border ${
                orderFilter === 'completed'
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/30'
                  : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div>
                <span className='text-[9px] sm:text-[10px] text-emerald-400 uppercase font-bold tracking-wider'>
                  Completed
                </span>
                <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                  {dynamicStatusCounts.completed}
                </p>
              </div>
              <div className='w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs'>
                ✅
              </div>
            </button>

            <button
              type='button'
              onClick={() => setOrderFilter('cancelled')}
              className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border col-span-2 sm:col-span-1 ${
                orderFilter === 'cancelled'
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/30'
                  : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div>
                <span className='text-[9px] sm:text-[10px] text-rose-400 uppercase font-bold tracking-wider'>
                  Cancelled
                </span>
                <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                  {dynamicStatusCounts.cancelled}
                </p>
              </div>
              <div className='w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-xs'>
                ❌
              </div>
            </button>
          </div>
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {orders.length === 0 ? (
            <div className='bg-[#131d31]/90 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/60 text-center space-y-2.5 shadow-xl'>
              <Package size={36} className='mx-auto text-slate-500' />
              <p className='text-slate-300 text-xs font-medium'>
                لم تقم بأي طلبات حتى الآن.
              </p>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className='bg-[#131d31]/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/60 text-center space-y-2 shadow-lg'>
              <p className='text-slate-300 text-xs font-semibold'>
                No orders match your selected filters.
              </p>
              <button
                type='button'
                onClick={() => {
                  setSearchQuery('');
                  setMinPrice('');
                  setMaxPrice('');
                  setTimeFilter('all');
                  setOrderFilter('all');
                }}
                className='px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition cursor-pointer'
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className='max-h-[420px] overflow-y-auto pr-1.5 space-y-3 custom-scrollbar'>
              {visibleOrders.map((order: any, idx: number) => {
                const orderItems = getOrderItemsList(order);
                const orderNotes = getOrderNotesText(order);
                const hasNotes = Boolean(orderNotes);
                const hasItems = orderItems.length > 0;
                const cardTheme =
                  ORDER_CARD_THEMES[idx % ORDER_CARD_THEMES.length];
                const totalQty = orderItems.reduce(
                  (acc: number, item: any) =>
                    acc + (Number(item?.quantity) || 1),
                  0,
                );

                // بيانات الأوردر الديناميكية لرسالة الواتساب
                const orderNumberDisplay = order.order_number
                  ? String(order.order_number)
                  : String(order.id).slice(0, 8).toUpperCase();
                const customerName =
                  order.customer_name || order.name || 'غير محدد';
                const customerPhone =
                  order.customer_phone || order.phone || 'غير محدد';
                const customerAddress = order.customer_address || 'غير محدد';

                const whatsappMessage = [
                  'السلام عليكم، كنت حابب أتابع بخصوص اوردر سابق ليا في المتجر',
                  `رقم الأوردر: #${orderNumberDisplay}`,
                  `الاسم: ${customerName}`,
                  `رقم الهاتف: ${customerPhone}`,
                  `العنوان: ${customerAddress}`,
                ].join('\n');

                const whatsappUrl = `https://wa.me/201016605189?text=${encodeURIComponent(
                  whatsappMessage,
                )}`;

                return (
                  <div
                    key={order.id}
                    className={`bg-gradient-to-br ${cardTheme} backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border shadow-lg space-y-3 transition-all duration-300`}
                  >
                    <div className='flex flex-col gap-2 border-b border-slate-700/60 pb-2.5'>
                      <div className='flex justify-between items-center gap-2'>
                        <span className='font-black text-[11px] text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-500/30'>
                          ORDER #{orderNumberDisplay}
                        </span>

                        <div className='flex items-center gap-1.5'>
                          {/* Items Icon + Count (Animated when order has items) */}
                          <button
                            type='button'
                            onClick={() => setActiveItemsOrder(order)}
                            title='View ordered items'
                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 ${
                              hasItems
                                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/50 shadow-sm shadow-cyan-950/50 animate-pulse'
                                : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 border-slate-700/70'
                            }`}
                          >
                            <span>🛍️</span>
                            <span>{totalQty || orderItems.length}</span>
                          </button>

                          {/* Notes Icon (Animated when order has notes) */}
                          <button
                            type='button'
                            onClick={() => setActiveNotesOrder(order)}
                            title='View customer notes'
                            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 ${
                              hasNotes
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/50 shadow-sm shadow-amber-950/50 animate-pulse'
                                : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 border-slate-700/70'
                            }`}
                          >
                            <span>📝</span>
                            <span className='hidden sm:inline'>Notes</span>
                          </button>

                          {/* زر واتساب متابعة الأوردر */}
                          <a
                            href={whatsappUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            title='متابعة الطلب عبر واتساب'
                            aria-label='متابعة الطلب عبر واتساب'
                            className='px-2 py-0.5 rounded-lg border bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50 text-[10px] font-bold flex items-center justify-center transition-all hover:scale-105'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              viewBox='0 0 24 24'
                              fill='currentColor'
                              className='w-3.5 h-3.5'
                            >
                              <path d='M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.75.453 3.453 1.313 4.969l-1.375 5.063 5.188-1.359c1.469.797 3.109 1.219 4.844 1.219 5.516 0 9.969-4.453 9.969-9.969s-4.453-9.969-9.969-9.969zm5.813 14.125c-.25.703-1.438 1.344-1.984 1.422-.516.078-1.172.109-1.891-.125-.438-.141-1-.328-1.734-.641-3.047-1.313-5.031-4.391-5.188-4.594-.156-.203-1.234-1.641-1.234-3.125s.781-2.219 1.063-2.516c.281-.297.609-.375.813-.375.203 0 .406 0 .578.016.188.016.438-.063.688.516.25.594.859 2.094.938 2.25.078.156.125.344.031.547-.094.203-.141.328-.281.5-.141.172-.297.391-.422.516-.141.141-.297.297-.125.594.172.297.766 1.266 1.641 2.047 1.125 1 2.078 1.313 2.375 1.453.297.141.469.125.641-.078.172-.203.734-.859.938-1.156.203-.297.406-.25.688-.141.281.109 1.797.844 2.109 1 .313.156.516.234.594.375.078.141.078.813-.172 1.516z' />
                            </svg>
                          </a>

                          {getStatusBadge(order.status)}
                        </div>
                      </div>

                      <div className='bg-[#0f172a] p-2.5 rounded-xl border border-slate-700/50 space-y-1 text-xs'>
                        <div className='flex items-center justify-between text-slate-200'>
                          <span className='text-slate-400'>Customer:</span>
                          <span className='font-bold text-white'>
                            {order.customer_name ||
                              order.name ||
                              'Valued Customer'}
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-slate-200'>
                          <span className='text-slate-400'>Phone:</span>
                          <span className='font-semibold text-emerald-400 dir-ltr'>
                            {order.customer_phone || order.phone || 'N/A'}
                          </span>
                        </div>
                        <div className='flex items-start justify-between text-slate-200 gap-2'>
                          <span className='text-slate-400 shrink-0 flex items-center gap-1'>
                            <MapPin size={11} className='text-rose-400' />{' '}
                            Address:
                          </span>
                          <span className='text-right text-slate-200 line-clamp-1'>
                            {order.customer_address || 'Not Specified'}
                          </span>
                        </div>
                      </div>

                      <div className='flex justify-between items-center text-[10px] text-slate-400 px-0.5'>
                        <span>Ordered on:</span>
                        <span className='font-medium text-slate-300'>
                          {new Date(order.created_at).toLocaleString('en-US')}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between bg-[#19253d] p-2.5 rounded-xl border border-slate-700/50'>
                      <div className='space-y-1'>
                        <div>
                          <span className='text-[9px] text-slate-400 block uppercase font-bold tracking-wider'>
                            Shipping Fee
                          </span>
                          <span className='font-bold text-[11px] sm:text-xs text-sky-300'>
                            {order.free_shipping_approved
                              ? 'Free Shipping (0 EGP)'
                              : `${Number(
                                  order.delivery_fee ??
                                    order.shipping_cost ??
                                    0,
                                )} EGP`}
                          </span>
                        </div>

                        <div className='pt-1 border-t border-slate-700/60'>
                          <span className='text-[9px] text-slate-400 block uppercase font-bold tracking-wider'>
                            Total Amount
                          </span>
                          <span className='font-black text-xs sm:text-sm text-emerald-400'>
                            {(() => {
                              const fee = order.free_shipping_approved
                                ? 0
                                : Number(
                                    order.delivery_fee ??
                                      order.shipping_cost ??
                                      0,
                                  );
                              const sub = Number(order.subtotal ?? 0);
                              if (sub > 0) return sub + fee;
                              return Number(order.total_amount ?? fee);
                            })()}{' '}
                            <span className='text-[10px] text-slate-400 font-normal'>
                              EGP
                            </span>
                          </span>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className='px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer'
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}
          {/* ============================= */}

          {/* Centered Responsive Notes Modal */}
          {activeNotesOrder && (
            <div
              onClick={() => setActiveNotesOrder(null)}
              className='fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4'
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className='w-full max-w-md bg-[#11192c] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]'
              >
                <div className='flex items-center justify-between px-4 py-3 border-b border-slate-700/70 bg-[#152038]'>
                  <div className='flex items-center gap-2'>
                    <span>📝</span>
                    <h3 className='text-xs sm:text-sm font-bold text-white'>
                      Order Notes #
                      {activeNotesOrder.order_number ||
                        String(activeNotesOrder.id).slice(0, 8).toUpperCase()}
                    </h3>
                  </div>
                  <button
                    type='button'
                    onClick={() => setActiveNotesOrder(null)}
                    className='w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center transition cursor-pointer'
                  >
                    ✕
                  </button>
                </div>

                <div className='p-4 overflow-y-auto custom-scrollbar text-xs leading-relaxed text-slate-200 whitespace-pre-wrap'>
                  {getOrderNotesText(activeNotesOrder) ||
                    'No notes were added for this order.'}
                </div>
              </div>
            </div>
          )}

          {/* Centered Responsive Ordered Items Modal */}
          {activeItemsOrder && (
            <div
              onClick={() => setActiveItemsOrder(null)}
              className='fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4'
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className='w-full max-w-lg bg-[#11192c] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]'
              >
                <div className='flex items-center justify-between px-4 py-3 border-b border-slate-700/70 bg-[#152038]'>
                  <div className='flex items-center gap-2'>
                    <span>🛍️</span>
                    <h3 className='text-xs sm:text-sm font-bold text-white'>
                      Ordered Items #
                      {activeItemsOrder.order_number ||
                        String(activeItemsOrder.id).slice(0, 8).toUpperCase()}
                    </h3>
                  </div>
                  <button
                    type='button'
                    onClick={() => setActiveItemsOrder(null)}
                    className='w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center transition cursor-pointer'
                  >
                    ✕
                  </button>
                </div>

                {/* Items Subtotal Summary Box */}
                <div className='px-4 py-2.5 bg-[#131e34] border-b border-slate-700/60 flex items-center justify-between'>
                  <span className='text-[11px] font-bold text-slate-300 uppercase tracking-wider'>
                    Items Subtotal
                  </span>
                  <span className='text-xs sm:text-sm font-black text-emerald-400'>
                    {Number(
                      activeItemsOrder.subtotal ??
                        getOrderItemsList(activeItemsOrder).reduce(
                          (sum: number, item: any) =>
                            sum +
                            Number(item?.price ?? 0) *
                              (Number(item?.quantity) || 1),
                          0,
                        ),
                    )}{' '}
                    <span className='text-[10px] font-normal text-slate-400'>
                      EGP
                    </span>
                  </span>
                </div>

                <div className='p-4 overflow-y-auto custom-scrollbar space-y-2.5'>
                  {getOrderItemsList(activeItemsOrder).length === 0 ? (
                    <p className='text-xs text-slate-400 text-center py-4'>
                      No items found in this order.
                    </p>
                  ) : (
                    getOrderItemsList(activeItemsOrder).map(
                      (item: any, index: number) => {
                        const currentPrice = Number(item?.price ?? 0);
                        const beforePrice = Number(
                          item?.compare_at_price ??
                            item?.old_price ??
                            item?.original_price ??
                            item?.before_price ??
                            0,
                        );
                        const qty = Number(item?.quantity ?? 1);
                        const thumbUrl = getOptimizedThumbUrl(
                          item?.image || item?.thumbnail || item?.img,
                        );

                        return (
                          <div
                            key={item?.id || `${item?.name}-${index}`}
                            className='bg-[#172238] border border-slate-700/60 rounded-xl p-3 flex items-start justify-between gap-3'
                          >
                            <div className='flex items-start gap-2.5 min-w-0'>
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={item?.name || 'Product'}
                                  loading='lazy'
                                  className='w-9 h-9 rounded-lg object-cover border border-slate-600/60 shrink-0 bg-slate-900'
                                />
                              ) : (
                                <div className='w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shrink-0'>
                                  📦
                                </div>
                              )}

                              <div className='min-w-0 space-y-0.5'>
                                <div className='flex items-center gap-1.5 flex-wrap'>
                                  <span className='text-xs font-bold text-white truncate'>
                                    {item?.name || 'Product'}
                                  </span>
                                  <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25'>
                                    x{qty}
                                  </span>
                                </div>

                                {(item?.description || item?.desc) && (
                                  <p className='text-[11px] text-slate-300/90 leading-snug'>
                                    {item?.description || item?.desc}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className='text-right shrink-0 space-y-0.5'>
                              {beforePrice > currentPrice && (
                                <div className='text-[10px] text-slate-400 line-through'>
                                  {beforePrice} EGP
                                </div>
                              )}
                              <div className='text-xs font-black text-emerald-400'>
                                {currentPrice}{' '}
                                <span className='text-[10px] font-normal text-slate-400'>
                                  EGP
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
