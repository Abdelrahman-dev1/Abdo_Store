'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flame,
  Layers,
  Clock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // ======================
  // ======================

  const [liveOrderPage, setLiveOrderPage] = useState(1);
  const [liveOrderPageAnimKey, setLiveOrderPageAnimKey] = useState(0);
  // ======================
  const [liveStatusFilter, setLiveStatusFilter] = useState<string>('all');

  // ======================
  // ======================
  // ======================
  // ======================
  const [regularPage, setRegularPage] = useState(1);
  const [regularPageAnimKey, setRegularPageAnimKey] = useState(0);
  // ======================
  // ======================
  // ======================
  const [vipPage, setVipPage] = useState(1);
  const [vipPageAnimKey, setVipPageAnimKey] = useState(0);
  // ======================
  // ======================

  // فلتر الزمن الجديد (All Time, Today, This Week, This Month)
  const [timeFilter, setTimeFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');

  // حالة لتخزين البروفايل الـ VIP المفتوح حالياً
  const [expandedProfileKey, setExpandedProfileKey] = useState<string | null>(
    null,
  );

  const [vipOrderDetailsKey, setVipOrderDetailsKey] = useState<string | null>(
    null,
  );

  const [regularOrderDetailsKey, setRegularOrderDetailsKey] = useState<
    string | null
  >(null);
  const [regularOrderNoteKey, setRegularOrderNoteKey] = useState<string | null>(
    null,
  );

  const [vipOrderNoteKey, setVipOrderNoteKey] = useState<string | null>(null);

  // بحث خاص بكل بروفايل VIP
  const [profileSearchQueries, setProfileSearchQueries] = useState<{
    [key: string]: string;
  }>({});
  // فلتر حالة خاص بكل بروفايل VIP
  const [profileStatusFilters, setProfileStatusFilters] = useState<{
    [key: string]: string;
  }>({});

  // فلتر حالة وشريط بحث خاص بقسم العملاء العاديين
  const [regularStatusFilter, setRegularStatusFilter] = useState('all');
  const [regularSearchQuery, setRegularSearchQuery] = useState('');

  // مراجع للتحكم في حركة الاسلايدرات الأفقية للعملاء المميزين والعاديين
  const vipSliderRef = useRef<HTMLDivElement>(null);
  const regularSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // ========================
  // ========================
  // ========================
  // ========================
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
  }, []);
  // ========================
  // ========================
  // ========================
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
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================

  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // حالات مستقلة لبلوك Live Real-time Incoming Orders (بدون أي تداخل)
  const [liveSearch, setLiveSearch] = useState<string>('');
  const [liveCatalogProducts, setLiveCatalogProducts] = useState<any[]>([]);
  const [liveCollapsedMetaIds, setLiveCollapsedMetaIds] = useState<
    Record<string, boolean>
  >({});
  const [liveOrderModal, setLiveOrderModal] = useState<{
    isOpen: boolean;
    order: any | null;
    items: any[];
  }>({
    isOpen: false,
    order: null,
    items: [],
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(
            'id, name, description, price, compare_at_price, old_price, discount, image, images, category',
          );
        if (mounted && !error && Array.isArray(data)) {
          setLiveCatalogProducts(data);
        }
      } catch {
        // تجاهل أخطاء الجلب المؤقتة
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================
  // =================================

  // دوال التحرك السريع في الاسلايدرات
  const scrollSlider = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right' | 'start' | 'end',
  ) => {
    if (!ref.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = ref.current;
    if (direction === 'left') {
      ref.current.scrollTo({
        left: scrollLeft - clientWidth * 0.75,
        behavior: 'smooth',
      });
    } else if (direction === 'right') {
      ref.current.scrollTo({
        left: scrollLeft + clientWidth * 0.75,
        behavior: 'smooth',
      });
    } else if (direction === 'start') {
      ref.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === 'end') {
      ref.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
    }
  };

  // إحصائيات بوكسات الفلتر بحسب فلتر الزمن المختار
  // إحصائيات بوكسات الفلتر بحسب فلتر الزمن المختار
  const timeFilteredOrders = useMemo(() => {
    if (!currentTime) return orders; // أثناء الـ SSR يرجع الأوردرات بدون فلترة زمنية مؤقتاً لحد ما الـ Client يعمل Mount
    const now = currentTime;
    return orders.filter((o) => {
      if (!o.created_at) return true;
      const orderDate = new Date(o.created_at);

      if (timeFilter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (timeFilter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        return orderDate >= startOfWeek;
      } else if (timeFilter === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [orders, timeFilter, currentTime]);

  const visibleLiveOrders =
    liveStatusFilter === 'all'
      ? timeFilteredOrders
      : timeFilteredOrders.filter((o: any) => o.status === liveStatusFilter);

  const totalCount = timeFilteredOrders.length;
  const pendingCount = timeFilteredOrders.filter(
    (o) => o.status === 'pending',
  ).length;
  const shippingCount = timeFilteredOrders.filter(
    (o) => o.status === 'shipping',
  ).length;
  const deliveredCount = timeFilteredOrders.filter(
    (o) => o.status === 'delivered',
  ).length;
  const cancelledCount = timeFilteredOrders.filter(
    (o) => o.status === 'cancelled',
  ).length;

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
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  const getWhatsAppLink = (order: any) => {
    let phone = (order.customer_phone || order.phone || '').replace(/\D/g, '');
    if (phone.length === 11 && phone.startsWith('01')) {
      phone = '2' + phone;
    }

    let itemsList: any[] = [];
    try {
      itemsList =
        typeof order.items === 'string'
          ? JSON.parse(order.items)
          : order.items || [];
    } catch (e) {
      itemsList = [];
    }

    const itemsFormatted = itemsList
      .map(
        (item: any) =>
          `• المنتج: ${item.name} | الكمية: ${item.quantity} | السعر: ${item.price} ج.م | الإجمالي الفرعي: ${item.price * item.quantity} ج.م`,
      )
      .join('\n---\n');

    // صافي إجمالي المنتجات من العناصر نفسها لتجنب أي شحن مضاف مسبقاً
    const productsSubtotal = itemsList.reduce(
      (sum: number, item: any) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0,
    );

    const orderNumberText = order.order_number
      ? `#${order.order_number}`
      : order.id
        ? `#${String(order.id).slice(0, 6)}`
        : 'غير محدد';

    const customerNameText = (
      order.customer_name ||
      order.full_name ||
      order.name ||
      ''
    ).trim();

    const customerNameLine = customerNameText
      ? `👤 اسم العميل: ${customerNameText}\n`
      : '';

    const notesText = order.customer_notes?.trim()
      ? `📝 ملاحظات العميل: ${order.customer_notes.trim()}\n`
      : '';

    const message =
      `السلام عليكم، بنكلم حضرتك بخصوص الطلب اللي طلبته من Abdo Store\n` +
      `وحابين نأكد تفاصيله مع حضرتك:\n\n` +
      `🔢 رقم الطلب: ${orderNumberText}\n` +
      `${customerNameLine}\n` +
      `تفاصيل الطلب:\n\n` +
      `${itemsFormatted}\n\n` +
      `-------------------\n` +
      `📦 إجمالي المنتجات: ${productsSubtotal} ج.م\n` +
      `🚚 مصاريف الشحن: \n` +
      `💵 إجمالي الدفع عند الاستلام: \n` +
      `📍 عنوان التوصيل: ${order.customer_address || 'غير محدد'}\n` +
      `${notesText}\n` +
      `لو الاوردر تمام يريت تبلغني عشان ابعتهولك في اسرع وقت 🤍`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================
  // =======================================

  const statusFilteredOrders = useMemo(() => {
    if (selectedStatusFilter === 'all') return timeFilteredOrders;
    return timeFilteredOrders.filter((o) => o.status === selectedStatusFilter);
  }, [timeFilteredOrders, selectedStatusFilter]);

  const matchesSearch = (
    order: any,
    rawQuery: string,
    profileName = '',
    profilePhone = '',
  ) => {
    if (!rawQuery.trim()) return true;
    const q = rawQuery.trim().toLowerCase();

    const customerName = (
      profileName ||
      order.customer_name ||
      ''
    ).toLowerCase();
    const customerPhone = (
      profilePhone ||
      order.customer_phone ||
      order.phone ||
      ''
    ).toLowerCase();
    // const city = (order.city || '').toLowerCase();
    const address = (order.customer_address || '').toLowerCase();
    const orderId = (order.id || '').toLowerCase();
    const totalAmount = String(order.total_amount || '');

    if (
      customerName.includes(q) ||
      customerPhone.includes(q) ||
      // city.includes(q) ||
      address.includes(q) ||
      orderId.includes(q) ||
      totalAmount.includes(q)
    ) {
      return true;
    }

    let itemsList = [];
    try {
      itemsList =
        typeof order.items === 'string'
          ? JSON.parse(order.items)
          : order.items || [];
    } catch (e) {
      itemsList = [];
    }

    return itemsList.some((item: any) => {
      const itemName = (item.name || '').toLowerCase();
      const itemPrice = String(item.price || '');
      const itemTotalPrice = String((item.price || 0) * (item.quantity || 0));
      return (
        itemName.includes(q) ||
        itemPrice.includes(q) ||
        itemTotalPrice.includes(q)
      );
    });
  };

  // تجميع البروفايلات والطلبات العادية مع فلترة الأقسام الخاصة بهم
  const processedData = useMemo(() => {
    const map = new Map();

    statusFilteredOrders.forEach((order) => {
      const phone = (
        order.customer_phone ||
        order.phone ||
        'unknown_phone'
      ).trim();
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

    // البحث العام (Global Search)
    const q = searchQuery.trim();
    let filteredProfiles = allProfiles;

    if (q) {
      filteredProfiles = allProfiles.filter((profile) => {
        const matchesProfileInfo =
          profile.customerName.toLowerCase().includes(q.toLowerCase()) ||
          profile.customerPhone.toLowerCase().includes(q.toLowerCase());
        if (matchesProfileInfo) return true;
        return profile.orders.some((order: any) =>
          matchesSearch(order, q, profile.customerName, profile.customerPhone),
        );
      });
    }

    const vipProfiles: any[] = [];
    const normalOrdersList: any[] = [];

    filteredProfiles.forEach((profile) => {
      if (profile.orders.length >= 3) {
        let targetOrders = profile.orders;
        if (q) {
          targetOrders = profile.orders.filter((o: any) =>
            matchesSearch(o, q, profile.customerName, profile.customerPhone),
          );
          if (
            targetOrders.length === 0 &&
            (profile.customerName.toLowerCase().includes(q.toLowerCase()) ||
              profile.customerPhone.toLowerCase().includes(q.toLowerCase()))
          ) {
            targetOrders = profile.orders;
          }
        }
        vipProfiles.push({ ...profile, orders: targetOrders });
      } else {
        let targetOrders = profile.orders;
        if (q) {
          targetOrders = profile.orders.filter((o: any) =>
            matchesSearch(o, q, profile.customerName, profile.customerPhone),
          );
        }
        normalOrdersList.push(...targetOrders);
      }
    });

    return {
      vipProfiles,
      normalOrders: normalOrdersList,
    };
  }, [statusFilteredOrders, searchQuery]);

  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  const VIP_PER_PAGE = 6;
  const totalVipPages = Math.max(
    1,
    Math.ceil((processedData?.vipProfiles?.length || 0) / VIP_PER_PAGE),
  );
  const safeVipPage = Math.min(vipPage, totalVipPages);
  const vipStartIndex = (safeVipPage - 1) * VIP_PER_PAGE;
  const vipEndIndex = Math.min(
    vipStartIndex + VIP_PER_PAGE,
    processedData?.vipProfiles?.length || 0,
  );
  const paginatedVipProfiles = (processedData?.vipProfiles || []).slice(
    vipStartIndex,
    vipEndIndex,
  );

  const handleVipPageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, totalVipPages));
    if (clamped === safeVipPage) return;
    setVipPage(clamped);
    setVipPageAnimKey((k) => k + 1);
    setExpandedProfileKey(null);
    if (vipSliderRef.current) {
      vipSliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  return (
    <div className='min-h-screen bg-[#111827] text-slate-100 pb-14 font-sans relative selection:bg-amber-500 selection:text-white text-xs'>
      {/* Admin Navbar */}
      <nav className='bg-[#1f2937]/90 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-50 shadow-sm transition-all duration-300'>
        <div className='max-w-6xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2'>
          {/* يسار الهيدر: رجوع للداشبورد + انتقال لصفحة التوصيل */}
          <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
            <Link
              href='/admin'
              className='flex items-center gap-1.5 bg-[#374151]/80 hover:bg-[#4b5563] text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border border-slate-600/50 active:scale-95'
            >
              <ArrowLeft size={14} className='shrink-0' />
              <span className='hidden md:inline'>Dashboard</span>
            </Link>

            <Link
              href='/admin/delivery'
              className='flex items-center gap-1.5 bg-gradient-to-r from-indigo-600/25 to-teal-600/25 hover:from-indigo-600/40 hover:to-teal-600/40 text-teal-200 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border border-teal-400/35 hover:border-teal-300/60 shadow-sm active:scale-95'
            >
              <Truck size={14} className='text-teal-300 shrink-0' />
              <span className='hidden sm:inline'>Delivery</span>
            </Link>
          </div>

          {/* منتصف الهيدر: عنوان الصفحة */}
          <h1 className='text-xs sm:text-sm font-extrabold text-slate-100 flex items-center gap-2 truncate min-w-0'>
            <span className='w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0'></span>
            <span className='truncate'>Orders &amp; Profiles Management</span>
          </h1>

          {/* يمين الهيدر: تسجيل الخروج */}
          <button
            type='button'
            onClick={handleLogout}
            className='flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border border-red-500/25 shrink-0 active:scale-95 cursor-pointer'
          >
            <LogOut size={14} className='shrink-0' />
            <span className='hidden sm:inline'>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className='max-w-5xl mx-auto px-3 sm:px-4 py-5 space-y-4.5 relative z-10'>
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* الجزء الثالث الجديد تماماً في الأعلى (أعلى كل شيء) */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* Live Real-time Incoming Orders (Enhanced + Search + Modal) */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* Live Real-time Incoming Orders (Enhanced + Search + Modal) */}
        {/* ========================================================= */}
        {(() => {
          const catalogById = new Map<string, any>();
          const catalogByName = new Map<string, any>();
          liveCatalogProducts.forEach((p: any) => {
            if (p?.id) catalogById.set(String(p.id), p);
            if (p?.name) {
              catalogByName.set(String(p.name).trim().toLowerCase(), p);
            }
          });

          const parseLiveOrderItems = (rawItems: any): any[] => {
            if (Array.isArray(rawItems)) return rawItems;
            if (typeof rawItems === 'string' && rawItems.trim()) {
              try {
                const parsed = JSON.parse(rawItems);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            }
            return [];
          };

          const enrichLiveItem = (rawItem: any) => {
            const matchedProd =
              (rawItem?.product_id
                ? catalogById.get(String(rawItem.product_id))
                : undefined) ||
              (rawItem?.id ? catalogById.get(String(rawItem.id)) : undefined) ||
              (rawItem?.name
                ? catalogByName.get(String(rawItem.name).trim().toLowerCase())
                : undefined);

            const name = String(
              rawItem?.name ||
                rawItem?.title ||
                matchedProd?.name ||
                'Unnamed Product',
            ).trim();

            const description = String(
              rawItem?.description ||
                matchedProd?.description ||
                'No product description available.',
            ).trim();

            const category = String(
              rawItem?.category_name ||
                rawItem?.category ||
                matchedProd?.category ||
                'General',
            ).trim();

            const imageUrl =
              (typeof rawItem?.image === 'string' && rawItem.image.trim()) ||
              (Array.isArray(rawItem?.images) && rawItem.images[0]) ||
              (typeof matchedProd?.image === 'string' &&
                matchedProd.image.trim()) ||
              (Array.isArray(matchedProd?.images) && matchedProd.images[0]) ||
              '';

            const quantity = Math.max(
              Number(rawItem?.quantity ?? rawItem?.qty ?? 1) || 1,
              1,
            );

            const currentPrice = Number(
              rawItem?.price ?? matchedProd?.price ?? 0,
            );

            const rawBefore =
              rawItem?.compare_at_price ??
              rawItem?.old_price ??
              matchedProd?.compare_at_price ??
              matchedProd?.old_price ??
              null;

            let beforePrice: number | null =
              rawBefore !== null && Number(rawBefore) > currentPrice
                ? Number(rawBefore)
                : null;

            const discountVal = Number(
              rawItem?.discount ?? matchedProd?.discount ?? 0,
            );

            if (!beforePrice && discountVal > 0 && currentPrice > 0) {
              const est = Math.round(
                currentPrice / (1 - Math.min(discountVal, 90) / 100),
              );
              if (est > currentPrice) beforePrice = est;
            }

            const discountPercent =
              beforePrice && beforePrice > currentPrice && beforePrice > 0
                ? Math.round(((beforePrice - currentPrice) / beforePrice) * 100)
                : discountVal > 0
                  ? Math.round(discountVal)
                  : 0;

            const lineTotal = currentPrice * quantity;

            return {
              name,
              description,
              category,
              imageUrl,
              quantity,
              currentPrice,
              beforePrice,
              discountPercent,
              lineTotal,
            };
          };

          const formatFullDateTime = (rawDate: any) => {
            if (!rawDate) return { dateStr: '—', timeStr: '—' };
            const d = new Date(rawDate);
            if (Number.isNaN(d.getTime())) {
              return { dateStr: String(rawDate), timeStr: '' };
            }
            return {
              dateStr: d.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              timeStr: d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
            };
          };

          const q = liveSearch.trim().toLowerCase();
          const filteredLiveOrders = (visibleLiveOrders || []).filter(
            (order: any) => {
              if (!q) return true;
              const items = parseLiveOrderItems(order?.items);
              const itemsText = items
                .map((it: any) => {
                  const e = enrichLiveItem(it);
                  return `${e.name} ${e.category} ${e.description} ${e.currentPrice}`;
                })
                .join(' ')
                .toLowerCase();

              const haystack = [
                order?.order_number,
                order?.customer_name,
                order?.customer_phone,
                order?.phone,
                // order?.city,
                order?.customer_address,
                order?.customer_notes,
                order?.notes,
                order?.branch_name,
                order?.status,
                order?.total_amount,
                itemsText,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

              return haystack.includes(q);
            },
          );

          // =====================================
          // =====================================
          // =====================================
          // =====================================
          // =====================================
          // =====================================
          // =====================================
          const LIVE_ORDERS_PER_PAGE = 10;
          const totalLiveOrderPages = Math.max(
            1,
            Math.ceil(filteredLiveOrders.length / LIVE_ORDERS_PER_PAGE),
          );
          const safeLiveOrderPage = Math.min(
            liveOrderPage,
            totalLiveOrderPages,
          );
          const liveOrderStartIndex =
            (safeLiveOrderPage - 1) * LIVE_ORDERS_PER_PAGE;
          const liveOrderEndIndex = Math.min(
            liveOrderStartIndex + LIVE_ORDERS_PER_PAGE,
            filteredLiveOrders.length,
          );
          const paginatedLiveOrders = filteredLiveOrders.slice(
            liveOrderStartIndex,
            liveOrderEndIndex,
          );

          const handleLiveOrderPageChange = (nextPage: number) => {
            const clamped = Math.max(
              1,
              Math.min(nextPage, totalLiveOrderPages),
            );
            if (clamped === safeLiveOrderPage) return;
            setLiveOrderPage(clamped);
            setLiveOrderPageAnimKey((k) => k + 1);
          };
          // =====================================
          // =====================================
          // =====================================
          // =====================================
          // =====================================

          const statusCounts = {
            all: timeFilteredOrders.length,
            pending: timeFilteredOrders.filter(
              (o: any) => o.status === 'pending',
            ).length,
            shipping: timeFilteredOrders.filter(
              (o: any) => o.status === 'shipping',
            ).length,
            delivered: timeFilteredOrders.filter(
              (o: any) => o.status === 'delivered',
            ).length,
            cancelled: timeFilteredOrders.filter(
              (o: any) => o.status === 'cancelled',
            ).length,
          };

          const filterBoxes = [
            {
              key: 'all',
              label: 'All',
              count: statusCounts.all,
              icon: Layers,
              activeClass:
                'bg-slate-700/90 text-white border-slate-400/60 ring-1 ring-slate-400/40',
              idleClass:
                'bg-slate-900/70 text-slate-300 border-slate-700/80 hover:border-slate-500',
              badgeClass: 'bg-slate-800 text-slate-200',
            },
            {
              key: 'pending',
              label: 'Pending',
              count: statusCounts.pending,
              icon: Clock,
              activeClass:
                'bg-amber-950/80 text-amber-200 border-amber-400/70 ring-1 ring-amber-400/40',
              idleClass:
                'bg-amber-950/30 text-amber-300/90 border-amber-500/25 hover:border-amber-400/50',
              badgeClass: 'bg-amber-500/20 text-amber-200',
            },
            {
              key: 'shipping',
              label: 'Shipping',
              count: statusCounts.shipping,
              icon: Truck,
              activeClass:
                'bg-blue-950/80 text-blue-200 border-blue-400/70 ring-1 ring-blue-400/40',
              idleClass:
                'bg-blue-950/30 text-blue-300/90 border-blue-500/25 hover:border-blue-400/50',
              badgeClass: 'bg-blue-500/20 text-blue-200',
            },
            {
              key: 'delivered',
              label: 'Delivered',
              count: statusCounts.delivered,
              icon: CheckCircle2,
              activeClass:
                'bg-emerald-950/80 text-emerald-200 border-emerald-400/70 ring-1 ring-emerald-400/40',
              idleClass:
                'bg-emerald-950/30 text-emerald-300/90 border-emerald-500/25 hover:border-emerald-400/50',
              badgeClass: 'bg-emerald-500/20 text-emerald-200',
            },
            {
              key: 'cancelled',
              label: 'Cancelled',
              count: statusCounts.cancelled,
              icon: XCircle,
              activeClass:
                'bg-red-950/80 text-red-200 border-red-400/70 ring-1 ring-red-400/40',
              idleClass:
                'bg-red-950/30 text-red-300/90 border-red-500/25 hover:border-red-400/50',
              badgeClass: 'bg-red-500/20 text-red-200',
            },
          ];

          const modalSummary = liveOrderModal.items.reduce(
            (acc: { totalQty: number; totalAmount: number }, rawIt: any) => {
              const info = enrichLiveItem(rawIt);
              acc.totalQty += info.quantity;
              acc.totalAmount += info.lineTotal;
              return acc;
            },
            { totalQty: 0, totalAmount: 0 },
          );

          return (
            <div className='bg-gradient-to-r from-blue-900/30 via-[#1f2937] to-amber-900/30 p-3.5 rounded-2xl border border-blue-500/30 shadow-lg space-y-3 transition-all duration-300'>
              <div className='flex items-center justify-between gap-2 flex-wrap'>
                <div className='flex items-center gap-2'>
                  <span className='relative flex h-2.5 w-2.5'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500'></span>
                  </span>
                  <h3 className='text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wide flex items-center gap-1.5'>
                    <Flame className='w-4 h-4 text-amber-400 animate-pulse' />
                    Live Real-time Incoming Orders ({filteredLiveOrders.length})
                  </h3>
                </div>
                <span className='text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-500/30'>
                  Instant Feed
                </span>
              </div>
              {/* ============================ */}
              {/* ============================ */}
              {/* ============================ */}
              {/* ============================ */}
              {filteredLiveOrders.length > LIVE_ORDERS_PER_PAGE && (
                <div
                  dir='ltr'
                  className='flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-xl bg-[#0b1324]/95 border border-cyan-500/30 shadow-md backdrop-blur-xl'
                >
                  <div className='flex items-center gap-1 pr-1.5 border-r border-slate-800 shrink-0'>
                    <span className='w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping' />
                    <span className='text-[9px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap'>
                      Showing{' '}
                      <span className='font-black text-cyan-300'>
                        {liveOrderStartIndex + 1}–{liveOrderEndIndex}
                      </span>{' '}
                      of{' '}
                      <span className='font-black text-white'>
                        {filteredLiveOrders.length}
                      </span>
                    </span>
                  </div>

                  <div
                    key={`live-order-page-bar-${liveOrderPageAnimKey}`}
                    className='flex items-center gap-1 overflow-x-auto max-w-[140px] sm:max-w-none py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                  >
                    {Array.from({ length: totalLiveOrderPages }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === safeLiveOrderPage;

                      return (
                        <button
                          key={`live-order-page-${pageNum}`}
                          type='button'
                          onClick={() => handleLiveOrderPageChange(pageNum)}
                          aria-current={isActive ? 'page' : undefined}
                          title={`صفحة ${pageNum}`}
                          className={`min-w-[20px] h-[20px] sm:min-w-[26px] sm:h-[26px] px-1 sm:px-1.5 rounded-lg text-[9px] sm:text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white shadow-sm shadow-rose-500/30 scale-105 border border-cyan-300/40'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-500/40 active:scale-95'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* ============================ */}
              {/* ============================ */}
              {/* ============================ */}
              {/* ============================ */}
              {/* Comprehensive Search Bar */}
              <div className='relative'>
                <Search
                  size={14}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                />
                <input
                  type='text'
                  value={liveSearch}
                  onChange={(e) => setLiveSearch(e.target.value)}
                  placeholder='Search customer, phone, branch, address, note, order #, or product...'
                  className='w-full bg-[#111827]/90 border border-slate-700/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-400 outline-none transition-all duration-200'
                />
                {liveSearch && (
                  <button
                    type='button'
                    onClick={() => setLiveSearch('')}
                    className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer'
                    title='Clear search'
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Boxes */}
              <div className='grid grid-cols-2 sm:grid-cols-5 gap-2'>
                {filterBoxes.map((box) => {
                  const IconComponent = box.icon;
                  const isActive = liveStatusFilter === box.key;
                  return (
                    <button
                      key={box.key}
                      type='button'
                      onClick={() =>
                        setLiveStatusFilter(
                          isActive && box.key !== 'all' ? 'all' : box.key,
                        )
                      }
                      className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                        isActive ? box.activeClass : box.idleClass
                      }`}
                    >
                      <span className='flex items-center gap-1.5 truncate'>
                        <IconComponent size={13} className='shrink-0' />
                        <span className='truncate'>{box.label}</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${box.badgeClass}`}
                      >
                        {box.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Orders List */}
              <div className='max-h-72 overflow-y-auto pr-1 space-y-2 scroll-smooth'>
                {filteredLiveOrders.length === 0 ? (
                  <div className='bg-[#111827]/70 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400'>
                    {liveSearch.trim()
                      ? `No orders match "${liveSearch.trim()}" in "${liveStatusFilter}" status.`
                      : `No orders in "${liveStatusFilter}" status right now.`}
                  </div>
                ) : (
                  paginatedLiveOrders.map((order: any, idx: number) => {
                    const displayOrderIndex = liveOrderStartIndex + idx;
                    const orderKey = String(
                      order?.id ?? `live_${displayOrderIndex}`,
                    );

                    const isVipOrder =
                      orders.filter(
                        (o: any) =>
                          (o.customer_phone || o.phone) ===
                          (order.customer_phone || order.phone),
                      ).length >= 3;

                    const isMetaOpen = Boolean(liveCollapsedMetaIds[orderKey]);
                    const itemsList = parseLiveOrderItems(order?.items);
                    const { dateStr, timeStr } = formatFullDateTime(
                      order?.created_at,
                    );
                    const branchText =
                      typeof order?.branch_name === 'string'
                        ? order.branch_name.trim()
                        : '';
                    const noteText =
                      typeof order?.customer_notes === 'string' &&
                      order.customer_notes.trim()
                        ? order.customer_notes.trim()
                        : typeof order?.notes === 'string' && order.notes.trim()
                          ? order.notes.trim()
                          : '';

                    const orderUnitsSum = itemsList.reduce((sum, it: any) => {
                      const info = enrichLiveItem(it);
                      return sum + info.quantity;
                    }, 0);

                    return (
                      <div
                        key={order.id || idx}
                        className='bg-[#111827]/95 hover:border-blue-500/40 p-3 rounded-xl border border-slate-700/80 space-y-2 text-xs transition-all duration-200'
                      >
                        <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3'>
                          <div className='flex items-start gap-2.5 min-w-0 flex-1'>
                            <span className='bg-slate-800 text-slate-300 px-2 py-1 rounded font-bold text-[10px] border border-slate-700 shrink-0'>
                              #{idx + 1}
                            </span>

                            <div className='min-w-0 flex-1 space-y-1.5'>
                              <div className='flex items-center gap-1.5 flex-wrap'>
                                {order?.order_number && (
                                  <span className='text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'>
                                    #{order.order_number}
                                  </span>
                                )}
                                <span className='font-bold text-white text-xs'>
                                  {order.customer_name || 'Not Specified'}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    isVipOrder
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                                  }`}
                                >
                                  {isVipOrder ? 'VIP' : 'Normal'}
                                </span>
                                <span
                                  className='text-[10px] text-slate-400 font-mono'
                                  dir='ltr'
                                >
                                  {order.customer_phone || order.phone}
                                </span>

                                {branchText && (
                                  <span className='inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'>
                                    <span>🏢</span>
                                    <span>{branchText}</span>
                                  </span>
                                )}

                                <button
                                  type='button'
                                  onClick={() =>
                                    setLiveCollapsedMetaIds((prev) => ({
                                      ...prev,
                                      [orderKey]: !isMetaOpen,
                                    }))
                                  }
                                  className='ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700 transition cursor-pointer'
                                  title='Toggle address & notes'
                                >
                                  {isMetaOpen ? (
                                    <>
                                      <ChevronUp size={11} />
                                      <span>Hide Info</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown size={11} />
                                      <span>Show Info</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className='flex items-center gap-2 flex-wrap text-[10px] text-slate-400 font-mono'>
                                <span>📅 {dateStr}</span>
                                {timeStr && (
                                  <span className='text-sky-300 font-bold'>
                                    🕒 {timeStr}
                                  </span>
                                )}
                                <span className='text-slate-500 font-sans'>
                                  • {orderUnitsSum} pcs
                                </span>
                              </div>

                              {isMetaOpen && (
                                <div className='space-y-1.5 pt-0.5 transition-all duration-200'>
                                  <p className='text-[11px] text-slate-400 flex items-start gap-1 break-words'>
                                    <MapPin
                                      size={12}
                                      className='text-red-400 shrink-0 mt-0.5'
                                    />
                                    <span>
                                      {/* {order.city ? `${order.city}, ` : ''} */}
                                      {order.customer_address || 'No address'}
                                    </span>
                                  </p>

                                  {noteText && (
                                    <div className='inline-flex items-start gap-1.5 text-[11px] text-amber-200 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg max-w-full'>
                                      <span className='font-bold text-amber-400 shrink-0'>
                                        📝 Note:
                                      </span>
                                      <span className='break-words'>
                                        {noteText}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className='flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-800 shrink-0'>
                            <div className='text-right'>
                              <span className='font-bold text-emerald-400 block text-xs font-mono'>
                                {Number(
                                  order.total_amount || 0,
                                ).toLocaleString()}{' '}
                                EGP
                              </span>
                              <span className='text-[9px] text-slate-400 block'>
                                {itemsList.length} types · {orderUnitsSum} pcs
                              </span>
                            </div>

                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(order.id, e.target.value)
                              }
                              className={`text-[10px] font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                                order.status === 'pending'
                                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                  : order.status === 'shipping'
                                    ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                                    : order.status === 'delivered'
                                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                                      : 'bg-red-950/40 text-red-300 border-red-500/40'
                              }`}
                            >
                              <option
                                value='pending'
                                className='bg-[#1f2937] text-amber-300'
                              >
                                Pending
                              </option>
                              <option
                                value='shipping'
                                className='bg-[#1f2937] text-blue-300'
                              >
                                Shipping
                              </option>
                              <option
                                value='delivered'
                                className='bg-[#1f2937] text-emerald-300'
                              >
                                Delivered
                              </option>
                              <option
                                value='cancelled'
                                className='bg-[#1f2937] text-red-300'
                              >
                                Cancelled
                              </option>
                            </select>

                            <button
                              type='button'
                              onClick={() =>
                                setLiveOrderModal({
                                  isOpen: true,
                                  order,
                                  items: itemsList,
                                })
                              }
                              className='bg-indigo-600/25 hover:bg-indigo-600/45 text-indigo-200 px-2.5 py-1 rounded-lg text-[10px] font-bold transition border border-indigo-400/40 flex items-center gap-1 cursor-pointer'
                            >
                              <Eye size={12} />
                              <span>Products ({itemsList.length})</span>
                            </button>

                            <a
                              href={getWhatsAppLink(order)}
                              target='_blank'
                              rel='noopener noreferrer'
                              title='واتساب'
                              className='bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/30 transition flex items-center justify-center'
                            >
                              <MessageCircle size={15} />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* {filteredLiveOrders.length > LIVE_ORDERS_PER_PAGE && (
                <div
                  dir='ltr'
                  className='flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-[#0b1324]/95 border border-cyan-500/30 shadow-lg backdrop-blur-xl'
                >
                  <div className='flex items-center gap-1.5 pr-2 border-r border-slate-800 shrink-0'>
                    <span className='w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping' />
                    <span className='text-[10px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap'>
                      Showing{' '}
                      <span className='font-black text-cyan-300'>
                        {liveOrderStartIndex + 1}–{liveOrderEndIndex}
                      </span>{' '}
                      of{' '}
                      <span className='font-black text-white'>
                        {filteredLiveOrders.length}
                      </span>
                    </span>
                  </div>

                  <div
                    key={`live-order-page-bar-${liveOrderPageAnimKey}`}
                    className='flex items-center gap-1 overflow-x-auto max-w-[160px] sm:max-w-none py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                  >
                    {Array.from({ length: totalLiveOrderPages }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === safeLiveOrderPage;

                      return (
                        <button
                          key={`live-order-page-${pageNum}`}
                          type='button'
                          onClick={() => handleLiveOrderPageChange(pageNum)}
                          aria-current={isActive ? 'page' : undefined}
                          title={`صفحة ${pageNum}`}
                          className={`min-w-[24px] h-[24px] sm:min-w-[28px] sm:h-[28px] px-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white shadow-md shadow-rose-500/30 scale-105 border border-cyan-300/40'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-500/40 active:scale-95'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )} */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {liveOrderModal.isOpen && (
                <div
                  className='fixed inset-0 z-50 pt-20 pb-4 px-3 sm:px-4 bg-black/75 backdrop-blur-sm flex items-center justify-center overflow-y-auto animate-fadeIn'
                  onClick={() =>
                    setLiveOrderModal({ isOpen: false, order: null, items: [] })
                  }
                >
                  <div
                    className='w-full max-w-lg my-auto rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-200'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='px-4 py-3 bg-gradient-to-r from-indigo-950/80 via-[#111827] to-blue-950/70 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0'>
                      <div>
                        <h4 className='text-sm font-black text-white'>
                          Order #{liveOrderModal.order?.order_number || '—'}{' '}
                          Products
                        </h4>
                        <p className='text-[11px] text-slate-400'>
                          {liveOrderModal.order?.customer_name || 'Customer'}
                          {liveOrderModal.order?.branch_name
                            ? ` • Branch: ${liveOrderModal.order.branch_name}`
                            : ''}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() =>
                          setLiveOrderModal({
                            isOpen: false,
                            order: null,
                            items: [],
                          })
                        }
                        className='px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-bold transition cursor-pointer'
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className='px-4 py-3 bg-[#0b1120] border-b border-slate-800 grid grid-cols-2 gap-2.5 shrink-0'>
                      <div className='p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between'>
                        <div>
                          <span className='block text-[10px] font-bold text-blue-300 uppercase'>
                            Total Products
                          </span>
                          <span className='text-sm sm:text-base font-black text-white font-mono'>
                            {modalSummary.totalQty} pcs{' '}
                            <span className='text-[11px] font-sans text-slate-400'>
                              ({liveOrderModal.items.length} items)
                            </span>
                          </span>
                        </div>
                        <span className='text-base'>📦</span>
                      </div>

                      <div className='p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between'>
                        <div>
                          <span className='block text-[10px] font-bold text-emerald-300 uppercase'>
                            Total Price
                          </span>
                          <span className='text-sm sm:text-base font-black text-emerald-300 font-mono'>
                            {modalSummary.totalAmount.toLocaleString()} EGP
                          </span>
                        </div>
                        <span className='text-base'>💰</span>
                      </div>
                    </div>

                    <div className='p-3.5 sm:p-4 space-y-2.5 max-h-[245px] sm:max-h-[265px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-900/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600'>
                      {liveOrderModal.items.length === 0 ? (
                        <p className='text-center text-xs text-slate-400 py-6'>
                          No items found in this order.
                        </p>
                      ) : (
                        liveOrderModal.items.map((rawIt: any, iIdx: number) => {
                          const info = enrichLiveItem(rawIt);
                          return (
                            <div
                              key={iIdx}
                              className='p-3 rounded-xl bg-[#111827] border border-slate-800 hover:border-indigo-500/40 transition-all duration-200 flex gap-3 items-start'
                            >
                              {info.imageUrl ? (
                                <Image
                                  src={info.imageUrl}
                                  alt={info.name || 'Item'}
                                  width={128}
                                  height={128}
                                  loading='lazy'
                                  sizes='64px'
                                  unoptimized={
                                    info.imageUrl.startsWith('blob:') ||
                                    info.imageUrl.startsWith('data:')
                                  }
                                  className='w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-900 shrink-0'
                                />
                              ) : null}

                              <div className='min-w-0 flex-1 space-y-1'>
                                <div className='flex items-start justify-between gap-2'>
                                  <div>
                                    <h5 className='text-xs sm:text-sm font-black text-white'>
                                      {info.name}
                                    </h5>
                                    <span className='inline-block mt-0.5 px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] font-bold'>
                                      {info.category}
                                    </span>
                                  </div>
                                  <span className='px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-black shrink-0'>
                                    x{info.quantity}
                                  </span>
                                </div>

                                <p className='text-[11px] text-slate-400 leading-relaxed'>
                                  {info.description}
                                </p>

                                <div className='flex items-center justify-between gap-2 pt-1 text-xs font-mono'>
                                  <div className='flex items-center gap-2'>
                                    <span className='font-black text-emerald-400'>
                                      {info.currentPrice.toLocaleString()} EGP
                                    </span>
                                    {info.beforePrice &&
                                      info.beforePrice > info.currentPrice && (
                                        <span className='line-through text-rose-400/85 text-[11px]'>
                                          {info.beforePrice.toLocaleString()}{' '}
                                          EGP
                                        </span>
                                      )}
                                    {info.discountPercent > 0 && (
                                      <span className='px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-sans font-bold'>
                                        -{info.discountPercent}%
                                      </span>
                                    )}
                                  </div>

                                  <span className='text-amber-300 font-black'>
                                    Subtotal: {info.lineTotal.toLocaleString()}{' '}
                                    EGP
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {/* ========================================================= */}
        {/* ========================================================= */}

        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
          <div
            onClick={() => setTimeFilter('all')}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all text-center ${
              timeFilter === 'all'
                ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                : 'bg-[#1f2937]/70 border-slate-700/60 text-slate-400 hover:border-slate-600'
            }`}
          >
            <p className='text-[10px] uppercase font-semibold text-indigo-300'>
              All Time
            </p>
            <p className='text-sm font-black mt-0.5'>{orders.length} Orders</p>
          </div>

          <div
            onClick={() => setTimeFilter('today')}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all text-center ${
              timeFilter === 'today'
                ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                : 'bg-[#1f2937]/70 border-slate-700/60 text-slate-400 hover:border-slate-600'
            }`}
          >
            <p className='text-[10px] uppercase font-semibold text-indigo-300'>
              Today
            </p>
            <p className='text-sm font-black mt-0.5'>
              {currentTime
                ? orders.filter(
                    (o) =>
                      o.created_at &&
                      new Date(o.created_at).toDateString() ===
                        currentTime.toDateString(),
                  ).length
                : 0}{' '}
              Orders
            </p>
          </div>

          <div
            onClick={() => setTimeFilter('week')}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all text-center ${
              timeFilter === 'week'
                ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                : 'bg-[#1f2937]/70 border-slate-700/60 text-slate-400 hover:border-slate-600'
            }`}
          >
            <p className='text-[10px] uppercase font-semibold text-indigo-300'>
              This Week
            </p>
            <p className='text-sm font-black mt-0.5'>
              {currentTime
                ? orders.filter((o) => {
                    if (!o.created_at) return false;
                    const startOfWeek = new Date(currentTime);
                    startOfWeek.setDate(currentTime.getDate() - 7);
                    return new Date(o.created_at) >= startOfWeek;
                  }).length
                : 0}{' '}
              Orders
            </p>
          </div>

          <div
            onClick={() => setTimeFilter('month')}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all text-center ${
              timeFilter === 'month'
                ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                : 'bg-[#1f2937]/70 border-slate-700/60 text-slate-400 hover:border-slate-600'
            }`}
          >
            <p className='text-[10px] uppercase font-semibold text-indigo-300'>
              This Month
            </p>
            <p className='text-sm font-black mt-0.5'>
              {currentTime
                ? orders.filter((o) => {
                    if (!o.created_at) return false;
                    const d = new Date(o.created_at);
                    return (
                      d.getMonth() === currentTime.getMonth() &&
                      d.getFullYear() === currentTime.getFullYear()
                    );
                  }).length
                : 0}{' '}
              Orders
            </p>
          </div>
        </div>
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* بوكسات الفلتر الأصلية */}
        {/* ========================================================= */}
        <div className='grid grid-cols-2 sm:grid-cols-5 gap-2.5'>
          <div
            onClick={() => setSelectedStatusFilter('all')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
              selectedStatusFilter === 'all'
                ? 'bg-blue-600/20 border-blue-500'
                : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-slate-400 uppercase'>
                All
              </p>
              <h4 className='text-base sm:text-lg font-black text-white mt-0.5'>
                {totalCount}
              </h4>
            </div>
            <LayoutGrid size={16} className='text-blue-400' />
          </div>

          <div
            onClick={() => setSelectedStatusFilter('pending')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
              selectedStatusFilter === 'pending'
                ? 'bg-amber-600/20 border-amber-500'
                : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-amber-400 uppercase'>
                Pending
              </p>
              <h4 className='text-base sm:text-lg font-black text-amber-300 mt-0.5'>
                {pendingCount}
              </h4>
            </div>
            <Clock3 size={16} className='text-amber-400' />
          </div>

          <div
            onClick={() => setSelectedStatusFilter('shipping')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
              selectedStatusFilter === 'shipping'
                ? 'bg-blue-600/20 border-blue-500'
                : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-blue-400 uppercase'>
                Shipped
              </p>
              <h4 className='text-base sm:text-lg font-black text-blue-300 mt-0.5'>
                {shippingCount}
              </h4>
            </div>
            <Truck size={16} className='text-blue-400' />
          </div>

          <div
            onClick={() => setSelectedStatusFilter('delivered')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
              selectedStatusFilter === 'delivered'
                ? 'bg-emerald-600/20 border-emerald-500'
                : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-emerald-400 uppercase'>
                Delivered
              </p>
              <h4 className='text-base sm:text-lg font-black text-emerald-300 mt-0.5'>
                {deliveredCount}
              </h4>
            </div>
            <CheckCircle2 size={16} className='text-emerald-400' />
          </div>

          <div
            onClick={() => setSelectedStatusFilter('cancelled')}
            className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between col-span-2 sm:col-span-1 ${
              selectedStatusFilter === 'cancelled'
                ? 'bg-red-600/20 border-red-500'
                : 'bg-[#1f2937]/70 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div>
              <p className='text-[10px] font-bold text-red-400 uppercase'>
                Cancelled
              </p>
              <h4 className='text-base sm:text-lg font-black text-red-300 mt-0.5'>
                {cancelledCount}
              </h4>
            </div>
            <XCircle size={16} className='text-red-400' />
          </div>
        </div>

        {/* ========================================================= */}
        {/* بوكسات الفلتر الزمنية المتوسطة الجديدة (All Time, Today, This Week, This Month) */}
        {/* ========================================================= */}
        {/* بوكسات الفلتر الزمنية المتوسطة الجديدة */}

        {/* ======================= */}
        {/* ======================= */}
        {/* ======================= */}
        {/* ======================= */}
        {/* ======================= */}
        {/* ======================= */}
        {/* ======================= */}
        {/* ======================= */}
        {/* ======================= */}
        {/* Global Search Bar */}
        <div className='bg-[#1f2937]/85 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm'>
          <div className='flex items-center gap-2 text-xs font-semibold text-slate-300 w-full sm:w-auto'>
            <span className='w-2 h-2 rounded-full bg-emerald-400'></span>
            Total Filtered Records: {statusFilteredOrders.length}
          </div>

          <div className='relative w-full sm:w-80'>
            <Search
              size={15}
              className='absolute left-3 top-2.5 text-slate-400 pointer-events-none'
            />
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
          <div className='space-y-6'>
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* 1. VIP CUSTOMERS PROFILES (Horizontal Slider + Index Badges + Nav Buttons) */}
            {/* ========================================================= */}
            {/* 1. VIP CUSTOMERS PROFILES (Horizontal Slider + Index Badges + Nav Buttons) */}
            {/* ========================================================= */}
            {processedData.vipProfiles.length > 0 && (
              <div className='space-y-3 bg-[#1f2937]/40 p-3.5 sm:p-4 rounded-2xl border border-slate-700/70'>
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}

                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                <div className='flex items-center justify-between gap-2 flex-wrap'>
                  <div className='flex items-center gap-1.5 px-1'>
                    <Crown className='w-4 h-4 text-amber-400 shrink-0' />
                    <h3 className='text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide'>
                      VIP Customers (3+ Orders) — (
                      {processedData.vipProfiles.length})
                    </h3>
                  </div>

                  {/* أزرار التحكم السريع في الاسلايدر */}
                  <div className='flex items-center gap-1.5'>
                    <button
                      type='button'
                      onClick={() => scrollSlider(vipSliderRef, 'start')}
                      title='First'
                      className='p-1.5 bg-[#111827] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer'
                    >
                      <ChevronsLeft size={14} />
                    </button>
                    <button
                      type='button'
                      onClick={() => scrollSlider(vipSliderRef, 'left')}
                      title='Prev'
                      className='p-1.5 bg-[#111827] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer'
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type='button'
                      onClick={() => scrollSlider(vipSliderRef, 'right')}
                      title='Next'
                      className='p-1.5 bg-[#111827] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer'
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type='button'
                      onClick={() => scrollSlider(vipSliderRef, 'end')}
                      title='Last'
                      className='p-1.5 bg-[#111827] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer'
                    >
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                </div>
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                {processedData.vipProfiles.length > VIP_PER_PAGE && (
                  <div
                    dir='ltr'
                    className='flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-xl bg-[#0b1324]/95 border border-amber-500/30 shadow-md backdrop-blur-xl'
                  >
                    <div className='flex items-center gap-1 pr-1.5 border-r border-slate-800 shrink-0'>
                      <span className='w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping' />
                      <span className='text-[9px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap'>
                        Showing{' '}
                        <span className='font-black text-amber-300'>
                          {vipStartIndex + 1}–{vipEndIndex}
                        </span>{' '}
                        of{' '}
                        <span className='font-black text-white'>
                          {processedData.vipProfiles.length}
                        </span>
                      </span>
                    </div>

                    <div
                      key={`vip-page-bar-${vipPageAnimKey}`}
                      className='flex items-center gap-1 overflow-x-auto max-w-[115px] sm:max-w-none py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                    >
                      {Array.from({ length: totalVipPages }, (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === safeVipPage;

                        return (
                          <button
                            key={`vip-page-${pageNum}`}
                            type='button'
                            onClick={() => handleVipPageChange(pageNum)}
                            aria-current={isActive ? 'page' : undefined}
                            title={`صفحة ${pageNum}`}
                            className={`min-w-[20px] h-[20px] sm:min-w-[26px] sm:h-[26px] px-1 sm:px-1.5 rounded-lg text-[9px] sm:text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white shadow-sm shadow-rose-500/30 scale-105 border border-cyan-300/40'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-200 border border-slate-700/80 hover:border-amber-500/40 active:scale-95'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                {/* ========================= */}
                {/* الاسلايدر الأفقي */}
                <div
                  ref={vipSliderRef}
                  className='flex overflow-x-auto gap-3.5 pb-3 pt-1 snap-x scroll-smooth'
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {paginatedVipProfiles.map((profile: any, pIdx: number) => {
                    const displayVipIndex = vipStartIndex + pIdx;
                    // ======================
                    // ======================
                    // ======================
                    // ======================

                    // ======================
                    // ======================
                    // ======================
                    const isExpanded = expandedProfileKey === profile.key;
                    const profileKey = profile.key;
                    const pSearch = (profileSearchQueries[profileKey] || '')
                      .toLowerCase()
                      .trim();
                    const pStatus = profileStatusFilters[profileKey] || 'all';

                    const pTotal = profile.orders.length;
                    const pPending = profile.orders.filter(
                      (o: any) => o.status === 'pending',
                    ).length;
                    const pShipping = profile.orders.filter(
                      (o: any) => o.status === 'shipping',
                    ).length;
                    const pDelivered = profile.orders.filter(
                      (o: any) => o.status === 'delivered',
                    ).length;
                    const pCancelled = profile.orders.filter(
                      (o: any) => o.status === 'cancelled',
                    ).length;

                    const parseOrderItems = (order: any) => {
                      try {
                        return typeof order.items === 'string'
                          ? JSON.parse(order.items)
                          : order.items || [];
                      } catch {
                        return [];
                      }
                    };

                    const profileOrdersFiltered = profile.orders.filter(
                      (order: any) => {
                        if (pStatus !== 'all' && order.status !== pStatus)
                          return false;

                        if (!pSearch) {
                          return matchesSearch(
                            order,
                            '',
                            profile.customerName,
                            profile.customerPhone,
                          );
                        }

                        const itemsArr = parseOrderItems(order);
                        const matchesProductName = itemsArr.some((item: any) =>
                          String(item?.name || '')
                            .toLowerCase()
                            .includes(pSearch),
                        );

                        const orderTotalStr = String(
                          order.total_amount ?? '',
                        ).toLowerCase();
                        const matchesItemPrice = itemsArr.some((item: any) => {
                          const unitPrice = String(item?.price ?? '');
                          const lineTotal = String(
                            Number(item?.price || 0) *
                              Number(item?.quantity || 1),
                          );
                          return (
                            unitPrice.includes(pSearch) ||
                            lineTotal.includes(pSearch)
                          );
                        });
                        const matchesPrice =
                          orderTotalStr.includes(pSearch) || matchesItemPrice;

                        const matchesNote = String(order.customer_notes || '')
                          .toLowerCase()
                          .includes(pSearch);

                        return (
                          matchesSearch(
                            order,
                            pSearch,
                            profile.customerName,
                            profile.customerPhone,
                          ) ||
                          matchesProductName ||
                          matchesPrice ||
                          matchesNote
                        );
                      },
                    );

                    return (
                      <div
                        key={profileKey}
                        className={`min-w-[275px] sm:min-w-[320px] max-w-[350px] flex-shrink-0 snap-start bg-[#1f2937]/95 rounded-xl border transition-all ${
                          isExpanded
                            ? 'border-amber-500 ring-1 ring-amber-500/40'
                            : 'border-slate-700/80 hover:border-slate-600'
                        } p-3.5 space-y-3 relative`}
                      >
                        {/* بادج رقم الترتيب في الاسلايدر */}
                        <span className='absolute top-2.5 left-2.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded'>
                          #{pIdx + 1}
                        </span>

                        <div className='flex items-center justify-between gap-2.5 pt-2'>
                          <div className='flex items-center gap-2.5 min-w-0'>
                            <div className='w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0'>
                              {profile.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className='min-w-0'>
                              <div className='flex items-center gap-1.5 flex-wrap'>
                                <h4 className='text-xs font-bold text-white truncate max-w-[120px]'>
                                  {profile.customerName}
                                </h4>
                                <span className='bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0'>
                                  <Crown size={9} /> VIP
                                </span>
                              </div>
                              <p
                                className='text-[10px] text-slate-400 truncate'
                                dir='ltr'
                              >
                                {profile.customerPhone}
                              </p>
                            </div>
                          </div>

                          <button
                            type='button'
                            onClick={() =>
                              setExpandedProfileKey(
                                isExpanded ? null : profileKey,
                              )
                            }
                            className='flex items-center gap-1 bg-[#374151] hover:bg-[#4b5563] text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border border-slate-600 shrink-0 cursor-pointer'
                          >
                            <Eye size={12} />
                            <span>{isExpanded ? 'Hide' : 'Open'}</span>
                          </button>
                        </div>

                        <div className='flex justify-between items-center text-[10px] bg-[#111827] px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300'>
                          <span>
                            Orders:{' '}
                            <strong className='text-amber-300'>{pTotal}</strong>
                          </span>
                          <span>
                            Total:{' '}
                            <strong className='text-emerald-400'>
                              {profile.totalSpent} EGP
                            </strong>
                          </span>
                        </div>

                        {/* المحتوى التفصيلي عند الضغط على فتح */}
                        {isExpanded && (
                          <div className='pt-2.5 border-t border-slate-700/80 space-y-2.5 animate-fadeIn'>
                            <div className='grid grid-cols-5 gap-1 text-center'>
                              <div
                                onClick={() =>
                                  setProfileStatusFilters({
                                    ...profileStatusFilters,
                                    [profileKey]: 'all',
                                  })
                                }
                                className={`cursor-pointer p-1 rounded border text-[9px] transition ${pStatus === 'all' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                All ({pTotal})
                              </div>
                              <div
                                onClick={() =>
                                  setProfileStatusFilters({
                                    ...profileStatusFilters,
                                    [profileKey]: 'pending',
                                  })
                                }
                                className={`cursor-pointer p-1 rounded border text-[9px] transition ${pStatus === 'pending' ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                Pend ({pPending})
                              </div>
                              <div
                                onClick={() =>
                                  setProfileStatusFilters({
                                    ...profileStatusFilters,
                                    [profileKey]: 'shipping',
                                  })
                                }
                                className={`cursor-pointer p-1 rounded border text-[9px] transition ${pStatus === 'shipping' ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                Ship ({pShipping})
                              </div>
                              <div
                                onClick={() =>
                                  setProfileStatusFilters({
                                    ...profileStatusFilters,
                                    [profileKey]: 'delivered',
                                  })
                                }
                                className={`cursor-pointer p-1 rounded border text-[9px] transition ${pStatus === 'delivered' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                Deliv ({pDelivered})
                              </div>
                              <div
                                onClick={() =>
                                  setProfileStatusFilters({
                                    ...profileStatusFilters,
                                    [profileKey]: 'cancelled',
                                  })
                                }
                                className={`cursor-pointer p-1 rounded border text-[9px] transition ${pStatus === 'cancelled' ? 'bg-red-600/30 border-red-500 text-red-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                              >
                                Canc ({pCancelled})
                              </div>
                            </div>

                            <div className='relative'>
                              <Search
                                size={13}
                                className='absolute left-2.5 top-2 text-slate-400 pointer-events-none'
                              />
                              <input
                                type='text'
                                placeholder='Search product, price, note...'
                                value={profileSearchQueries[profileKey] || ''}
                                onChange={(e) =>
                                  setProfileSearchQueries({
                                    ...profileSearchQueries,
                                    [profileKey]: e.target.value,
                                  })
                                }
                                className='w-full pl-8 pr-2.5 py-1 bg-[#111827] border border-slate-700 rounded-lg text-[11px] text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500'
                                dir='ltr'
                              />
                            </div>

                            <div className='max-h-64 overflow-y-auto pr-1 space-y-2'>
                              {profileOrdersFiltered.length === 0 ? (
                                <p className='text-[10px] text-slate-500 text-center py-3'>
                                  No matching orders.
                                </p>
                              ) : (
                                profileOrdersFiltered.map((order: any) => {
                                  const itemsList = parseOrderItems(order);
                                  const hasNote = Boolean(
                                    order.customer_notes?.trim(),
                                  );
                                  const isItemsOpen =
                                    vipOrderDetailsKey === order.id;
                                  const isNoteOpen =
                                    vipOrderNoteKey === order.id;

                                  return (
                                    <div
                                      key={order.id}
                                      className='bg-[#111827] p-2.5 rounded-lg border border-slate-800 space-y-2 text-[11px]'
                                    >
                                      <div className='flex items-center justify-between gap-1 border-b border-slate-800 pb-2 flex-wrap'>
                                        <span
                                          dir='ltr'
                                          className='font-bold text-[9px] text-slate-300 bg-[#1f2937] px-1.5 py-0.5 rounded border border-slate-700'
                                        >
                                          #
                                          {order.order_number ??
                                            String(order.id ?? '')
                                              .slice(0, 5)
                                              .toUpperCase()}
                                        </span>
                                        <select
                                          value={order.status}
                                          onChange={(e) =>
                                            handleStatusChange(
                                              order.id,
                                              e.target.value,
                                            )
                                          }
                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border outline-none cursor-pointer ${
                                            order.status === 'pending'
                                              ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                              : order.status === 'shipping'
                                                ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                                                : order.status === 'delivered'
                                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                                                  : 'bg-red-950/40 text-red-300 border-red-500/40'
                                          }`}
                                        >
                                          <option
                                            value='pending'
                                            className='bg-[#1f2937] text-amber-300'
                                          >
                                            Pending
                                          </option>
                                          <option
                                            value='shipping'
                                            className='bg-[#1f2937] text-blue-300'
                                          >
                                            Shipping
                                          </option>
                                          <option
                                            value='delivered'
                                            className='bg-[#1f2937] text-emerald-300'
                                          >
                                            Delivered
                                          </option>
                                          <option
                                            value='cancelled'
                                            className='bg-[#1f2937] text-red-300'
                                          >
                                            Cancelled
                                          </option>
                                        </select>
                                        <span className='font-bold text-amber-300'>
                                          {order.total_amount} EGP
                                        </span>
                                        <a
                                          href={getWhatsAppLink(order)}
                                          target='_blank'
                                          rel='noopener noreferrer'
                                          className='bg-emerald-600/20 text-emerald-400 p-1 rounded border border-emerald-500/30'
                                        >
                                          <MessageCircle size={13} />
                                        </a>
                                      </div>

                                      <div className='text-[10px] text-slate-300 truncate'>
                                        {/* 📍 {order.city ? `${order.city}, ` : ''} */}
                                        {order.customer_address || 'No address'}
                                      </div>

                                      {/* أزرار مدمجة لفتح/قفل المنتجات والملاحظات بشكل مستقل */}
                                      <div className='flex items-center gap-1.5 flex-wrap pt-0.5'>
                                        <button
                                          type='button'
                                          onClick={() =>
                                            setVipOrderDetailsKey(
                                              isItemsOpen ? null : order.id,
                                            )
                                          }
                                          className='inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 transition cursor-pointer'
                                        >
                                          <Eye size={11} />
                                          <span>
                                            {isItemsOpen
                                              ? 'Hide Products'
                                              : `Products (${itemsList.length})`}
                                          </span>
                                        </button>

                                        {hasNote && (
                                          <button
                                            type='button'
                                            onClick={() =>
                                              setVipOrderNoteKey(
                                                isNoteOpen ? null : order.id,
                                              )
                                            }
                                            className='inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition cursor-pointer'
                                          >
                                            <span>📝</span>
                                            <span>
                                              {isNoteOpen
                                                ? 'Hide Note'
                                                : 'Note'}
                                            </span>
                                          </button>
                                        )}
                                      </div>

                                      {/* عرض اسم كل منتج وسعره بوضوح عند الضغط */}
                                      {isItemsOpen && (
                                        <div className='bg-[#1f2937]/90 border border-blue-500/30 rounded-lg p-2 space-y-1.5 animate-fadeIn'>
                                          {itemsList.length === 0 ? (
                                            <p className='text-[10px] text-slate-400'>
                                              No items found.
                                            </p>
                                          ) : (
                                            itemsList.map(
                                              (item: any, idx: number) => {
                                                const unitPrice = Number(
                                                  item.price || 0,
                                                );
                                                const qty = Number(
                                                  item.quantity || 1,
                                                );
                                                return (
                                                  // ================================
                                                  // ================================
                                                  // ================================
                                                  // ================================
                                                  // ================================
                                                  <div
                                                    key={idx}
                                                    className='border-b border-slate-800 last:border-b-0 pb-1.5 last:pb-0'
                                                  >
                                                    <div className='flex items-start gap-2'>
                                                      {item.image && (
                                                        <Image
                                                          src={item.image}
                                                          alt={
                                                            item.name || 'item'
                                                          }
                                                          width={26}
                                                          height={26}
                                                          loading='lazy'
                                                          sizes='26px'
                                                          className='w-[26px] h-[26px] rounded object-cover border border-slate-700 shrink-0 mt-0.5'
                                                        />
                                                      )}

                                                      <div className='min-w-0 flex-1 space-y-0.5'>
                                                        <p className='text-[10.5px] font-semibold text-white leading-snug break-words'>
                                                          {idx + 1}.{' '}
                                                          {item.name ||
                                                            'Unnamed Product'}
                                                        </p>
                                                        <div className='flex items-center justify-between gap-2 text-[9.5px] text-slate-400'>
                                                          <span>
                                                            Qty:{' '}
                                                            <strong className='text-slate-200'>
                                                              {qty}
                                                            </strong>{' '}
                                                            × {unitPrice} EGP
                                                          </span>
                                                          <span className='text-emerald-400 font-bold shrink-0'>
                                                            {unitPrice * qty}{' '}
                                                            EGP
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  // =====================================
                                                  // =====================================
                                                  // =====================================
                                                  // =====================================
                                                  // =====================================
                                                );
                                              },
                                            )
                                          )}
                                        </div>
                                      )}

                                      {/* عرض الملاحظة عند الضغط بشكل مستقل */}
                                      {hasNote && isNoteOpen && (
                                        <div className='text-[10px] text-amber-200 bg-amber-950/40 border border-amber-500/30 px-2 py-1.5 rounded-lg break-words animate-fadeIn'>
                                          <span className='font-bold text-amber-400'>
                                            📝 Note:{' '}
                                          </span>
                                          {order.customer_notes.trim()}
                                        </div>
                                      )}
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
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* 2. REGULAR ORDERS / CUSTOMERS (Horizontal Slider + Index Badges + Nav Buttons) */}
            {/* ========================================================= */}
            {processedData.normalOrders.length > 0 &&
              (() => {
                const parseRegularItems = (order: any) => {
                  try {
                    return typeof order.items === 'string'
                      ? JSON.parse(order.items)
                      : order.items || [];
                  } catch {
                    return [];
                  }
                };

                const regularProfilesMap = new Map<string, any>();
                processedData.normalOrders.forEach(
                  (order: any, idx: number) => {
                    const rawPhone = String(
                      order.customer_phone || order.phone || '',
                    ).trim();
                    const rawName = String(
                      order.customer_name || 'Not Specified',
                    ).trim();
                    const key =
                      rawPhone ||
                      rawName.toLowerCase() ||
                      String(order.id || idx);

                    if (!regularProfilesMap.has(key)) {
                      regularProfilesMap.set(key, {
                        key: `reg_${key}`,
                        customerName: rawName || 'Not Specified',
                        customerPhone: rawPhone || 'No Phone',
                        orders: [],
                        totalSpent: 0,
                      });
                    }

                    const entry = regularProfilesMap.get(key);
                    entry.orders.push(order);
                    entry.totalSpent += Number(order.total_amount || 0);
                  },
                );

                const regularProfiles = Array.from(regularProfilesMap.values());
                // =========================
                // =========================
                // =========================
                // =========================
                // =========================
                const REGULAR_PER_PAGE = 6;
                const totalRegularPages = Math.max(
                  1,
                  Math.ceil(regularProfiles.length / REGULAR_PER_PAGE),
                );
                const safeRegularPage = Math.min(
                  regularPage,
                  totalRegularPages,
                );
                const regularStartIndex =
                  (safeRegularPage - 1) * REGULAR_PER_PAGE;
                const regularEndIndex = Math.min(
                  regularStartIndex + REGULAR_PER_PAGE,
                  regularProfiles.length,
                );
                const paginatedRegularProfiles = regularProfiles.slice(
                  regularStartIndex,
                  regularEndIndex,
                );

                const handleRegularPageChange = (nextPage: number) => {
                  const clamped = Math.max(
                    1,
                    Math.min(nextPage, totalRegularPages),
                  );
                  if (clamped === safeRegularPage) return;
                  setRegularPage(clamped);
                  setRegularPageAnimKey((k) => k + 1);
                  setExpandedProfileKey(null);
                  if (regularSliderRef.current) {
                    regularSliderRef.current.scrollTo({
                      left: 0,
                      behavior: 'smooth',
                    });
                  }
                };
                // =========================
                // =========================
                // =========================
                // =========================
                return (
                  <div className='space-y-3 bg-[#1f2937]/40 p-3.5 sm:p-4 rounded-2xl border border-slate-700/70'>
                    <div className='flex items-center justify-between gap-2 flex-wrap'>
                      <div className='flex items-center gap-1.5 px-1'>
                        <UsersIcon className='w-4 h-4 text-sky-400 shrink-0' />
                        <h3 className='text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wide'>
                          Regular Customers / Orders — (
                          {processedData.normalOrders.length})
                        </h3>
                      </div>

                      {/* أزرار التحكم السريع في اسلايدر العملاء العاديين */}
                      <div className='flex items-center gap-1.5'>
                        <button
                          type='button'
                          onClick={() =>
                            scrollSlider(regularSliderRef, 'start')
                          }
                          title='First'
                          className='p-1.5 bg-[#111827] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer'
                        >
                          <ChevronsLeft size={14} />
                        </button>
                        <button
                          type='button'
                          onClick={() => scrollSlider(regularSliderRef, 'left')}
                          title='Prev'
                          className='p-1.5 bg-[#111827] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer'
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type='button'
                          onClick={() =>
                            scrollSlider(regularSliderRef, 'right')
                          }
                          title='Next'
                          className='p-1.5 bg-[#111827] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer'
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          type='button'
                          onClick={() => scrollSlider(regularSliderRef, 'end')}
                          title='Last'
                          className='p-1.5 bg-[#111827] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer'
                        >
                          <ChevronsRight size={14} />
                        </button>
                      </div>
                    </div>

                    {/* ===================== */}
                    {/* ===================== */}
                    {/* ===================== */}
                    {/* ===================== */}
                    {/* ===================== */}
                    {/* ===================== */}
                    {/* ===================== */}
                    {regularProfiles.length > REGULAR_PER_PAGE && (
                      <div
                        dir='ltr'
                        className='flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-xl bg-[#0b1324]/95 border border-sky-500/30 shadow-md backdrop-blur-xl'
                      >
                        <div className='flex items-center gap-1 pr-1.5 border-r border-slate-800 shrink-0'>
                          <span className='w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping' />
                          <span className='text-[9px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap'>
                            Showing{' '}
                            <span className='font-black text-sky-300'>
                              {regularStartIndex + 1}–{regularEndIndex}
                            </span>{' '}
                            of{' '}
                            <span className='font-black text-white'>
                              {regularProfiles.length}
                            </span>
                          </span>
                        </div>

                        <div
                          key={`regular-page-bar-${regularPageAnimKey}`}
                          className='flex items-center gap-1 overflow-x-auto max-w-[115px] sm:max-w-none py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                        >
                          {Array.from({ length: totalRegularPages }, (_, i) => {
                            const pageNum = i + 1;
                            const isActive = pageNum === safeRegularPage;

                            return (
                              <button
                                key={`regular-page-${pageNum}`}
                                type='button'
                                onClick={() => handleRegularPageChange(pageNum)}
                                aria-current={isActive ? 'page' : undefined}
                                title={`صفحة ${pageNum}`}
                                className={`min-w-[20px] h-[20px] sm:min-w-[26px] sm:h-[26px] px-1 sm:px-1.5 rounded-lg text-[9px] sm:text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? 'bg-gradient-to-r from-red-600 via-rose-500 to-blue-600 text-white shadow-sm shadow-rose-500/30 scale-105 border border-cyan-300/40'
                                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-sky-200 border border-slate-700/80 hover:border-sky-500/40 active:scale-95'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* ===================== */}
                    {/* ===================== */}
                    {/* ===================== */}
                    {/* ===================== */}

                    {/* الاسلايدر الأفقي للعملاء العاديين */}
                    <div
                      ref={regularSliderRef}
                      className='flex overflow-x-auto gap-3.5 pb-3 pt-1 snap-x scroll-smooth'
                      style={{ scrollSnapType: 'x mandatory' }}
                    >
                      {paginatedRegularProfiles.map(
                        (profile: any, rIdx: number) => {
                          const displayRegularIndex = regularStartIndex + rIdx;

                          const isExpanded = expandedProfileKey === profile.key;
                          const profileKey = profile.key;
                          const rSearch = (
                            profileSearchQueries[profileKey] || ''
                          )
                            .toLowerCase()
                            .trim();
                          const rStatus =
                            profileStatusFilters[profileKey] || 'all';

                          const rTotal = profile.orders.length;
                          const rPending = profile.orders.filter(
                            (o: any) => o.status === 'pending',
                          ).length;
                          const rShipping = profile.orders.filter(
                            (o: any) => o.status === 'shipping',
                          ).length;
                          const rDelivered = profile.orders.filter(
                            (o: any) => o.status === 'delivered',
                          ).length;
                          const rCancelled = profile.orders.filter(
                            (o: any) => o.status === 'cancelled',
                          ).length;

                          const regularOrdersFiltered = profile.orders.filter(
                            (order: any) => {
                              if (rStatus !== 'all' && order.status !== rStatus)
                                return false;

                              if (!rSearch) {
                                return matchesSearch(
                                  order,
                                  '',
                                  profile.customerName,
                                  profile.customerPhone,
                                );
                              }

                              const itemsArr = parseRegularItems(order);
                              const matchesProductName = itemsArr.some(
                                (item: any) =>
                                  String(item?.name || '')
                                    .toLowerCase()
                                    .includes(rSearch),
                              );

                              const orderTotalStr = String(
                                order.total_amount ?? '',
                              ).toLowerCase();
                              const matchesItemPrice = itemsArr.some(
                                (item: any) => {
                                  const unitPrice = String(item?.price ?? '');
                                  const lineTotal = String(
                                    Number(item?.price || 0) *
                                      Number(item?.quantity || 1),
                                  );
                                  return (
                                    unitPrice.includes(rSearch) ||
                                    lineTotal.includes(rSearch)
                                  );
                                },
                              );
                              const matchesPrice =
                                orderTotalStr.includes(rSearch) ||
                                matchesItemPrice;

                              const matchesNote = String(
                                order.customer_notes || '',
                              )
                                .toLowerCase()
                                .includes(rSearch);

                              return (
                                matchesSearch(
                                  order,
                                  rSearch,
                                  profile.customerName,
                                  profile.customerPhone,
                                ) ||
                                matchesProductName ||
                                matchesPrice ||
                                matchesNote
                              );
                            },
                          );

                          return (
                            <div
                              key={profileKey}
                              className={`min-w-[275px] sm:min-w-[320px] max-w-[350px] flex-shrink-0 snap-start bg-[#1f2937]/95 rounded-xl border transition-all ${
                                isExpanded
                                  ? 'border-sky-500 ring-1 ring-sky-500/40'
                                  : 'border-slate-700/80 hover:border-slate-600'
                              } p-3.5 space-y-3 relative`}
                            >
                              {/* بادج رقم الترتيب في الاسلايدر */}
                              <span className='absolute top-2.5 left-2.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded'>
                                #{rIdx + 1}
                              </span>

                              <div className='flex items-center justify-between gap-2.5 pt-2'>
                                <div className='flex items-center gap-2.5 min-w-0'>
                                  <div className='w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0'>
                                    {profile.customerName
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div className='min-w-0'>
                                    <div className='flex items-center gap-1.5 flex-wrap'>
                                      <h4 className='text-xs font-bold text-white truncate max-w-[120px]'>
                                        {profile.customerName}
                                      </h4>
                                      <span className='bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0'>
                                        Normal
                                      </span>
                                    </div>
                                    <p
                                      className='text-[10px] text-slate-400 truncate'
                                      dir='ltr'
                                    >
                                      {profile.customerPhone}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type='button'
                                  onClick={() =>
                                    setExpandedProfileKey(
                                      isExpanded ? null : profileKey,
                                    )
                                  }
                                  className='flex items-center gap-1 bg-[#374151] hover:bg-[#4b5563] text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border border-slate-600 shrink-0 cursor-pointer'
                                >
                                  <Eye size={12} />
                                  <span>{isExpanded ? 'Hide' : 'Open'}</span>
                                </button>
                              </div>

                              <div className='flex justify-between items-center text-[10px] bg-[#111827] px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300'>
                                <span>
                                  Orders:{' '}
                                  <strong className='text-sky-300'>
                                    {rTotal}
                                  </strong>
                                </span>
                                <span>
                                  Total:{' '}
                                  <strong className='text-emerald-400'>
                                    {profile.totalSpent} EGP
                                  </strong>
                                </span>
                              </div>

                              {/* المحتوى التفصيلي عند الضغط على فتح */}
                              {isExpanded && (
                                <div className='pt-2.5 border-t border-slate-700/80 space-y-2.5 animate-fadeIn'>
                                  <div className='grid grid-cols-5 gap-1 text-center'>
                                    <div
                                      onClick={() =>
                                        setProfileStatusFilters({
                                          ...profileStatusFilters,
                                          [profileKey]: 'all',
                                        })
                                      }
                                      className={`cursor-pointer p-1 rounded border text-[9px] transition ${rStatus === 'all' ? 'bg-sky-600/30 border-sky-500 text-white font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                                    >
                                      All ({rTotal})
                                    </div>
                                    <div
                                      onClick={() =>
                                        setProfileStatusFilters({
                                          ...profileStatusFilters,
                                          [profileKey]: 'pending',
                                        })
                                      }
                                      className={`cursor-pointer p-1 rounded border text-[9px] transition ${rStatus === 'pending' ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                                    >
                                      Pend ({rPending})
                                    </div>
                                    <div
                                      onClick={() =>
                                        setProfileStatusFilters({
                                          ...profileStatusFilters,
                                          [profileKey]: 'shipping',
                                        })
                                      }
                                      className={`cursor-pointer p-1 rounded border text-[9px] transition ${rStatus === 'shipping' ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                                    >
                                      Ship ({rShipping})
                                    </div>
                                    <div
                                      onClick={() =>
                                        setProfileStatusFilters({
                                          ...profileStatusFilters,
                                          [profileKey]: 'delivered',
                                        })
                                      }
                                      className={`cursor-pointer p-1 rounded border text-[9px] transition ${rStatus === 'delivered' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                                    >
                                      Deliv ({rDelivered})
                                    </div>
                                    <div
                                      onClick={() =>
                                        setProfileStatusFilters({
                                          ...profileStatusFilters,
                                          [profileKey]: 'cancelled',
                                        })
                                      }
                                      className={`cursor-pointer p-1 rounded border text-[9px] transition ${rStatus === 'cancelled' ? 'bg-red-600/30 border-red-500 text-red-300 font-bold' : 'bg-[#111827] border-slate-800 text-slate-400'}`}
                                    >
                                      Canc ({rCancelled})
                                    </div>
                                  </div>

                                  <div className='relative'>
                                    <Search
                                      size={13}
                                      className='absolute left-2.5 top-2 text-slate-400 pointer-events-none'
                                    />
                                    <input
                                      type='text'
                                      placeholder='Search product, price, note...'
                                      value={
                                        profileSearchQueries[profileKey] || ''
                                      }
                                      onChange={(e) =>
                                        setProfileSearchQueries({
                                          ...profileSearchQueries,
                                          [profileKey]: e.target.value,
                                        })
                                      }
                                      className='w-full pl-8 pr-2.5 py-1 bg-[#111827] border border-slate-700 rounded-lg text-[11px] text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-sky-500'
                                      dir='ltr'
                                    />
                                  </div>

                                  <div className='max-h-64 overflow-y-auto pr-1 space-y-2'>
                                    {regularOrdersFiltered.length === 0 ? (
                                      <p className='text-[10px] text-slate-500 text-center py-3'>
                                        No matching orders.
                                      </p>
                                    ) : (
                                      regularOrdersFiltered.map(
                                        (order: any) => {
                                          const itemsList =
                                            parseRegularItems(order);
                                          const hasNote = Boolean(
                                            order.customer_notes?.trim(),
                                          );
                                          const isItemsOpen =
                                            regularOrderDetailsKey === order.id;
                                          const isNoteOpen =
                                            regularOrderNoteKey === order.id;

                                          return (
                                            <div
                                              key={order.id}
                                              className='bg-[#111827] p-2.5 rounded-lg border border-slate-800 space-y-2 text-[11px]'
                                            >
                                              <div className='flex items-center justify-between gap-1 border-b border-slate-800 pb-2 flex-wrap'>
                                                <span
                                                  dir='ltr'
                                                  className='font-bold text-[9px] text-slate-300 bg-[#1f2937] px-1.5 py-0.5 rounded border border-slate-700'
                                                >
                                                  #
                                                  {order.order_number ??
                                                    String(order.id || '')
                                                      .slice(0, 5)
                                                      .toUpperCase()}
                                                </span>
                                                <select
                                                  value={order.status}
                                                  onChange={(e) =>
                                                    handleStatusChange(
                                                      order.id,
                                                      e.target.value,
                                                    )
                                                  }
                                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border outline-none cursor-pointer ${
                                                    order.status === 'pending'
                                                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                                      : order.status ===
                                                          'shipping'
                                                        ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                                                        : order.status ===
                                                            'delivered'
                                                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                                                          : 'bg-red-950/40 text-red-300 border-red-500/40'
                                                  }`}
                                                >
                                                  <option
                                                    value='pending'
                                                    className='bg-[#1f2937] text-amber-300'
                                                  >
                                                    Pending
                                                  </option>
                                                  <option
                                                    value='shipping'
                                                    className='bg-[#1f2937] text-blue-300'
                                                  >
                                                    Shipping
                                                  </option>
                                                  <option
                                                    value='delivered'
                                                    className='bg-[#1f2937] text-emerald-300'
                                                  >
                                                    Delivered
                                                  </option>
                                                  <option
                                                    value='cancelled'
                                                    className='bg-[#1f2937] text-red-300'
                                                  >
                                                    Cancelled
                                                  </option>
                                                </select>
                                                <span className='font-bold text-sky-300'>
                                                  {order.total_amount} EGP
                                                </span>
                                                <a
                                                  href={getWhatsAppLink(order)}
                                                  target='_blank'
                                                  rel='noopener noreferrer'
                                                  className='bg-emerald-600/20 text-emerald-400 p-1 rounded border border-emerald-500/30'
                                                >
                                                  <MessageCircle size={13} />
                                                </a>
                                              </div>

                                              <div className='text-[10px] text-slate-300 truncate'>
                                                📍{' '}
                                                {/* {order.city
                                              ? `${order.city}, `
                                              : ''} */}
                                                {order.customer_address ||
                                                  'No address'}
                                              </div>

                                              {/* أزرار مدمجة لفتح/قفل المنتجات والملاحظات بشكل مستقل */}
                                              <div className='flex items-center gap-1.5 flex-wrap pt-0.5'>
                                                <button
                                                  type='button'
                                                  onClick={() =>
                                                    setRegularOrderDetailsKey(
                                                      isItemsOpen
                                                        ? null
                                                        : order.id,
                                                    )
                                                  }
                                                  className='inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 transition cursor-pointer'
                                                >
                                                  <Eye size={11} />
                                                  <span>
                                                    {isItemsOpen
                                                      ? 'Hide Products'
                                                      : `Products (${itemsList.length})`}
                                                  </span>
                                                </button>

                                                {hasNote && (
                                                  <button
                                                    type='button'
                                                    onClick={() =>
                                                      setRegularOrderNoteKey(
                                                        isNoteOpen
                                                          ? null
                                                          : order.id,
                                                      )
                                                    }
                                                    className='inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition cursor-pointer'
                                                  >
                                                    <span>📝</span>
                                                    <span>
                                                      {isNoteOpen
                                                        ? 'Hide Note'
                                                        : 'Note'}
                                                    </span>
                                                  </button>
                                                )}
                                              </div>

                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* ============================== */}
                                              {/* عرض اسم كل منتج وسعره بوضوح عند الضغط */}
                                              {isItemsOpen && (
                                                <div className='bg-[#1f2937]/90 border border-sky-500/30 rounded-lg p-2 space-y-1.5 animate-fadeIn'>
                                                  {itemsList.length === 0 ? (
                                                    <p className='text-[10px] text-slate-400'>
                                                      No items found.
                                                    </p>
                                                  ) : (
                                                    itemsList.map(
                                                      (
                                                        item: any,
                                                        idx: number,
                                                      ) => {
                                                        const unitPrice =
                                                          Number(
                                                            item.price || 0,
                                                          );
                                                        const qty = Number(
                                                          item.quantity || 1,
                                                        );
                                                        return (
                                                          <div
                                                            key={idx}
                                                            className='border-b border-slate-800 last:border-b-0 pb-1.5 last:pb-0'
                                                          >
                                                            <div className='flex items-start gap-2'>
                                                              {item.image && (
                                                                <Image
                                                                  src={
                                                                    item.image
                                                                  }
                                                                  alt={
                                                                    item.name ||
                                                                    'item'
                                                                  }
                                                                  width={26}
                                                                  height={26}
                                                                  loading='lazy'
                                                                  sizes='26px'
                                                                  className='w-[26px] h-[26px] rounded object-cover border border-slate-700 shrink-0 mt-0.5'
                                                                />
                                                              )}

                                                              <div className='min-w-0 flex-1 space-y-0.5'>
                                                                <p className='text-[10.5px] font-semibold text-white leading-snug break-words'>
                                                                  {idx + 1}.{' '}
                                                                  {item.name ||
                                                                    'Unnamed Product'}
                                                                </p>
                                                                <div className='flex items-center justify-between gap-2 text-[9.5px] text-slate-400'>
                                                                  <span>
                                                                    Qty:{' '}
                                                                    <strong className='text-slate-200'>
                                                                      {qty}
                                                                    </strong>{' '}
                                                                    ×{' '}
                                                                    {unitPrice}{' '}
                                                                    EGP
                                                                  </span>
                                                                  <span className='text-emerald-400 font-bold shrink-0'>
                                                                    {unitPrice *
                                                                      qty}{' '}
                                                                    EGP
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        );
                                                      },
                                                    )
                                                  )}
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
                                              {/* ========================== */}
                                              {/* ========================== */}
                                              {/* ========================== */}
                                              {/* عرض الملاحظة عند الضغط بشكل مستقل */}
                                              {hasNote && isNoteOpen && (
                                                <div className='text-[10px] text-amber-200 bg-amber-950/40 border border-amber-500/30 px-2 py-1.5 rounded-lg break-words animate-fadeIn'>
                                                  <span className='font-bold text-amber-400'>
                                                    📝 Note:{' '}
                                                  </span>
                                                  {order.customer_notes.trim()}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        },
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                );
              })()}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* ========================================================= */}
          </div>
        )}
      </main>
    </div>
  );
}
