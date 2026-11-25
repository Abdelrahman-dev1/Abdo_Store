'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { evaluatePromoRules, PromoRule } from '@/lib/promoEngine';
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
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  // =============================================
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');
  // =============================================
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [branchError, setBranchError] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  // const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const branchSectionRef = useRef<HTMLDivElement | null>(null);
  const [createAccount, setCreateAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const pathname = usePathname();
  const [showUpcomingHints, setShowUpcomingHints] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 30_000; // 30 ثانية إيقاف مؤقت

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!lockUntil) return;

    const updateTimer = () => {
      const diff = Math.ceil((lockUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setLockUntil(null);
        setRemainingSeconds(0);
        setFailedAttempts(0);
      } else {
        setRemainingSeconds(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const isLocked = Boolean(lockUntil && remainingSeconds > 0);
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================
  //  ============================================

  const [branches, setBranches] = useState<
    { id: string; name: string; address: string | null }[]
  >([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [orderNote, setOrderNote] = useState('');

  const [promoRules, setPromoRules] = useState<PromoRule[]>([]);

  const [clientNow, setClientNow] = useState<Date | undefined>(undefined);
  // ====================================
  // ====================================
  const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !active) {
        if (active) setCompletedOrdersCount(0);
        return;
      }

      const { data: userOrders } = await supabase
        .from('orders')
        .select('status')
        .eq('user_id', user.id);

      if (!active || !userOrders) return;

      const count = userOrders.filter(
        (o) =>
          o.status === 'delivered' ||
          o.status === 'completed' ||
          o.status === 'تم التسليم',
      ).length;

      setCompletedOrdersCount(count);
    })();

    return () => {
      active = false;
    };
  }, []);
  // ====================================

  // ====================================

  useEffect(() => {
    setClientNow(new Date());
  }, []);
  // ====================================
  // ====================================

  useEffect(() => {
    let active = true;
    (async () => {
      setBranchesLoading(true);
      const { data } = await supabase
        .from('store_branches')
        .select('id, name, address')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!active) return;
      const list = data ?? [];
      setBranches(list);

      if (list.length === 0) {
        setSelectedBranch('أونلاين فقط');
      } else if (list.length === 1) {
        setSelectedBranch(list[0].name);
      } else {
        setSelectedBranch('');
      }
      setBranchesLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // ===========================
  // ===========================
  // ===========================
  // ===========================

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('promo_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });
      if (active) setPromoRules((data ?? []) as PromoRule[]);
    })();
    return () => {
      active = false;
    };
  }, []);
  // ===========================
  // ===========================
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
          // setCity(profile.city || '');
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

  // =================================
  // =================================
  // =================================
  const totalItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cart],
  );
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ====== بداية نظام العروض والمكافآت المربوط بالسيتينج ======
  const [checkoutPromoRules, setCheckoutPromoRules] = useState<any[]>([]);
  // ========================
  // ========================
  // ========================
  const [clientTimeInfo, setClientTimeInfo] = useState<{
    todayKey: string;
    nowMinutes: number;
  } | null>(null);

  useEffect(() => {
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const updateClock = () => {
      const now = new Date();
      setClientTimeInfo({
        todayKey: dayKeys[now.getDay()],
        nowMinutes: now.getHours() * 60 + now.getMinutes(),
      });
    };

    updateClock();
    const timer = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  // ========================
  // ========================
  // ========================
  // ========================
  // ========================

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
      setCheckoutPromoRules(data ?? []);
    })();

    return () => {
      active = false;
    };
  }, []);

  const promoEvaluation = useMemo(() => {
    const currentSubtotal = Number(subtotal || 0);
    const currentItemsCount = Number(totalItemsCount || 0);
    const currentCompletedOrders = 0;

    const matchedRules: Array<{
      rule: any;
      rewardLabel: string;
      discountAmount: number;
      freeShipping: boolean;
      shippingDiscountPercent: number;
    }> = [];

    const upcomingHints: Array<{
      rule: any;
      remainingHint: string;
      progressPercent?: number;
    }> = [];

    let stopNonStackable = false;

    const todayKey = clientTimeInfo?.todayKey ?? '';
    const nowMinutes = clientTimeInfo?.nowMinutes ?? -1;

    const toMinutes = (t: string) => {
      const [h, m] = String(t || '00:00')
        .split(':')
        .map((x) => Number(x) || 0);
      return h * 60 + m;
    };

    const getRewardText = (rule: any) => {
      if (rule.custom_reward_label)
        return String(rule.custom_reward_label).trim();
      if (rule.reward_type === 'free_shipping') return 'شحن مجاني 100%';
      if (rule.reward_type === 'shipping_discount_percent')
        return `خصم ${Number(rule.reward_value ?? 50)}% على الشحن`;
      if (rule.reward_type === 'fixed_discount')
        return `خصم ${Number(rule.reward_value ?? 0)} ج`;
      if (rule.reward_type === 'percent_discount')
        return `خصم ${Number(rule.reward_value ?? 0)}%`;
      return rule.title || 'مكافأة مميزة';
    };

    for (const rule of checkoutPromoRules) {
      if (stopNonStackable && !rule.is_stackable) continue;

      const cfg = rule.condition_config || {};
      const rewardLabel = getRewardText(rule);
      const shortDesc = rule.description ? String(rule.description).trim() : '';
      let isMatched = false;
      let hintText: string | null = null;
      let progressPercent: number | undefined;

      switch (rule.condition_type) {
        case 'min_order_amount': {
          const minAmount = Math.max(0, Number(cfg.min_amount ?? 0));
          if (currentSubtotal >= minAmount) {
            isMatched = true;
          } else if (minAmount > 0) {
            const remaining = Math.max(0, minAmount - currentSubtotal);
            progressPercent = Math.min(
              100,
              Math.max(0, Math.round((currentSubtotal / minAmount) * 100)),
            );
            hintText = `زوّد طلبك بـ ${remaining} ج بس عشان تحصل على العرض (${currentSubtotal}/${minAmount} ج)`;
          }
          break;
        }

        case 'min_items_count': {
          const minItems = Math.max(1, Number(cfg.min_items ?? 1));
          if (currentItemsCount >= minItems) {
            isMatched = true;
          } else {
            const remaining = Math.max(0, minItems - currentItemsCount);
            progressPercent = Math.min(
              100,
              Math.max(0, Math.round((currentItemsCount / minItems) * 100)),
            );
            hintText = `ناقصلك ${remaining} ${
              remaining === 1 ? 'قطعة واحدة' : 'قطع'
            } في السلة لتفعيل العرض (${currentItemsCount}/${minItems} قطع)`;
          }
          break;
        }

        case 'days_of_week': {
          const days: string[] = Array.isArray(cfg.days) ? cfg.days : [];
          if (days.includes(todayKey)) {
            isMatched = true;
          } else if (days.length > 0) {
            hintText = 'هذا العرض متاح في أيام محددة من الأسبوع';
          }
          break;
        }

        case 'time_window': {
          const startM = toMinutes(cfg.start_hour ?? '00:00');
          const endM = toMinutes(cfg.end_hour ?? '05:00');
          const inside =
            startM <= endM
              ? nowMinutes >= startM && nowMinutes <= endM
              : nowMinutes >= startM || nowMinutes <= endM;
          if (inside) {
            isMatched = true;
          } else {
            hintText = `متاح يومياً من الساعة ${cfg.start_hour ?? '00:00'} إلى ${cfg.end_hour ?? '05:00'}`;
          }
          break;
        }

        case 'first_order': {
          if (currentCompletedOrders === 0) {
            isMatched = true;
          } else {
            hintText = 'عرض مخصص لأول طلب للعميل الجديد';
          }
          break;
        }

        case 'completed_orders_cycle': {
          const req = Math.max(1, Number(cfg.required_completed ?? 5));
          const freeOn = Math.max(
            req + 1,
            Number(cfg.free_on_order_number ?? req + 1),
          );
          if (
            currentCompletedOrders + 1 >= freeOn &&
            currentCompletedOrders >= req
          ) {
            isMatched = true;
          } else {
            const left = Math.max(0, req - currentCompletedOrders);
            progressPercent = Math.min(
              100,
              Math.max(0, Math.round((currentCompletedOrders / req) * 100)),
            );
            hintText = `متبقي ${left} ${
              left === 1 ? 'طلب مكتمل' : 'طلبات مكتملة'
            } للوصول لمكافأة الولاء`;
          }
          break;
        }

        case 'custom_manual': {
          const freeCondition =
            rule.custom_condition_label ||
            (cfg.note ? String(cfg.note).trim() : '') ||
            shortDesc ||
            'عرض خاص من المتجر';

          const explicitMinItems = Number(cfg.min_items || 0);
          const numbersInText = (
            `${freeCondition} ${shortDesc} ${rule.title || ''}`.match(/\d+/g) ||
            []
          )
            .map((n) => Number(n))
            .filter((n) => n > 0 && n <= 100);

          const targetItems =
            explicitMinItems > 0
              ? explicitMinItems
              : numbersInText.length > 0
                ? Math.max(...numbersInText)
                : 0;

          if (targetItems > 0) {
            if (currentItemsCount >= targetItems) {
              isMatched = true;
            } else {
              const left = Math.max(0, targetItems - currentItemsCount);
              progressPercent = Math.min(
                100,
                Math.max(
                  0,
                  Math.round((currentItemsCount / targetItems) * 100),
                ),
              );
              hintText = `${freeCondition} — ناقصلك ${left} ${
                left === 1 ? 'قطعة واحدة' : 'قطع'
              } (${currentItemsCount}/${targetItems})`;
            }
          } else {
            hintText = freeCondition;
          }
          break;
        }

        default: {
          hintText =
            rule.custom_condition_label ||
            (cfg.note ? String(cfg.note).trim() : '') ||
            shortDesc;
          break;
        }
      }

      if (isMatched) {
        let discountAmount = 0;
        let freeShipping = false;
        let shippingDiscountPercent = 0;

        if (rule.reward_type === 'free_shipping') {
          freeShipping = true;
          shippingDiscountPercent = 100;
        } else if (rule.reward_type === 'shipping_discount_percent') {
          shippingDiscountPercent = Math.min(
            100,
            Math.max(0, Number(rule.reward_value ?? 0)),
          );
        } else if (rule.reward_type === 'fixed_discount') {
          discountAmount = Math.max(0, Number(rule.reward_value ?? 0));
        } else if (rule.reward_type === 'percent_discount') {
          const pct = Math.min(
            100,
            Math.max(0, Number(rule.reward_value ?? 0)),
          );
          discountAmount = Math.round((currentSubtotal * pct) / 100);
        }

        matchedRules.push({
          rule,
          rewardLabel,
          discountAmount,
          freeShipping,
          shippingDiscountPercent,
        });

        if (!rule.is_stackable) {
          stopNonStackable = true;
        }
      } else if (hintText) {
        upcomingHints.push({
          rule,
          remainingHint: hintText,
          progressPercent,
        });
      }
    }

    return {
      matchedRules,
      upcomingHints,
      totalDiscount: matchedRules.reduce((sum, r) => sum + r.discountAmount, 0),
      hasFreeShipping: matchedRules.some((r) => r.freeShipping),
      shippingDiscountPercent: matchedRules.reduce(
        (max, r) => Math.max(max, r.shippingDiscountPercent),
        0,
      ),
    };
  }, [checkoutPromoRules, subtotal, totalItemsCount, clientTimeInfo]);

  // ====== نهاية نظام العروض والمكافآت ======
  // ==================================
  // ==================================
  // ==================================
  const totalAmount = Math.max(0, subtotal - promoEvaluation.totalDiscount);
  // ==================================
  // ==================================

  // const [showUpcomingHints, setShowUpcomingHints] = useState(false);

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
      setCheckoutPromoRules(data ?? []);
    })();

    return () => {
      active = false;
    };
  }, []);

  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================

  // =================================
  // =================================
  // =================================
  // =================================
  const scrollToBranchSection = () => {
    requestAnimationFrame(() => {
      const el = branchSectionRef.current;
      if (!el) return;

      // البحث عن أقرب حاوية قابلة للتمرير رأسياً إن وجدت
      let parent: HTMLElement | null = el.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const canScrollY =
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          parent.scrollHeight > parent.clientHeight;

        if (canScrollY) {
          const parentRect = parent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const targetTop =
            parent.scrollTop +
            (elRect.top - parentRect.top) -
            parent.clientHeight / 2 +
            elRect.height / 2;

          parent.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth',
          });
          return;
        }
        parent = parent.parentElement;
      }

      // التمرير الطبيعي في الصفحة
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
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
  // دالة تأكيد الطلب المضمونة والآمنة 100%
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (branches.length > 0 && !selectedBranch) {
      setBranchError(true);
      scrollToBranchSection();
      return;
    }
    setBranchError(false);

    if (branches.length > 0 && !selectedBranch) {
      setBranchError(true);
      requestAnimationFrame(() => {
        branchSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
      return;
    }
    setBranchError(false);

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
            // city,
            address,
          });
        }
      }

      // تم إزالة customer_notes ليتوافق تماماً مع جدول orders الحالي في سوبابيز
      const orderData = {
        user_id: userId,
        customer_name: fullName,
        customer_phone: phone,
        branch_name: selectedBranch || null,
        customer_email: currentUser?.email || email || '',
        // city: city || 'Not specified',
        customer_address: address,
        customer_notes: orderNote.trim() || null,
        items: cart,
        subtotal,
        // shipping_cost: shippingFee,
        total_amount: totalAmount,
        payment_method: 'Cash on Delivery',
        payment_status: 'Unpaid',
        delivery_method: 'Standard Delivery',
        status: 'pending',
      };

      // 1. حفظ الطلب في قاعدة البيانات Supabase بنجاح تام
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

      const orderNum = insertedOrder?.order_number
        ? `#${insertedOrder.order_number}`
        : insertedOrder?.id
          ? `#${String(insertedOrder.id).slice(0, 6)}`
          : '';
      setCreatedOrderNumber(orderNum);

      // 1.5. تنقيص كمية الستوك لكل منتج في السلة بأمان
      try {
        for (const item of cart) {
          const productId = item.id || item.product_id;
          const qtyBought = Number(item.quantity ?? item.qty ?? 1);

          if (productId && qtyBought > 0) {
            const { error: stockError } = await supabase.rpc(
              'adjust_product_stock',
              {
                p_product_id: productId,
                p_delta: -Math.abs(qtyBought),
              },
            );

            if (stockError) {
              console.error(
                `Failed to decrease stock for product ${productId}:`,
                stockError,
              );
            }
          }
        }
      } catch (stockErr) {
        console.error('Stock adjustment error:', stockErr);
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
  // =================================
  // =================================
  const whatsappMessageLines = [
    'السلام عليكم، لسه عاملين أوردر حالاً وحابين نأكد عليه لسرعة التجهيز والتوصيل.',
    createdOrderNumber ? `رقم الطلب: ${createdOrderNumber}` : '',
    fullName.trim() ? `الاسم: ${fullName.trim()}` : '',
    phone.trim() ? `رقم الهاتف: ${phone.trim()}` : '',
    address.trim() ? `العنوان: ${address.trim()}` : '',
  ].filter(Boolean);

  const whatsappHref = `https://wa.me/201016605189?text=${encodeURIComponent(
    whatsappMessageLines.join('\n'),
  )}`;
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

        <div
          dir='rtl'
          className='relative z-10 bg-[#0e1626]/90 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full text-center space-y-6'
        >
          {/* Success Icon */}
          <div className='w-20 h-20 bg-emerald-950/60 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/40 animate-bounce'>
            <CheckCircle2 size={40} />
          </div>

          {/* Title & Description */}
          <div className='space-y-2'>
            <h1 className='text-2xl font-black text-white'>
              تم استلام طلبك بنجاح! 🎉
            </h1>
            <p className='text-xs text-slate-400 leading-relaxed'>
              شكراً لتسوقك معنا! سنتواصل معك في أقرب وقت لتأكيد تفاصيل التوصيل.
            </p>
          </div>

          {/* Action Buttons Section */}
          <div className='space-y-3 w-full'>
            {/* Return to Store Button */}
            <Link
              href='/'
              onClick={() => {
                setSuccess(false);
                setErrorMessage(null);
              }}
              className='w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl block shadow-lg shadow-red-950/50 transition cursor-pointer'
            >
              Return to Store
            </Link>
            {/* WhatsApp Support / Follow-up Banner */}
            <div className='flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-[#0c1017] border border-slate-800/80 text-xs'>
              <span className='text-slate-300 text-[11px] sm:text-xs text-center sm:text-right leading-relaxed font-medium'>
                لسرعة الطلب وتأكيد الأوردر مباشرة، تواصل معنا:
              </span>

              <a
                href={whatsappHref}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600/25 to-teal-600/25 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 shadow-md shadow-emerald-950/40 group transform hover:scale-[1.02] shrink-0 w-full sm:w-auto'
              >
                <div className='w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow group-hover:rotate-12 transition-transform duration-300'>
                  {/* WhatsApp SVG Icon */}
                  <svg className='w-3 h-3 fill-current' viewBox='0 0 24 24'>
                    <path d='M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z' />
                  </svg>
                </div>
                <span dir='ltr' className='tracking-wide'>
                  +20 101 660 5189
                </span>
              </a>
            </div>
          </div>
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

      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 fixed top-0 inset-x-0 z-50'>
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
                src='/fav-me-3.webp'
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
        <div className='mb-8 mt-15'>
          <h1 className='text-2xl sm:text-3xl font-black text-white tracking-tight'>
            Checkout & Shipping
          </h1>
          <p
            className='text-xs sm:text-sm text-blue-300/90 mt-1.5 flex  gap-2 font-medium'
            dir=''
          >
            <span className='inline-flex items-center justify-center p-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 animate-pulse'>
              <Truck className='w-3 h-3' />
            </span>
            <span>أدخل بيانات التوصيل بدقة لإتمام طلبك وتأكيد الشحن</span>
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
              <span>بيانات التوصيل</span>
            </h2>

            {!currentUser ? (
              <div className='bg-[#0e1626]/90 backdrop-blur-xl p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800/90 shadow-2xl space-y-3.5 sm:space-y-4'>
                <label className='relative flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0e1626] to-slate-900/90 border border-blue-500/40 hover:border-red-500/60 shadow-lg shadow-blue-950/25 cursor-pointer select-none transition-all duration-300 group hover:scale-[1.005]'>
                  <input
                    type='checkbox'
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    className='sr-only peer'
                  />
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 border-2 shrink-0 ${
                      createAccount
                        ? 'bg-gradient-to-tr from-red-600 to-blue-600 border-transparent shadow-md shadow-blue-500/30 scale-105'
                        : 'bg-slate-800/80 border-slate-600 group-hover:border-blue-400 animate-pulse'
                    }`}
                  >
                    {createAccount && (
                      <Check
                        size={16}
                        className='text-white stroke-[3] transition-transform duration-200 scale-100'
                      />
                    )}
                  </div>

                  <div className='flex-1 flex items-center gap-2.5 sm:gap-3 min-w-0'>
                    <div className='p-2 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:text-red-400 group-hover:scale-105 transition-all duration-300 shrink-0'>
                      <UserPlus size={18} />
                    </div>
                    <div className='flex-1 flex items-center justify-between gap-2.5 min-w-0'>
                      <div className='text-left min-w-0' dir='ltr'>
                        <span className='text-xs sm:text-sm font-bold bg-gradient-to-r from-white via-sky-200 to-blue-300 bg-clip-text text-transparent block tracking-tight leading-snug'>
                          تسجيل الدخول اختياري • أنشئ حسابك بسهولة
                        </span>
                        <span className='text-[11px] sm:text-xs text-slate-300/90 block mt-0.5 leading-snug'>
                          تابع شحناتك واحفظ سلتك ومفضلتك وسجل طلباتك ومكافآتك في
                          مكان واحد.
                        </span>
                      </div>

                      {/* أيقونة تفاعلية تشجع على الضغط وتدور عند الفتح */}
                      <div
                        className={`p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 shrink-0 transition-transform duration-300 ${
                          createAccount
                            ? 'rotate-180 text-red-400 border-red-500/30'
                            : 'animate-bounce'
                        }`}
                      >
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </label>

                {createAccount && (
                  <div className='space-y-3 sm:space-y-3.5 pt-3 sm:pt-4 border-t border-slate-800 transition-all duration-300'>
                    <button
                      type='button'
                      disabled={isSubmitting || isLocked}
                      onClick={handleGoogleLogin}
                      className='w-full py-2.5 sm:py-3 bg-[#141d2f] border border-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm cursor-pointer active:scale-[0.99]'
                    >
                      <svg className='w-4 h-4 shrink-0' viewBox='0 0 24 24'>
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

                    <div className='relative flex py-0.5 items-center'>
                      <div className='flex-grow border-t border-slate-800'></div>
                      <span className='flex-shrink mx-3 text-slate-500 text-[10px] uppercase font-semibold'>
                        Or with Email
                      </span>
                      <div className='flex-grow border-t border-slate-800'></div>
                    </div>

                    <div>
                      <label className='block text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5'>
                        Email Address *
                      </label>
                      <div className='relative'>
                        <input
                          type='email'
                          value={email}
                          disabled={isSubmitting || isLocked}
                          onChange={(e) => setEmail(e.target.value.trimStart())}
                          autoComplete='email'
                          maxLength={120}
                          className='w-full px-3.5 py-2.5 pl-10 bg-[#141d2f] border border-slate-700/80 disabled:opacity-60 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200'
                          placeholder='name@example.com'
                        />
                        <Mail className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors' />
                      </div>
                    </div>

                    <div>
                      <label className='block text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5'>
                        Account Password *
                      </label>
                      <div className='relative'>
                        <input
                          type='password'
                          value={password}
                          disabled={isSubmitting || isLocked}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete='new-password'
                          maxLength={128}
                          className='w-full px-3.5 py-2.5 pl-10 bg-[#141d2f] border border-slate-700/80 disabled:opacity-60 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200'
                          placeholder='••••••••'
                        />
                        <Lock className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors' />
                      </div>
                    </div>

                    {isLocked && (
                      <p
                        className='text-[11px] text-center text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg py-1.5 px-2.5'
                        dir='rtl'
                      >
                        تم إيقاف المحاولات مؤقتاً، حاول بعد{' '}
                        <span className='font-bold'>{remainingSeconds}</span>{' '}
                        ثانية.
                      </p>
                    )}

                    <button
                      type='button'
                      disabled={isSubmitting || isLocked}
                      onClick={async () => {
                        if (isLocked) {
                          showToast(
                            `محاولات كثيرة خاطئة، انتظر ${remainingSeconds} ثانية.`,
                            3500,
                          );
                          return;
                        }

                        const cleanEmail = email.trim();
                        if (!cleanEmail || !password) {
                          showToast(
                            'من فضلك أدخل البريد الإلكتروني وكلمة المرور.',
                            3500,
                          );
                          return;
                        }

                        if (password.length < 6) {
                          showToast('كلمة المرور يجب ألا تقل عن 6 أحرف.', 3500);
                          return;
                        }

                        setIsSubmitting(true);
                        try {
                          let { data, error } = await supabase.auth.signUp({
                            email: cleanEmail,
                            password,
                          });

                          if (
                            error &&
                            error.message
                              .toLowerCase()
                              .includes('already registered')
                          ) {
                            const signInRes =
                              await supabase.auth.signInWithPassword({
                                email: cleanEmail,
                                password,
                              });
                            data = signInRes.data;
                            error = signInRes.error;
                          }

                          if (error) {
                            const nextAttempts = failedAttempts + 1;
                            setFailedAttempts(nextAttempts);

                            if (nextAttempts >= MAX_ATTEMPTS) {
                              setLockUntil(Date.now() + LOCK_DURATION_MS);
                              showToast(
                                'تم إدخال بيانات خاطئة عدة مرات، تم إيقاف المحاولات لمدة 30 ثانية.',
                                4000,
                              );
                            } else {
                              showToast(
                                'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
                                3500,
                              );
                            }
                            return;
                          }

                          setFailedAttempts(0);
                          setLockUntil(null);

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
                              if (profile.address) setAddress(profile.address);
                            }

                            router.refresh();
                            showToast(
                              'تم تسجيل الدخول وتجهيز حسابك بنجاح! 🎉',
                              3000,
                            );
                          }
                        } catch {
                          showToast(
                            'حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.',
                            3500,
                          );
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className='w-full py-2.5 sm:py-3 bg-blue-600/30 hover:bg-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/50 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md group active:scale-[0.99]'
                    >
                      <ShieldCheck
                        size={16}
                        className='text-blue-400 group-hover:scale-110 transition-transform duration-200'
                      />
                      <span>
                        {isSubmitting
                          ? 'جاري التحقق...'
                          : isLocked
                            ? `انتظر ${remainingSeconds} ثانية`
                            : 'Save Email & Sign In Now 🔒'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className='bg-emerald-950/40 border border-emerald-500/40 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl text-xs text-emerald-300 flex items-center justify-between gap-3 backdrop-blur-md shadow-lg transition-all duration-300'>
                <span className='font-medium leading-snug flex items-center flex-wrap gap-1.5'>
                  <span
                    className='inline-block animate-pulse'
                    aria-hidden='true'
                  >
                    ✔⚡
                  </span>
                  <span>تم تسجيل الدخول بحساب </span>
                  <strong className='text-white break-all'>
                    {currentUser.email}
                  </strong>

                  <span> 🛡️ بياناتك محفوظة لإتمام الطلب فوراً</span>
                </span>
                <Link
                  href='/profile'
                  className='underline font-bold text-emerald-400 hover:text-white transition shrink-0'
                >
                  Edit Profile
                </Link>
              </div>
            )}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
            {/* ================================================ */}
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
                placeholder='المحافظة - المركز / المدينة - القرية / الحي - الشارع ورقم العقار'
                // placeholder='Governorate - Center/City - Village/District - Street & Building No.'
              />
            </div>
          </div>

          {/* ======================== */}
          {/* ======================== */}
          {/* ======================== */}
          {/* ======================== */}
          {/* ======================== */}
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
                            title='إزالة المنتج'
                            className='w-7 h-7 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all duration-200 cursor-pointer shadow-sm'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='w-3.5 h-3.5'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                              strokeWidth='2'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-8 text-slate-400 text-xs'>
                Your cart is empty.{' '}
                <Link href='/' className='text-blue-400 underline'>
                  Shop Now
                </Link>
              </div>
            )}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* اختيار الفرع (مربوط بـ store_branches في السيتينج + خيار أونلاين دايماً) */}
            {/* ==================================== */}
            {/* اختيار الفرع (مربوط بـ store_branches في السيتينج + خيار أونلاين دايماً) */}
            <div ref={branchSectionRef} className='space-y-2 relative z-10'>
              <div className='flex items-center justify-between gap-2'>
                <label className='block text-xs font-bold text-slate-200'>
                  اختر الفرع <span className='text-rose-400'>*</span>
                </label>
                {selectedBranch && (
                  <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-400/35 shadow-sm shadow-cyan-500/10 transition-all duration-300'>
                    {selectedBranch === 'أونلاين فقط'
                      ? '🌐 أونلاين'
                      : '🏢 فرع محدد'}
                  </span>
                )}
              </div>

              {branchesLoading ? (
                <div className='rounded-xl border border-slate-700/80 bg-[#090f19]/85 px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-cyan-400 animate-ping' />
                  <span>جاري تحميل بيانات الفروع...</span>
                </div>
              ) : branches.length === 0 ? (
                <div className='flex items-center justify-between rounded-xl border border-blue-500/35 bg-gradient-to-r from-red-500/10 via-[#090f19] to-cyan-500/15 px-3.5 py-2.5 text-xs font-bold text-blue-200 transition-all duration-300'>
                  <span>🌐 أونلاين فقط</span>
                  <span className='rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 text-[10px] text-cyan-200'>
                    مثبّت تلقائيًا
                  </span>
                </div>
              ) : (
                <button
                  type='button'
                  onClick={() => setIsBranchModalOpen(true)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-left transition-all duration-300 flex items-center justify-between gap-2 shadow-inner group cursor-pointer active:scale-[0.99] ${
                    branchError
                      ? 'border-rose-500/80 bg-rose-950/20 focus:border-rose-400'
                      : 'border-slate-700/90 hover:border-cyan-400/60 bg-gradient-to-r from-[#090f19] via-[#0d1628] to-[#090f19]'
                  }`}
                >
                  <span
                    className={
                      selectedBranch
                        ? 'text-white font-semibold truncate'
                        : 'text-slate-400 truncate'
                    }
                  >
                    {selectedBranch ||
                      '-- اختر الفرع لتسهل علينا طريقه التوصيل --'}
                  </span>

                  <span className='shrink-0 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-600/25 via-blue-600/25 to-cyan-500/25 group-hover:from-red-600/40 group-hover:to-cyan-500/40 border border-cyan-400/30 px-2.5 py-1 text-[11px] font-bold text-cyan-200 transition-all duration-300'>
                    <span>اختيار</span>
                    <span className='transition-transform duration-300 group-hover:translate-x-0.5'>
                      ▾
                    </span>
                  </span>
                </button>
              )}

              {/* تنبيه بسيط عند عدم اختيار الفرع */}
              {branchError && (
                <div className='flex items-center gap-2 rounded-xl border border-rose-500/45 bg-gradient-to-r from-rose-950/60 via-rose-900/30 to-transparent px-3 py-2 text-[11px] sm:text-xs font-semibold text-rose-200 animate-in fade-in duration-200'>
                  <span className='text-sm leading-none shrink-0'>⚠️</span>
                  <span>من فضلك اختر الفرع أولاً قبل تأكيد الطلب.</span>
                </div>
              )}

              <div className='rounded-xl bg-[#090f19]/75 border border-slate-800/90 hover:border-cyan-500/25 px-3 py-2 transition-all duration-300 flex items-start gap-2'>
                <span className='text-sm leading-none mt-0.5 shrink-0 animate-bounce [animation-duration:2.6s]'>
                  💡
                </span>
                <p className='text-[11px] sm:text-xs text-slate-300 leading-relaxed'>
                  اختر الفرع الأقرب ليك، ولو مكانك بعيد عن فروعنا مثل محافظات
                  مختلفه اختر{' '}
                  <strong className='text-cyan-300 font-bold underline decoration-cyan-500/40 underline-offset-2'>
                    أونلاين فقط
                  </strong>
                  .
                </p>
              </div>
            </div>
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}

            {/* خانة تعليق / ملاحظات مع الأوردر (اختياري) */}
            <div className='space-y-1.5 relative z-10'>
              <label className='flex items-center justify-between text-xs font-bold text-slate-200'>
                <span>ملاحظات مع الأوردر</span>
                <span className='text-[10px] font-semibold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800'>
                  اختياري
                </span>
              </label>
              <textarea
                rows={2}
                maxLength={300}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder='مثال: يرجى الاتصال عند الوصول، أو إضافة أي تعليمات خاصة بالطلب...'
                className='w-full resize-none rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400'
              />
            </div>
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {(promoEvaluation.matchedRules.length > 0 ||
              promoEvaluation.upcomingHints.length > 0) && (
              <div className='group/promo relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#131d32] via-[#0d1524] to-[#121c30] p-3 sm:p-3.5 shadow-lg shadow-black/30 transition-all duration-300 hover:border-cyan-400/45 space-y-2.5'>
                {/* شريط علوي أنيق */}
                <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 opacity-90' />

                {/* هالة خفيفة */}
                <div className='pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl transition-transform duration-500 group-hover/promo:scale-125' />

                {/* العروض المتحققة بالفعل */}
                {promoEvaluation.matchedRules.length > 0 && (
                  <div className='relative z-10 space-y-1.5'>
                    <div className='flex items-center gap-1.5'>
                      <span className='inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-xs animate-bounce'>
                        🎉
                      </span>
                      <h4 className='text-[11px] sm:text-xs font-black text-emerald-300'>
                        عروض ومكافآت مفعّلة (
                        {promoEvaluation.matchedRules.length})
                      </h4>
                    </div>

                    <div className='max-h-44 overflow-y-auto pr-0.5 space-y-1.5'>
                      {promoEvaluation.matchedRules.map((item) => (
                        <div
                          key={item.rule.id}
                          className='rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-2 space-y-1 transition-all duration-200 hover:border-emerald-400/55'
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <span className='text-[11px] sm:text-xs font-black text-white truncate'>
                              {item.rule.title}
                            </span>
                            <span className='shrink-0 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[9.5px] font-extrabold text-emerald-200'>
                              {item.rewardLabel}
                            </span>
                          </div>

                          {item.rule.description && (
                            <p className='text-[10px] text-sky-200/90 leading-snug border-r-2 border-sky-400/50 pr-2'>
                              {item.rule.description}
                            </p>
                          )}

                          <p className='text-[10.5px] sm:text-[11px] font-bold text-emerald-200 leading-snug'>
                            {item.rule.customer_message ||
                              'تم استيفاء شرط العرض وسيتم تطبيقه على طلبك.'}
                          </p>

                          <div className='h-1 w-full overflow-hidden rounded-full bg-slate-800'>
                            <div className='h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400' />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* العروض القريبة / الإضافية بشريط تقدم وسكرول داخلي */}
                {promoEvaluation.upcomingHints.length > 0 && (
                  <div className='relative z-10 space-y-2'>
                    <button
                      type='button'
                      onClick={() => setShowUpcomingHints((prev) => !prev)}
                      className='group/btn flex w-full items-center justify-between gap-2 rounded-xl border border-cyan-400/35 bg-gradient-to-r from-cyan-500/12 via-indigo-500/10 to-emerald-500/12 hover:from-cyan-500/20 hover:to-emerald-500/20 px-3 py-2 text-[11px] sm:text-xs font-black text-cyan-100 transition-all duration-200 cursor-pointer active:scale-[0.99]'
                    >
                      <span className='flex items-center gap-2 min-w-0'>
                        <span className='inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 border border-amber-300/30 text-xs animate-bounce'>
                          🎁
                        </span>
                        <span className='truncate'>
                          عروض ومكافآت إضافية متاحة (
                          {promoEvaluation.upcomingHints.length})
                        </span>
                      </span>

                      <span className='inline-flex shrink-0 items-center gap-1 rounded-lg bg-cyan-500/20 border border-cyan-300/35 px-2 py-0.5 text-[10px] font-black text-cyan-100'>
                        <span>{showUpcomingHints ? 'إخفاء' : 'اكتشف'}</span>
                        <span
                          className={`text-[10px] transition-transform duration-300 ${
                            showUpcomingHints
                              ? 'rotate-180 text-rose-300'
                              : 'animate-bounce text-amber-300'
                          }`}
                        >
                          ▼
                        </span>
                      </span>
                    </button>

                    {showUpcomingHints && (
                      <div className='max-h-60 sm:max-h-64 overflow-y-auto pr-0.5 space-y-2 pt-0.5'>
                        {promoEvaluation.upcomingHints.map((hint, idx) => {
                          const rewardText =
                            hint.rule.custom_reward_label ||
                            (hint.rule.reward_type === 'free_shipping'
                              ? 'شحن مجاني'
                              : hint.rule.reward_type ===
                                  'shipping_discount_percent'
                                ? `خصم ${Number(hint.rule.reward_value ?? 50)}% على الشحن`
                                : hint.rule.reward_type === 'fixed_discount'
                                  ? `خصم ${Number(hint.rule.reward_value ?? 0)} ج`
                                  : hint.rule.reward_type === 'percent_discount'
                                    ? `خصم ${Number(hint.rule.reward_value ?? 0)}%`
                                    : hint.rule.title);

                          const pct =
                            typeof hint.progressPercent === 'number'
                              ? hint.progressPercent
                              : null;

                          const isMissingAlert = /ناقصلك|متبقي|زوّد/i.test(
                            String(hint.remainingHint || ''),
                          );

                          const cardStyle = [
                            {
                              border:
                                'border-cyan-400/30 hover:border-cyan-300/55',
                              badge:
                                'border-cyan-400/40 bg-cyan-500/15 text-cyan-200',
                              bar: 'from-cyan-400 via-sky-400 to-blue-500',
                              percentText: 'text-cyan-300',
                              missingText: 'text-amber-300',
                              icon: '⚡',
                            },
                            {
                              border:
                                'border-emerald-400/30 hover:border-emerald-300/55',
                              badge:
                                'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
                              bar: 'from-emerald-400 via-teal-300 to-cyan-400',
                              percentText: 'text-emerald-300',
                              missingText: 'text-rose-300',
                              icon: '⚡',
                            },
                            {
                              border:
                                'border-amber-400/30 hover:border-amber-300/55',
                              badge:
                                'border-amber-400/40 bg-amber-500/15 text-amber-200',
                              bar: 'from-amber-400 via-orange-400 to-rose-400',
                              percentText: 'text-amber-300',
                              missingText: 'text-cyan-200',
                              icon: '⚡',
                            },
                          ][idx % 3];

                          return (
                            <div
                              key={hint.rule.id}
                              className={`group/card rounded-xl border ${cardStyle.border} bg-gradient-to-br from-[#152036] to-[#0f1829] p-2.5 space-y-1.5 transition-all duration-200 hover:border-opacity-80`}
                            >
                              {/* 1. اسم القاعدة + بادج المكافأة */}
                              <div className='flex items-center justify-between gap-2 pb-1 border-b border-slate-800/80'>
                                <span className='flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-white truncate'>
                                  <span className='text-xs group-hover/card:scale-110 transition-transform'>
                                    {cardStyle.icon}
                                  </span>
                                  <span className='truncate'>
                                    {hint.rule.title}
                                  </span>
                                </span>
                                <span
                                  className={`shrink-0 rounded-md border ${cardStyle.badge} px-2 py-0.5 text-[9.5px] font-extrabold`}
                                >
                                  {rewardText}
                                </span>
                              </div>

                              {/* 2. الوصف المختصر (لو موجود) */}
                              {hint.rule.description && (
                                <p className='text-[10px] text-slate-300 leading-snug bg-slate-900/60 rounded-md px-2 py-1 border-r-2 border-cyan-400/50'>
                                  {hint.rule.description}
                                </p>
                              )}

                              {/* 3. جملة الشرط / المتبقي بلون واضح ومميز */}
                              <p
                                className={`text-[10.5px] sm:text-[11px] font-extrabold leading-snug ${
                                  isMissingAlert
                                    ? cardStyle.missingText
                                    : 'text-slate-100'
                                }`}
                              >
                                {hint.remainingHint}
                              </p>

                              {/* 4. شريط التقدم */}
                              {pct !== null && (
                                <div className='space-y-1 pt-0.5'>
                                  <div className='flex items-center justify-between text-[9.5px] font-bold text-slate-300'>
                                    <span>نسبة التقدم</span>
                                    <span className={cardStyle.percentText}>
                                      {pct}%
                                    </span>
                                  </div>
                                  <div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-800/95 p-[1px]'>
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${cardStyle.bar} transition-all duration-500`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ==================================== */}
            {/* ملخص الفاتورة */}
            <div className='space-y-2 pt-4 border-t border-slate-800/80 text-xs text-slate-300 relative z-10'>
              <div className='flex justify-between'>
                <span>Subtotal</span>
                <span className='font-bold text-white'>{subtotal} EGP</span>
              </div>

              <div className='flex items-center justify-between gap-1.5 sm:gap-2 min-w-0'>
                <span className='text-[10px] sm:text-xs text-slate-400 font-medium shrink-0'>
                  Shipping Fee:
                </span>
                <span className='text-[8px] sm:text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-[2px] sm:px-2 sm:py-0.5 rounded-[4px] sm:rounded-lg leading-none whitespace-nowrap'>
                  يُحسب عند الاستلام
                </span>
              </div>

              <div className='pt-2 border-t border-slate-800 space-y-1'>
                <div className='flex justify-between text-sm font-black text-white'>
                  <span>Total Amount</span>
                  <span className='text-emerald-400'>{totalAmount} EGP</span>
                </div>

                {promoEvaluation.totalDiscount > 0 && (
                  <div className='flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/25 px-2.5 py-1 text-[10.5px] font-bold text-emerald-200'>
                    <span>✅ تم تفعيل الخصم</span>
                    <span>
                      بدلاً من{' '}
                      <span className='line-through text-slate-400'>
                        {subtotal} EGP
                      </span>{' '}
                      بقى{' '}
                      <span className='text-emerald-300 font-black'>
                        {totalAmount} EGP
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* زر تأكيد الطلب */}
            <div className='space-y-3 w-full relative z-10 '>
              Confirm Order
              <button
                type='submit'
                disabled={loading || cart.length === 0}
                className='w-full py-4 mt-3 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-red-950/50 transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer relative z-10 group '
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
          </div>
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* Modal اختيار الفرع */}
          {isBranchModalOpen && (
            <div
              onClick={() => setIsBranchModalOpen(false)}
              className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]'
            >
              <div
                dir='rtl'
                onClick={(e) => e.stopPropagation()}
                className='relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#080e1a]/95 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden animate-[zoomIn_0.22s_cubic-bezier(0.16,1,0.3,1)]'
              >
                {/* شريط علوي متدرج */}
                <div className='h-1 w-full bg-gradient-to-r from-red-600 via-blue-500 to-cyan-400' />

                {/* إضاءة خلفية ناعمة */}
                <div className='pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-blue-600/20 blur-3xl' />
                <div className='pointer-events-none absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-cyan-500/15 blur-3xl' />

                {/* الهيدر */}
                <div className='relative z-10 flex items-center justify-between gap-3 px-4 py-3.5 border-b border-slate-800/90'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600/80 to-blue-600/80 border border-cyan-400/30 flex items-center justify-center text-sm shadow-md'>
                      📍
                    </div>
                    <div>
                      <h3 className='text-sm font-black text-white'>
                        اختر الفرع المناسب ليك
                      </h3>
                      <p className='text-[11px] text-slate-400'>
                        لتسهيل وتحديد طريقة التوصيل بأسرع شكل
                      </p>
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={() => setIsBranchModalOpen(false)}
                    className='w-8 h-8 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-700/80 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-all duration-200 cursor-pointer'
                    aria-label='إغلاق'
                  >
                    ✕
                  </button>
                </div>

                {/* قائمة الفروع */}
                <div className='relative z-10 p-3.5 max-h-[65vh] overflow-y-auto space-y-2'>
                  {branches.map((branch) => {
                    const isSelected = selectedBranch === branch.name;
                    return (
                      <button
                        key={branch.id}
                        type='button'
                        onClick={() => {
                          setSelectedBranch(branch.name);
                          setIsBranchModalOpen(false);
                        }}
                        className={`w-full text-right rounded-xl px-3.5 py-3 border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600/25 via-cyan-500/15 to-blue-600/10 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                            : 'bg-[#0d1526]/80 hover:bg-[#121d33] border-slate-800 hover:border-blue-500/40'
                        }`}
                      >
                        <div className='min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors truncate'>
                              {branch.name}
                            </span>
                          </div>
                          {branch.address && (
                            <p className='text-[11px] text-slate-400 mt-0.5 truncate'>
                              {branch.address}
                            </p>
                          )}
                        </div>

                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400 text-slate-950 scale-105'
                              : 'border-slate-600 group-hover:border-cyan-400/70'
                          }`}
                        >
                          {isSelected && (
                            <span className='text-[11px] font-black leading-none'>
                              ✓
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}

                  {/* خيار أونلاين فقط لو مش موجود في الفروع */}
                  {!branches.some((b) => b.name?.trim() === 'أونلاين فقط') && (
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedBranch('أونلاين فقط');
                        setIsBranchModalOpen(false);
                      }}
                      className={`w-full text-right rounded-xl px-3.5 py-3 border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group ${
                        selectedBranch === 'أونلاين فقط'
                          ? 'bg-gradient-to-r from-red-600/20 via-blue-600/20 to-cyan-500/20 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                          : 'bg-gradient-to-r from-blue-950/50 via-[#0d1526] to-cyan-950/40 hover:border-cyan-400/45 border-blue-500/25'
                      }`}
                    >
                      <div className='min-w-0'>
                        <div className='text-xs sm:text-sm font-extrabold text-cyan-200 group-hover:text-white transition-colors'>
                          🌐 أونلاين فقط
                        </div>
                        <p className='text-[11px] text-slate-400 mt-0.5'>
                          توصيل أونلاين / للمناطق البعيدة والمحافظات
                        </p>
                      </div>

                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          selectedBranch === 'أونلاين فقط'
                            ? 'border-cyan-400 bg-cyan-400 text-slate-950 scale-105'
                            : 'border-cyan-500/40 group-hover:border-cyan-300'
                        }`}
                      >
                        {selectedBranch === 'أونلاين فقط' && (
                          <span className='text-[11px] font-black leading-none'>
                            ✓
                          </span>
                        )}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
          {/* ============================ */}
        </form>
      </main>
    </div>
  );
}
