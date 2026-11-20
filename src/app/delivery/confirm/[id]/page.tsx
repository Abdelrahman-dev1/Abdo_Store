'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { evaluatePromoRules, type PromoRule } from '@/lib/promoEngine';
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Sparkles,
  MessageCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  Clock,
  ThumbsUp,
  User,
  Gift,
} from 'lucide-react';

interface DriverInfo {
  id: string;
  full_name: string;
  phone: string;
  completed_deliveries: number;
  average_rating: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface CustomerDeliveryDetails {
  id: string;
  order_id: string;
  driver_id: string | null;
  delivery_fee: number;
  status: 'new' | 'assigned' | 'completed' | 'cancelled';
  driver_confirmed: boolean;
  customer_confirmed: boolean;
  customer_confirmed_at: string | null;
  customer_rating: number | null;
  customer_review: string | null;
  emergency_alert: string | null;
  orders: {
    order_number: number;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    city: string | null;
    total_amount: number;
    subtotal: number | null;
    items: OrderItem[] | null;
    created_at?: string | null;
    user_id?: string | null;
    free_shipping_approved?: boolean | null;
    free_shipping_reason?: string | null;
  };
  drivers: DriverInfo | null;
}

function CustomerConfirmContent() {
  const params = useParams();
  const deliveryId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [delivery, setDelivery] = useState<CustomerDeliveryDetails | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [storeCurrency, setStoreCurrency] = useState<string>('EGP');
  const [promoRules, setPromoRules] = useState<PromoRule[]>([]);
  const [customerCompletedOrders, setCustomerCompletedOrders] =
    useState<number>(0);

  // حالات تأكيد الاستلام
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState<boolean>(false);

  // حالات تقييم المندوب
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // حالات الإلغاء الطارئ من العميل
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    reason: string;
    cancelling: boolean;
  }>({
    isOpen: false,
    reason: '',
    cancelling: false,
  });

  // مودال الإشعارات المخصص (بديل alert)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showModal = (
    type: 'success' | 'error' | 'warning',
    title: string,
    message: string,
  ) => {
    setFeedbackModal({ isOpen: true, type, title, message });
  };

  const formatWhatsAppPhone = (raw: string): string => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('01') && digits.length === 11) {
      digits = '2' + digits;
    } else if (digits.startsWith('1') && digits.length === 10) {
      digits = '20' + digits;
    }
    return digits;
  };

  // جلب قواعد العروض النشطة
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('promo_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });
      if (active && data) {
        setPromoRules(data as PromoRule[]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // جلب تفاصيل الشحنة والمندوب
  const fetchDeliveryInfo = useCallback(
    async (showLoader = false) => {
      if (!deliveryId) return;
      if (showLoader) setLoading(true);

      try {
        const { data, error } = await supabase
          .from('deliveries')
          .select(
            `
            *,
            orders (
              order_number,
              customer_name,
              customer_phone,
              customer_address,
              city,
              total_amount,
              subtotal,
              items,
              created_at,
              user_id,
              free_shipping_approved,
              free_shipping_reason
            ),
            drivers (
              id,
              full_name,
              phone,
              completed_deliveries,
              average_rating
            )
          `,
          )
          .eq('id', deliveryId)
          .single();

        if (error) throw error;

        const typedData = data as unknown as CustomerDeliveryDetails;
        setDelivery(typedData);

        if (typedData.customer_rating) {
          setSelectedRating(typedData.customer_rating);
          setRatingSubmitted(true);
        }

        // حساب عدد الطلبات المكتملة السابقة للعميل إن وُجد user_id
        if (typedData.orders?.user_id) {
          const { data: userOrders } = await supabase
            .from('orders')
            .select('id, status')
            .eq('user_id', typedData.orders.user_id)
            .neq('id', typedData.order_id);

          if (userOrders) {
            const completedCount = userOrders.filter(
              (o) =>
                o.status === 'delivered' ||
                o.status === 'completed' ||
                o.status === 'تم التسليم',
            ).length;
            setCustomerCompletedOrders(completedCount);
          }
        }

        const { data: settingsData } = await supabase
          .from('settings')
          .select('store_currency')
          .limit(1)
          .single();

        if (settingsData?.store_currency) {
          setStoreCurrency(settingsData.store_currency);
        }
      } catch {
        if (showLoader) {
          showModal(
            'error',
            'رابط غير صالح',
            'تعذر العثور على بيانات هذا الطلب، يرجى مراجعة خدمة العملاء.',
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [deliveryId],
  );

  // تشغيل الجلب والاشتراك في التحديث اللحظي (Realtime)
  useEffect(() => {
    if (!deliveryId) return;
    fetchDeliveryInfo(false);

    const channel = supabase
      .channel(`customer-delivery-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        () => {
          fetchDeliveryInfo(false);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId, fetchDeliveryInfo]);

  // 1. العميل يؤكد استلام الطلب
  const handleConfirmReceipt = async () => {
    if (!delivery) return;
    setConfirmingReceipt(true);

    try {
      const now = new Date().toISOString();
      const isBothConfirmed = Boolean(delivery.driver_confirmed);

      const { error } = await supabase
        .from('deliveries')
        .update({
          customer_confirmed: true,
          customer_confirmed_at: now,
          status: isBothConfirmed ? 'completed' : delivery.status,
          updated_at: now,
        })
        .eq('id', delivery.id);

      if (error) throw error;

      // إذا كان المندوب قد أكد قبله، نغلق الطلب الرئيسي ونزيد رصيد المندوب
      if (isBothConfirmed) {
        await supabase
          .from('orders')
          .update({ status: 'delivered', updated_at: now })
          .eq('id', delivery.order_id);

        if (delivery.drivers) {
          await supabase
            .from('drivers')
            .update({
              completed_deliveries:
                (delivery.drivers.completed_deliveries || 0) + 1,
            })
            .eq('id', delivery.drivers.id);
        }
      }

      setConfirmModalOpen(false);
      await fetchDeliveryInfo(false);

      showModal(
        'success',
        'شكراً لتأكيد الاستلام! 🎉',
        'نتمنى لك تجربة تسوق رائعة. يسعدنا تقييمك لمندوب التوصيل بالأسفل!',
      );
    } catch (err: any) {
      showModal(
        'error',
        'تعذر تأكيد الاستلام',
        err?.message || 'حدث خطأ بسيط، يرجى المحاولة مرة أخرى.',
      );
    } finally {
      setConfirmingReceipt(false);
    }
  };

  // 2. العميل يرسل تقييم المندوب
  const handleSubmitDriverRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;
    setSubmittingRating(true);

    try {
      const now = new Date().toISOString();
      const combinedReview = [
        selectedTags.length > 0 ? `[${selectedTags.join(' - ')}]` : '',
        reviewComment.trim(),
      ]
        .filter(Boolean)
        .join(' ');

      const { error } = await supabase
        .from('deliveries')
        .update({
          customer_rating: selectedRating,
          customer_review: combinedReview || null,
          updated_at: now,
        })
        .eq('id', delivery.id);

      if (error) throw error;

      // تحديث متوسط تقييم المندوب في جدول drivers
      if (delivery.drivers) {
        const { data: ratedDeliveries } = await supabase
          .from('deliveries')
          .select('customer_rating')
          .eq('driver_id', delivery.drivers.id)
          .not('customer_rating', 'is', null);

        if (ratedDeliveries && ratedDeliveries.length > 0) {
          const sum = ratedDeliveries.reduce(
            (acc, row) => acc + Number(row.customer_rating || 0),
            0,
          );
          const avg = Number((sum / ratedDeliveries.length).toFixed(2));

          await supabase
            .from('drivers')
            .update({ average_rating: avg })
            .eq('id', delivery.drivers.id);
        }
      }

      setRatingSubmitted(true);
      await fetchDeliveryInfo(false);

      showModal(
        'success',
        'تم إرسال تقييمك بنجاح ⭐',
        'شكراً لمشاركتنا رأيك، تقييمك يساعدنا على تقديم أفضل خدمة دائماً!',
      );
    } catch (err: any) {
      showModal(
        'error',
        'تعذر إرسال التقييم',
        err?.message || 'حدث خطأ أثناء حفظ التقييم.',
      );
    } finally {
      setSubmittingRating(false);
    }
  };

  // 3. إلغاء طارئ للطلب من العميل (يسمع فوراً عند الأدمن والسواق)
  const handleEmergencyCancelByCustomer = async () => {
    if (!delivery) return;
    const reasonText = cancelModal.reason.trim();
    if (!reasonText) {
      showModal(
        'warning',
        'يرجى تحديد سبب الإلغاء',
        'اختر سبباً سريعاً أو اكتب سبب الإلغاء ليتم إبلاغ الإدارة والمندوب فوراً.',
      );
      return;
    }

    setCancelModal((prev) => ({ ...prev, cancelling: true }));
    try {
      const now = new Date().toISOString();
      const alertText = `إلغاء طارئ من العميل (${delivery.orders.customer_name} - ${delivery.orders.customer_phone}): ${reasonText}`;

      // تحديث جدول التوصيل (يسمع لحظياً في شاشة السواق ولوحة الأدمن)
      const { error: delError } = await supabase
        .from('deliveries')
        .update({
          status: 'cancelled',
          emergency_alert: alertText,
          updated_at: now,
        })
        .eq('id', delivery.id);

      if (delError) throw delError;

      // تحديث جدول الطلبات الرئيسي
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: now,
        })
        .eq('id', delivery.order_id);

      setCancelModal({ isOpen: false, reason: '', cancelling: false });
      await fetchDeliveryInfo(false);

      showModal(
        'warning',
        'تم إلغاء الطلب وإبلاغ الإدارة والمندوب',
        'تم تسجيل إلغاء طلبك فوراً وإرسال إشعار عاجل للإدارة ومندوب التوصيل.',
      );
    } catch (err: any) {
      setCancelModal((prev) => ({ ...prev, cancelling: false }));
      showModal(
        'error',
        'تعذر إلغاء الطلب',
        err?.message || 'حدث خطأ أثناء إلغاء الطلب، يرجى المحاولة مرة أخرى.',
      );
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const ord = delivery?.orders;
  const orderSubtotal = Number(ord?.subtotal ?? ord?.total_amount ?? 0);
  const deliveryFee = Number(delivery?.delivery_fee || 0);
  const totalPayable = orderSubtotal + deliveryFee;

  const totalItemsCount = useMemo(() => {
    if (!ord?.items || ord.items.length === 0) return 0;
    return ord.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  }, [ord?.items]);

  // تقييم العروض والمكافآت بناءً على بيانات الأوردر الفعلي ووقت إنشائه
  const orderPromoEval = useMemo(() => {
    if (!ord) {
      return {
        matchedRules: [] as any[],
        upcomingHints: [] as any[],
        allEvaluated: [] as any[],
      };
    }
    const orderCreatedDate = ord.created_at ? new Date(ord.created_at) : null;
    return evaluatePromoRules(promoRules, {
      subtotal: orderSubtotal,
      itemsCount: totalItemsCount,
      city: ord.city ?? '',
      orderDate: orderCreatedDate,
      completedOrdersCount: customerCompletedOrders,
    });
  }, [
    ord,
    promoRules,
    orderSubtotal,
    totalItemsCount,
    customerCompletedOrders,
  ]);

  if (loading) {
    return (
      <div
        dir='rtl'
        className='min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6'
      >
        <div className='w-16 h-16 rounded-3xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse mb-4'>
          <Truck size={32} />
        </div>
        <p className='text-base font-black text-slate-200'>
          جاري تحميل تفاصيل شحنتك...
        </p>
      </div>
    );
  }

  if (!delivery || !ord) {
    return (
      <div
        dir='rtl'
        className='min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4'
      >
        <div className='max-w-md w-full bg-[#0e1626] border border-slate-800 rounded-3xl p-7 text-center space-y-3'>
          <XCircle size={48} className='mx-auto text-rose-400' />
          <h1 className='text-xl font-black text-white'>
            عذراً، رابط الطلب غير متاح
          </h1>
          <p className='text-sm text-slate-400'>
            يرجى التأكد من صحة الرابط المرسل إليك أو التواصل مع خدمة العملاء.
          </p>
        </div>
      </div>
    );
  }

  const isCompleted = delivery.status === 'completed';
  const isCancelled = delivery.status === 'cancelled';
  const matchedRewards = orderPromoEval?.matchedRules ?? [];
  const hasAnyRewardSignal =
    matchedRewards.length > 0 ||
    Boolean(ord.free_shipping_approved) ||
    Boolean(ord.free_shipping_reason) ||
    deliveryFee === 0;

  return (
    <div
      dir='rtl'
      className='min-h-screen bg-[#07090e] text-white pb-14 selection:bg-emerald-600 selection:text-white'
    >
      {/* الهيدر العلوي */}
      <div className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-20'>
        <div className='max-w-lg mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20'>
              <ShieldCheck size={23} />
            </div>
            <div>
              <h1 className='text-base sm:text-lg font-black text-white'>
                متابعة واستلام الطلب #{ord.order_number}
              </h1>
              <p className='text-xs text-slate-400'>
                أهلاً بك، {ord.customer_name}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchDeliveryInfo(false)}
            className='p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            title='تحديث حالة الطلب'
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      <div className='max-w-lg mx-auto px-4 pt-5 space-y-5'>
        {/* شريط مراحل الطلب البصري */}
        {/* شريط مراحل الطلب البصري مع شارة صح عند اكتمال كل مرحلة */}
        {!isCancelled && (
          <div className='bg-[#0e1626] border-2 border-slate-800 rounded-3xl p-4 sm:p-5'>
            <div className='grid grid-cols-3 gap-2 text-center'>
              {/* المرحلة 1: تم التجهيز (مكتملة دائماً) */}
              <div className='space-y-2'>
                <div className='relative w-11 h-11 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto'>
                  <Package size={20} />
                  <span className='absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md ring-2 ring-[#0e1626]'>
                    <CheckCircle2 size={14} strokeWidth={3} />
                  </span>
                </div>
                <p className='text-xs sm:text-sm font-black text-emerald-300'>
                  تم التجهيز
                </p>
              </div>

              {/* المرحلة 2: في الطريق إليك */}
              <div className='space-y-2'>
                <div
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center mx-auto border-2 transition-all ${
                    delivery.drivers
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  <Truck size={20} />
                  {delivery.drivers && (
                    <span className='absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md ring-2 ring-[#0e1626]'>
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-black ${
                    delivery.drivers ? 'text-blue-300' : 'text-slate-500'
                  }`}
                >
                  في الطريق إليك
                </p>
              </div>

              {/* المرحلة 3: الاستلام والتقييم */}
              <div className='space-y-2'>
                <div
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center mx-auto border-2 transition-all ${
                    isCompleted || delivery.customer_confirmed
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  <Star size={20} />
                  {(isCompleted || delivery.customer_confirmed) && (
                    <span className='absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md ring-2 ring-[#0e1626]'>
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-black ${
                    isCompleted || delivery.customer_confirmed
                      ? 'text-emerald-300'
                      : 'text-slate-500'
                  }`}
                >
                  الاستلام والتقييم
                </p>
              </div>
            </div>
          </div>
        )}

        {/* حالة الإلغاء */}
        {isCancelled && (
          <div className='bg-rose-950/40 border-2 border-rose-500/50 rounded-3xl p-6 text-center space-y-2.5'>
            <XCircle size={48} className='mx-auto text-rose-400' />
            <h2 className='text-xl font-black text-white'>
              تم إلغاء هذا الطلب
            </h2>
            <p className='text-sm text-slate-300 leading-relaxed'>
              هذا الطلب ملغي حالياً، وتم إخطار الإدارة ومندوب التوصيل بذلك.
            </p>
            {delivery.emergency_alert && (
              <p className='text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mt-2'>
                {delivery.emergency_alert}
              </p>
            )}
          </div>
        )}

        {/* بطاقة بيانات مندوب التوصيل */}
        {!isCancelled && delivery.drivers && (
          <div className='bg-[#0e1626] border border-slate-800 rounded-3xl p-5 space-y-4'>
            <div className='flex items-center justify-between border-b border-slate-800 pb-3'>
              <h2 className='text-base font-black text-white flex items-center gap-2'>
                <User size={19} className='text-blue-400' />
                بيانات مندوب التوصيل
              </h2>
              <span className='px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1'>
                <Star size={12} className='fill-amber-400 text-amber-400' />
                {Number(delivery.drivers.average_rating || 5).toFixed(1)}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <p className='text-lg font-black text-white'>
                  {delivery.drivers.full_name}
                </p>
                <p className='text-xs text-slate-400 mt-0.5'>
                  أتم {delivery.drivers.completed_deliveries || 0} رحلة توصيل
                  بنجاح
                </p>
              </div>
              <span
                className='text-sm font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20'
                dir='ltr'
              >
                {delivery.drivers.phone}
              </span>
            </div>

            <div className='grid grid-cols-2 gap-3 pt-1'>
              <a
                href={`tel:${delivery.drivers.phone}`}
                className='py-3.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20'
              >
                <Phone size={18} />
                اتصال بالمندوب
              </a>

              <a
                href={`https://wa.me/${formatWhatsAppPhone(
                  delivery.drivers.phone,
                )}`}
                target='_blank'
                rel='noopener noreferrer'
                className='py-3.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20'
              >
                <MessageCircle size={18} />
                واتساب المندوب
              </a>
            </div>
          </div>
        )}

        {/* ملخص الفاتورة والمبلغ المطلوب عند الاستلام */}
        {/* ملخص الفاتورة والعنوان وإسلايدر المنتجات الواضح */}
        {!isCancelled && (
          <div className='space-y-4'>
            {/* بانر طمأنة للعميل بأنيميشن هادي */}
            <div className='bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-emerald-600/20 border-2 border-blue-500/40 rounded-3xl p-4 flex items-center gap-3.5 shadow-lg'>
              <div className='w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-md shadow-blue-600/30'>
                <ShieldCheck size={26} />
              </div>
              <div>
                <p className='text-base font-black text-white leading-snug'>
                  طلبك في أمان تام ومحل اهتمامنا 🛡️
                </p>
                <p className='text-xs sm:text-sm font-bold text-blue-200 mt-0.5 leading-relaxed'>
                  بنتابع رحلتك لحظة بلحظة وبنهتم بأدق التفاصيل عشان يوصلك طلبك
                  بأسرع وقت وأفضل حال لراحتك.
                </p>
              </div>
            </div>

            {/* كارت المكافآت المستحقة وحالة الاعتماد لهذا الطلب */}
            {/* كارت المكافآت المستحقة وحالة الاعتماد + شريط التقدم للعروض القادمة */}
            {(hasAnyRewardSignal ||
              (orderPromoEval?.upcomingHints?.length ?? 0) > 0) && (
              <div className='bg-gradient-to-br from-[#0e1626] via-[#131c33] to-[#0e1626] border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-lg'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <div className='w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300'>
                      <Gift size={18} />
                    </div>
                    <div>
                      <h3 className='text-sm sm:text-base font-black text-white'>
                        عروض ومكافآت هذا الطلب
                      </h3>
                      <p className='text-[11px] text-slate-400'>
                        مقيّمة حسب بيانات طلبك ووقت إنشائه
                      </p>
                    </div>
                  </div>

                  {ord.free_shipping_approved ? (
                    <span className='px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0'>
                      ✓ معتمدة من الأدمن
                    </span>
                  ) : (
                    <span className='px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0'>
                      ⏳ بانتظار اعتماد الأدمن
                    </span>
                  )}
                </div>

                {matchedRewards.length > 0 && (
                  <div className='flex flex-wrap gap-1.5'>
                    {matchedRewards.map((item: any, idx: number) => (
                      <span
                        key={item?.rule?.id || idx}
                        className='px-3 py-1 rounded-xl text-xs font-bold bg-[#090f19] text-amber-200 border border-amber-500/25'
                      >
                        🎁 {item?.rule?.title || item?.label || 'مكافأة مؤهلة'}
                      </span>
                    ))}
                  </div>
                )}

                {ord.free_shipping_reason && (
                  <p className='text-xs text-slate-300 bg-[#090f19]/90 border border-slate-800 rounded-xl px-3 py-2'>
                    {ord.free_shipping_reason}
                  </p>
                )}

                {!ord.free_shipping_approved && hasAnyRewardSignal && (
                  <p className='text-[11px] font-bold text-amber-300/90 flex items-center gap-1.5'>
                    <Clock size={13} className='shrink-0' />
                    يرجى تذكير الأدمن لاعتماد المكافأة عند تأكيد الطلب.
                  </p>
                )}

                {/* شريط التقدم للعروض القادمة لتشجيع الطلب القادم */}
                {(orderPromoEval?.upcomingHints?.length ?? 0) > 0 && (
                  <div className='pt-3 border-t border-slate-800/90 space-y-2.5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-black text-sky-300 flex items-center gap-1.5'>
                        <Sparkles size={14} className='text-sky-400' />
                        قريب من عروض إضافية في طلبك القادم:
                      </span>
                    </div>

                    <div className='space-y-2'>
                      {orderPromoEval.upcomingHints.map(
                        (hint: any, idx: number) => {
                          const rawProgress =
                            typeof hint?.progressPercent === 'number'
                              ? hint.progressPercent
                              : typeof hint?.progress === 'number'
                                ? hint.progress <= 1
                                  ? hint.progress * 100
                                  : hint.progress
                                : 50;
                          const progress = Math.max(
                            8,
                            Math.min(100, Number(rawProgress) || 50),
                          );

                          const hintTitle =
                            hint?.rule?.title ||
                            hint?.title ||
                            hint?.label ||
                            hint?.message ||
                            hint?.hint ||
                            (typeof hint === 'string'
                              ? hint
                              : 'عرض إضافي مميز');

                          const hintDetail =
                            hint?.message ||
                            hint?.hint ||
                            hint?.description ||
                            'كمّل شروط العرض في طلبك الجاي واستفد بالمكافأة.';

                          return (
                            <div
                              key={hint?.rule?.id || idx}
                              className='bg-[#090f19] border border-sky-500/20 rounded-2xl p-3 space-y-1.5'
                            >
                              <div className='flex items-center justify-between gap-2 text-xs'>
                                <span className='font-black text-white truncate'>
                                  {hintTitle}
                                </span>
                                <span className='font-mono font-bold text-sky-300 shrink-0'>
                                  {Math.round(progress)}%
                                </span>
                              </div>

                              <div className='w-full h-2 rounded-full bg-slate-800 overflow-hidden'>
                                <div
                                  className='h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300'
                                  style={{ width: `${progress}%` }}
                                />
                              </div>

                              {hintDetail !== hintTitle && (
                                <p className='text-[11px] text-slate-400 leading-relaxed'>
                                  {hintDetail}
                                </p>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>

                    <p className='text-[11px] font-bold text-emerald-300/90'>
                      💡 خليه في بالك لطلبك الجاي عشان تقفّل الشروط وتكسب العرض!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* كارت المبلغ الإجمالي وتفاصيل الفاتورة بخط كبير وواضح */}
            <div className='bg-gradient-to-br from-[#0e1626] to-[#132238] border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-base sm:text-lg font-black text-white'>
                  المبلغ المطلوب عند الاستلام:
                </span>
                <span className='px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shrink-0'>
                  الدفع كاش
                </span>
              </div>

              <div className='text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight'>
                {totalPayable}{' '}
                <span className='text-xl sm:text-2xl font-extrabold text-emerald-300'>
                  {storeCurrency}
                </span>
              </div>

              <div className='pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-3'>
                <div className='bg-[#090f19] border border-slate-800 rounded-2xl p-3'>
                  <span className='text-xs sm:text-sm font-bold text-slate-400 block'>
                    سعر المنتجات:
                  </span>
                  <span className='text-base sm:text-lg font-black text-white mt-0.5 block'>
                    {orderSubtotal} {storeCurrency}
                  </span>
                </div>

                <div className='bg-[#090f19] border border-slate-800 rounded-2xl p-3'>
                  <span className='text-xs sm:text-sm font-bold text-slate-400 block'>
                    رسوم التوصيل:
                  </span>
                  <span className='text-base sm:text-lg font-black text-blue-400 mt-0.5 block'>
                    {deliveryFee} {storeCurrency}
                  </span>
                </div>
              </div>
            </div>

            {/* كارت عنوان التسليم (مرفوع فوق المنتجات وبخط كبير وواضح) */}
            <div className='bg-[#0e1626] border-2 border-slate-800 rounded-3xl p-5 flex items-start gap-3.5 shadow-md'>
              <div className='w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5'>
                <MapPin size={24} />
              </div>
              <div className='space-y-1'>
                <span className='text-xs sm:text-sm font-bold text-slate-400 block'>
                  عنوان التوصيل المسجل لدينا:
                </span>
                <p className='text-base sm:text-lg font-black text-white leading-relaxed'>
                  {ord.customer_address}
                  {ord.city ? ` — ${ord.city}` : ''}
                </p>
              </div>
            </div>

            {/* إسلايدر أفقي متوسط لمحتويات الطلب (بدل القائمة الطويلة) */}
            {ord.items && ord.items.length > 0 && (
              <div className='bg-[#0e1626] border-2 border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-md'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-base sm:text-lg font-black text-white flex items-center gap-2'>
                    <Package size={21} className='text-amber-400' />
                    محتويات طلبك ({ord.items.length} أصناف)
                  </h3>
                  {ord.items.length > 1 && (
                    <span className='text-xs font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse'>
                      اسحب لليسار ←
                    </span>
                  )}
                </div>

                <div className='flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth'>
                  {ord.items.map((item, idx) => (
                    <div
                      key={idx}
                      className='min-w-[215px] max-w-[235px] snap-start shrink-0 bg-[#090f19] border-2 border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='px-2.5 py-0.5 rounded-lg bg-blue-600 text-white text-xs font-black'>
                          صنف #{idx + 1}
                        </span>
                        <span className='px-2.5 py-0.5 rounded-lg bg-slate-800 text-amber-300 text-xs font-black'>
                          الكمية: {item.quantity}
                        </span>
                      </div>

                      <p className='text-base font-black text-white line-clamp-2 leading-snug'>
                        {item.name}
                      </p>

                      <div className='pt-2 border-t border-slate-800 flex items-center justify-between'>
                        <span className='text-xs font-bold text-slate-400'>
                          الإجمالي:
                        </span>
                        <span className='text-base font-black text-emerald-400'>
                          {item.price * item.quantity} {storeCurrency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* قسم تأكيد الاستلام + زرار الإلغاء الطارئ */}
        {!isCancelled && (
          <div className='space-y-3'>
            {delivery.customer_confirmed ? (
              <div className='bg-emerald-950/40 border border-emerald-500/50 rounded-3xl p-5 text-center space-y-1.5'>
                <CheckCircle2 size={38} className='mx-auto text-emerald-400' />
                <h3 className='text-base font-black text-white'>
                  تم تأكيد استلامك للطلب بنجاح ✓
                </h3>
                <p className='text-xs text-emerald-200'>
                  {isCompleted
                    ? 'تم إغلاق الطلب بنجاح من الطرفين.'
                    : 'تم تسجيل تأكيدك، وفي انتظار تأكيد المندوب لإغلاق الطلب نهائياً.'}
                </p>
              </div>
            ) : (
              <>
                <button
                  type='button'
                  onClick={() => setConfirmModalOpen(true)}
                  className='w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all'
                >
                  <CheckCircle2 size={22} />
                  نعم، استلمت طلبي بنجاح
                </button>

                {/* زرار الإلغاء الطارئ للعميل */}
                <button
                  type='button'
                  onClick={() =>
                    setCancelModal({
                      isOpen: true,
                      reason: '',
                      cancelling: false,
                    })
                  }
                  className='w-full py-3.5 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors'
                >
                  <AlertTriangle size={17} className='text-rose-400' />
                  إلغاء الطلب / الإبلاغ عن مشكلة عاجلة
                </button>
              </>
            )}
          </div>
        )}

        {/* قسم تقييم المندوب (يظهر بمجرد تأكيد العميل للاستلام أو اكتمال الطلب) */}
        {!isCancelled &&
          (delivery.customer_confirmed || isCompleted) &&
          delivery.drivers && (
            <div className='bg-[#0e1626] border border-purple-500/40 rounded-3xl p-5 space-y-4 shadow-xl'>
              <div className='text-center space-y-1'>
                <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30'>
                  <Sparkles size={12} /> رأيك يهمنا
                </span>
                <h3 className='text-lg font-black text-white'>
                  قيّم خدمة المندوب ({delivery.drivers.full_name})
                </h3>
                <p className='text-xs text-slate-400'>
                  اختر عدد النجوم المناسبة لمستوى الخدمة والتوصيل
                </p>
              </div>

              {ratingSubmitted ? (
                <div className='bg-[#090f19] border border-slate-800 rounded-2xl p-4 text-center space-y-2'>
                  <div className='flex items-center justify-center gap-1.5'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={26}
                        className={
                          star <= selectedRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }
                      />
                    ))}
                  </div>
                  <p className='text-sm font-black text-emerald-400 flex items-center justify-center gap-1.5'>
                    <ThumbsUp size={16} /> شكراً لتقييمك! تم حفظ رأيك بنجاح.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitDriverRating} className='space-y-4'>
                  {/* نجوم التقييم التفاعلية */}
                  <div className='flex items-center justify-center gap-2 py-2'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type='button'
                        onClick={() => setSelectedRating(star)}
                        className='p-1 transition-transform hover:scale-110 active:scale-95'
                      >
                        <Star
                          size={34}
                          className={
                            star <= selectedRating
                              ? 'fill-amber-400 text-amber-400 drop-shadow'
                              : 'text-slate-700 hover:text-slate-500'
                          }
                        />
                      </button>
                    ))}
                  </div>

                  {/* أوسمة سريعة للتقييم */}
                  <div className='flex flex-wrap justify-center gap-1.5'>
                    {[
                      'سريع جداً ⚡',
                      'تعامل راقي 🤝',
                      'التزام بالمواعيد ⏱️',
                      'حافظ على الطلب 📦',
                    ].map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type='button'
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            active
                              ? 'bg-purple-600/25 border-purple-500 text-purple-200'
                              : 'bg-[#090f19] border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder='أضف تعليقاً اختيارياً للمندوب...'
                    className='w-full bg-[#090f19] border border-slate-800 focus:border-purple-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none'
                  />

                  <button
                    type='submit'
                    disabled={submittingRating}
                    className='w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-purple-600/20'
                  >
                    {submittingRating
                      ? 'جاري إرسال التقييم...'
                      : 'إرسال التقييم'}
                  </button>
                </form>
              )}
            </div>
          )}
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. مودال تأكيد استلام الطلب */}
      {confirmModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center'>
            <div className='w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4'>
              <CheckCircle2 size={30} />
            </div>
            <h3 className='text-base font-black text-white'>
              تأكيد استلام الطلب؟
            </h3>
            <p className='text-xs text-slate-300 mt-2 leading-relaxed'>
              هل استلمت طلبك رقم{' '}
              <span className='font-bold text-white'>#{ord.order_number}</span>{' '}
              بالكامل وبحالة ممتازة؟
            </p>
            <div className='flex gap-2.5 mt-6'>
              <button
                type='button'
                onClick={() => setConfirmModalOpen(false)}
                disabled={confirmingReceipt}
                className='flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs'
              >
                تراجع
              </button>
              <button
                type='button'
                onClick={handleConfirmReceipt}
                disabled={confirmingReceipt}
                className='flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs'
              >
                {confirmingReceipt ? 'جاري التأكيد...' : 'نعم، استلمت الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. مودال الإلغاء الطارئ للعميل */}
      {cancelModal.isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4'>
            <div className='text-center'>
              <div className='w-13 h-13 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-3'>
                <AlertTriangle size={28} />
              </div>
              <h3 className='text-base font-black text-white'>
                إلغاء الطلب / بلاغ عاجل
              </h3>
              <p className='text-xs text-slate-400 mt-1'>
                سيتم إلغاء الطلب وإبلاغ الإدارة ومندوب التوصيل فوراً. اختر سبب
                الإلغاء:
              </p>
            </div>

            <div className='flex flex-col gap-1.5'>
              {[
                'تأخر المندوب عن الموعد المتفق عليه',
                'تم تغيير العنوان أو الموعد',
                'تم تنفيذ الطلب بالخطأ',
                'تعذر التواصل مع مندوب التوصيل',
              ].map((preset) => (
                <button
                  key={preset}
                  type='button'
                  onClick={() =>
                    setCancelModal((prev) => ({ ...prev, reason: preset }))
                  }
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border text-right transition-colors ${
                    cancelModal.reason === preset
                      ? 'bg-rose-600/25 border-rose-500 text-rose-200'
                      : 'bg-[#090f19] border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  - {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={cancelModal.reason}
              onChange={(e) =>
                setCancelModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder='أو اكتب سبب الإلغاء بالتفصيل هنا...'
              className='w-full bg-[#090f19] border border-slate-800 focus:border-rose-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none'
            />

            <div className='flex gap-2.5'>
              <button
                type='button'
                onClick={() =>
                  setCancelModal({
                    isOpen: false,
                    reason: '',
                    cancelling: false,
                  })
                }
                disabled={cancelModal.cancelling}
                className='flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs'
              >
                تراجع
              </button>
              <button
                type='button'
                onClick={handleEmergencyCancelByCustomer}
                disabled={cancelModal.cancelling}
                className='flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs'
              >
                {cancelModal.cancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. مودال الإشعارات */}
      {feedbackModal.isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center'>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                feedbackModal.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : feedbackModal.type === 'warning'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {feedbackModal.type === 'success' && <CheckCircle2 size={30} />}
              {feedbackModal.type === 'warning' && <AlertTriangle size={30} />}
              {feedbackModal.type === 'error' && <XCircle size={30} />}
            </div>
            <h3 className='text-base font-black text-white'>
              {feedbackModal.title}
            </h3>
            <p className='text-xs text-slate-300 mt-2 leading-relaxed'>
              {feedbackModal.message}
            </p>
            <button
              onClick={() =>
                setFeedbackModal((prev) => ({ ...prev, isOpen: false }))
              }
              className='mt-5 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs'
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerConfirmDeliveryPage() {
  return (
    <Suspense
      fallback={
        <div
          dir='rtl'
          className='min-h-screen bg-[#07090e] text-white flex items-center justify-center p-6'
        >
          <p className='text-base font-black text-slate-200'>
            جاري تجهيز صفحة متابعة الطلب...
          </p>
        </div>
      }
    >
      <CustomerConfirmContent />
    </Suspense>
  );
}
