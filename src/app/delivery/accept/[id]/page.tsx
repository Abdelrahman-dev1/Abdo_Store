'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  User,
  Navigation,
  Copy,
  Check,
  Star,
  Sparkles,
  MessageCircle,
  Package,
  RefreshCw,
  BookmarkCheck,
  Zap,
} from 'lucide-react';

interface DriverProfile {
  id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  completed_deliveries: number;
  average_rating: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface DeliveryDetails {
  id: string;
  order_id: string;
  driver_id: string | null;
  delivery_fee: number;
  status: 'new' | 'assigned' | 'completed' | 'cancelled';
  driver_confirmed: boolean;
  driver_confirmed_at: string | null;
  customer_confirmed: boolean;
  pickup_confirmed: boolean;
  emergency_alert: string | null;
  orders: {
    order_number: number;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    city: string | null;
    notes: string | null;
    total_amount: number;
    subtotal: number | null;
    items: OrderItem[] | null;
  };
  drivers: DriverProfile | null;
}

const DRIVER_STORAGE_KEY = 'verified_delivery_driver_phone';

function DriverAcceptContent() {
  const params = useParams();
  const deliveryId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [storeCurrency, setStoreCurrency] = useState<string>('EGP');

  const [driverPhoneInput, setDriverPhoneInput] = useState<string>('');
  const [verifiedDriver, setVerifiedDriver] = useState<DriverProfile | null>(
    null,
  );
  const [submittingAccept, setSubmittingAccept] = useState<boolean>(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

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

  const [apologyModal, setApologyModal] = useState<{
    isOpen: boolean;
    reason: string;
    sending: boolean;
  }>({
    isOpen: false,
    reason: '',
    sending: false,
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const showModal = (
    type: 'success' | 'error' | 'warning',
    title: string,
    message: string,
  ) => {
    setFeedbackModal({ isOpen: true, type, title, message });
  };

  const normalizePhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('201') && digits.length === 12) {
      return '0' + digits.slice(2);
    }
    return digits;
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

  const fetchDeliveryDetails = useCallback(
    async (showLoader = true) => {
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
              notes,
              total_amount,
              subtotal,
              items
            ),
            drivers (
              id,
              full_name,
              phone,
              is_active,
              completed_deliveries,
              average_rating
            )
          `,
          )
          .eq('id', deliveryId)
          .single();

        if (error) throw error;

        const typedDelivery = data as unknown as DeliveryDetails;
        setDelivery(typedDelivery);

        const { data: settingsData } = await supabase
          .from('settings')
          .select('store_currency')
          .limit(1)
          .single();

        if (settingsData?.store_currency) {
          setStoreCurrency(settingsData.store_currency);
        }

        const savedPhone =
          typeof window !== 'undefined'
            ? localStorage.getItem(DRIVER_STORAGE_KEY)
            : null;

        if (savedPhone) {
          setDriverPhoneInput(savedPhone);
          if (
            typedDelivery.drivers &&
            normalizePhone(typedDelivery.drivers.phone) ===
              normalizePhone(savedPhone)
          ) {
            setVerifiedDriver(typedDelivery.drivers);
          }
        }
      } catch {
        if (showLoader) {
          showModal(
            'error',
            'الرابط غير صالح',
            'تعذر العثور على بيانات هذا الأوردر، يرجى التواصل مع الإدارة.',
          );
        }
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [deliveryId],
  );

  useEffect(() => {
    if (!deliveryId) return;
    fetchDeliveryDetails(true);

    const channel = supabase
      .channel(`driver-delivery-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        () => {
          fetchDeliveryDetails(false);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId, fetchDeliveryDetails]);

  const handleAcceptOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery || !driverPhoneInput.trim()) return;

    const cleanInputPhone = normalizePhone(driverPhoneInput.trim());
    if (cleanInputPhone.length < 10) {
      showModal(
        'warning',
        'رقم الهاتف ناقص',
        'من فضلك اكتب رقم تليفونك بالكامل (11 رقم) المسجل مع الإدارة.',
      );
      return;
    }

    setSubmittingAccept(true);
    try {
      const { data: driversList, error: drvError } = await supabase
        .from('drivers')
        .select('*');

      if (drvError) throw drvError;

      const matchedDriver = (driversList as DriverProfile[])?.find(
        (d) => normalizePhone(d.phone) === cleanInputPhone,
      );

      if (!matchedDriver) {
        throw new Error(
          'رقم التليفون ده مش متسجل في قائمة الكباتن. كلم الإدارة عشان يسجلوك.',
        );
      }

      if (!matchedDriver.is_active) {
        throw new Error('حسابك موقوف مؤقتاً من الإدارة. كلم المسؤول لتفعيله.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(DRIVER_STORAGE_KEY, cleanInputPhone);
      }

      if (
        delivery.status !== 'new' &&
        delivery.driver_id === matchedDriver.id
      ) {
        setVerifiedDriver(matchedDriver);
        await fetchDeliveryDetails(false);
        showModal(
          'success',
          `أهلاً بيك يا كابتن ${matchedDriver.full_name} ✓`,
          'تم التأكد إنك صاحب الأوردر ده، وكل بيانات العميل قدامك دلوقتي.',
        );
        return;
      }

      const now = new Date().toISOString();
      const { data: updatedRows, error: updateError } = await supabase
        .from('deliveries')
        .update({
          driver_id: matchedDriver.id,
          status: 'assigned',
          pickup_confirmed: false,
          emergency_alert: null,
          updated_at: now,
        })
        .eq('id', delivery.id)
        .eq('status', 'new')
        .select();

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        await fetchDeliveryDetails(false);
        throw new Error(
          'للأسف، في كابتن تاني سبقك واستلم الأوردر ده قبلك بلحظات!',
        );
      }

      setVerifiedDriver(matchedDriver);
      await fetchDeliveryDetails(false);

      showModal(
        'success',
        `ربنا يرزقك يا ${matchedDriver.full_name}!`,
        'الأوردر بقى باسمك دلوقتي، وتقدر تتصل بالعميل وتتحرك فوراً.',
      );
    } catch (err: any) {
      showModal(
        'error',
        'تعذر استلام الأوردر',
        err?.message || 'حصل خطأ بسيط، جرب تدوس تاني.',
      );
    } finally {
      setSubmittingAccept(false);
    }
  };

  // إرسال تفاصيل الرحلة والرابط لواتساب السواق الشخصي كمرجع دائم
  const handleSaveTripToDriverWhatsApp = () => {
    if (!delivery || !verifiedDriver) return;
    const ord = delivery.orders;
    const orderSubtotal = Number(ord.subtotal ?? ord.total_amount ?? 0);
    const deliveryFee = Number(delivery.delivery_fee || 0);
    const totalToCollect = orderSubtotal + deliveryFee;
    const currentUrl =
      typeof window !== 'undefined' ? window.location.href : '';

    const tripNote = [
      `📌 *بيانات أوردر التوصيل رقم #${ord.order_number}*`,
      ``,
      `👤 *اسم العميل:* ${ord.customer_name}`,
      `📞 *تليفون العميل:* ${ord.customer_phone}`,
      `📍 *العنوان:* ${ord.customer_address}${ord.city ? ` (${ord.city})` : ''}`,
      ord.notes ? `📝 *ملاحظات:* ${ord.notes}` : '',
      `💰 *هتاخد من العميل:* ${totalToCollect} ${storeCurrency}`,
      `🛵 *أجرتك في المشوار:* ${deliveryFee} ${storeCurrency}`,
      ``,
      `🔗 *اضغط على الرابط ده لما توصل عشان تأكد التسليم:*`,
      currentUrl,
    ]
      .filter(Boolean)
      .join('\n');

    const driverWa = formatWhatsAppPhone(verifiedDriver.phone);
    const waUrl = `https://wa.me/${driverWa}?text=${encodeURIComponent(
      tripNote,
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmDeliveryByDriver = async () => {
    if (!delivery || !verifiedDriver) return;
    setConfirmingDelivery(true);

    try {
      const now = new Date().toISOString();
      const isBothConfirmed = Boolean(delivery.customer_confirmed);

      const { error } = await supabase
        .from('deliveries')
        .update({
          driver_confirmed: true,
          driver_confirmed_at: now,
          status: isBothConfirmed ? 'completed' : 'assigned',
          updated_at: now,
        })
        .eq('id', delivery.id)
        .eq('driver_id', verifiedDriver.id);

      if (error) throw error;

      if (isBothConfirmed) {
        await supabase
          .from('orders')
          .update({ status: 'delivered', updated_at: now })
          .eq('id', delivery.order_id);

        await supabase
          .from('drivers')
          .update({
            completed_deliveries:
              (verifiedDriver.completed_deliveries || 0) + 1,
          })
          .eq('id', verifiedDriver.id);
      }

      setConfirmModalOpen(false);
      await fetchDeliveryDetails(false);

      showModal(
        'success',
        'تسلم إيدك يا كابتن ✓',
        isBothConfirmed
          ? 'تم تقفيل الأوردر بنجاح والمشوار اتضاف لرصيدك!'
          : 'تم تسجيل إنك سلمت الأوردر، ومستنيين تأكيد العميل عشان يتقفل نهائي.',
      );
    } catch (err: any) {
      showModal(
        'error',
        'مشكلة في التأكيد',
        err?.message || 'حصل خطأ أثناء التأكيد، جرب تاني.',
      );
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const handleSendDriverApology = async () => {
    if (!delivery || !verifiedDriver) return;
    const reasonText = apologyModal.reason.trim();
    if (!reasonText) {
      showModal(
        'warning',
        'اختار أو اكتب السبب',
        'من فضلك اختار سبب الاعتذار أو اكتبه عشان الإدارة تتصرف بسرعة.',
      );
      return;
    }

    setApologyModal((prev) => ({ ...prev, sending: true }));
    try {
      const now = new Date().toISOString();
      const alertMessage = `اعتذار من الكابتن (${verifiedDriver.full_name} - ${verifiedDriver.phone}): ${reasonText}`;

      const { error } = await supabase
        .from('deliveries')
        .update({
          emergency_alert: alertMessage,
          updated_at: now,
        })
        .eq('id', delivery.id);

      if (error) throw error;

      setApologyModal({ isOpen: false, reason: '', sending: false });
      await fetchDeliveryDetails(false);

      showModal(
        'warning',
        'وصلت رسالتك للإدارة فوراً',
        'الإدارة شافت اعتذارك دلوقتي وهيتواصلوا معاك أو يحولوا الأوردر لكابتن تاني.',
      );
    } catch (err: any) {
      setApologyModal((prev) => ({ ...prev, sending: false }));
      showModal(
        'error',
        'تعذر الإرسال',
        err?.message || 'حصل خطأ أثناء الإرسال.',
      );
    }
  };

  const handleCopyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      // تجاهل
    }
  };

  if (loading) {
    return (
      <div
        dir='rtl'
        className='min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6'
      >
        <div className='w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 animate-bounce mb-4'>
          <Truck size={34} />
        </div>
        <p className='text-lg font-black text-white'>
          جاري تحميل بيانات الأوردر...
        </p>
      </div>
    );
  }

  if (!delivery || !delivery.orders) {
    return (
      <div
        dir='rtl'
        className='min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4'
      >
        <div className='max-w-md w-full bg-[#0e1626] border border-slate-700 rounded-3xl p-7 text-center space-y-3'>
          <XCircle size={50} className='mx-auto text-rose-400' />
          <h1 className='text-xl font-black text-white'>
            الرابط ده مش شغال أو انتهى
          </h1>
          <p className='text-base text-slate-300'>
            ممكن يكون الأوردر اتلغى، راجع الإدارة لو في أي استفسار.
          </p>
        </div>
      </div>
    );
  }

  const ord = delivery.orders;
  const orderSubtotal = Number(ord.subtotal ?? ord.total_amount ?? 0);
  const deliveryFee = Number(delivery.delivery_fee || 0);
  const totalToCollect = orderSubtotal + deliveryFee;

  const isAssignedToAnotherDriver =
    delivery.status !== 'new' &&
    delivery.driver_id &&
    (!verifiedDriver || delivery.driver_id !== verifiedDriver.id);

  const isMyAssignedOrder =
    verifiedDriver && delivery.driver_id === verifiedDriver.id;

const storeAddressText =
  // 'محل عبدو استور — تواصل مع الإدارة لتأكيد العنوان التفصيلي عند الوصول';
  'محل عبدو استور — طحانوب المحطه';

const isAwaitingStorePickup =
  Boolean(isMyAssignedOrder) &&
  delivery.status === 'assigned' &&
  !delivery.pickup_confirmed;

const canViewFullCustomerDetails =
  Boolean(isMyAssignedOrder) &&
  delivery.status !== 'cancelled' &&
  (Boolean(delivery.pickup_confirmed) || delivery.status === 'completed');

  return (
    <div
      dir='rtl'
      className='min-h-screen bg-[#07090e] text-white pb-14 selection:bg-blue-600 selection:text-white'
    >
      {/* الهيدر العلوي الواضح */}
      <div className='bg-[#0e1626] border-b border-slate-800 sticky top-0 z-20 shadow-lg'>
        <div className='max-w-lg mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30'>
              <Truck size={25} />
            </div>
            <div>
              <h1 className='text-lg sm:text-xl font-black text-white'>
                أوردر رقم #{ord.order_number}
              </h1>
              <p className='text-xs sm:text-sm font-bold text-blue-400'>
                بوابة الكباتن والتوصيل السريع
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchDeliveryDetails(false)}
            className='px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-black flex items-center gap-1.5'
            title='تحديث البيانات'
          >
            <RefreshCw size={16} />
            تحديث
          </button>
        </div>
      </div>

      <div className='max-w-lg mx-auto px-4 pt-5 space-y-5'>
        {/* استيكر متحرك وجملة تحفيزية واضحة للسواق */}
        {delivery.status !== 'completed' && delivery.status !== 'cancelled' && (
          <div className='bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-500/50 rounded-2xl p-3.5 flex items-center gap-3 shadow-md'>
            <div className='w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 animate-bounce'>
              <Zap size={22} className='fill-slate-950' />
            </div>
            <div>
              <p className='text-sm sm:text-base font-black text-amber-300 leading-snug'>
                العميل مستعجل على الأوردر!
              </p>
              <p className='text-xs sm:text-sm font-bold text-amber-100/90 mt-0.5'>
                سرعة التوصيل بترفع تقييمك وبتزود أولويتك في الأوردرات الجاية ⭐
              </p>
            </div>
          </div>
        )}

        {/* بطاقة ترحيب السواق المتعرف عليه */}
        {verifiedDriver && (
          <div className='bg-[#0e1626] border-2 border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-2'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-lg shrink-0'>
                {verifiedDriver.full_name.charAt(0)}
              </div>
              <div>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-base font-black text-white'>
                    كابتن / {verifiedDriver.full_name}
                  </span>
                  {(verifiedDriver.completed_deliveries || 0) > 3 && (
                    <span className='px-2 py-0.5 rounded-lg bg-purple-600 text-white text-xs font-black flex items-center gap-1'>
                      <Sparkles size={12} /> VIP
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-3 text-sm font-bold text-slate-300 mt-1'>
                  <span>
                    مشاويرك: {verifiedDriver.completed_deliveries || 0}
                  </span>
                  <span className='text-amber-400 flex items-center gap-1'>
                    <Star size={14} className='fill-amber-400' />
                    {Number(verifiedDriver.average_rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(DRIVER_STORAGE_KEY);
                }
                setVerifiedDriver(null);
                setDriverPhoneInput('');
              }}
              className='px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-rose-400 shrink-0'
            >
              تغيير الرقم
            </button>
          </div>
        )}

        {/* الحالة A: الأوردر ملغي */}
        {delivery.status === 'cancelled' && (
          <div className='bg-rose-950/40 border-2 border-rose-500/50 rounded-3xl p-7 text-center space-y-3'>
            <XCircle size={52} className='mx-auto text-rose-400' />
            <h2 className='text-xl font-black text-white'>
              تم إلغاء هذا الأوردر
            </h2>
            <p className='text-base text-slate-200'>
              الأوردر ده اتلغى من الإدارة أو العميل ومش محتاج توصيل.
            </p>
          </div>
        )}

        {/* الحالة B: الأوردر محجوز لكابتن (أو يحتاج إدخال رقم الكابتن لفتحه) */}
        {delivery.status !== 'cancelled' && isAssignedToAnotherDriver && (
          <div className='bg-[#0e1626] border-2 border-amber-500/50 rounded-3xl p-6 text-center space-y-4'>
            <div className='w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto'>
              <ShieldCheck size={34} />
            </div>
            <h2 className='text-xl font-black text-white'>
              الأوردر ده محجوز حالياً لكابتن
            </h2>
            <p className='text-base text-slate-300 leading-relaxed'>
              لو إنت الكابتن اللي استلم أوردر #{ord.order_number}، اكتب رقم
              تليفونك تحت عشان تفتح بيانات العميل:
            </p>

            <form
              onSubmit={handleAcceptOrder}
              className='pt-3 border-t border-slate-800 space-y-3'
            >
              <input
                type='tel'
                value={driverPhoneInput}
                onChange={(e) => setDriverPhoneInput(e.target.value)}
                placeholder='اكتب رقم تليفونك هنا (010...)'
                className='w-full bg-[#090f19] border-2 border-slate-700 focus:border-blue-500 rounded-2xl px-4 py-3.5 text-lg text-white font-mono font-bold text-center outline-none'
                dir='ltr'
              />
              <button
                type='submit'
                disabled={submittingAccept}
                className='w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-base font-black text-white shadow-lg'
              >
                {submittingAccept ? 'جاري التأكد...' : 'فتح بيانات العميل الآن'}
              </button>
            </form>
          </div>
        )}

        {/* الحالة C: الأوردر متاح للاستلام (Section 1) */}
        {delivery.status === 'new' && (
          <div className='bg-[#0e1626] border-2 border-blue-500/50 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl'>
            <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
              <span className='px-3.5 py-1.5 rounded-full text-sm font-black bg-blue-600 text-white animate-pulse'>
                متاح للاستلام الآن 🚀
              </span>
              <span className='text-base font-black text-slate-200'>
                أوردر #{ord.order_number}
              </span>
            </div>

            {/* أرقام واضحة وكبيرة */}
            <div className='w-full text-center' dir='rtl'>
              <div className='bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center shadow-lg shadow-emerald-950/20'>
                <p className='text-lg sm:text-xl font-bold text-emerald-300 flex items-center justify-center gap-2'>
                  <span>أجرتك في المشوار: ✅⚡</span>
                  {/* <DollarSign size={22} className='text-emerald-400 shrink-0' /> */}
                </p>

                <p className='text-3xl sm:text-4xl font-black text-emerald-400 mt-2 tracking-tight'>
                  {deliveryFee}{' '}
                  <span className='text-xl sm:text-2xl font-extrabold text-emerald-300/90'>
                    {storeCurrency}
                  </span>
                </p>
              </div>

              {/* الكارت التاني لو حبيت ترجعه في أي وقت:
  <div className='bg-[#090f19] border-2 border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center mt-3'>
    <p className='text-base sm:text-lg font-bold text-slate-300'>
      المبلغ اللي هتستلمه:
    </p>
    <p className='text-3xl font-black text-white mt-1'>
      {totalToCollect} <span className='text-xl font-bold text-slate-400'>{storeCurrency}</span>
    </p>
  </div>
  */}
            </div>

            <div className='bg-[#090f19] border-2 border-slate-800 rounded-2xl p-4'>
              <div className='flex items-start gap-2.5'>
                <MapPin size={22} className='text-rose-400 shrink-0 mt-0.5' />
                <div>
                  <span className='text-sm font-bold text-slate-400 block'>
                    منطقة التوصيل:
                  </span>
                  <span className='font-black text-base sm:text-lg text-white leading-snug'>
                    {ord.customer_address}
                    {ord.city ? ` — ${ord.city}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* فورم إدخال رقم السواق لقبول الأوردر */}
            <form onSubmit={handleAcceptOrder} className='space-y-4 pt-1'>
              <div>
                <label className='block text-base font-black text-white mb-2'>
                  اكتب رقم تليفونك المسجل لاستلام الأوردر:
                </label>
                <input
                  type='tel'
                  required
                  value={driverPhoneInput}
                  onChange={(e) => setDriverPhoneInput(e.target.value)}
                  placeholder='01012345678'
                  dir='ltr'
                  className='w-full bg-[#090f19] border-2 border-blue-500/50 focus:border-blue-400 rounded-2xl px-4 py-4 text-xl font-mono font-black text-white text-center outline-none'
                />
              </div>

              <button
                type='submit'
                disabled={submittingAccept}
                className='w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-lg shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all'
              >
                <CheckCircle2 size={24} />
                {submittingAccept
                  ? 'جاري تسجيل الأوردر باسمك...'
                  : 'استلم الأوردر واعرض بيانات العميل'}
              </button>
            </form>
          </div>
        )}

        {/* الحالة D: الأوردر مستلم من السواق الحالي (Section 2 — كل البيانات واضحة ومكبرة) */}
        {/* المرحلة الوسطى: اذهب الآن إلى محل عبدو استور لاستلام الأوردر وتفعيل المشوار */}
        {isAwaitingStorePickup && (
          <div className='bg-gradient-to-br from-[#0e1626] via-[#131e36] to-[#0e1626] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 text-center space-y-5 shadow-2xl'>
            <div className='w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-amber-500/20'>
              <Package size={40} />
            </div>

            <div className='space-y-2.5'>
              <span className='inline-block px-3.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950'>
                خطوة استلام الأوردر من المحل
              </span>
              <h2 className='text-2xl font-black text-white leading-snug'>
                اذهب الآن إلى محل عبدو استور لاستلام الأوردر وتفعيل المشوار
              </h2>
              <p className='text-base font-bold text-slate-200 leading-relaxed'>
                الأوردر رقم{' '}
                <span className='text-amber-300 font-black'>
                  #{ord.order_number}
                </span>{' '}
                اتحجز باسمك خلاص. توجه للمحل لاستلام الشحنة، وأول ما الإدارة
                تفعّل استلامك، الصفحة هتفتحلك بيانات العميل تلقائياً في نفس
                اللحظة!
              </p>
            </div>

            {/* عنوان المحل + ملخص المشوار */}
            <div className='bg-[#090f19] border border-slate-800 rounded-2xl p-4 space-y-2.5 text-right'>
              <div className='pb-2 border-b border-slate-800 text-xs sm:text-sm font-black text-amber-300 flex items-start gap-2'>
                <MapPin size={18} className='text-amber-400 shrink-0 mt-0.5' />
                <span>عنوان المحل: {storeAddressText}</span>
              </div>
              <div className='flex items-center justify-between text-sm font-bold'>
                <span className='text-slate-400'>أجرة التوصيل:</span>
                <span className='text-emerald-400 text-lg font-black'>
                  {deliveryFee} {storeCurrency}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm font-bold'>
                <span className='text-slate-400'>منطقة العميل:</span>
                <span className='text-white font-black'>
                  {ord.customer_address}
                  {ord.city ? ` — ${ord.city}` : ''}
                </span>
              </div>
            </div>

            {/* <button
              type='button'
              onClick={handleSaveTripToDriverWhatsApp}
              className='w-full py-3.5 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border-2 border-emerald-500/60 text-emerald-200 font-black text-sm flex items-center justify-center gap-2 transition-all'
            >
              <BookmarkCheck size={20} className='text-emerald-400 shrink-0' />
              احفظ تفاصيل المشوار والرابط في واتسابك
            </button> */}

            <button
              type='button'
              dir='rtl'
              onClick={() => fetchDeliveryDetails(false)}
              className='group w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-slate-800/90 via-[#131c31] to-slate-800/90 hover:from-blue-950/60 hover:via-[#16223b] hover:to-emerald-950/60 border border-slate-700/80 hover:border-blue-500/50 text-slate-100 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-black/40 hover:shadow-blue-950/30 transition-all duration-300 active:scale-[0.98] cursor-pointer'
            >
              <RefreshCw
                size={18}
                className='text-blue-400 group-hover:text-emerald-400 group-hover:rotate-180 transition-transform duration-500 shrink-0'
              />
              <span>تحديث حالة التفعيل الآن</span>
            </button>
          </div>
        )}

        {/* المرحلة الأخيرة: عرض بيانات العميل الكاملة وأزرار التوصيل */}
        {canViewFullCustomerDetails && (
          <div className='space-y-5'>
            {delivery.emergency_alert && (
              <div className='bg-rose-950/60 border-2 border-rose-500 rounded-2xl p-4 text-sm text-rose-100 flex items-start gap-3'>
                <AlertTriangle
                  size={24}
                  className='text-rose-400 shrink-0 mt-0.5'
                />
                <div>
                  <p className='font-black text-base text-rose-300'>
                    تم إرسال اعتذارك للإدارة:
                  </p>
                  <p className='mt-1 font-bold'>{delivery.emergency_alert}</p>
                </div>
              </div>
            )}

            {delivery.status === 'completed' && (
              <div className='bg-emerald-950/50 border-2 border-emerald-500 rounded-3xl p-6 text-center space-y-2'>
                <CheckCircle2 size={50} className='mx-auto text-emerald-400' />
                <h2 className='text-xl font-black text-white'>
                  تم تسليم الأوردر بنجاح!
                </h2>
                <p className='text-base font-bold text-emerald-200'>
                  تسلم إيدك يا كابتن {verifiedDriver.full_name}، المشوار اتضاف
                  لرصيدك.
                </p>
              </div>
            )}

            {/* 1. بطاقة الحساب المالي (واضحة ومباشرة) */}
            <div className='bg-gradient-to-br from-[#0e1626] to-[#132238] border-2 border-emerald-500/60 rounded-3xl p-5 space-y-3 shadow-xl'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-base font-black text-white'>
                  هتاخد من العميل كاش:
                </span>
                <span className='px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950'>
                  الدفع عند الاستلام
                </span>
              </div>

              <div className='text-4xl font-black text-emerald-400 tracking-tight'>
                {totalToCollect} {storeCurrency}
              </div>

              <div className='pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-sm font-bold'>
                <div className='bg-[#090f19] p-2.5 rounded-xl border border-slate-800'>
                  <span className='text-slate-400 block text-xs'>
                    حساب الطلب:
                  </span>
                  <span className='text-white text-base font-black'>
                    {orderSubtotal} {storeCurrency}
                  </span>
                </div>
                <div className='bg-[#090f19] p-2.5 rounded-xl border border-slate-800'>
                  <span className='text-slate-400 block text-xs'>
                    أجرتك إنت:
                  </span>
                  <span className='text-blue-400 text-base font-black'>
                    {deliveryFee} {storeCurrency}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. زرار حفظ البيانات في واتساب السواق بلغة بسيطة ومباشرة */}
            <button
              type='button'
              onClick={handleSaveTripToDriverWhatsApp}
              className='w-full py-4 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border-2 border-emerald-500/60 text-emerald-200 flex flex-col items-center justify-center text-center gap-1 shadow-lg transition-all'
            >
              <span className='text-base font-black text-white flex items-center gap-2'>
                <BookmarkCheck
                  size={22}
                  className='text-emerald-400 shrink-0'
                />
                ابعت بيانات العميل والرابط لنفسك على الواتساب
              </span>
              <span className='text-xs font-bold text-emerald-300'>
                (اضغط هنا عشان تحفظ العنوان والرابط في شاتك لو قفلت الصفحة)
              </span>
            </button>

            {/* 3. بيانات العميل وأزرار الاتصال والخرائط */}
            <div className='bg-[#0e1626] border-2 border-slate-800 rounded-3xl p-5 space-y-4'>
              <h2 className='text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3'>
                <User size={21} className='text-blue-400' />
                بيانات العميل والعنوان
              </h2>

              <div className='space-y-4'>
                <div className='bg-[#090f19] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between'>
                  <span className='text-slate-400 text-sm font-bold'>
                    اسم العميل:
                  </span>
                  <span className='font-black text-lg text-white'>
                    {ord.customer_name}
                  </span>
                </div>

                <div className='bg-[#090f19] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between'>
                  <span className='text-slate-400 text-sm font-bold'>
                    رقم التليفون:
                  </span>
                  <span
                    className='font-mono font-black text-lg text-blue-400'
                    dir='ltr'
                  >
                    {ord.customer_phone}
                  </span>
                </div>

                {/* أزرار اتصال وواتساب كبيرة ومريحة */}
                <div className='grid grid-cols-2 gap-3'>
                  <a
                    href={`tel:${ord.customer_phone}`}
                    className='py-4 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25'
                  >
                    <Phone size={20} />
                    اتصال بالعميل
                  </a>

                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(
                      ord.customer_phone,
                    )}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='py-4 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25'
                  >
                    <MessageCircle size={20} />
                    واتساب العميل
                  </a>
                </div>

                {/* العنوان بالتفصيل + نسخ + خرائط جوجل */}
                <div className='bg-[#090f19] border-2 border-slate-800 rounded-2xl p-4 space-y-3'>
                  <div className='flex items-start gap-2.5'>
                    <MapPin
                      size={22}
                      className='text-rose-400 shrink-0 mt-0.5'
                    />
                    <div>
                      <span className='text-xs font-bold text-slate-400 block'>
                        العنوان بالتفصيل:
                      </span>
                      <span className='text-base font-black text-white leading-relaxed'>
                        {ord.customer_address}
                        {ord.city ? ` — ${ord.city}` : ''}
                      </span>
                    </div>
                  </div>

                  {ord.notes && (
                    <div className='text-sm font-bold text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-xl p-3'>
                      📝 ملحوظة من العميل: {ord.notes}
                    </div>
                  )}

                  <div className='grid grid-cols-2 gap-2.5 pt-1'>
                    <button
                      type='button'
                      onClick={() =>
                        handleCopyAddress(
                          `${ord.customer_address} ${ord.city || ''}`,
                        )
                      }
                      className='py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-black flex items-center justify-center gap-1.5'
                    >
                      {copiedAddress ? (
                        <>
                          <Check size={18} className='text-emerald-400' /> تم
                          النسخ
                        </>
                      ) : (
                        <>
                          <Copy size={18} /> نسخ العنوان
                        </>
                      )}
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${ord.customer_address} ${ord.city || ''}`,
                      )}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black flex items-center justify-center gap-1.5'
                    >
                      <Navigation size={18} />
                      افتح الخريطة
                    </a>
                  </div>
                </div>

                {/* محتويات الأوردر */}
                {/* {ord.items && ord.items.length > 0 && (
                  <div className='bg-[#090f19] border border-slate-800 rounded-2xl p-4 space-y-2'>
                    <p className='text-sm font-black text-slate-300 flex items-center gap-2'>
                      <Package size={18} className='text-blue-400' /> الحاجات
                      اللي جوه الأوردر ({ord.items.length}):
                    </p>
                    {ord.items.map((item, idx) => (
                      <div
                        key={idx}
                        className='flex items-center justify-between text-sm font-bold text-white py-1 border-b border-slate-800/60 last:border-0'
                      >
                        <span>
                          • {item.name} (العدد: {item.quantity})
                        </span>
                        <span className='font-mono text-emerald-400'>
                          {item.price * item.quantity} {storeCurrency}
                        </span>
                      </div>
                    ))}
                  </div>
                )} */}
              </div>
            </div>

            {/* 4. أزرار إنهاء المهمة أو الاعتذار */}
            {delivery.status === 'assigned' && (
              <div className='space-y-3 pt-1'>
                {delivery.driver_confirmed ? (
                  <div className='bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-5 text-center space-y-1.5'>
                    <p className='text-lg font-black text-emerald-300 flex items-center justify-center gap-2'>
                      <CheckCircle2 size={22} />
                      إنت أكدت تسليم الأوردر بنجاح ✓
                    </p>
                    <p className='text-sm font-bold text-slate-200'>
                      مستنيين العميل يدوس تأكيد من عنده عشان المشوار يتقفل
                      نهائي.
                    </p>
                  </div>
                ) : (
                  <button
                    type='button'
                    onClick={() => setConfirmModalOpen(true)}
                    className='w-full py-5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all'
                  >
                    <CheckCircle2 size={26} />
                    تم تسليم الأوردر للعميل بنجاح
                  </button>
                )}

                {!delivery.driver_confirmed && (
                  <button
                    type='button'
                    onClick={() =>
                      setApologyModal({
                        isOpen: true,
                        reason: '',
                        sending: false,
                      })
                    }
                    className='w-full py-3.5 px-4 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 border-2 border-rose-500/50 text-rose-200 font-black text-sm flex items-center justify-center gap-2 transition-colors'
                  >
                    <AlertTriangle size={19} className='text-rose-400' />
                    اعتذار عن التوصيل / حصلتلي مشكلة
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. مودال الإشعارات */}
      {feedbackModal.isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border-2 border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center'>
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                feedbackModal.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : feedbackModal.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {feedbackModal.type === 'success' && <CheckCircle2 size={36} />}
              {feedbackModal.type === 'warning' && <AlertTriangle size={36} />}
              {feedbackModal.type === 'error' && <XCircle size={36} />}
            </div>
            <h3 className='text-lg font-black text-white'>
              {feedbackModal.title}
            </h3>
            <p className='text-base text-slate-200 mt-2 leading-relaxed'>
              {feedbackModal.message}
            </p>
            <button
              onClick={() =>
                setFeedbackModal((prev) => ({ ...prev, isOpen: false }))
              }
              className='mt-6 w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base'
            >
              تمام، فهمت
            </button>
          </div>
        </div>
      )}

      {/* 2. مودال تأكيد التسليم النهائي */}
      {confirmModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border-2 border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center'>
            <div className='w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4'>
              <CheckCircle2 size={36} />
            </div>
            <h3 className='text-lg font-black text-white'>
              متأكد إنك سلمت الأوردر؟
            </h3>
            <p className='text-base text-slate-200 mt-2 leading-relaxed'>
              هل سلمت الطلب للعميل{' '}
              <span className='font-black text-white'>{ord.customer_name}</span>{' '}
              واستلمت منه{' '}
              <span className='font-black text-emerald-400'>
                {totalToCollect} {storeCurrency}
              </span>
              ؟
            </p>
            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => setConfirmModalOpen(false)}
                disabled={confirmingDelivery}
                className='flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-200 font-black text-base'
              >
                لأ، لسه
              </button>
              <button
                onClick={handleConfirmDeliveryByDriver}
                disabled={confirmingDelivery}
                className='flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base'
              >
                {confirmingDelivery ? 'ثواني...' : 'أيوه، سلمته'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. مودال الاعتذار / الطوارئ */}
      {apologyModal.isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border-2 border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4'>
            <div className='text-center'>
              <div className='w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto mb-3'>
                <AlertTriangle size={30} />
              </div>
              <h3 className='text-lg font-black text-white'>
                إبلاغ الإدارة بمشكلة أو اعتذار
              </h3>
              <p className='text-sm text-slate-300 mt-1'>
                دوس على السبب المناسب أو اكتبه تحت:
              </p>
            </div>

            <div className='flex flex-col gap-2'>
              {[
                'عطل مفاجئ في الموتوسيكل',
                'العميل مش بيرد على التليفون',
                'عنوان العميل غير واضح',
                'ظرف شخصي طارئ',
              ].map((preset) => (
                <button
                  key={preset}
                  type='button'
                  onClick={() =>
                    setApologyModal((prev) => ({ ...prev, reason: preset }))
                  }
                  className={`w-full py-2.5 px-3 rounded-xl text-sm font-black border text-right transition-colors ${
                    apologyModal.reason === preset
                      ? 'bg-rose-600/30 border-rose-500 text-white'
                      : 'bg-[#090f19] border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  • {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={apologyModal.reason}
              onChange={(e) =>
                setApologyModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder='أو اكتب السبب هنا...'
              className='w-full bg-[#090f19] border-2 border-slate-800 focus:border-rose-500 rounded-2xl p-3 text-base text-white placeholder-slate-500 outline-none'
            />

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() =>
                  setApologyModal({ isOpen: false, reason: '', sending: false })
                }
                disabled={apologyModal.sending}
                className='flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-200 font-black text-base'
              >
                رجوع
              </button>
              <button
                type='button'
                onClick={handleSendDriverApology}
                disabled={apologyModal.sending}
                className='flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base'
              >
                {apologyModal.sending ? 'بيبعت...' : 'ابعت للإدارة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriverAcceptDeliveryPage() {
  return (
    <Suspense
      fallback={
        <div
          dir='rtl'
          className='min-h-screen bg-[#07090e] text-white flex items-center justify-center p-6'
        >
          <p className='text-lg font-black text-slate-200'>
            جاري تجهيز الصفحة...
          </p>
        </div>
      }
    >
      <DriverAcceptContent />
    </Suspense>
  );
}
