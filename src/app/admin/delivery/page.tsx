'use client';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { evaluatePromoRules, PromoRule } from '@/lib/promoEngine';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  Users,
  Search,
  Send,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  Package,
  DollarSign,
  UserCheck,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ShoppingBag,
  Layers,
  X,
  Check,
  ExternalLink,
  Store,
  Zap,
} from 'lucide-react';
import ProductsAnalyticsTab from '@/components/ProductsAnalyticsTab';

// نوع عنصر المنتج داخل الأوردر
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// نوع بيانات الأوردر المدمجة مع سجل التوصيل والسواق
interface DeliveryRecord {
  id: string;
  order_id: string;
  driver_id: string | null;
  delivery_fee: number;
  status: 'new' | 'assigned' | 'completed' | 'cancelled';
  driver_confirmed: boolean;
  driver_confirmed_at: string | null;
  customer_confirmed: boolean;
  pickup_confirmed?: boolean;
  customer_confirmed_at: string | null;
  emergency_alert: string | null;
  admin_notified_customer: boolean;
  driver_rating: number | null;
  customer_review: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    id: string;
    order_number: number;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    // city: string | null;
    notes: string | null;
    total_amount: number;
    subtotal: number | null;
    shipping_cost: number | null;
    items: OrderItem[] | null;
    status: string;
    created_at: string;
  };
  drivers: {
    id: string;
    full_name: string;
    phone: string;
    completed_deliveries: number;
    average_rating: number;
  } | null;
}

// نوع بروفايل العميل المستخرج للتحليلات
interface CustomerProfile {
  phone: string;
  name: string;
  address: string;
  // city: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  ordersList: DeliveryRecord[];
}

type FilterStatus =
  | 'all'
  | 'new'
  | 'assigned'
  | 'awaiting_confirm'
  | 'completed'
  | 'emergency';

type TimeFilter = 'all' | 'today' | 'week' | 'month';
// نوع بيانات السواق المختصرة لقائمة الإرسال المباشر
interface ActiveDriverOption {
  id: string;
  full_name: string;
  phone: string;
  is_favorite: boolean;
  completed_deliveries: number;
  average_rating: number;
}

// =======================
// =======================
// =======================

// =======================
// =======================
// =======================

export default function DeliveryOperationsPage() {
  const router = useRouter();
  // حالات البيانات الأساسية
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [driversGroupLink, setDriversGroupLink] = useState<string>('');
  const [storeCurrency, setStoreCurrency] = useState<string>('EGP');

  const [showActivatedModal, setShowActivatedModal] = useState(false);

  const [activeDrivers, setActiveDrivers] = useState<ActiveDriverOption[]>([]);
  const [directDriverModal, setDirectDriverModal] = useState<{
    isOpen: boolean;
    record: DeliveryRecord | null;
  }>({
    isOpen: false,
    record: null,
  });

  // حالات التبويب والفلترة والبحث
  // حالات التبويب والفلترة والبحث
  const [activeTab, setActiveTab] = useState<'board' | 'analytics'>('board');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  // ربط مستقل للأوردرات المرسلة لجروبات السواقين (عشان ميتداخلش مع فلتر الحالة القديم)
  const [dispatchedGroupByOrderId, setDispatchedGroupByOrderId] = useState<
    Record<string, { groupKey: string; groupName: string }>
  >({});
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('abdo_store_dispatched_groups_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setDispatchedGroupByOrderId(parsed);
        }
      }
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  }, []);

  const recordOrderGroupDispatch = (
    recordId: string | number | undefined,
    groupKey: string,
    groupName: string,
  ) => {
    if (!recordId) return;
    const idStr = String(recordId);
    setDispatchedGroupByOrderId((prev) => {
      const next = {
        ...prev,
        [idStr]: { groupKey, groupName },
      };
      try {
        localStorage.setItem(
          'abdo_store_dispatched_groups_v1',
          JSON.stringify(next),
        );
      } catch {
        // تجاهل أخطاء التخزين المحلي
      }
      return next;
    });
  };
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [modalCompletedOrdersCount, setModalCompletedOrdersCount] =
    useState<number>(0);

  // مراجع إسلايدري الأوردرات (صف علوي وصف سفلي)
  const ordersSlider1Ref = useRef<HTMLDivElement>(null);
  const ordersSlider2Ref = useRef<HTMLDivElement>(null);

  // تخزين تعديلات سعر التوصيل المؤقتة لكل أوردر قبل الحفظ
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [savingFeeId, setSavingFeeId] = useState<string | null>(null);

  // مرجع إسلايدر العملاء
  const customersSliderRef = useRef<HTMLDivElement>(null);
  // مراجع إسلايدرات تحليل المنتجات (3 صفوف)
  const mostProductsSliderRef = useRef<HTMLDivElement>(null);
  const leastProductsSliderRef = useRef<HTMLDivElement>(null);
  const pairsProductsSliderRef = useRef<HTMLDivElement>(null);

  // ======================
  // ======================
  // ======================
  // ======================
  // ======================
  // ======================
  // ======================
  const [driverGroups, setDriverGroups] = useState<
    { id: string; name: string; group_link: string; is_default?: boolean }[]
  >([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupNameInput, setGroupNameInput] = useState<string>('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupPickerRecord, setGroupPickerRecord] = useState<any>(null);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState<boolean>(false);
  const [groupLink, setGroupLink] = useState<string>('');
  const [savingGroupLink, setSavingGroupLink] = useState<boolean>(false);
  // ======================
  // ======================
  // ======================
  // ======================
  const [promoRules, setPromoRules] = useState<PromoRule[]>([]);
  const [activePromoDelivery, setActivePromoDelivery] =
    useState<DeliveryRecord | null>(null);
  const [approvingRewardOrderId, setApprovingRewardOrderId] = useState<
    string | null
  >(null);
  // ======================
  // ======================

  const scrollSingleSlider = (
    ref: React.RefObject<HTMLDivElement | null>,
    dir: 'left' | 'right' | 'start' | 'end',
  ) => {
    if (!ref.current) return;
    if (dir === 'start') ref.current.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir === 'end')
      ref.current.scrollTo({
        left: ref.current.scrollWidth,
        behavior: 'smooth',
      });
    else {
      ref.current.scrollBy({
        left: dir === 'left' ? -260 : 260,
        behavior: 'smooth',
      });
    }
  };

  // حالات البحث والترتيب لتحليل المنتجات
  const [productSearch, setProductSearch] = useState<string>('');
  const [productSortOrder, setProductSortOrder] = useState<'desc' | 'asc'>(
    'desc',
  );

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

  // مودال تأكيد الإجراءات الحساسة (إغلاق يدوي / إلغاء / إعادة طرح)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'force_complete' | 'reopen_driver' | 'cancel_order' | null;
    record: DeliveryRecord | null;
    processing: boolean;
  }>({
    isOpen: false,
    type: null,
    record: null,
    processing: false,
  });

  // مودال عرض سجل أوردرات عميل معين
  const [customerModal, setCustomerModal] = useState<{
    isOpen: boolean;
    customer: CustomerProfile | null;
  }>({
    isOpen: false,
    customer: null,
  });

  const showModal = (
    type: 'success' | 'error' | 'warning',
    title: string,
    message: string,
  ) => {
    setFeedbackModal({ isOpen: true, type, title, message });
  };

  // دالة تنظيف وتنسيق رقم الهاتف للواتساب الدولي (مصر +20)
  const formatWhatsAppPhone = (rawPhone: string): string => {
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('01') && digits.length === 11) {
      digits = '2' + digits;
    } else if (digits.startsWith('1') && digits.length === 10) {
      digits = '20' + digits;
    }
    return digits;
  };

  // =============================
  // =============================
  // =============================
  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      // جلب سجلات التوصيل مع بيانات الأوردر والسواق
      const { data: delData, error: delError } = await supabase
        .from('deliveries')
        .select(
          `
          *,
          orders (
            id,
            order_number,
            customer_name,
            customer_phone,
            customer_address,
            customer_notes,
            branch_name,
            notes,
            total_amount,
            subtotal,
            shipping_cost,
            user_id,
free_shipping_approved,
free_shipping_reason,
            items,
            status,
            created_at
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
        .order('created_at', { ascending: false });

      if (delError) throw delError;

      const typedData = (delData as unknown as DeliveryRecord[]) || [];
      // console.log('DELIVERY_SAMPLE:', delData?.[0]);
      setDeliveries(typedData);

      // تهيئة قيم أسعار التوصيل في الحقول
      const initialFees: Record<string, string> = {};
      typedData.forEach((d) => {
        initialFees[d.id] = String(d.delivery_fee ?? 0);
      });
      setFeeInputs((prev) => ({ ...initialFees, ...prev }));

      // جلب لينك جروب السواقين والعملة من الإعدادات
      const { data: settingsData } = await supabase
        .from('settings')
        .select('drivers_group_link, store_currency')
        .limit(1)
        .single();

      if (settingsData?.drivers_group_link) {
        setDriversGroupLink(settingsData.drivers_group_link);
      }
      if (settingsData?.store_currency) {
        setStoreCurrency(settingsData.store_currency);
      }

      // جلب السواقين النشطين للإرسال المباشر (المفضلة والأكثر خبرة أولاً)
      const { data: driversList } = await supabase
        .from('drivers')
        .select(
          'id, full_name, phone, is_favorite, completed_deliveries, average_rating',
        )
        .eq('is_active', true)
        .order('is_favorite', { ascending: false })
        .order('completed_deliveries', { ascending: false });

      if (driversList) {
        setActiveDrivers(driversList as ActiveDriverOption[]);
        const { data: rulesData } = await supabase
          .from('promo_rules')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: true });

        if (rulesData) {
          setPromoRules(rulesData as PromoRule[]);
        }
      }
    } catch (err: any) {
      if (showLoader) {
        showModal(
          'error',
          'Sync Error',
          err?.message || 'Failed to load delivery operations data.',
        );
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };
  // =============================
  // =============================
  // =============================

  // جلب البيانات الأولية وتفعيل التحديث اللحظي (Realtime)
  useEffect(() => {
    const initTimer = window.setTimeout(() => {
      setCurrentTimestamp(Date.now());
    }, 0);

    const intervalTimer = window.setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 60_000);

    fetchData();

    // الاشتراك في التحديثات اللحظية لجدول deliveries
    const channel = supabase
      .channel('admin-deliveries-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries' },
        () => {
          fetchData(false);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          // انتظار بسيط لضمان عمل الـ Trigger وإنشاء سجل التوصيل
          setTimeout(() => fetchData(false), 600);
        },
      )
      .subscribe();

    return () => {
      window.clearTimeout(initTimer);
      window.clearInterval(intervalTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  // ==========================
  // ==========================
  // ==========================
  // ==========================
  useEffect(() => {
    const userId = activePromoDelivery?.orders?.user_id;
    const currentOrderId = activePromoDelivery?.orders?.id;
    if (!userId) {
      setModalCompletedOrdersCount(0);
      return;
    }

    let active = true;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, status')
        .eq('user_id', userId);

      if (!active) return;
      const count = (data || []).filter(
        (o: any) =>
          o.id !== currentOrderId &&
          (o.status === 'delivered' ||
            o.status === 'completed' ||
            o.status === 'تم التسليم'),
      ).length;
      setModalCompletedOrdersCount(count);
    })();

    return () => {
      active = false;
    };
  }, [activePromoDelivery]);
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  // ==========================
  // ==========================

  const handleActivateDriverPickup = async (del: DeliveryRecord) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('deliveries')
        .update({
          pickup_confirmed: true,
          status: 'assigned',
          updated_at: now,
        })
        .eq('id', del.id);

      if (error) throw error;

      // إظهار الموديل عند نجاح التفعيل وإخفاؤه تلقائياً بعد 2.5 ثانية
      setShowActivatedModal(true);
      setTimeout(() => {
        setShowActivatedModal(false);
      }, 2500);
    } catch (err: any) {
      console.error('Error activating driver pickup:', err?.message || err);
    }
  };

  // حفظ سعر التوصيل المحدد للأوردر
  const handleSaveDeliveryFee = async (record: DeliveryRecord) => {
    const newFee = parseFloat(feeInputs[record.id] || '0');
    if (isNaN(newFee) || newFee < 0) {
      showModal(
        'warning',
        'Invalid Fee',
        'Please enter a valid positive delivery fee.',
      );
      return;
    }

    setSavingFeeId(record.id);
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          delivery_fee: newFee,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (error) throw error;

      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === record.id ? { ...item, delivery_fee: newFee } : item,
        ),
      );

      showModal(
        'success',
        'Delivery Fee Updated',
        `Delivery fee for Order #${record.orders?.order_number} is now ${newFee} ${storeCurrency}.`,
      );
    } catch (err: any) {
      showModal(
        'error',
        'Update Failed',
        err?.message || 'Could not update the delivery fee.',
      );
    } finally {
      setSavingFeeId(null);
    }
  };

  // ================================
  // ================================
  // ================================
  const handleApproveOrderReward = async (
    rec: DeliveryRecord,
    matchedTitles: string[],
  ) => {
    if (!rec?.orders?.id) return;
    setApprovingRewardOrderId(rec.orders.id);
    try {
      const now = new Date().toISOString();
      const reasonText =
        matchedTitles.length > 0
          ? `معتمد من الأدمن: ${matchedTitles.join(' + ')}`
          : rec.orders.free_shipping_reason || 'معتمد من الأدمن';

      const { error } = await supabase
        .from('orders')
        .update({
          free_shipping_approved: true,
          free_shipping_reason: reasonText,
          updated_at: now,
        })
        .eq('id', rec.orders.id);

      if (error) throw error;

      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === rec.id && item.orders
            ? {
                ...item,
                orders: {
                  ...item.orders,
                  free_shipping_approved: true,
                  free_shipping_reason: reasonText,
                },
              }
            : item,
        ),
      );

      setActivePromoDelivery((prev) =>
        prev && prev.id === rec.id && prev.orders
          ? {
              ...prev,
              orders: {
                ...prev.orders,
                free_shipping_approved: true,
                free_shipping_reason: reasonText,
              },
            }
          : prev,
      );

      showModal(
        'success',
        'تم اعتماد المكافأة ✓',
        'تم اعتماد المكافأة/العرض لهذا الطلب وتحديث حالته للعميل.',
      );
    } catch (err: any) {
      showModal(
        'error',
        'تعذر اعتماد المكافأة',
        err?.message || 'حدث خطأ أثناء حفظ الاعتماد.',
      );
    } finally {
      setApprovingRewardOrderId(null);
    }
  };
  // ================================
  // ================================
  // ================================
  // ================================
  // ================================
  // ================================
  // ================================
  const fetchDriverGroups = async () => {
    const { data } = await supabase
      .from('whatsapp_driver_groups')
      .select('*')
      .order('created_at', { ascending: true });

    if (data) {
      setDriverGroups(data);
      if (data.length > 0 && !selectedGroupId) {
        const def = data.find((g: any) => g.is_default) || data[0];
        setSelectedGroupId(def.id);
      }
    }
  };

  useEffect(() => {
    fetchDriverGroups();
  }, []);

  const handleSaveNamedGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = groupNameInput.trim();
    const cleanLink = groupLink.trim();
    if (!cleanName || !cleanLink) return;

    setSavingGroupLink(true);
    try {
      if (editingGroupId) {
        const { error } = await supabase
          .from('whatsapp_driver_groups')
          .update({ name: cleanName, group_link: cleanLink })
          .eq('id', editingGroupId);
        if (error) throw error;
        setEditingGroupId(null);
      } else {
        const { data, error } = await supabase
          .from('whatsapp_driver_groups')
          .insert([
            {
              name: cleanName,
              group_link: cleanLink,
              is_default: driverGroups.length === 0,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        if (data) setSelectedGroupId(data.id);
      }

      setGroupNameInput('');
      setGroupLink('');
      await fetchDriverGroups();
      showModal(
        'success',
        'Group Saved',
        'Driver group list updated successfully.',
      );
    } catch (err: any) {
      showModal(
        'error',
        'Save Failed',
        err?.message || 'Could not save group.',
      );
    } finally {
      setSavingGroupLink(false);
    }
  };

  const handleStartEditGroup = (grp: any) => {
    setEditingGroupId(grp.id);
    setGroupNameInput(grp.name);
    setGroupLink(grp.group_link);
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_driver_groups')
        .delete()
        .eq('id', id);
      if (error) throw error;
      if (selectedGroupId === id) setSelectedGroupId('');
      if (editingGroupId === id) {
        setEditingGroupId(null);
        setGroupNameInput('');
        setGroupLink('');
      }
      await fetchDriverGroups();
    } catch (err: any) {
      showModal(
        'error',
        'Delete Failed',
        err?.message || 'Could not delete group.',
      );
    }
  };
  // ================================
  // ================================
  // ================================

  const sendDispatchToLink = async (
    record: any,
    targetLink: string,
    groupKey = 'default_drivers_group',
    groupName = 'Drivers Group',
  ) => {
    const currentFee = parseFloat(
      feeInputs[record.id] ?? String(record.delivery_fee || 0),
    );
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const acceptUrl = `${origin}/delivery/accept/${record.id}`;

const messageText = [
  `🚚 *NEW DELIVERY MISSION — Order #${record.orders?.order_number}*`,
  `👤 *Customer:* ${record.orders?.customer_name}`,
  `📍 *Address:* ${record.orders?.customer_address || ''}`,
  `💵 *Delivery Fee:* ${currentFee} ${storeCurrency}`,
  ``,
  `👇 *Tap link below & enter your phone to accept:*`,
  acceptUrl,
].join('\n');

    try {
      await navigator.clipboard.writeText(messageText);
    } catch {
      // تجاهل خطأ الحافظة في بعض المتصفحات القديمة
    }
    recordOrderGroupDispatch(record?.id, groupKey, groupName);
    if (targetLink) {
      window.open(targetLink, '_blank', 'noopener,noreferrer');
      showModal(
        'success',
        'Copied & Group Opened',
        'Section 1 dispatch message has been copied to your clipboard and the selected WhatsApp group was opened. Paste & send!',
      );
    } else {
      showModal(
        'warning',
        'Message Copied (No Group Link)',
        'Dispatch message copied to clipboard! Add a WhatsApp group first for 1-click opening.',
      );
    }
  };
  // ================================
  // ================================
  // ================================
  // ================================
  // تجهيز رسالة قسم 1 ونسخها + فتح جروب السواقين على الواتساب
  const handleSendToDriversGroup = async (record: any) => {
    if (driverGroups.length === 1) {
      const g = driverGroups[0];
      await sendDispatchToLink(
        record,
        g.group_link,
        String(g.id ?? g.name ?? 'group_1'),
        g.name || 'Drivers Group',
      );
      return;
    }

    if (driverGroups.length > 1) {
      setGroupPickerRecord(record);
      return;
    }

    await sendDispatchToLink(
      record,
      driversGroupLink,
      'default_drivers_group',
      'Drivers Group',
    );
  };
  // ============================
  // ============================
  // ============================
  // ============================
  // إرسال رسالة قسم 1 مباشرة لشات سواق محدد على الواتساب (الرسالة بتنزل جوه الشات أوتوماتيك)
  const handleSendDirectToDriver = (
    record: DeliveryRecord,
    driver: ActiveDriverOption,
  ) => {
    const currentFee = parseFloat(
      feeInputs[record.id] ?? String(record.delivery_fee || 0),
    );
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const acceptUrl = `${origin}/delivery/accept/${record.id}`;

   const messageText = [
     `🚚 *DIRECT DELIVERY MISSION — Order #${record.orders?.order_number}*`,
     `Hello *${driver.full_name}*, you have a priority delivery request:`,
     ``,
     `👤 *Customer:* ${record.orders?.customer_name}`,
     `📍 *Address:* ${record.orders?.customer_address || ''}`,
     `💵 *Delivery Fee:* ${currentFee} ${storeCurrency}`,
     ``,
     `👇 *Tap link below & enter your phone to accept:*`,
     acceptUrl,
   ].join('\n');

    const waPhone = formatWhatsAppPhone(driver.phone);
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
      messageText,
    )}`;

    setDirectDriverModal({ isOpen: false, record: null });
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // تجهيز رسالة قسم 3 وإرسالها مباشرة لشات العميل على الواتساب
  const handleSendToCustomerWhatsApp = async (record: DeliveryRecord) => {
    if (!record.drivers) {
      showModal(
        'warning',
        'No Driver Assigned',
        'A driver must accept this order before notifying the customer.',
      );
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const confirmUrl = `${origin}/delivery/confirm/${record.id}`;

    // تنسيق قائمة المنتجات
    const itemsList =
      record.orders?.items && record.orders.items.length > 0
        ? record.orders.items
            .map(
              (item) =>
                `• ${item.name} (x${item.quantity}) — ${
                  item.price * item.quantity
                } ${storeCurrency}`,
            )
            .join('\n')
        : '• Store Order Items';

    const orderAmount = Number(
      record.orders?.subtotal ?? record.orders?.total_amount ?? 0,
    );
    const deliveryFee = Number(record.delivery_fee || 0);
    const grandTotal = orderAmount + deliveryFee;

    const customerMessage = [
      `📦 *Order #${record.orders?.order_number} — Out for Delivery!*`,
      `Hello *${record.orders?.customer_name}*, your order is on the way.`,
      ``,
      `🛒 *Order Details:*`,
      itemsList,
      ``,
      `💰 *Payment Summary:*`,
      `• Order Subtotal: ${orderAmount} ${storeCurrency}`,
      `• Delivery Fee: ${deliveryFee} ${storeCurrency}`,
      `• *Total to Pay Driver:* ${grandTotal} ${storeCurrency}`,
      ``,
      `🛵 *Assigned Driver:*`,
      `• Name: ${record.drivers.full_name}`,
      `• Phone: ${record.drivers.phone}`,
      ``,
      `✅ *When you receive your order, please confirm & rate your driver here:*`,
      confirmUrl,
    ].join('\n');

    const waPhone = formatWhatsAppPhone(record.orders?.customer_phone || '');
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
      customerMessage,
    )}`;

    // تحديث حالة إشعار العميل في الداتا بيز
    await supabase
      .from('deliveries')
      .update({
        admin_notified_customer: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === record.id ? { ...d, admin_notified_customer: true } : d,
      ),
    );

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // تنفيذ الإجراءات المؤكدة من المودال (إغلاق يدوي / إعادة طرح / إلغاء)
  const executeConfirmedAction = async () => {
    if (!actionModal.record || !actionModal.type) return;
    setActionModal((prev) => ({ ...prev, processing: true }));

    const rec = actionModal.record;
    const now = new Date().toISOString();

    try {
      if (actionModal.type === 'force_complete') {
        // 1. إتمام التوصيل يدوياً
        const { error } = await supabase
          .from('deliveries')
          .update({
            status: 'completed',
            driver_confirmed: true,
            driver_confirmed_at: rec.driver_confirmed_at || now,
            customer_confirmed: true,
            customer_confirmed_at: rec.customer_confirmed_at || now,
            emergency_alert: null,
            updated_at: now,
          })
          .eq('id', rec.id);

        if (error) throw error;

        // 2. تحديث حالة الأوردر الأصلي في جدول orders
        await supabase
          .from('orders')
          .update({ status: 'delivered', updated_at: now })
          .eq('id', rec.order_id);

        // 3. زيادة عداد مشاوير السواق إن وجد
        if (rec.driver_id && rec.drivers) {
          await supabase
            .from('drivers')
            .update({
              completed_deliveries: (rec.drivers.completed_deliveries || 0) + 1,
            })
            .eq('id', rec.driver_id);
        }

        showModal(
          'success',
          'Order Completed Manually',
          `Order #${rec.orders?.order_number} has been marked as completed.`,
        );
      } else if (actionModal.type === 'reopen_driver') {
        // إعادة الأوردر لحالة جديد ليقبله سواق آخر
        const { error } = await supabase
          .from('deliveries')
          .update({
            status: 'new',
            driver_id: null,
            driver_confirmed: false,
            driver_confirmed_at: null,
            customer_confirmed: false,
            customer_confirmed_at: null,
            admin_notified_customer: false,
            pickup_confirmed: false,
            emergency_alert: null,
            updated_at: now,
          })
          .eq('id', rec.id);

        if (error) throw error;

        showModal(
          'success',
          'Order Re-opened',
          `Order #${rec.orders?.order_number} is back to NEW status. You can dispatch it to the drivers group now.`,
        );
      } else if (actionModal.type === 'cancel_order') {
        // إلغاء الأوردر نهائياً
        const { error } = await supabase
          .from('deliveries')
          .update({
            status: 'cancelled',
            emergency_alert: null,
            updated_at: now,
          })
          .eq('id', rec.id);

        if (error) throw error;

        await supabase
          .from('orders')
          .update({ status: 'cancelled', updated_at: now })
          .eq('id', rec.order_id);

        showModal(
          'success',
          'Order Cancelled',
          `Order #${rec.orders?.order_number} has been marked as cancelled.`,
        );
      }

      setActionModal({
        isOpen: false,
        type: null,
        record: null,
        processing: false,
      });
      fetchData(false);
    } catch (err: any) {
      setActionModal((prev) => ({ ...prev, processing: false }));
      showModal(
        'error',
        'Action Failed',
        err?.message || 'Could not execute the requested action.',
      );
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
  // دوال مساعدة موحدة للتوقيت والحالة والبحث
  const matchesTimeRange = (
    d: any,
    range: TimeFilter,
    bounds: {
      startOfToday: Date | null;
      sevenDaysAgo: Date | null;
      thirtyDaysAgo: Date | null;
    },
  ) => {
    if (range === 'all') return true;
    const raw = d.orders?.created_at || d.created_at;
    if (!raw) return false;
    const orderDate = new Date(raw);

    if (range === 'today') {
      return bounds.startOfToday ? orderDate >= bounds.startOfToday : false;
    }
    if (range === 'week') {
      return bounds.sevenDaysAgo ? orderDate >= bounds.sevenDaysAgo : false;
    }
    if (range === 'month') {
      return bounds.thirtyDaysAgo ? orderDate >= bounds.thirtyDaysAgo : false;
    }
    return true;
  };

  const matchesStatus = (d: any, status: FilterStatus) => {
    if (status === 'all') return true;
    if (status === 'new') {
      return d.status === 'new' && !d.emergency_alert;
    }
    if (status === 'assigned') {
      return (
        d.status === 'assigned' &&
        !d.driver_confirmed &&
        !d.customer_confirmed &&
        !d.emergency_alert
      );
    }
    if (status === 'awaiting_confirm') {
      return (
        d.status === 'assigned' &&
        d.driver_confirmed !== d.customer_confirmed &&
        !d.emergency_alert
      );
    }
    if (status === 'completed') {
      return d.status === 'completed';
    }
    if (status === 'emergency') {
      return Boolean(d.emergency_alert) || d.status === 'cancelled';
    }
    return true;
  };

  // ====================

  // دالة مساعدة مستقلة لفحص المنتجات وسعر الشحن في البحث
  // دالة مساعدة مستقلة لفحص المنتجات والأسعار وسعر الشحن في البحث
  // دالة مساعدة مستقلة لفحص المنتجات والأسعار وسعر الشحن في البحث
  // دالة مساعدة مستقلة لفحص المنتجات والأسعار وسعر الشحن في البحث
  const matchesProductAndShippingSearch = (d: any, q: string) => {
    const items: any[] = Array.isArray(d.orders?.items) ? d.orders.items : [];

    // ====================
    // ====================
    // ====================
    // ====================
    // ====================
    // ====================
    // 1. بحث مخصص عن سعر الشحن فقط (عشان ميتداخلش مع سعر المنتج أو رقم الأوردر)
    if (q.startsWith('@')) {
      const targetFee = q.slice(1).trim().toLowerCase();
      if (!targetFee) return true;

      const rawFee =
        typeof feeInputs !== 'undefined' &&
        feeInputs[d.id] !== undefined &&
        feeInputs[d.id] !== ''
          ? feeInputs[d.id]
          : (d.delivery_fee ??
            d.orders?.delivery_fee ??
            d.orders?.shipping_fee ??
            0);

      const feeStr = String(rawFee).trim().toLowerCase();
      const feeNumStr = String(parseFloat(feeStr));

      return feeStr === targetFee || feeNumStr === targetFee;
    }

    // 2. بحث عادي (رقم الأوردر، بيانات العميل والسائق، اسم المنتج، الأسعار)
    const orderNum = String(d.orders?.order_number ?? '')
      .trim()
      .toLowerCase();
    const cName = (d.orders?.customer_name || '').toLowerCase();
    const cPhone = (d.orders?.customer_phone || '').toLowerCase();
    const cAddr = (d.orders?.customer_address || '').toLowerCase();
    const dName = (d.drivers?.full_name || '').toLowerCase();
    const dPhone = (d.drivers?.phone || '').toLowerCase();

    // مطابقة رقم الأوردر بدقة (تمنع تداخل 60 مع 160 أو 601 في المستقبل)
    const isExactOrderNumber = orderNum !== '' && orderNum === q;

    const matchesTextFields =
      isExactOrderNumber ||
      cName.includes(q) ||
      cPhone.includes(q) ||
      cAddr.includes(q) ||
      dName.includes(q) ||
      dPhone.includes(q);

    if (matchesTextFields) return true;

    // مطابقة السعر (سعر الوحدة أو إجمالي العنصر أو إجمالي الأوردر)
    const numericQuery = Number(q);
    const isNumericSearch = q !== '' && !Number.isNaN(numericQuery);

    if (isNumericSearch) {
      const subtotal = Number(d.orders?.subtotal);
      const totalAmount = Number(d.orders?.total_amount);

      if (
        (!Number.isNaN(subtotal) && subtotal === numericQuery) ||
        (!Number.isNaN(totalAmount) && totalAmount === numericQuery)
      ) {
        return true;
      }
    }

    return items.some((item) => {
      const itemName = String(item?.name ?? '').toLowerCase();
      if (itemName.includes(q)) return true;

      if (isNumericSearch) {
        const unitPrice = Number(item?.price);
        const qty = Number(item?.quantity) || 1;
        const lineTotal = unitPrice * qty;

        return (
          (!Number.isNaN(unitPrice) && unitPrice === numericQuery) ||
          (!Number.isNaN(lineTotal) && lineTotal === numericQuery)
        );
      }

      return false;
    });
  };
  // ======================
  // ======================
  const matchesSearch = (d: any, rawQuery: string) => {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return true;
    return matchesProductAndShippingSearch(d, q);
  };
  // ======================
  // ======================
  // ======================

  const timeBounds = useMemo(() => {
    if (!currentTimestamp) {
      return { startOfToday: null, sevenDaysAgo: null, thirtyDaysAgo: null };
    }
    const now = new Date(currentTimestamp);
    return {
      startOfToday: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      sevenDaysAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      thirtyDaysAgo: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
  }, [currentTimestamp]);

  // أرقام بوكسات التوقيت (محسوبة حسب الحالة والبحث الحاليين)
  const timeCounts = useMemo(() => {
    const base = deliveries.filter((d) => {
      const matchesGroup =
        selectedGroupFilter === 'all'
          ? true
          : dispatchedGroupByOrderId[String(d.id)]?.groupKey ===
            selectedGroupFilter;
      return (
        matchesGroup &&
        matchesStatus(d, statusFilter) &&
        matchesSearch(d, searchQuery)
      );
    });

    return {
      all: base.length,
      today: base.filter((d) => matchesTimeRange(d, 'today', timeBounds))
        .length,
      week: base.filter((d) => matchesTimeRange(d, 'week', timeBounds)).length,
      month: base.filter((d) => matchesTimeRange(d, 'month', timeBounds))
        .length,
    };
  }, [
    deliveries,
    selectedGroupFilter,
    dispatchedGroupByOrderId,
    statusFilter,
    searchQuery,
    timeBounds,
  ]);

  // الطلبات المطابقة للوقت والبحث (عشان أرقام بوكسات الحالات تتحدث بناءً عليها)
  const timeAndSearchDeliveries = useMemo(() => {
    return deliveries.filter(
      (d) =>
        matchesTimeRange(d, timeFilter, timeBounds) &&
        matchesSearch(d, searchQuery),
    );
  }, [deliveries, timeFilter, timeBounds, searchQuery]);

  // إحصائيات بوكسات الحالات — مرتبطة مباشرة بـ timeFilter و searchQuery
  // المصدر الأساسي لبوكسات الحالات: لو مختار فرع معين يبقى أوردرات الفرع ده فقط (مع الوقت والبحث)، وإلا كل الفروع
  const statsSourceDeliveries = useMemo(() => {
    if (selectedGroupFilter === 'all') {
      return timeAndSearchDeliveries;
    }
    return timeAndSearchDeliveries.filter((d) => {
      const assignedGroup = dispatchedGroupByOrderId[String(d.id)];
      return assignedGroup?.groupKey === selectedGroupFilter;
    });
  }, [selectedGroupFilter, timeAndSearchDeliveries, dispatchedGroupByOrderId]);

  // إحصائيات بوكسات الحالات — مرتبطة بالوقت والبحث والفرع المختار
  const stats = useMemo(() => {
    const source = statsSourceDeliveries;

    return {
      all: source.length,
      newOrders: source.filter((d) => matchesStatus(d, 'new')).length,
      assigned: source.filter((d) => matchesStatus(d, 'assigned')).length,
      awaitingConfirm: source.filter((d) =>
        matchesStatus(d, 'awaiting_confirm'),
      ).length,
      completed: source.filter((d) => matchesStatus(d, 'completed')).length,
      emergency: source.filter((d) => matchesStatus(d, 'emergency')).length,
      activeEmergencies: deliveries.filter((d) => Boolean(d.emergency_alert)),
    };
  }, [statsSourceDeliveries, deliveries]);
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================

  // حساب إحصائيات بوكسات الفلترة الحية
  // حساب إحصائيات بوكسات الفلترة الحية
  // حساب إحصائيات بوكسات الفلترة الحية
  // const stats = useMemo(() => {
  //   const all = deliveries.length;
  //   const newOrders = deliveries.filter(
  //     (d) => d.status === 'new' && !d.emergency_alert,
  //   ).length;
  //   const assigned = deliveries.filter(
  //     (d) =>
  //       d.status === 'assigned' &&
  //       !d.driver_confirmed &&
  //       !d.customer_confirmed &&
  //       !d.emergency_alert,
  //   ).length;
  //   const awaitingConfirm = deliveries.filter(
  //     (d) =>
  //       d.status === 'assigned' &&
  //       d.driver_confirmed !== d.customer_confirmed &&
  //       !d.emergency_alert,
  //   ).length;
  //   const completed = deliveries.filter((d) => d.status === 'completed').length;
  //   const emergency = deliveries.filter(
  //     (d) => Boolean(d.emergency_alert) || d.status === 'cancelled',
  //   ).length;

  //   const activeEmergencies = deliveries.filter((d) =>
  //     Boolean(d.emergency_alert),
  //   );

  //   return {
  //     all,
  //     newOrders,
  //     assigned,
  //     awaitingConfirm,
  //     completed,
  //     emergency,
  //     activeEmergencies,
  //   };
  // }, [deliveries]);

  // تصفية الأوردرات حسب الحالة والوقت وشريط البحث
  // القائمة النهائية اللي بتتعرض في الجدول/الكروت بعد دمج الوقت + الحالة + البحث
  const filteredDeliveries = useMemo(() => {
    return timeAndSearchDeliveries.filter((d) =>
      matchesStatus(d, statusFilter),
    );
  }, [timeAndSearchDeliveries, statusFilter]);

  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // تجميع الفروع/الجروبات اللي تم الإرسال ليها فعلياً + حساب أعدادها حسب الوقت والبحث الحاليين
  const dynamicGroupBoxes = useMemo(() => {
    const groupsMap = new Map<
      string,
      { key: string; name: string; count: number }
    >();

    // أولاً: نجمع كل الجروبات المسجلة في الإرسالات
    Object.values(dispatchedGroupByOrderId).forEach((entry) => {
      if (!entry?.groupKey) return;
      if (!groupsMap.has(entry.groupKey)) {
        groupsMap.set(entry.groupKey, {
          key: entry.groupKey,
          name: entry.groupName || 'Drivers Group',
          count: 0,
        });
      }
    });

    // ثانياً: نحسب العدد الفعلي للأوردرات المطابقة للوقت والبحث الحاليين لكل فرع/جروب
    // (الأوردر بيفضل محسوب هنا حتى لو حالته اتغيرت لـ Shipped أو Delivered أو Alerts)
    timeAndSearchDeliveries.forEach((d) => {
      const assignedGroup = dispatchedGroupByOrderId[String(d.id)];
      if (!assignedGroup) return;
      const box = groupsMap.get(assignedGroup.groupKey);
      if (box) {
        box.count += 1;
      }
    });

    return Array.from(groupsMap.values());
  }, [dispatchedGroupByOrderId, timeAndSearchDeliveries]);

  // القائمة النهائية المعروضة: لو مختار فرع معين يعرض أوردرات الفرع ده (ومعاهم الحالة لو مش 'all')
  const displayedDeliveries = useMemo(() => {
    if (selectedGroupFilter !== 'all') {
      return timeAndSearchDeliveries.filter((d) => {
        const assignedGroup = dispatchedGroupByOrderId[String(d.id)];
        const matchesGroup = assignedGroup?.groupKey === selectedGroupFilter;
        return matchesGroup && matchesStatus(d, statusFilter);
      });
    }
    return filteredDeliveries;
  }, [
    selectedGroupFilter,
    timeAndSearchDeliveries,
    dispatchedGroupByOrderId,
    statusFilter,
    filteredDeliveries,
  ]);
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
  // ==================================
  // ==================================
  // ==================================

  // ================بدايه==========================
  // إضافات الكارت الجديدة (معزولة وآمنة)
  // ==========================================
  const [openAddressCardIds, setOpenAddressCardIds] = useState<
    Record<string, boolean>
  >({});
  const [openNotesCardIds, setOpenNotesCardIds] = useState<
    Record<string, boolean>
  >({});
  const [productsModalData, setProductsModalData] = useState<{
    isOpen: boolean;
    orderNumber?: string | number;
    customerName?: string;
    items: any[];
  }>({ isOpen: false, items: [] });

  // آمن مع Next.js: يبدأ بـ 0 ويتحدث في المتصفح فقط داخل useEffect
  const [relativeNowTick, setRelativeNowTick] = useState<number>(0);

  useEffect(() => {
    setRelativeNowTick(Date.now());
    const timer = setInterval(() => {
      setRelativeNowTick(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleCardAddressAccordion = (cardKey: string) => {
    setOpenAddressCardIds((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  const toggleCardNotesAccordion = (cardKey: string) => {
    setOpenNotesCardIds((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  // تنسيق التاريخ والوقت بنظام 12 ساعة
  const formatOrderDateTime12h = (dateValue?: string | null) => {
    if (!dateValue) return { dateLabel: '—', time12h: '—' };
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return { dateLabel: '—', time12h: '—' };

    const dateLabel = parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const time12h = parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return { dateLabel, time12h };
  };

  // حساب المدة المنقضية (دقائق / ساعات / أيام / شهور)
  const formatElapsedTime = (
    dateValue?: string | null,
    nowMs = relativeNowTick,
  ) => {
    if (!dateValue || !nowMs) return '';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return '';

    const diffSeconds = Math.max(
      0,
      Math.floor((nowMs - parsed.getTime()) / 1000),
    );
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears}y ago`;
  };
  // ============نهايه======================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================

  // ==========================================
  // ==========================================
  // ==========================================

  // تحديث الوقت المنقضي (منذ دقائق/ساعات/أيام/شهور) كل دقيقة تلقائياً
  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeNowTick(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);


  // ==========================================
  // ==========================================
  // ==========================================

  // ==========================================
  // ==========================================
  // ==========================================

const getCustomerTierBadge = (ord: any, _rec: any) => {
  const phoneKey = String(ord?.customer_phone || ord?.phone || '').trim();
  const userKey = String(ord?.user_id || '').trim();

  const matchingOrdersCount = Array.isArray(displayedDeliveries)
    ? displayedDeliveries.filter((item: any) => {
        const o = item?.orders;
        if (!o) return false;
        if (
          phoneKey &&
          String(o.customer_phone || o.phone || '').trim() === phoneKey
        ) {
          return true;
        }
        if (userKey && String(o.user_id || '').trim() === userKey) {
          return true;
        }
        return false;
      }).length
    : 0;

  const orderTotal = Number(ord?.total_amount ?? ord?.subtotal ?? 0);
  const isVip =
    matchingOrdersCount >= 2 ||
    Boolean(ord?.free_shipping_approved) ||
    orderTotal >= 1500;

  return isVip
    ? {
        label: 'VIP Client',
        className:
          'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 text-amber-300 border-amber-400/45 shadow-sm shadow-amber-500/10',
      }
    : {
        label: 'Regular',
        className: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
      };
};

const getOrderNotesText = (ord: any, rec?: any) => {
  const candidates = [
    ord?.notes,
    ord?.customer_notes,
    rec?.notes,
    rec?.customer_notes,
  ]
    .map((val) => (typeof val === 'string' ? val.trim() : ''))
    .filter(Boolean);

  return Array.from(new Set(candidates)).join(' • ');
};

const getRichItemDetails = (item: any) => {
  const catalogList: any[] =
    typeof products !== 'undefined' && Array.isArray(products) ? products : [];

  const matchedProduct = catalogList.find(
    (p) =>
      (item?.product_id && p?.id && String(p.id) === String(item.product_id)) ||
      (item?.id && p?.id && String(p.id) === String(item.id)) ||
      (item?.name &&
        p?.name &&
        String(p.name).trim().toLowerCase() ===
          String(item.name).trim().toLowerCase()),
  );

  const imageUrl =
    item?.image ||
    item?.image_url ||
    (Array.isArray(item?.images) && item.images[0]) ||
    matchedProduct?.image ||
    (Array.isArray(matchedProduct?.images) && matchedProduct.images[0]) ||
    '';

  const description =
    item?.description ||
    matchedProduct?.description ||
    'No extra description for this item.';

  const currentPrice = Number(item?.price ?? matchedProduct?.price ?? 0);

  const rawOldPrice =
    item?.old_price ??
    item?.compare_at_price ??
    matchedProduct?.old_price ??
    matchedProduct?.compare_at_price ??
    null;

  let beforeDiscountPrice: number | null =
    rawOldPrice !== null && rawOldPrice !== undefined && Number(rawOldPrice) > 0
      ? Number(rawOldPrice)
      : null;

  if (!beforeDiscountPrice && currentPrice > 0) {
    const discountPct = Number(item?.discount ?? matchedProduct?.discount ?? 0);
    if (discountPct > 0 && discountPct < 100) {
      beforeDiscountPrice = Math.round(currentPrice / (1 - discountPct / 100));
    }
  }

  const hasDiscount =
    beforeDiscountPrice !== null && beforeDiscountPrice > currentPrice;

  return {
    name: item?.name || item?.product_name || matchedProduct?.name || 'Item',
    quantity: Number(item?.quantity || 1),
    imageUrl: String(imageUrl || '').trim(),
    description: String(description).trim(),
    currentPrice,
    beforeDiscountPrice,
    hasDiscount,
  };
};
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  // ==================================
  const CARDS_PER_ROW = 4;
  const PAGE_SIZE = CARDS_PER_ROW * 2; // 8 كروت في الصفحة (4 في كل سلايدر)
// =============
// =============
// =============
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.max(
    1,
    Math.ceil(displayedDeliveries.length / PAGE_SIZE),
  );

  // لو الفلتر أو البحث اتغير والصفحة الحالية بقت أكبر من إجمالي الصفحات، ارجع للصفحة 1
  useEffect(() => {
    setCurrentPage(1);
  }, [
    displayedDeliveries.length,
    // لو عندك أسماء فلاتر إضافية فوق، تقدر تضيفها هنا لو حبيت
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // تقسيم الصفحة الحالية: أول 4 للإسلايدر الأول، والـ 4 التاليين للإسلايدر الثاني
  const { row1Orders, row2Orders, pageStartIndex, pageEndIndex } =
    useMemo(() => {
      const safePage = Math.min(Math.max(1, currentPage), totalPages);
      const startIdx = (safePage - 1) * PAGE_SIZE;
      const endIdx = Math.min(startIdx + PAGE_SIZE, displayedDeliveries.length);
      const currentSlice = displayedDeliveries.slice(startIdx, endIdx);

      return {
        row1Orders: currentSlice.slice(0, CARDS_PER_ROW),
        row2Orders: currentSlice.slice(CARDS_PER_ROW, PAGE_SIZE),
        pageStartIndex: startIdx,
        pageEndIndex: endIdx,
      };
    }, [displayedDeliveries, currentPage, totalPages]);

  // حساب أرقام الصفحات مع (...) عند الأعداد الكبيرة
  const paginationItems = useMemo<
    (number | 'ellipsis-left' | 'ellipsis-right')[]
  >(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];
    const leadingCount = 5; // أول 5 أرقام
    const trailingCount = 3; // آخر 3 أرقام (زي 98 - 99 - 100)

    const leadingPages = Array.from(
      { length: Math.min(leadingCount, totalPages) },
      (_, i) => i + 1,
    );
    const trailingStart = Math.max(1, totalPages - trailingCount + 1);
    const trailingPages = Array.from(
      { length: totalPages - trailingStart + 1 },
      (_, i) => trailingStart + i,
    );

    // لو الصفحة الحالية في النص بعيد عن البداية والنهاية، نظهر محيطها برضه لسهولة التنقل
    const aroundCurrent: number[] = [];
    if (currentPage > leadingCount && currentPage < trailingStart) {
      for (
        let p = Math.max(leadingCount + 1, currentPage - 1);
        p <= Math.min(trailingStart - 1, currentPage + 1);
        p++
      ) {
        aroundCurrent.push(p);
      }
    }

    const combined = Array.from(
      new Set([...leadingPages, ...aroundCurrent, ...trailingPages]),
    ).sort((a, b) => a - b);

    for (let i = 0; i < combined.length; i++) {
      const curr = combined[i];
      if (i > 0) {
        const prev = combined[i - 1];
        if (curr - prev > 1) {
          items.push(curr < trailingStart ? 'ellipsis-left' : 'ellipsis-right');
        }
      }
      items.push(curr);
    }

    return items;
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    const targetPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(targetPage);
    ordersSlider1Ref.current?.scrollTo({ left: 0, behavior: 'smooth' });
    ordersSlider2Ref.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };
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
  // تقسيم الأوردرات المفلترة بالتساوي على إسلايدرين (صف 1 وصف 2)
  // const { row1Orders, row2Orders } = useMemo(() => {
  //   const r1: DeliveryRecord[] = [];
  //   const r2: DeliveryRecord[] = [];
  //   displayedDeliveries.forEach((item, index) => {
  //     if (index % 2 === 0) r1.push(item);
  //     else r2.push(item);
  //   });
  //   return { row1Orders: r1, row2Orders: r2 };
  // }, [displayedDeliveries]);

  // تحريك الإسلايدرين معاً بسلاسة
  const scrollOrdersSliders = (dir: 'left' | 'right' | 'start' | 'end') => {
    [ordersSlider1Ref.current, ordersSlider2Ref.current].forEach((el) => {
      if (!el) return;
      if (dir === 'start') el.scrollTo({ left: 0, behavior: 'smooth' });
      else if (dir === 'end')
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      else {
        el.scrollBy({
          left: dir === 'left' ? -320 : 320,
          behavior: 'smooth',
        });
      }
    });
  };

  // استخراج تحليلات العملاء والمنتجات من الأوردرات
  const analyticsData = useMemo(() => {
    const customerMap = new Map<string, CustomerProfile>();
    const productCountMap = new Map<
      string,
      { name: string; count: number; revenue: number }
    >();
    const pairCountMap = new Map<
      string,
      { count: number; totalPrice: number }
    >();

    deliveries.forEach((del) => {
      const ord = del.orders;
      if (!ord) return;

      // 1. تجميع بيانات العميل برقم التليفون
      const phoneKey = ord.customer_phone?.trim() || 'Unknown';
      const existing = customerMap.get(phoneKey);
      const orderTotal = Number(ord.total_amount || 0);

      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += orderTotal;
        existing.ordersList.push(del);
      } else {
        customerMap.set(phoneKey, {
          phone: phoneKey,
          name: ord.customer_name || 'Customer',
          address: ord.customer_address || '',
          // city: ord.city || '',
          ordersCount: 1,
          totalSpent: orderTotal,
          lastOrderDate: ord.created_at,
          ordersList: [del],
        });
      }

      // 2. تحليل المنتجات والمنتجات المشتركة مع أسعارها
      const items = ord.items || [];
      const uniqueItemsMap = new Map<string, number>();

      items.forEach((item) => {
        const pName = item.name?.trim() || 'Unnamed Product';
        const qty = Number(item.quantity || 1);
        const unitP = Number(item.price || 0);
        const rev = unitP * qty;

        const prevProd = productCountMap.get(pName);
        if (prevProd) {
          prevProd.count += qty;
          prevProd.revenue += rev;
        } else {
          productCountMap.set(pName, { name: pName, count: qty, revenue: rev });
        }

        if (!uniqueItemsMap.has(pName)) {
          uniqueItemsMap.set(pName, unitP);
        }
      });

      // حساب أزواج المنتجات المشتركة + مجموع سعرهما
      const uniqueEntries = Array.from(uniqueItemsMap.entries()).sort((a, b) =>
        a[0].localeCompare(b[0]),
      );
      if (uniqueEntries.length >= 2) {
        for (let i = 0; i < uniqueEntries.length; i++) {
          for (let j = i + 1; j < uniqueEntries.length; j++) {
            const pairKey = `${uniqueEntries[i][0]} + ${uniqueEntries[j][0]}`;
            const pairPrice = uniqueEntries[i][1] + uniqueEntries[j][1];
            const prevPair = pairCountMap.get(pairKey);
            if (prevPair) {
              prevPair.count += 1;
            } else {
              pairCountMap.set(pairKey, { count: 1, totalPrice: pairPrice });
            }
          }
        }
      }
    });

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.ordersCount - a.ordersCount,
    );
    const vipCustomersCount = customers.filter((c) => c.ordersCount > 3).length;

    const allProducts = Array.from(productCountMap.values()).map((p) => ({
      ...p,
      unitPrice: p.count > 0 ? Math.round(p.revenue / p.count) : 0,
    }));

    const q = productSearch.toLowerCase().trim();

    const filteredProducts = allProducts.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        String(p.unitPrice).includes(q) ||
        String(p.revenue).includes(q)
      );
    });

    // القائمة 1: الأكثر مبيعاً (تتأثر بزر الترتيب)
    const mostBase = [...filteredProducts]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const sortedProducts =
      productSortOrder === 'desc' ? mostBase : [...mostBase].reverse();

    // القائمة 2: الأقل طلباً (تتأثر بزر الترتيب)
    const leastBase = [...filteredProducts]
      .sort((a, b) => a.count - b.count)
      .slice(0, 8);
    const leastProducts =
      productSortOrder === 'asc' ? leastBase : [...leastBase].reverse();

    // القائمة 3: المنتجات المشتركة بالسعر (تتأثر بالبحث والترتيب)
    const allPairs = Array.from(pairCountMap.entries())
      .map(([pair, info]) => ({
        pair,
        count: info.count,
        totalPrice: info.totalPrice,
      }))
      .filter((p) => {
        if (!q) return true;
        return (
          p.pair.toLowerCase().includes(q) || String(p.totalPrice).includes(q)
        );
      })
      .sort((a, b) =>
        productSortOrder === 'desc' ? b.count - a.count : a.count - b.count,
      )
      .slice(0, 8);

    return {
      customers,
      vipCustomersCount,
      sortedProducts,
      leastProducts,
      topPairs: allPairs,
    };
  }, [deliveries, productSearch, productSortOrder]);

  // التحكم في إسلايدر العملاء
  const scrollCustomersSlider = (dir: 'left' | 'right' | 'start' | 'end') => {
    if (!customersSliderRef.current) return;
    const el = customersSliderRef.current;
    if (dir === 'start') el.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir === 'end')
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    else {
      el.scrollBy({
        left: dir === 'left' ? -330 : 330,
        behavior: 'smooth',
      });
    }
  };

  // ==========================================
  // ==========================================
  // ==========================================
  // ==========================================
  // const timeCounts = useMemo(() => {
  //   if (!currentTimestamp) {
  //     return { all: 0, today: 0, week: 0, month: 0 };
  //   }
  //   const now = new Date(currentTimestamp);
  //   const startOfToday = new Date(
  //     now.getFullYear(),
  //     now.getMonth(),
  //     now.getDate(),
  //   );
  //   const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  //   const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  //   const q = searchQuery.toLowerCase().trim();

  //   const matchesStatusAndSearch = (d: any) => {
  //     if (
  //       statusFilter === 'new' &&
  //       !(d.status === 'new' && !d.emergency_alert)
  //     ) {
  //       return false;
  //     }
  //     if (
  //       statusFilter === 'assigned' &&
  //       !(
  //         d.status === 'assigned' &&
  //         !d.driver_confirmed &&
  //         !d.customer_confirmed &&
  //         !d.emergency_alert
  //       )
  //     ) {
  //       return false;
  //     }
  //     if (
  //       statusFilter === 'awaiting_confirm' &&
  //       !(
  //         d.status === 'assigned' &&
  //         d.driver_confirmed !== d.customer_confirmed &&
  //         !d.emergency_alert
  //       )
  //     ) {
  //       return false;
  //     }
  //     if (statusFilter === 'completed' && d.status !== 'completed') {
  //       return false;
  //     }
  //     if (
  //       statusFilter === 'emergency' &&
  //       !(Boolean(d.emergency_alert) || d.status === 'cancelled')
  //     ) {
  //       return false;
  //     }

  //     if (q) {
  //       const orderNum = String(d.orders?.order_number || '');
  //       const cName = (d.orders?.customer_name || '').toLowerCase();
  //       const cPhone = (d.orders?.customer_phone || '').toLowerCase();
  //       const cAddr = (d.orders?.customer_address || '').toLowerCase();
  //       const dName = (d.drivers?.full_name || '').toLowerCase();
  //       const dPhone = (d.drivers?.phone || '').toLowerCase();

  //       return (
  //         orderNum.includes(q) ||
  //         cName.includes(q) ||
  //         cPhone.includes(q) ||
  //         cAddr.includes(q) ||
  //         dName.includes(q) ||
  //         dPhone.includes(q)
  //       );
  //     }
  //     return true;
  //   };

  //   const base = deliveries.filter(matchesStatusAndSearch);

  //   return {
  //     all: base.length,
  //     today: base.filter((d) => {
  //       const raw = d.orders?.created_at || d.created_at;
  //       return raw ? new Date(raw) >= startOfToday : false;
  //     }).length,
  //     week: base.filter((d) => {
  //       const raw = d.orders?.created_at || d.created_at;
  //       return raw ? new Date(raw) >= sevenDaysAgo : false;
  //     }).length,
  //     month: base.filter((d) => {
  //       const raw = d.orders?.created_at || d.created_at;
  //       return raw ? new Date(raw) >= thirtyDaysAgo : false;
  //     }).length,
  //   };
  // }, [deliveries, statusFilter, searchQuery, currentTimestamp]);
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
  // ==========================================
  // =================
  // =========================

const buildCustomerWhatsAppLink = (order: any, deliveryRecord?: any) => {
  let phone = (order?.customer_phone || order?.phone || '').replace(/\D/g, '');
  if (phone.length === 11 && phone.startsWith('01')) {
    phone = '2' + phone;
  }

  let itemsList: any[] = [];
  try {
    itemsList =
      typeof order?.items === 'string'
        ? JSON.parse(order.items)
        : order?.items || [];
  } catch {
    itemsList = [];
  }

  // صافي إجمالي المنتجات من العناصر مباشرةً
  const productsSubtotal = itemsList.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

  // قراءة مصاريف الشحن المعينة في الكارد (الحقل الحالي أولاً ثم المحفوظ في deliveryRecord ثم order.shipping_cost)
  const rawFee =
    deliveryRecord?.id !== undefined &&
    feeInputs?.[deliveryRecord.id] !== undefined &&
    feeInputs?.[deliveryRecord.id] !== ''
      ? feeInputs[deliveryRecord.id]
      : (deliveryRecord?.delivery_fee ?? order?.shipping_cost ?? 0);

  const shippingFee = Math.max(0, Number(rawFee) || 0);
  const cashOnDeliveryTotal = productsSubtotal + shippingFee;

  const itemsFormatted = itemsList
    .map((item: any) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const subtotal = price * qty;
      const imageUrl =
        item.image_url ||
        item.image ||
        (Array.isArray(item.images) ? item.images[0] : '') ||
        item.img ||
        item.thumbnail ||
        '';
      const imageLine = imageUrl ? `\n   └ 🖼️ صورة المنتج: ${imageUrl}` : '';

      return (
        `• المنتج: ${item.name || 'منتج'} | الكمية: ${qty} | السعر: ${price} ج.م | الإجمالي الفرعي: ${subtotal} ج.م` +
        imageLine
      );
    })
    .join('\n---\n');

  const orderNumberText = order?.order_number
    ? `#${order.order_number}`
    : order?.id
      ? `#${String(order.id).slice(0, 6)}`
      : 'غير محدد';

  const customerNameLine = order?.customer_name?.trim()
    ? `👤 اسم العميل: ${order.customer_name.trim()}\n`
    : '';

  // قراءة النوتس بنفس منطق الكارد (getOrderNotesText لو متاحة + fallback على الحقول المباشرة)
  const resolvedNotes =
    typeof getOrderNotesText === 'function'
      ? getOrderNotesText(order, deliveryRecord)
      : order?.notes || order?.customer_notes || deliveryRecord?.notes || '';

  const notesText = String(resolvedNotes || '').trim()
    ? `📝 ملاحظات العميل: ${String(resolvedNotes).trim()}\n`
    : '';

  const message =
    `السلام عليكم، بنكلم حضرتك بخصوص الاوردر اللي طلبته من Abdo Store\n` +
    `وحابين نأكد تفاصيله مع حضرتك:\n\n` +
    `🔢 رقم الاوردر: ${orderNumberText}\n` +
    `${customerNameLine}\n` +
    `تفاصيل الاوردر:\n\n` +
    `${itemsFormatted}\n\n` +
    `-------------------\n` +
    `📦 إجمالي المنتجات: ${productsSubtotal} ج.م\n` +
    `🚚 مصاريف الشحن: ${shippingFee} ج.م\n` +
    `💵 إجمالي الدفع عند الاستلام: ${cashOnDeliveryTotal} ج.م\n` +
    `📍 عنوان التوصيل: ${order?.customer_address || 'غير محدد'}\n` +
    `${notesText}\n` +
    `لو الاوردر تمام يريت تبلغني عشان ابعتهولك في اسرع وقت 🤍`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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

  return (
    <div className='min-h-screen bg-[#090f19] text-slate-100 pb-20'>
      {/* الشريط العلوي الثابت */}
      <div className='border-b border-slate-800/80 bg-[#0e1626]/90 backdrop-blur-xl sticky top-0 z-30'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <Link
              href='/admin'
              className='p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors'
              title='Back to Admin Dashboard'
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl sm:text-2xl font-black text-white flex items-center gap-2'>
                  <Truck className='text-blue-400' size={24} />
                  Delivery Operations
                </h1>
                <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
                  LIVE
                </span>
              </div>
              <p className='text-xs text-slate-400'>
                Dispatch drivers, monitor two-way confirmations, and analyze VIP
                customers
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2 self-end sm:self-auto'>
            <button
              onClick={() => fetchData(true)}
              className='p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors'
              title='Refresh Live Data'
            >
              <RefreshCw size={17} />
            </button>
            <Link
              href='/admin/drivers'
              className='px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-colors'
            >
              <Users size={16} />
              Drivers Fleet
            </Link>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6'>
        {/* شريط تنبيهات الطوارئ (يظهر تلقائياً عند وجود اعتذار سواق أو طلب إلغاء عميل) */}
        {stats.activeEmergencies.length > 0 && (
          <div className='bg-rose-950/50 border border-rose-500/60 rounded-2xl p-4 space-y-3 shadow-lg shadow-rose-950/30'>
            <div className='flex items-center gap-2 text-rose-400 font-black text-sm'>
              <ShieldAlert size={20} className='animate-bounce' />
              URGENT DELIVERY ALERTS ({stats.activeEmergencies.length})
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {stats.activeEmergencies.map((em) => (
                <div
                  key={em.id}
                  className='bg-[#090f19]/90 border border-rose-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                >
                  <div>
                    <p className='text-xs font-black text-white'>
                      Order #{em.orders?.order_number} —{' '}
                      {em.orders?.customer_name}
                    </p>
                    <p className='text-xs text-rose-300 mt-0.5'>
                      {em.emergency_alert}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'reopen_driver',
                          record: em,
                          processing: false,
                        })
                      }
                      className='px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold'
                    >
                      Re-open Order
                    </button>
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'cancel_order',
                          record: em,
                          processing: false,
                        })
                      }
                      className='px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-xs font-bold'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* التبويب الرئيسي للتبديل بين لوحة الأوردرات والتحليلات */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e1626] p-2 rounded-2xl border border-slate-800'>
          <div className='flex gap-2'>
            <button
              onClick={() => setActiveTab('board')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                activeTab === 'board'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package size={17} />
              Orders Dispatch Board ({deliveries.length})
            </button>
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}

            <button
              type='button'
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 size={17} />
              Product Analytics
            </button>
            {/* =========================== */}
            {/* =========================== */}
            {/* =========================== */}
            <button
              type='button'
              onClick={() => router.push('/admin/orders')}
              className='flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-600/80 hover:to-teal-600/80 border border-transparent hover:border-teal-400/30 hover:shadow-lg hover:shadow-indigo-600/15'
            >
              <BarChart3 size={17} />
              <span>Live Orders</span>
            </button>
            {/* =========================== */}
            {/* =========================== */}
          </div>
          {/* =========================== */}
          {/* =========================== */}
          {/* =========================== */}
          {/* =========================== */}
          {activeTab === 'board' && (
            <div className='relative flex-1 sm:max-w-md'>
              <Search
                size={16}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10'
              />
              {!searchQuery && (
                <div className='pointer-events-none absolute inset-y-0 left-10 right-8 flex flex-col justify-center leading-tight select-none'>
                  <span className='text-[11px] sm:text-xs text-slate-500 truncate'>
                    Search order num , customer, phone, address, driver...
                  </span>
                  <span className='text-[10px] sm:text-[11px] text-slate-500/80 truncate'>
                    Or product, price, @shipping
                  </span>
                </div>
              )}
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=''
                className='w-full min-h-[42px] bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-8 py-2 text-xs sm:text-sm text-white outline-none'
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white z-10'
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}
          {/* =========================== */}
        </div>

        {/* ================= التبويب الأول: لوحة إدارة الأوردرات ================= */}
        {/* ================= التبويب الأول: لوحة إدارة الأوردرات ================= */}

        {/* ================= التبويب الثاني: بروفايلات العملاء وتحليل المنتجات ================= */}
        {/* ================= التبويب الأول: لوحة إدارة الأوردرات ================= */}
        {activeTab === 'board' && (
          <div className='space-y-3'>
            {/* 1. بوكسات الفلترة الحية (مصغرة وأنيقة) */}
            {/* 1. بوكسات الفلترة الحية (مصغرة وأنيقة) */}
            {/* 1. بوكسات الفلترة الحية (مصغرة وأنيقة) */}
            {/* ======================== */}

            <div className='grid grid-cols-3 sm:grid-cols-6 gap-2'>
              {/* ======================== */}
              {/* ======================== */}

              {dynamicGroupBoxes.length > 0 && (
                <div className='flex items-center gap-2 flex-wrap pt-1'>
                  <button
                    type='button'
                    onClick={() => setSelectedGroupFilter('all')}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center gap-2 cursor-pointer ${
                      selectedGroupFilter === 'all'
                        ? 'bg-indigo-600/25 border-indigo-500 text-white'
                        : 'bg-[#090f19] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>All Branches</span>
                    <span className='px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-200'>
                      {timeAndSearchDeliveries.length}
                    </span>
                  </button>

                  {dynamicGroupBoxes.map((grpBox) => {
                    const isSelected = selectedGroupFilter === grpBox.key;
                    return (
                      <button
                        key={grpBox.key}
                        type='button'
                        onClick={() =>
                          setSelectedGroupFilter((prev) =>
                            prev === grpBox.key ? 'all' : grpBox.key,
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                            : 'bg-[#0e1626] border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{grpBox.name}</span>
                        <span className='px-1.5 py-0.5 rounded-md bg-black/30 text-[11px] font-black font-mono text-emerald-400'>
                          {grpBox.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* ======================== */}
              {/* ======================== */}
              {/* ======================== */}
              {/* ======================== */}
              {/* ======================== */}
              {[
                {
                  key: 'all',
                  label: 'All',
                  count: stats.all,
                  accent: 'text-white',
                },
                {
                  key: 'new',
                  label: 'Waiting',
                  count: stats.newOrders,
                  accent: 'text-blue-400',
                },
                {
                  key: 'assigned',
                  label: 'Shipped',
                  count: stats.assigned,
                  accent: 'text-amber-400',
                },
                {
                  key: 'awaiting_confirm',
                  label: '1-Side OK',
                  count: stats.awaitingConfirm,
                  accent: 'text-purple-400',
                },
                {
                  key: 'completed',
                  label: 'Delivered',
                  count: stats.completed,
                  accent: 'text-emerald-400',
                },
                {
                  key: 'emergency',
                  label: 'Alerts',
                  count: stats.emergency,
                  accent: 'text-rose-400',
                },

                // ===============================
                // ===============================
                // ===============================
                // ===============================
                // ===============================
                // ===============================
                // ===============================
                // ===============================
                // ===============================
              ].map((box) => {
                const selected = statusFilter === box.key;
                return (
                  <button
                    key={box.key}
                    onClick={() => setStatusFilter(box.key as FilterStatus)}
                    className={`px-2.5 py-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selected
                        ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-[#0e1626] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className='text-[11px] font-bold text-slate-400 truncate'>
                      {box.label}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-black ml-1 ${box.accent}`}
                    >
                      {box.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2. شريط فلترة الوقت تحت البوكسات + أزرار التحكم في الإسلايدر */}
            {/* 2. شريط فلترة الوقت تحت البوكسات + أزرار التحكم في الإسلايدر */}
            {/* 2. شريط فلترة الوقت تحت البوكسات + أزرار التحكم في الإسلايدر */}
            {/* 2. شريط فلترة الوقت تحت البوكسات + أزرار التحكم في الإسلايدر */}
            {/* 2. شريط فلترة الوقت تحت البوكسات + أزرار التحكم في الإسلايدر */}
            {/* 2. شريط فلترة الوقت تحت البوكسات + أزرار التحكم في الإسلايدر */}
            <div className='flex flex-wrap items-center justify-between gap-2 bg-[#0e1626] p-2 rounded-2xl border border-slate-800'>
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              <button
                type='button'
                onClick={() => setIsGroupManagerOpen(true)}
                className='px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-black transition-colors cursor-pointer'
              >
                Driver Groups ({driverGroups.length})
              </button>
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}

              <div className='flex items-center gap-1.5 flex-wrap'>
                {[
                  { key: 'all', label: 'All Time', count: timeCounts.all },
                  { key: 'today', label: 'Today', count: timeCounts.today },
                  { key: 'week', label: 'This Week', count: timeCounts.week },
                  {
                    key: 'month',
                    label: 'This Month',
                    count: timeCounts.month,
                  },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTimeFilter(t.key as TimeFilter)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      timeFilter === t.key
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-[#090f19] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        timeFilter === t.key
                          ? 'bg-black/25 text-white'
                          : 'bg-slate-800/90 text-slate-300'
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}
              {/* =========================== */}

              <div className='flex items-center gap-1'>
                <button
                  onClick={() => scrollOrdersSliders('start')}
                  className='px-2 py-1 rounded-lg bg-[#090f19] border border-slate-800 hover:border-slate-600 text-[11px] font-bold text-slate-300'
                >
                  First
                </button>
                <button
                  onClick={() => scrollOrdersSliders('left')}
                  className='p-1.5 rounded-lg bg-[#090f19] border border-slate-800 hover:border-slate-600 text-slate-300'
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => scrollOrdersSliders('right')}
                  className='p-1.5 rounded-lg bg-[#090f19] border border-slate-800 hover:border-slate-600 text-slate-300'
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  onClick={() => scrollOrdersSliders('end')}
                  className='px-2 py-1 rounded-lg bg-[#090f19] border border-slate-800 hover:border-slate-600 text-[11px] font-bold text-slate-300'
                >
                  Last
                </button>
              </div>
            </div>

            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {displayedDeliveries.length > PAGE_SIZE && (
              <div className='mt-4 p-2.5 sm:px-4 rounded-2xl bg-gradient-to-r from-[#090f19]/95 via-[#0e1626]/95 to-[#090f19]/95 border border-slate-800/90 backdrop-blur-md shadow-lg shadow-black/30 flex flex-wrap items-center justify-between gap-3 text-xs'>
                {/* عداد الصفحات والأوردرات */}
                <div className='flex items-center gap-2 text-slate-400'>
                  <span className='w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse' />
                  <span>
                    Showing{' '}
                    <strong className='text-white font-mono'>
                      {pageStartIndex + 1}–{pageEndIndex}
                    </strong>{' '}
                    of{' '}
                    <strong className='text-cyan-300 font-mono'>
                      {displayedDeliveries.length}
                    </strong>
                  </span>
                  <span className='hidden sm:inline text-slate-600'>•</span>
                  <span className='hidden sm:inline px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 font-mono text-[11px] font-bold'>
                    Page {currentPage} / {totalPages}
                  </span>
                </div>

                {/* أزرار التنقل وأرقام الصفحات */}
                <div className='flex items-center gap-1.5 flex-wrap'>
                  <button
                    type='button'
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#090f19] border border-slate-800 text-slate-300 font-bold hover:border-cyan-500/50 hover:text-white hover:bg-slate-900 active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition-all duration-150 cursor-pointer'
                  >
                    <ChevronLeft size={14} className='shrink-0' />
                    <span>Prev</span>
                  </button>

                  {paginationItems.map((item, idx) => {
                    if (item === 'ellipsis-left' || item === 'ellipsis-right') {
                      return (
                        <span
                          key={`${item}-${idx}`}
                          className='px-1.5 py-1 text-slate-500 font-mono tracking-widest select-none'
                        >
                          •••
                        </span>
                      );
                    }

                    const isActive = item === currentPage;
                    return (
                      <button
                        key={item}
                        type='button'
                        onClick={() => handlePageChange(item)}
                        className={`min-w-[34px] h-[34px] px-2.5 rounded-xl font-mono text-xs font-black transition-all duration-150 cursor-pointer select-none ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white border border-cyan-400/50 shadow-md shadow-cyan-500/25 scale-105'
                            : 'bg-[#090f19]/90 text-slate-400 border border-slate-800/90 hover:border-slate-600 hover:text-white hover:bg-slate-800/70 active:scale-95'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    type='button'
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#090f19] border border-slate-800 text-slate-300 font-bold hover:border-cyan-500/50 hover:text-white hover:bg-slate-900 active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition-all duration-150 cursor-pointer'
                  >
                    <span>Next</span>
                    <ChevronRight size={14} className='shrink-0' />
                  </button>
                </div>
              </div>
            )}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* ====================================== */}
            {/* 3. عرض الأوردرات في 2 إسلايدر أفقيين مدمجين مع ترقيم الكروت */}
            {loading ? (
              <div className='py-12 text-center text-slate-400 text-xs'>
                Loading live delivery orders...
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className='py-12 text-center bg-[#0e1626] rounded-2xl border border-dashed border-slate-800'>
                <Package className='mx-auto text-slate-600 mb-2' size={30} />
                <p className='text-sm font-bold text-slate-300'>
                  No orders found in this filter
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {[
                  { ref: ordersSlider1Ref, items: row1Orders, rowNum: 1 },
                  { ref: ordersSlider2Ref, items: row2Orders, rowNum: 2 },
                ].map(
                  (slider, sIdx) =>
                    slider.items.length > 0 && (
                      <div
                        key={sIdx}
                        ref={slider.ref}
                        className='flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth'
                        style={{ scrollbarWidth: 'thin' }}
                      >
                        {slider.items.map((rec, cardIdx) => {
                          const ord = rec.orders;
                          if (!ord) return null;
                          // =========================
                          // =========================
                          // =========================
                          // =========================

                          const isEmergency = Boolean(rec.emergency_alert);
                          const orderSubtotal = Number(
                            ord.subtotal ?? ord.total_amount ?? 0,
                          );
                          const currentFee = Number(rec.delivery_fee || 0);
                          const totalCollect = orderSubtotal + currentFee;

                          let stickerBadge = (
                            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'>
                              <Clock size={11} className='animate-spin' />
                              WAITING
                            </span>
                          );

                          if (isEmergency) {
                            stickerBadge = (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-bounce'>
                                <AlertTriangle size={11} />
                                ALERT
                              </span>
                            );
                          } else if (rec.status === 'completed') {
                            stickerBadge = (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'>
                                <CheckCircle2 size={11} />
                                DELIVERED
                              </span>
                            );
                          } else if (rec.status === 'cancelled') {
                            stickerBadge = (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30'>
                                <XCircle size={11} />
                                CANCELLED
                              </span>
                            );
                          } else if (
                            rec.status === 'assigned' &&
                            (rec.driver_confirmed || rec.customer_confirmed)
                          ) {
                            stickerBadge = (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/25 text-purple-300 border border-purple-500/40 animate-pulse'>
                                <Zap size={11} />
                                1-SIDE OK
                              </span>
                            );
                          } else if (rec.status === 'assigned') {
                            stickerBadge = (
                              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'>
                                <Truck size={11} />
                                SHIPPED
                              </span>
                            );
                          }

                          return (
                            <div
                              key={rec.id}
                              className={`min-w-[275px] sm:min-w-[310px] max-w-[310px] snap-start shrink-0 bg-[#0e1626] rounded-2xl border p-3.5 flex flex-col justify-between transition-all ${
                                isEmergency
                                  ? 'border-rose-500/70'
                                  : rec.status === 'completed'
                                    ? 'border-emerald-500/30'
                                    : rec.status === 'new'
                                      ? 'border-blue-500/40'
                                      : 'border-slate-800'
                              }`}
                            >
                              {/* =================================== */}
                              {/* =================================== */}
                              {/* =================================== */}
                              {/* =================================== */}
                              <div className='space-y-2'>
                                {/* رأس الكارت: استيكر رقم الكارت الحقيقي في الإسلايدر + رقم الأوردر + حالة الاستيكر */}
                                <div className='flex items-center justify-between gap-1.5 pb-2 border-b border-slate-800/80'>
                                  <div className='flex items-center gap-1.5'>
                                    <span
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white shadow ${
                                        slider.rowNum === 1
                                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600'
                                          : 'bg-gradient-to-r from-fuchsia-600 to-purple-600'
                                      }`}
                                      title='Slider Card Index'
                                    >
                                      S{slider.rowNum} #{cardIdx + 1}
                                    </span>
                                    <span className='text-sm font-black text-white'>
                                      Order #{ord.order_number}
                                    </span>
                                  </div>
                                  {stickerBadge}
                                  {/* ========================= */}
                                  {/* ========================= */}
                                  {/* ========================= */}

                                  {/* ========================= */}
                                  {/* ========================= */}
                                </div>

                                {/* =================================== */}
                                {/* =================================== */}
                                {/* =================================== */}
                                {/* =================================== */}
                                {(() => {
                                  const tier = getCustomerTierBadge(ord, rec);
                                  const { dateLabel, time12h } =
                                    formatOrderDateTime12h(
                                      ord.created_at || rec.created_at,
                                    );
                                  const elapsedLabel = formatElapsedTime(
                                    ord.created_at || rec.created_at,
                                    relativeNowTick,
                                  );
                                  const branchLabel =
                                    typeof ord?.branch_name === 'string'
                                      ? ord.branch_name.trim()
                                      : '';

                                  return (
                                    <div className='p-2 rounded-xl bg-gradient-to-r from-[#090f19] via-[#101b30] to-[#090f19] border border-slate-800/90 space-y-1.5'>
                                      <div className='flex items-center justify-between gap-1.5'>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${tier.className}`}
                                        >
                                          ★ {tier.label}
                                        </span>

                                        {elapsedLabel && (
                                          <span className='px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-mono text-[10px] font-bold shrink-0'>
                                            ⏱ {elapsedLabel}
                                          </span>
                                        )}
                                      </div>

                                      <div className='flex items-center justify-between gap-1.5 text-[10px] text-slate-400 font-mono min-w-0'>
                                        <span className='truncate'>
                                          📅 {dateLabel} •{' '}
                                          <strong className='text-sky-300'>
                                            {time12h}
                                          </strong>
                                        </span>

                                        {branchLabel && (
                                          <span
                                            title={branchLabel}
                                            className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-sans text-[10px] font-bold shrink-0 max-w-[125px]'
                                          >
                                            <span>🏢</span>
                                            <span className='truncate'>
                                              {branchLabel}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                                {/* =================================== */}
                                {/* =================================== */}
                                {/* =================================== */}
                                {/* =================================== */}
                                {(() => {
                                  const sub = Number(
                                    ord.subtotal ?? ord.total_amount ?? 0,
                                  );
                                  const cnt = (ord.items || []).reduce(
                                    (s, it) => s + Number(it.quantity || 1),
                                    0,
                                  );
                                  const ev = evaluatePromoRules(promoRules, {
                                    subtotal: sub,
                                    itemsCount: cnt,
                                    // city: ord.city ?? '',
                                    orderDate: ord.created_at
                                      ? new Date(ord.created_at)
                                      : null,
                                  });
                                  const hasPromo =
                                    (ev?.matchedRules?.length ?? 0) > 0 ||
                                    Boolean(ord.free_shipping_approved) ||
                                    Boolean(ord.free_shipping_reason) ||
                                    Number(rec.delivery_fee || 0) === 0;

                                  if (!hasPromo) return null;

                                  const isApproved = Boolean(
                                    ord.free_shipping_approved,
                                  );

                                  return (
                                    <button
                                      type='button'
                                      onClick={() =>
                                        setActivePromoDelivery(rec)
                                      }
                                      className={`group w-full px-3 py-2 rounded-xl border backdrop-blur-md flex items-center justify-between gap-2 cursor-pointer select-none transition-all duration-150 active:scale-[0.98] ${
                                        isApproved
                                          ? 'bg-gradient-to-r from-emerald-950/60 via-[#0e1626]/90 to-teal-950/50 border-emerald-500/40 hover:border-emerald-400/70 shadow-sm shadow-emerald-950/40'
                                          : 'bg-gradient-to-r from-amber-950/55 via-[#0e1626]/95 to-rose-950/45 border-amber-500/45 hover:border-amber-400/80 shadow-md shadow-amber-950/40'
                                      }`}
                                    >
                                      <span className='flex items-center gap-2 min-w-0'>
                                        <span
                                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0 animate-bounce ${
                                            isApproved
                                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                                              : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                                          }`}
                                        >
                                          🎁
                                        </span>
                                        <span
                                          className={`text-xs font-black tracking-wide truncate ${
                                            isApproved
                                              ? 'text-emerald-300'
                                              : 'text-amber-200'
                                          }`}
                                        >
                                          Reward
                                        </span>
                                      </span>

                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                                          isApproved
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                                        }`}
                                      >
                                        {isApproved ? 'Approved' : 'Pending'}
                                      </span>
                                    </button>
                                  );
                                })()}
                                {/* =================================== */}
                                {/* =================================== */}
                                {/* =================================== */}
                                {/* =================================== */}
                                {/* =================================== */}

                                <div className='flex items-center justify-between text-xs'>
                                  <span className='font-bold text-slate-200 truncate max-w-[155px]'>
                                    {ord.customer_name}
                                  </span>
                                  <span className='font-black text-emerald-400'>
                                    {totalCollect} {storeCurrency}
                                  </span>
                                </div>

                                {(() => {
                                  const cardKey = String(
                                    rec.id ?? ord.id ?? ord.order_number,
                                  );
                                  const addrText = String(
                                    ord.customer_address || '',
                                  ).trim();
                                  const isLongAddr = addrText.length > 28;
                                  const isAddrOpen = Boolean(
                                    openAddressCardIds[cardKey],
                                  );

                                  return (
                                    <div className='space-y-1 text-[11px] text-slate-400'>
                                      <div className='flex items-center justify-between gap-1.5'>
                                        <span className='flex items-center gap-1 min-w-0 flex-1'>
                                          <span className='shrink-0'>📍</span>
                                          <span
                                            className={
                                              isAddrOpen
                                                ? 'text-slate-200 break-words'
                                                : 'truncate'
                                            }
                                          >
                                            {addrText || 'No address'}
                                          </span>
                                        </span>

                                        <div className='flex items-center gap-1.5 shrink-0'>
                                          {isLongAddr && (
                                            <button
                                              type='button'
                                              onClick={() =>
                                                toggleCardAddressAccordion(
                                                  cardKey,
                                                )
                                              }
                                              className='px-1.5 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[9px] font-black cursor-pointer'
                                            >
                                              {isAddrOpen ? 'Less ▲' : 'More ▼'}
                                            </button>
                                          )}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          <div
                                            className='inline-flex items-center gap-2'
                                            dir='ltr'
                                          >
                                            <a
                                              href={`tel:${ord.customer_phone}`}
                                              className='font-mono text-blue-400 hover:underline text-xs'
                                            >
                                              {ord.customer_phone}
                                            </a>

                                            <a
                                              href={buildCustomerWhatsAppLink(
                                                ord,
                                                rec,
                                              )}
                                              target='_blank'
                                              rel='noopener noreferrer'
                                              title='تأكيد الاوردر عبر واتساب'
                                              aria-label='تأكيد الاوردر عبر واتساب'
                                              className='inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 transition'
                                            >
                                              <svg
                                                className='w-3.5 h-3.5 fill-current'
                                                viewBox='0 0 24 24'
                                              >
                                                <path d='M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z' />
                                              </svg>
                                            </a>
                                          </div>
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                          {/* =========================================== */}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* زر المنتجات (يفتح الموديل) */}
                                {ord.items && ord.items.length > 0 && (
                                  <button
                                    type='button'
                                    onClick={() =>
                                      setProductsModalData({
                                        isOpen: true,
                                        orderNumber: ord.order_number,
                                        customerName: ord.customer_name,
                                        items: ord.items,
                                      })
                                    }
                                    className='w-full px-2.5 py-2 rounded-xl bg-gradient-to-r from-violet-950/50 via-[#090f19] to-fuchsia-950/40 hover:from-violet-900/60 hover:to-fuchsia-900/50 border border-violet-500/30 hover:border-violet-400/60 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group'
                                  >
                                    <span className='flex items-center gap-1.5 min-w-0 text-[11px] font-bold text-slate-200'>
                                      <span className='w-5 h-5 rounded-md bg-violet-500/20 border border-violet-400/35 text-violet-300 flex items-center justify-center text-xs shrink-0'>
                                        🛍
                                      </span>
                                      <span className='truncate'>
                                        Products ({ord.items.length}) •{' '}
                                        <span className='text-slate-400 font-normal'>
                                          {ord.items
                                            .map(
                                              (i: any) =>
                                                `${i.name || i.product_name || 'Item'} x${i.quantity || 1}`,
                                            )
                                            .join(', ')}
                                        </span>
                                      </span>
                                    </span>
                                    <span className='px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-200 border border-violet-400/35 text-[10px] font-black shrink-0 group-hover:scale-105 transition-transform'>
                                      Modal ↗
                                    </span>
                                  </button>
                                )}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* قسم الملاحظات القابل للفتح والغلق */}
                                {(() => {
                                  const cardKey = String(
                                    rec.id ?? ord.id ?? ord.order_number,
                                  );
                                  const notesText = getOrderNotesText(ord, rec);
                                  const isNotesOpen = Boolean(
                                    openNotesCardIds[cardKey],
                                  );

                                  return (
                                    <div className='rounded-xl bg-[#090f19] border border-slate-800/90 overflow-hidden'>
                                      <button
                                        type='button'
                                        onClick={() =>
                                          toggleCardNotesAccordion(cardKey)
                                        }
                                        className='w-full px-2.5 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-slate-900/70 transition-colors cursor-pointer'
                                      >
                                        <span className='flex items-center gap-1.5 text-[11px] font-bold text-amber-300/90'>
                                          <span>📝</span>
                                          <span>Notes</span>
                                          {notesText && (
                                            <span className='w-1.5 h-1.5 rounded-full bg-amber-400 inline-block' />
                                          )}
                                        </span>
                                        <span className='px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black'>
                                          {isNotesOpen ? 'Hide ▲' : 'Open ▼'}
                                        </span>
                                      </button>

                                      {isNotesOpen && (
                                        <div className='px-2.5 py-2 border-t border-slate-800/80 bg-amber-950/15 text-[11px] text-slate-200 break-words leading-relaxed'>
                                          {notesText || (
                                            <span className='text-slate-500 italic'>
                                              No notes on this order.
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}

                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}

                                <div className='flex items-center justify-between bg-[#090f19] px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px]'>
                                  <span className='text-slate-400 font-bold'>
                                    Fee ({storeCurrency}):
                                  </span>
                                  <div className='flex items-center gap-1.5'>
                                    <input
                                      type='number'
                                      min='0'
                                      value={
                                        feeInputs[rec.id] ?? rec.delivery_fee
                                      }
                                      onChange={(e) =>
                                        setFeeInputs((prev) => ({
                                          ...prev,
                                          [rec.id]: e.target.value,
                                        }))
                                      }
                                      disabled={rec.status === 'completed'}
                                      className='w-16 bg-[#0e1626] border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-white text-center outline-none'
                                    />
                                    {rec.status !== 'completed' && (
                                      <button
                                        onClick={() =>
                                          handleSaveDeliveryFee(rec)
                                        }
                                        disabled={savingFeeId === rec.id}
                                        className='px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white'
                                      >
                                        {savingFeeId === rec.id ? '..' : 'Set'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}
                                {/* ======================= */}

                                {rec.drivers && (
                                  <div className='p-2 rounded-xl bg-blue-950/20 border border-blue-500/25 space-y-1.5'>
                                    <div className='flex items-center justify-between text-[11px]'>
                                      <span className='font-bold text-blue-300 truncate'>
                                        🛵 {rec.drivers.full_name}
                                      </span>
                                      <span className='font-mono text-slate-400'>
                                        {rec.drivers.phone}
                                      </span>
                                    </div>

                                    <div className='grid grid-cols-2 gap-1.5 text-[10px] font-bold'>
                                      <div
                                        className={`py-1 px-1.5 rounded-lg text-center border ${
                                          rec.driver_confirmed
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                            : 'bg-[#090f19] border-slate-800 text-slate-500'
                                        }`}
                                      >
                                        {rec.driver_confirmed
                                          ? '✓ Driver OK'
                                          : '⏳ Driver'}
                                      </div>

                                      <div
                                        className={`py-1 px-1.5 rounded-lg text-center border ${
                                          rec.customer_confirmed
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                            : 'bg-[#090f19] border-slate-800 text-slate-500'
                                        }`}
                                      >
                                        {rec.customer_confirmed
                                          ? '✓ Client OK'
                                          : '⏳ Client'}
                                      </div>
                                    </div>

                                    {rec.driver_id &&
                                      !rec.pickup_confirmed &&
                                      rec.status !== 'cancelled' &&
                                      rec.status !== 'completed' && (
                                        <button
                                          type='button'
                                          onClick={() =>
                                            handleActivateDriverPickup(rec)
                                          }
                                          className='w-full py-1.5 px-2.5 rounded-lg bg-amber-500/90 hover:bg-amber-400 active:bg-amber-500 active:scale-[0.97] text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md hover:shadow-amber-500/25 transition-all duration-150 select-none'
                                        >
                                          <Store
                                            size={13}
                                            className='shrink-0 stroke-[2.5]'
                                          />
                                          <span>Activate Driver</span>
                                        </button>
                                      )}
                                  </div>
                                )}
                              </div>
                              {/* =================================== */}
                              {/* =================================== */}
                              {/* =================================== */}

                              <div className='pt-2.5 mt-2.5 border-t border-slate-800/80 space-y-1.5'>
                                {/* ==================================== */}
                                {/* ==================================== */}
                                {/* ==================================== */}
                                {/* ==================================== */}
                                {rec.status === 'new' && (
                                  <div className='flex items-center gap-1.5'>
                                    <button
                                      onClick={() =>
                                        handleSendToDriversGroup(rec)
                                      }
                                      className='flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] flex items-center justify-center gap-1 transition-colors'
                                    >
                                      <Send size={12} />
                                      Drivers Group
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDirectDriverModal({
                                          isOpen: true,
                                          record: rec,
                                        })
                                      }
                                      className='py-2 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 font-black text-[11px] flex items-center justify-center gap-1 transition-colors shrink-0'
                                    >
                                      <UserCheck size={13} />
                                      Pick Driver
                                    </button>
                                  </div>
                                )}

                                {/* ==================================== */}
                                {/* ==================================== */}
                                {/* ==================================== */}

                                {rec.status === 'assigned' && rec.drivers && (
                                  <button
                                    onClick={() =>
                                      handleSendToCustomerWhatsApp(rec)
                                    }
                                    className='w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors'
                                  >
                                    <ExternalLink size={13} />
                                    {rec.admin_notified_customer
                                      ? 'Re-send to Customer'
                                      : 'Send Details to Customer'}
                                  </button>
                                )}

                                {rec.status !== 'completed' &&
                                  rec.status !== 'cancelled' && (
                                    <div className='flex items-center gap-1.5'>
                                      <button
                                        onClick={() =>
                                          setActionModal({
                                            isOpen: true,
                                            type: 'force_complete',
                                            record: rec,
                                            processing: false,
                                          })
                                        }
                                        className='flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-emerald-600/20 text-slate-300 text-[11px] font-bold'
                                      >
                                        ✓ Complete
                                      </button>
                                      <button
                                        onClick={() =>
                                          setActionModal({
                                            isOpen: true,
                                            type: 'cancel_order',
                                            record: rec,
                                            processing: false,
                                          })
                                        }
                                        className='py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-rose-600/20 text-rose-400 text-[11px] font-bold'
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ),
                )}
              </div>
            )}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
            {/* ================================================== */}
          </div>
        )}
      </div>

      {/* ================= التبويب الثاني: بروفايلات العملاء وتحليل المنتجات ================= */}
      {/* ================= التبويب الثاني: بروفايلات العملاء وتحليل المنتجات ================= */}
      {activeTab === 'analytics' && (
        <ProductsAnalyticsTab
          deliveries={deliveries}
          storeCurrency={storeCurrency}
          supabase={supabase}
        />
      )}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ========================================= */}
      {/* ================= MODALS (بدون أي alert أو confirm) ================= */}

      {/* 1. مودال الإشعارات */}
      {feedbackModal.isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl'>
            <div className='flex flex-col items-center text-center'>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  feedbackModal.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : feedbackModal.type === 'warning'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {feedbackModal.type === 'success' && <CheckCircle2 size={30} />}
                {feedbackModal.type === 'warning' && (
                  <AlertTriangle size={30} />
                )}
                {feedbackModal.type === 'error' && <XCircle size={30} />}
              </div>
              <h3 className='text-lg font-black text-white'>
                {feedbackModal.title}
              </h3>
              <p className='text-sm text-slate-300 mt-2 leading-relaxed'>
                {feedbackModal.message}
              </p>
              <button
                onClick={() =>
                  setFeedbackModal((prev) => ({ ...prev, isOpen: false }))
                }
                className='mt-6 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. مودال تأكيد الإجراءات (إغلاق يدوي / إعادة طرح / إلغاء) */}
      {actionModal.isOpen && actionModal.record && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl'>
            <div className='flex flex-col items-center text-center'>
              <div className='w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-4'>
                <AlertTriangle size={28} />
              </div>

              <h3 className='text-lg font-black text-white'>
                {actionModal.type === 'force_complete' &&
                  'Complete Order Manually?'}
                {actionModal.type === 'reopen_driver' &&
                  'Re-open Order for Drivers?'}
                {actionModal.type === 'cancel_order' &&
                  'Cancel Delivery Order?'}
              </h3>

              <p className='text-sm text-slate-300 mt-2'>
                {actionModal.type === 'force_complete' &&
                  `This will mark Order #${actionModal.record.orders?.order_number} as fully delivered and update driver trip stats.`}
                {actionModal.type === 'reopen_driver' &&
                  `This will unassign the current driver and return Order #${actionModal.record.orders?.order_number} to NEW status.`}
                {actionModal.type === 'cancel_order' &&
                  `Are you sure you want to cancel Order #${actionModal.record.orders?.order_number}?`}
              </p>

              <div className='flex gap-3 w-full mt-6'>
                <button
                  onClick={() =>
                    setActionModal({
                      isOpen: false,
                      type: null,
                      record: null,
                      processing: false,
                    })
                  }
                  disabled={actionModal.processing}
                  className='flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm'
                >
                  Back
                </button>
                <button
                  onClick={executeConfirmedAction}
                  disabled={actionModal.processing}
                  className='flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm'
                >
                  {actionModal.processing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال اختيار سواق محدد للإرسال المباشر على الواتساب */}
      {directDriverModal.isOpen && directDriverModal.record && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[85vh] flex flex-col'>
            <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
              <div>
                <h3 className='text-base font-black text-white'>
                  Send Order #{directDriverModal.record.orders?.order_number}{' '}
                  Directly
                </h3>
                <p className='text-[11px] text-slate-400'>
                  Select an active driver to open their WhatsApp with pre-filled
                  message
                </p>
              </div>
              <button
                onClick={() =>
                  setDirectDriverModal({ isOpen: false, record: null })
                }
                className='p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white'
              >
                <X size={16} />
              </button>
            </div>

            <div className='py-3 overflow-y-auto space-y-2 flex-1'>
              {activeDrivers.length === 0 ? (
                <p className='text-center text-xs text-slate-400 py-8'>
                  No active drivers found. Activate drivers from Drivers Fleet
                  page first.
                </p>
              ) : (
                activeDrivers.map((drv) => {
                  const isVip = (drv.completed_deliveries || 0) > 3;
                  return (
                    <button
                      key={drv.id}
                      onClick={() =>
                        handleSendDirectToDriver(directDriverModal.record!, drv)
                      }
                      className='w-full p-3 rounded-2xl bg-[#090f19] border border-slate-800 hover:border-emerald-500/60 flex items-center justify-between text-left transition-all group'
                    >
                      <div>
                        <div className='flex items-center gap-1.5 flex-wrap'>
                          <span className='text-sm font-black text-white group-hover:text-emerald-400 transition-colors'>
                            {drv.full_name}
                          </span>
                          {drv.is_favorite && (
                            <span className='text-[10px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-400 font-bold'>
                              ❤️ Fav
                            </span>
                          )}
                          {isVip && (
                            <span className='text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-bold'>
                              VIP ⭐
                            </span>
                          )}
                        </div>
                        <p className='text-xs font-mono text-slate-400 mt-0.5'>
                          {drv.phone} • {drv.completed_deliveries || 0} trips
                        </p>
                      </div>

                      <span className='px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white text-xs font-black transition-colors shrink-0'>
                        Send ➔
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. مودال سجل أوردرات العميل */}
      {customerModal.isOpen && customerModal.customer && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] flex flex-col'>
            <div className='flex items-center justify-between pb-4 border-b border-slate-800'>
              <div>
                <h3 className='text-lg font-black text-white'>
                  {customerModal.customer.name}
                </h3>
                <p className='text-xs text-slate-400 font-mono'>
                  {customerModal.customer.phone} •{' '}
                  {customerModal.customer.ordersCount} Orders
                </p>
              </div>
              <button
                onClick={() =>
                  setCustomerModal({ isOpen: false, customer: null })
                }
                className='p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white'
              >
                <X size={18} />
              </button>
            </div>

            <div className='py-4 overflow-y-auto space-y-3 flex-1'>
              {customerModal.customer.ordersList.map((del) => (
                <div
                  key={del.id}
                  className='bg-[#090f19] border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1.5'
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-black text-white'>
                      Order #{del.orders?.order_number}
                    </span>
                    <span className='font-bold text-emerald-400'>
                      {del.orders?.total_amount} {storeCurrency}
                    </span>
                  </div>
                  <p className='text-slate-400'>
                    Status: <span className='uppercase'>{del.status}</span>
                    {del.drivers ? ` • Driver: ${del.drivers.full_name}` : ''}
                  </p>
                  <div className='flex flex-wrap items-center gap-2 text-[11px] text-slate-500'>
                    <span>{new Date(del.created_at).toLocaleString()}</span>
                    {del.orders?.branch_name && (
                      <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold'>
                        <span>🏢</span>
                        <span>{del.orders.branch_name}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {showActivatedModal && (
        <div
          onClick={() => setShowActivatedModal(false)}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='relative w-full max-w-xs rounded-3xl bg-gradient-to-b from-[#131e33] to-[#0b111e] border border-emerald-500/40 p-6 text-center shadow-[0_0_40px_rgba(16,185,129,0.25)] overflow-hidden'
          >
            {/* شريط إضاءة علوي ملون */}
            <div className='absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500' />

            {/* دائرة الأيقونة */}
            <div className='mx-auto mb-3.5 w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50'>
              <CheckCircle2 size={30} className='animate-bounce' />
            </div>

            {/* العنوان */}
            <h3 className='text-lg font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent'>
              Activated Successfully!
            </h3>

            {/* الوصف */}
            <p className='text-xs text-slate-300/90 font-medium mt-1.5 leading-relaxed'>
              Driver pickup has been confirmed and is now active.
            </p>

            {/* زرار إغلاق سريع */}
            <button
              type='button'
              onClick={() => setShowActivatedModal(false)}
              className='mt-5 w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95'
            >
              Awesome
            </button>
          </div>
        </div>
      )}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* ================= PROMO & REWARD DETAILS MODAL ================= */}
      {activePromoDelivery &&
        activePromoDelivery.orders &&
        (() => {
          const modalDel = activePromoDelivery;
          const modalOrd = modalDel.orders!;
          const sub = Number(modalOrd.subtotal ?? modalOrd.total_amount ?? 0);
          const cnt = (modalOrd.items || []).reduce(
            (s, it) => s + Number(it.quantity || 1),
            0,
          );
          const ev = evaluatePromoRules(promoRules, {
            subtotal: sub,
            itemsCount: cnt,
            // city: modalOrd.city ?? '',
            orderDate: modalOrd.created_at
              ? new Date(modalOrd.created_at)
              : undefined,
            completedOrdersCount: modalCompletedOrdersCount,
          });

          const matched = ev?.matchedRules ?? [];
          const hints = ev?.upcomingHints ?? [];
          const matchedTitles = matched
            .map(
              (m: any) =>
                m?.rule?.title || m?.title || m?.label || m?.message || '',
            )
            .filter(Boolean);
          const isApproved = Boolean(modalOrd.free_shipping_approved);
          const isApproving = approvingRewardOrderId === modalOrd.id;

          return (
            <div
              dir='ltr'
              onClick={() => setActivePromoDelivery(null)}
              className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className='relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#0e1626] via-[#090f19] to-[#07090e] border border-slate-700/70 shadow-2xl shadow-indigo-950/50 p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200'
              >
                {/* Header */}
                <div className='flex items-start justify-between gap-3 pb-4 border-b border-slate-800/90'>
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className='w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-indigo-500/20 border border-amber-400/35 flex items-center justify-center text-xl shrink-0 animate-bounce'>
                      🎁
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <h3 className='text-base sm:text-lg font-black text-white tracking-tight'>
                          Reward & Promo Details
                        </h3>
                        <span className='px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-slate-800/90 text-sky-300 border border-slate-700'>
                          Order #{modalOrd.order_number}
                        </span>
                      </div>
                      <p className='text-xs text-slate-400 truncate mt-0.5'>
                        {modalOrd.customer_name}
                        {/* {modalOrd.city ? ` • ${modalOrd.city}` : ''} */}
                      </p>
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={() => setActivePromoDelivery(null)}
                    className='px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/70 transition-colors cursor-pointer shrink-0'
                  >
                    Close
                  </button>
                </div>

                {/* Order Metrics & Approval Status */}
                <div className='grid grid-cols-3 gap-2.5 text-center'>
                  <div className='rounded-2xl bg-[#090f19]/90 border border-slate-800 p-3'>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400 block'>
                      Subtotal
                    </span>
                    <span className='text-sm font-black text-emerald-400 mt-0.5 block'>
                      {sub} {storeCurrency}
                    </span>
                  </div>

                  <div className='rounded-2xl bg-[#090f19]/90 border border-slate-800 p-3'>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400 block'>
                      Items
                    </span>
                    <span className='text-sm font-black text-sky-300 mt-0.5 block'>
                      {cnt}
                    </span>
                  </div>

                  <div className='rounded-2xl bg-[#090f19]/90 border border-slate-800 p-3 flex flex-col items-center justify-center'>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1'>
                      Status
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        isApproved
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Unlocked Rewards */}
                <div className='rounded-2xl bg-[#090f19]/80 border border-slate-800/90 p-4 space-y-2.5'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-xs font-black uppercase tracking-wider text-amber-300'>
                      Unlocked Rewards ({matched.length})
                    </h4>
                    {Number(modalDel.delivery_fee || 0) === 0 && (
                      <span className='text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30'>
                        0 Fee
                      </span>
                    )}
                  </div>

                  {matched.length > 0 ? (
                    <div className='space-y-1.5' dir='rtl'>
                      {matched.map((item: any, idx: number) => {
                        const title =
                          item?.rule?.title ||
                          item?.title ||
                          item?.label ||
                          item?.message ||
                          'مكافأة مستحقة';
                        const desc =
                          item?.rule?.description ||
                          item?.description ||
                          item?.rewardLabel ||
                          '';
                        return (
                          <div
                            key={item?.rule?.id || idx}
                            className='rounded-xl bg-gradient-to-r from-amber-500/10 via-[#0e1626] to-emerald-500/10 border border-amber-500/25 px-3 py-2 flex items-center justify-between gap-2'
                          >
                            <div className='min-w-0'>
                              <p className='text-xs font-black text-white truncate'>
                                🎁 {title}
                              </p>
                              {desc && (
                                <p className='text-[11px] text-slate-400 truncate'>
                                  {desc}
                                </p>
                              )}
                            </div>
                            <span className='text-[10px] font-bold text-emerald-300 shrink-0'>
                              ✓
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className='text-xs text-slate-400'>
                      {modalOrd.free_shipping_reason ||
                        'No rule matched automatically; check shipping or approval note below.'}
                    </p>
                  )}

                  {modalOrd.free_shipping_reason && (
                    <div
                      dir='rtl'
                      className='pt-2 border-t border-slate-800/80 text-xs text-slate-300'
                    >
                      <span className='text-[11px] font-bold text-slate-400 block mb-0.5'>
                        ملاحظة / سبب الاعتماد:
                      </span>
                      {modalOrd.free_shipping_reason}
                    </div>
                  )}
                </div>

                {/* Upcoming Progress */}
                <div className='rounded-2xl bg-[#090f19]/80 border border-slate-800/90 p-4 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-xs font-black uppercase tracking-wider text-sky-300'>
                      Upcoming Progress ({hints.length})
                    </h4>
                    <span className='text-[10px] text-slate-400 font-medium'>
                      Next milestones
                    </span>
                  </div>

                  {hints.length > 0 ? (
                    <div className='space-y-2.5'>
                      {hints.map((hint: any, idx: number) => {
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

                        const title =
                          hint?.rule?.title ||
                          hint?.title ||
                          hint?.label ||
                          hint?.message ||
                          hint?.hint ||
                          (typeof hint === 'string' ? hint : 'Upcoming Offer');

                        const detail =
                          hint?.message ||
                          hint?.hint ||
                          hint?.description ||
                          '';

                        return (
                          <div
                            key={hint?.rule?.id || idx}
                            className='rounded-xl bg-[#0e1626]/90 border border-slate-800 p-3 space-y-1.5'
                          >
                            <div className='flex items-center justify-between gap-2 text-xs'>
                              <span
                                dir='rtl'
                                className='font-bold text-slate-100 truncate'
                              >
                                {title}
                              </span>
                              <span className='font-mono font-black text-sky-300 shrink-0'>
                                {Math.round(progress)}%
                              </span>
                            </div>

                            <div className='w-full h-2 rounded-full bg-slate-800 overflow-hidden'>
                              <div
                                className='h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-500'
                                style={{ width: `${progress}%` }}
                              />
                            </div>

                            {detail && detail !== title && (
                              <p
                                dir='rtl'
                                className='text-[11px] text-slate-400 leading-relaxed'
                              >
                                {detail}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className='text-xs text-slate-400'>
                      No upcoming promo milestones for this order.
                    </p>
                  )}
                </div>

                {/* Action Footer */}
                <div className='flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/90'>
                  <button
                    type='button'
                    onClick={() => setActivePromoDelivery(null)}
                    className='px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer'
                  >
                    Done
                  </button>

                  {!isApproved && (
                    <button
                      type='button'
                      disabled={isApproving}
                      onClick={() =>
                        handleApproveOrderReward(modalDel, matchedTitles)
                      }
                      className='px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-60 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition-all duration-150 active:scale-[0.98] cursor-pointer'
                    >
                      {isApproving ? 'Approving...' : 'Approve Reward'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {groupPickerRecord && (
        <div
          onClick={() => setGroupPickerRecord(null)}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='w-full max-w-sm rounded-2xl bg-[#0e1626] border border-slate-700 p-4 space-y-3 shadow-2xl'
          >
            <div className='flex items-center justify-between border-b border-slate-800 pb-2'>
              <h4 className='text-sm font-black text-white'>
                Choose Drivers Group (#{groupPickerRecord.orders?.order_number})
              </h4>
              <button
                type='button'
                onClick={() => setGroupPickerRecord(null)}
                className='text-xs text-slate-400 hover:text-white cursor-pointer'
              >
                Close
              </button>
            </div>

            <div className='space-y-1.5 max-h-60 overflow-y-auto'>
              {driverGroups.map((grp) => (
                <button
                  key={grp.id}
                  type='button'
                  onClick={async () => {
                    const target = groupPickerRecord;
                    setGroupPickerRecord(null);
                    await sendDispatchToLink(
                      target,
                      grp.group_link,
                      String(grp.id ?? grp.name),
                      grp.name || 'Drivers Group',
                    );
                  }}
                  className='w-full text-left px-3 py-2.5 rounded-xl bg-[#090f19] hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 text-xs font-bold text-white flex items-center justify-between transition-colors cursor-pointer'
                >
                  <span className='truncate'>{grp.name}</span>
                  <span className='text-[11px] text-blue-400 shrink-0'>
                    Send →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* موديل عرض تفاصيل المنتجات */}
      {productsModalData.isOpen &&
        (() => {
          const itemsList = Array.isArray(productsModalData.items)
            ? productsModalData.items
            : [];

          const summary = itemsList.reduce(
            (acc: { totalUnits: number; totalPrice: number }, rawItem: any) => {
              const info = getRichItemDetails(rawItem);
              const qty = Number(info.quantity) || 0;
              const price = Number(info.currentPrice) || 0;
              acc.totalUnits += qty;
              acc.totalPrice += price * qty;
              return acc;
            },
            { totalUnits: 0, totalPrice: 0 },
          );

          const closeModal = () =>
            setProductsModalData({ isOpen: false, items: [] });

          return (
            <div
              className='fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn duration-200'
              onClick={closeModal}
            >
              <div
                className='w-full max-w-xl max-h-[86vh] rounded-3xl bg-[#090f19]/95 border border-slate-700/80 shadow-2xl shadow-violet-950/40 flex flex-col overflow-hidden transition-all duration-300 scale-100'
                onClick={(e) => e.stopPropagation()}
              >
                {/* هيدر الموديل */}
                <div className='px-4 py-3.5 bg-gradient-to-r from-violet-950/70 via-[#0e1626] to-cyan-950/60 border-b border-slate-800/90 flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <h3 className='text-sm sm:text-base font-black text-white flex items-center gap-2 flex-wrap'>
                      <span>
                        🛍 Order #{productsModalData.orderNumber} Items
                      </span>
                      <span className='px-2 py-0.5 rounded-full text-[11px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/35'>
                        {itemsList.length}{' '}
                        {itemsList.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </h3>
                    {productsModalData.customerName && (
                      <p className='text-xs text-slate-400 mt-0.5 truncate'>
                        Customer:{' '}
                        <strong className='text-slate-200'>
                          {productsModalData.customerName}
                        </strong>
                      </p>
                    )}
                  </div>

                  <button
                    type='button'
                    onClick={closeModal}
                    className='px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shrink-0'
                  >
                    ✕ Close
                  </button>
                </div>

                {/* ملخص إجمالي عدد المنتجات وتوتال السعر في الأعلى */}
                <div className='px-4 pt-3.5 pb-2 bg-[#070b14]/90 border-b border-slate-800/80 grid grid-cols-2 gap-2.5'>
                  <div className='p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-[#0e1626] to-blue-500/10 border border-cyan-500/25 flex items-center justify-between gap-2 transition-transform duration-200 hover:-translate-y-0.5'>
                    <div>
                      <span className='block text-[10px] uppercase tracking-wider font-bold text-cyan-300/80'>
                        Total Products
                      </span>
                      <span className='text-sm sm:text-base font-black font-mono text-white'>
                        {summary.totalUnits}{' '}
                        <span className='text-[11px] font-sans font-semibold text-cyan-300'>
                          pcs
                        </span>
                      </span>
                    </div>
                    <span className='w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-sm shrink-0'>
                      📦
                    </span>
                  </div>

                  <div className='p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#0e1626] to-teal-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 transition-transform duration-200 hover:-translate-y-0.5'>
                    <div className='min-w-0'>
                      <span className='block text-[10px] uppercase tracking-wider font-bold text-emerald-300/80'>
                        Total Price
                      </span>
                      <span className='text-sm sm:text-base font-black font-mono text-emerald-300 truncate block'>
                        {summary.totalPrice.toLocaleString()}{' '}
                        <span className='text-[11px] font-sans font-bold text-emerald-400/90'>
                          {storeCurrency}
                        </span>
                      </span>
                    </div>
                    <span className='w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0'>
                      💰
                    </span>
                  </div>
                </div>

                {/* قائمة المنتجات */}
                <div className='p-4 space-y-2.5 overflow-y-auto'>
                  {itemsList.map((rawItem: any, idx: number) => {
                    const info = getRichItemDetails(rawItem);
                    const lineTotal =
                      (Number(info.currentPrice) || 0) *
                      (Number(info.quantity) || 0);

                    return (
                      <div
                        key={rawItem?.id || `modal-item-${idx}`}
                        style={{
                          animationDelay: `${Math.min(idx * 45, 300)}ms`,
                        }}
                        className='p-3 rounded-2xl bg-[#0e1626] border border-slate-800 hover:border-violet-500/45 hover:bg-[#121c30] transition-all duration-200 hover:-translate-y-0.5 flex gap-3 items-start group'
                      >
                        {info.imageUrl ? (


                          <Image
                            src={info.imageUrl}
                            alt={info.name || 'Item'}
                            width={160}
                            height={160}
                            loading='lazy'
                            sizes='(max-width: 640px) 64px, 80px'
                            unoptimized={
                              info.imageUrl.startsWith('blob:') ||
                              info.imageUrl.startsWith('data:')
                            }
                            className='w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-700/80 group-hover:border-violet-400/50 bg-slate-900 shrink-0 transition-transform duration-200 group-hover:scale-105'
                          />
                        ) : (
                          <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0'>
                            NO IMG
                          </div>
                        )}

                        <div className='min-w-0 flex-1 space-y-1'>
                          <div className='flex items-start justify-between gap-2'>
                            <h4 className='text-xs sm:text-sm font-black text-white break-words'>
                              {info.name}
                            </h4>
                            <span className='px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-black shrink-0'>
                              Qty: {info.quantity}
                            </span>
                          </div>

                          {info.description && (
                            <p className='text-[11px] text-slate-400 leading-relaxed break-words'>
                              {info.description}
                            </p>
                          )}

                          <div className='flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono'>
                            <div className='flex items-center gap-2'>
                              <span className='font-black text-emerald-400'>
                                {info.currentPrice} {storeCurrency}
                              </span>
                              {info.hasDiscount &&
                                info.beforeDiscountPrice !== null && (
                                  <span className='line-through text-rose-400/80 text-[11px]'>
                                    {info.beforeDiscountPrice} {storeCurrency}
                                  </span>
                                )}
                            </div>

                            <span className='text-[11px] text-slate-300 font-bold'>
                              Total:{' '}
                              <strong className='text-amber-300'>
                                {lineTotal.toLocaleString()}
                              </strong>{' '}
                              {storeCurrency}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {isGroupManagerOpen && (
        <div
          onClick={() => setIsGroupManagerOpen(false)}
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='w-full max-w-md rounded-2xl bg-[#0e1626] border border-slate-700 p-4 space-y-4 shadow-2xl'
          >
            <div className='flex items-center justify-between border-b border-slate-800 pb-2.5'>
              <h4 className='text-sm font-black text-white'>
                Manage WhatsApp Driver Groups
              </h4>
              <button
                type='button'
                onClick={() => setIsGroupManagerOpen(false)}
                className='text-xs text-slate-400 hover:text-white cursor-pointer'
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveNamedGroup} className='space-y-2.5'>
              <input
                type='text'
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                placeholder='Group Name (e.g. Nasr City Drivers)'
                className='w-full bg-[#090f19] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none'
              />
              <input
                type='url'
                value={groupLink}
                onChange={(e) => setGroupLink(e.target.value)}
                placeholder='https://chat.whatsapp.com/...'
                className='w-full bg-[#090f19] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none'
              />
              <div className='flex items-center gap-2'>
                <button
                  type='submit'
                  disabled={savingGroupLink}
                  className='flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer'
                >
                  {savingGroupLink
                    ? 'Saving...'
                    : editingGroupId
                      ? 'Update Group'
                      : 'Add Group'}
                </button>
                {editingGroupId && (
                  <button
                    type='button'
                    onClick={() => {
                      setEditingGroupId(null);
                      setGroupNameInput('');
                      setGroupLink('');
                    }}
                    className='px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer'
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className='space-y-1.5 max-h-56 overflow-y-auto border-t border-slate-800 pt-3'>
              {driverGroups.length === 0 ? (
                <p className='text-xs text-slate-400 text-center py-3'>
                  No groups added yet.
                </p>
              ) : (
                driverGroups.map((grp) => (
                  <div
                    key={grp.id}
                    className='flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#090f19] border border-slate-800'
                  >
                    <div className='min-w-0'>
                      <p className='text-xs font-bold text-white truncate'>
                        {grp.name}
                      </p>
                      <p className='text-[11px] text-slate-400 truncate'>
                        {grp.group_link}
                      </p>
                    </div>
                    <div className='flex items-center gap-1.5 shrink-0'>
                      <button
                        type='button'
                        onClick={() => handleStartEditGroup(grp)}
                        className='px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-bold cursor-pointer'
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDeleteGroup(grp.id)}
                        className='px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[11px] font-bold cursor-pointer'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
      {/* =================================== */}
    </div>
  );
  /* =================================== */
}
{
  {
    /* =========================== */
  }
}
