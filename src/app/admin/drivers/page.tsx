'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  FileDown,
  Database,
  Search,
  Star,
  Heart,
  ShieldCheck,
  ShieldAlert,
  Phone,
  MapPin,
  CreditCard,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  Award,
  Truck,
  Link as LinkIcon,
  Save,
  Image as ImageIcon,
  Sparkles,
  X,
  SlidersHorizontal,
} from 'lucide-react';

// تعريف نوع بيانات السواق المطابق لجدول Supabase
interface Driver {
  id: string;
  full_name: string;
  phone: string;
  guarantor_phone: string;
  address: string;
  national_id: string;
  card_code: string;
  is_active: boolean;
  is_favorite: boolean;
  completed_deliveries: number;
  average_rating: number;
  total_reviews: number;
  created_at: string;
}

// تعريف نوع التقييمات القادمة من جدول التوصيل لعرضها في المودال
interface DriverReview {
  id: string;
  driver_rating: number;
  customer_review: string | null;
  customer_confirmed_at: string | null;
  orders: {
    customer_name: string;
    order_number: number;
  } | null;
}

// نوع الفلتر النشط
type FilterType =
  | 'all'
  | 'active'
  | 'inactive'
  | 'favorite'
  | 'vip'
  | 'regular'
  | 'top_rated';

export default function DriversManagementPage() {
  // حالات البيانات الأساسية
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingDb, setSubmittingDb] = useState<boolean>(false);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);

  // حالة لينك جروب الواتساب للسواقين
  const [groupLink, setGroupLink] = useState<string>('');
  const [savingGroupLink, setSavingGroupLink] = useState<boolean>(false);

  // حالات الفلترة والبحث والترتيب
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'deliveries' | 'rating'>(
    'newest',
  );

  // حالات فورم إضافة سواق جديد (البيانات النصية)
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [guarantorPhone, setGuarantorPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');
  const [cardCode, setCardCode] = useState<string>('');

  // حالات الصور المحلية للـ PDF فقط (لا تُرفع للسيرفر)
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [personalPhotoFile, setPersonalPhotoFile] = useState<File | null>(null);

  // مرجع الإسلايدر الأفقي للتحكم في التمرير يمين ويسار
  const sliderRef = useRef<HTMLDivElement>(null);

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

  // مودال تأكيد الحذف (بديل confirm)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    driver: Driver | null;
    deleting: boolean;
  }>({
    isOpen: false,
    driver: null,
    deleting: false,
  });

  // مودال عرض تقييمات العملاء للسواق
  const [reviewsModal, setReviewsModal] = useState<{
    isOpen: boolean;
    driver: Driver | null;
    reviews: DriverReview[];
    loading: boolean;
  }>({
    isOpen: false,
    driver: null,
    reviews: [],
    loading: false,
  });

  // دالة مساعدة لإظهار مودال التنبيهات
  const showModal = (
    type: 'success' | 'error' | 'warning',
    title: string,
    message: string,
  ) => {
    setFeedbackModal({ isOpen: true, type, title, message });
  };

  // جلب السواقين ولينك الجروب عند تحميل الصفحة
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // جلب قائمة السواقين
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      // جلب لينك جروب السواقين من الإعدادات
      const { data: settingsData } = await supabase
        .from('settings')
        .select('drivers_group_link')
        .limit(1)
        .single();

      if (settingsData?.drivers_group_link) {
        setGroupLink(settingsData.drivers_group_link);
      }
    } catch (err: any) {
      showModal(
        'error',
        'Failed to Load Data',
        err?.message || 'An error occurred while fetching drivers list.',
      );
    } finally {
      setLoading(false);
    }
  };

  // حفظ رابط جروب الواتساب في جدول settings
  const handleSaveGroupLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGroupLink(true);
    try {
      // التحقق من وجود سطر إعدادات وتحديثه
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single();

      if (existingSettings) {
        const { error } = await supabase
          .from('settings')
          .update({ drivers_group_link: groupLink.trim() })
          .eq('id', existingSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert([{ drivers_group_link: groupLink.trim() }]);
        if (error) throw error;
      }

      showModal(
        'success',
        'Group Link Saved',
        'Drivers WhatsApp group link has been updated successfully.',
      );
    } catch (err: any) {
      showModal(
        'error',
        'Save Failed',
        err?.message || 'Could not save the WhatsApp group link.',
      );
    } finally {
      setSavingGroupLink(false);
    }
  };

  // دالة لرسم البيانات النصية (عربي وإنجليزي) بدقة عالية كصورة لإدراجها في الـ PDF بدون تشويه
  const renderTextBlockAsImage = (lines: string[]): string => {
    const canvas = document.createElement('canvas');
    const scale = 2; // جودة مضاعفة للطباعة الواضحة
    const width = 520;
    const height = lines.length * 32 + 20;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
      ctx.textBaseline = 'top';

      lines.forEach((line, index) => {
        ctx.fillText(line, 5, 10 + index * 32);
      });
    }
    return canvas.toDataURL('image/png');
  };

  // دالة مساعدة لتحويل ملف الصورة المحلي إلى Base64 لإدراجه في الـ PDF محلياً
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // الزرار الأول: توليد وتحميل ملف PDF محلي بالبيانات والصور
  const handleGenerateLocalPdf = async () => {
    // التحقق من اكتمال الحقول النصية والصور
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !guarantorPhone.trim() ||
      !address.trim() ||
      !nationalId.trim() ||
      !cardCode.trim()
    ) {
      showModal(
        'warning',
        'Missing Text Details',
        'Please fill in all driver text fields before generating the PDF archive.',
      );
      return;
    }

    if (!idFrontFile || !idBackFile || !personalPhotoFile) {
      showModal(
        'warning',
        'Missing Required Photos',
        'Please attach ID Front, ID Back, and Personal Photo to generate the local PDF.',
      );
      return;
    }

    setGeneratingPdf(true);
    try {
      const [frontImg, backImg, personalImg] = await Promise.all([
        fileToDataUrl(idFrontFile),
        fileToDataUrl(idBackFile),
        fileToDataUrl(personalPhotoFile),
      ]);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // ترويسة الملف
      doc.setFillColor(14, 22, 38);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('VERIFIED DRIVER ARCHIVE RECORD', 15, 16);
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 24);

      // الصورة الشخصية في أعلى اليمين
      doc.addImage(personalImg, 'JPEG', 155, 38, 40, 45);
      doc.setDrawColor(200, 200, 200);
      doc.rect(155, 38, 40, 45);

      // جدول البيانات النصية
      // جدول البيانات النصية (يدعم العربية والإنجليزية بوضوح تام)
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text('Driver Personal & Security Information', 15, 45);

      const details = [
        `Full Name: ${fullName.trim()}`,
        `Driver Phone: ${phone.trim()}`,
        `Guarantor Phone: ${guarantorPhone.trim()}`,
        `National ID: ${nationalId.trim()}`,
        `ID Card Code: ${cardCode.trim()}`,
        `Address: ${address.trim()}`,
      ];

      const textImage = renderTextBlockAsImage(details);
      doc.addImage(textImage, 'PNG', 15, 49, 135, 46);
      // خط فاصل قبل صور البطاقة
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 98, 195, 98);

      // صورة وش البطاقة
      doc.setFontSize(12);
      doc.text('National ID - Front Side', 15, 108);
      doc.addImage(frontImg, 'JPEG', 15, 112, 180, 75);

      // صورة ضهر البطاقة
      doc.text('National ID - Back Side', 15, 198);
      doc.addImage(backImg, 'JPEG', 15, 202, 180, 75);

      // حفظ الملف محلياً باسم السواق
      const safeFileName = fullName.trim().replace(/\s+/g, '_');
      doc.save(`Driver_${safeFileName}_${nationalId.trim()}.pdf`);

      showModal(
        'success',
        'Local PDF Downloaded',
        'Driver archive PDF with photos has been saved directly to your device.',
      );
    } catch (err: any) {
      showModal(
        'error',
        'PDF Generation Failed',
        'Could not process one of the selected images. Please try standard JPG or PNG files.',
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  // الزرار الثاني: حفظ البيانات النصية فقط في قاعدة بيانات Supabase
  const handleSaveDriverToDatabase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !guarantorPhone.trim() ||
      !address.trim() ||
      !nationalId.trim() ||
      !cardCode.trim()
    ) {
      showModal(
        'warning',
        'Incomplete Information',
        'Please complete all text fields before saving the driver to the system.',
      );
      return;
    }

    setSubmittingDb(true);
    try {
      const cleanPhone = phone.trim();
      const cleanNationalId = nationalId.trim();

      // إرسال البيانات النصية فقط وتجاهل الصور تماماً
      const { data, error } = await supabase
        .from('drivers')
        .insert([
          {
            full_name: fullName.trim(),
            phone: cleanPhone,
            guarantor_phone: guarantorPhone.trim(),
            address: address.trim(),
            national_id: cleanNationalId,
            card_code: cardCode.trim(),
            is_active: true,
            is_favorite: false,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error(
            'A driver with this Phone Number or National ID already exists.',
          );
        }
        throw error;
      }

      if (data) {
        setDrivers((prev) => [data, ...prev]);
      }

      // تفريغ الفورم بعد الحفظ بنجاح
      setFullName('');
      setPhone('');
      setGuarantorPhone('');
      setAddress('');
      setNationalId('');
      setCardCode('');
      setIdFrontFile(null);
      setIdBackFile(null);
      setPersonalPhotoFile(null);

      showModal(
        'success',
        'Driver Registered',
        `${data.full_name} has been saved to the database and can now accept delivery orders.`,
      );
    } catch (err: any) {
      showModal(
        'error',
        'Registration Failed',
        err?.message || 'An unexpected error occurred while saving the driver.',
      );
    } finally {
      setSubmittingDb(false);
    }
  };

  // تبديل حالة نشاط السواق (Active / Inactive)
  const toggleDriverActive = async (driver: Driver) => {
    const newStatus = !driver.is_active;
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_active: newStatus })
        .eq('id', driver.id);

      if (error) throw error;

      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driver.id ? { ...d, is_active: newStatus } : d,
        ),
      );
    } catch (err: any) {
      showModal(
        'error',
        'Update Failed',
        err?.message || 'Failed to update driver status.',
      );
    }
  };

  // تبديل حالة المفضلة (Favorite)
  const toggleDriverFavorite = async (driver: Driver) => {
    const newFav = !driver.is_favorite;
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_favorite: newFav })
        .eq('id', driver.id);

      if (error) throw error;

      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driver.id ? { ...d, is_favorite: newFav } : d,
        ),
      );
    } catch (err: any) {
      showModal(
        'error',
        'Update Failed',
        err?.message || 'Failed to update favorite status.',
      );
    }
  };

  // حذف سواق بعد التأكيد من المودال
  const confirmDeleteDriver = async () => {
    if (!deleteModal.driver) return;
    setDeleteModal((prev) => ({ ...prev, deleting: true }));

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', deleteModal.driver.id);

      if (error) throw error;

      setDrivers((prev) => prev.filter((d) => d.id !== deleteModal.driver?.id));
      setDeleteModal({ isOpen: false, driver: null, deleting: false });
      showModal(
        'success',
        'Driver Deleted',
        'The driver record has been permanently removed.',
      );
    } catch (err: any) {
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
      showModal(
        'error',
        'Deletion Failed',
        err?.message || 'Could not delete the driver record.',
      );
    }
  };

  // فتح مودال وعرض تقييمات العملاء للسواق
  const openDriverReviews = async (driver: Driver) => {
    setReviewsModal({
      isOpen: true,
      driver,
      reviews: [],
      loading: true,
    });

    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(
          `
          id,
          driver_rating,
          customer_review,
          customer_confirmed_at,
          orders (
            customer_name,
            order_number
          )
        `,
        )
        .eq('driver_id', driver.id)
        .not('driver_rating', 'is', null)
        .order('customer_confirmed_at', { ascending: false });

      if (error) throw error;

      setReviewsModal((prev) => ({
        ...prev,
        reviews: (data as unknown as DriverReview[]) || [],
        loading: false,
      }));
    } catch (err) {
      setReviewsModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // دوال التحكم في الإسلايدر الأفقي (يمين ويسار + البداية والنهاية)
  const scrollSlider = (direction: 'left' | 'right' | 'start' | 'end') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    if (direction === 'start') {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === 'end') {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    } else {
      const scrollAmount = 340;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // حساب الإحصائيات والتحليلات الحية
  const analytics = useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter((d) => d.is_active).length;
    const inactive = total - active;
    const favorites = drivers.filter((d) => d.is_favorite).length;
    const vip = drivers.filter((d) => d.completed_deliveries > 3).length;
    const regular = total - vip;
    const topRated = drivers.filter(
      (d) => Number(d.average_rating) >= 4.5,
    ).length;

    const totalTrips = drivers.reduce(
      (acc, d) => acc + (d.completed_deliveries || 0),
      0,
    );

    const ratedDrivers = drivers.filter((d) => d.total_reviews > 0);
    const fleetAvgRating =
      ratedDrivers.length > 0
        ? (
            ratedDrivers.reduce((acc, d) => acc + Number(d.average_rating), 0) /
            ratedDrivers.length
          ).toFixed(1)
        : '0.0';

    return {
      total,
      active,
      inactive,
      favorites,
      vip,
      regular,
      topRated,
      totalTrips,
      fleetAvgRating,
    };
  }, [drivers]);

  // تطبيق الفلترة والبحث والترتيب على قائمة السواقين
  const filteredDrivers = useMemo(() => {
    return drivers
      .filter((driver) => {
        if (activeFilter === 'active' && !driver.is_active) return false;
        if (activeFilter === 'inactive' && driver.is_active) return false;
        if (activeFilter === 'favorite' && !driver.is_favorite) return false;
        if (activeFilter === 'vip' && driver.completed_deliveries <= 3)
          return false;
        if (activeFilter === 'regular' && driver.completed_deliveries > 3)
          return false;
        if (activeFilter === 'top_rated' && Number(driver.average_rating) < 4.5)
          return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = driver.full_name.toLowerCase().includes(q);
          const matchPhone = driver.phone.toLowerCase().includes(q);
          const matchGuarantor = driver.guarantor_phone
            .toLowerCase()
            .includes(q);
          const matchId = driver.national_id.toLowerCase().includes(q);
          const matchAddress = driver.address.toLowerCase().includes(q);
          return (
            matchName || matchPhone || matchGuarantor || matchId || matchAddress
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deliveries') {
          return (b.completed_deliveries || 0) - (a.completed_deliveries || 0);
        }
        if (sortBy === 'rating') {
          return Number(b.average_rating || 0) - Number(a.average_rating || 0);
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [drivers, activeFilter, searchQuery, sortBy]);

  return (
    <div className='min-h-screen bg-[#090f19] text-slate-100 pb-16'>
      {/* شريط العنوان العلوي */}
      <div className='border-b border-slate-800/80 bg-[#0e1626]/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-300'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4'>
          <div className='flex items-center gap-3 min-w-0'>
            <Link
              href='/admin'
              className='p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all duration-200 active:scale-95 shrink-0'
              title='Back to Admin Dashboard'
            >
              <ArrowLeft size={20} />
            </Link>
            <div className='min-w-0'>
              <h1 className='text-base sm:text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2 truncate'>
                <Users className='text-emerald-400 shrink-0' size={22} />
                <span className='truncate'>Drivers Fleet Management</span>
              </h1>
              <p className='text-xs text-slate-400 line-clamp-1'>
                Register verified drivers, export local ID PDFs, and monitor
                ratings
              </p>
            </div>
          </div>

          {/* زر الانتقال السريع إلى صفحة التوصيل */}
          <div className='flex items-center justify-end gap-2 shrink-0'>
            <Link
              href='/admin/delivery'
              className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600/25 to-teal-600/25 hover:from-indigo-600/40 hover:to-teal-600/40 text-teal-200 hover:text-white border border-teal-400/35 hover:border-teal-300/60 text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 active:scale-95'
            >
              <Truck size={17} className='text-teal-300 shrink-0' />
              <span>Delivery Operations</span>
            </Link>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6'>
        {/* 1. بوكسات التحليلات العامة للأسطول */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          <div className='bg-[#0e1626] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between'>
            <div>
              <p className='text-xs text-slate-400 font-medium'>Total Fleet</p>
              <p className='text-2xl sm:text-3xl font-black text-white mt-1'>
                {analytics.total}
              </p>
              <p className='text-[11px] text-emerald-400 mt-1'>
                {analytics.active} Active Now
              </p>
            </div>
            <div className='w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400'>
              <Users size={22} />
            </div>
          </div>

          <div className='bg-[#0e1626] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between'>
            <div>
              <p className='text-xs text-slate-400 font-medium'>
                Completed Trips
              </p>
              <p className='text-2xl sm:text-3xl font-black text-white mt-1'>
                {analytics.totalTrips}
              </p>
              <p className='text-[11px] text-slate-400 mt-1'>
                Across all drivers
              </p>
            </div>
            <div className='w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400'>
              <Truck size={22} />
            </div>
          </div>

          <div className='bg-[#0e1626] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between'>
            <div>
              <p className='text-xs text-slate-400 font-medium'>
                Fleet Avg Rating
              </p>
              <p className='text-2xl sm:text-3xl font-black text-amber-400 mt-1 flex items-center gap-1'>
                {analytics.fleetAvgRating}
                <Star size={18} className='fill-amber-400 text-amber-400' />
              </p>
              <p className='text-[11px] text-slate-400 mt-1'>
                Customer feedback
              </p>
            </div>
            <div className='w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400'>
              <Award size={22} />
            </div>
          </div>

          <div className='bg-[#0e1626] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between'>
            <div>
              <p className='text-xs text-slate-400 font-medium'>VIP Drivers</p>
              <p className='text-2xl sm:text-3xl font-black text-purple-400 mt-1'>
                {analytics.vip}
              </p>
              <p className='text-[11px] text-slate-400 mt-1'>
                Over 3 completed orders
              </p>
            </div>
            <div className='w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400'>
              <Sparkles size={22} />
            </div>
          </div>
        </div>

        {/* 2. بوكسات الفلترة التفاعلية بأعداد حية */}
        <div className='bg-[#0e1626] border border-slate-800/90 rounded-2xl p-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
              <SlidersHorizontal size={14} className='text-blue-400' />
              Smart Fleet Filters (Live Count)
            </span>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className='text-xs text-rose-400 hover:text-rose-300 font-semibold'
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* شبكة بوكسات الفلترة */}
          <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5'>
            {[
              {
                key: 'all',
                label: 'All Drivers',
                count: analytics.total,
                color: 'blue',
              },
              {
                key: 'active',
                label: 'Active',
                count: analytics.active,
                color: 'emerald',
              },
              {
                key: 'inactive',
                label: 'Inactive',
                count: analytics.inactive,
                color: 'rose',
              },
              {
                key: 'favorite',
                label: 'Favorites ❤️',
                count: analytics.favorites,
                color: 'pink',
              },
              {
                key: 'vip',
                label: 'VIP ⭐',
                count: analytics.vip,
                color: 'purple',
              },
              {
                key: 'regular',
                label: 'Regular',
                count: analytics.regular,
                color: 'slate',
              },
              {
                key: 'top_rated',
                label: 'Top Rated 🏆',
                count: analytics.topRated,
                color: 'amber',
              },
            ].map((box) => {
              const isSelected = activeFilter === box.key;
              return (
                <button
                  key={box.key}
                  onClick={() => setActiveFilter(box.key as FilterType)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-[#090f19] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {box.label}
                  </span>
                  <span
                    className={`text-xl font-black mt-1 ${
                      isSelected ? 'text-blue-400' : 'text-slate-200'
                    }`}
                  >
                    {box.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* شريط البحث الشامل + الترتيب */}
          <div className='flex flex-col sm:flex-row gap-3 pt-1'>
            <div className='relative flex-1'>
              <Search
                size={17}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search by driver name, phone, guarantor phone, National ID, or address...'
                className='w-full bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors'
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white'
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className='bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none'
            >
              <option value='newest'>Sort: Newest Registered</option>
              <option value='deliveries'>Sort: Most Deliveries</option>
              <option value='rating'>Sort: Highest Rating</option>
            </select>
          </div>
        </div>

        {/* 3. قسم عرض السواقين بإسلايدر أفقي ناعم وأزرار تحكم في البداية والنهاية */}
        <div className='bg-[#0e1626] border border-slate-800/90 rounded-2xl p-4 sm:p-6 space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div>
              <h2 className='text-lg font-black text-white flex items-center gap-2'>
                Registered Drivers Slider
                <span className='text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300'>
                  {filteredDrivers.length} shown
                </span>
              </h2>
              <p className='text-xs text-slate-400'>
                Swipe horizontally or use controls to jump between start and end
              </p>
            </div>

            {/* أزرار التحكم في الإسلايدر (البداية - خطوة يسار - خطوة يمين - النهاية) */}
            <div className='flex items-center gap-1.5 self-end sm:self-auto'>
              <button
                onClick={() => scrollSlider('start')}
                className='px-2.5 py-1.5 rounded-lg bg-[#090f19] border border-slate-800 hover:border-slate-600 text-xs font-bold text-slate-300 transition-colors'
                title='Jump to Start'
              >
                First
              </button>
              <button
                onClick={() => scrollSlider('left')}
                className='p-2 rounded-lg bg-[#090f19] border border-slate-800 hover:border-slate-600 text-slate-300 transition-colors'
                title='Scroll Left'
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollSlider('right')}
                className='p-2 rounded-lg bg-[#090f19] border border-slate-800 hover:border-slate-600 text-slate-300 transition-colors'
                title='Scroll Right'
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => scrollSlider('end')}
                className='px-2.5 py-1.5 rounded-lg bg-[#090f19] border border-slate-800 hover:border-slate-600 text-xs font-bold text-slate-300 transition-colors'
                title='Jump to End'
              >
                Last
              </button>
            </div>
          </div>

          {loading ? (
            <div className='py-12 text-center text-slate-400 text-sm'>
              Loading drivers fleet...
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className='py-12 text-center bg-[#090f19] rounded-2xl border border-dashed border-slate-800'>
              <Users className='mx-auto text-slate-600 mb-2' size={32} />
              <p className='text-sm font-bold text-slate-300'>
                No drivers match your current filter
              </p>
              <p className='text-xs text-slate-500 mt-1'>
                Try resetting filters or register a new driver below.
              </p>
            </div>
          ) : (
            /* حاوية الإسلايدر الأفقية */
            <div
              ref={sliderRef}
              className='flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth'
              style={{ scrollbarWidth: 'thin' }}
            >
              {filteredDrivers.map((driver) => {
                const isVip = (driver.completed_deliveries || 0) > 3;
                return (
                  <div
                    key={driver.id}
                    className='min-w-[295px] sm:min-w-[340px] max-w-[340px] snap-start bg-[#090f19] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shrink-0 transition-all'
                  >
                    <div>
                      {/* رأس الكارت: الاسم + شارة VIP + زر المفضلة */}
                      <div className='flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80'>
                        <div>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <h3 className='font-black text-base text-white'>
                              {driver.full_name}
                            </h3>
                            {isVip && (
                              <span className='px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30'>
                                VIP ⭐
                              </span>
                            )}
                          </div>
                          <div className='flex items-center gap-2 mt-1'>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                driver.is_active
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {driver.is_active ? (
                                <>
                                  <ShieldCheck size={12} /> Active
                                </>
                              ) : (
                                <>
                                  <ShieldAlert size={12} /> Inactive
                                </>
                              )}
                            </span>

                            {/* التقييم بالنجوم */}
                            <button
                              onClick={() => openDriverReviews(driver)}
                              className='inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors'
                              title='View Customer Reviews'
                            >
                              <Star
                                size={11}
                                className='fill-amber-400 text-amber-400'
                              />
                              {Number(driver.average_rating || 0).toFixed(1)} (
                              {driver.total_reviews || 0})
                            </button>
                          </div>
                        </div>

                        {/* زر إضافة/إزالة من المفضلة */}
                        <button
                          onClick={() => toggleDriverFavorite(driver)}
                          className={`p-2 rounded-xl border transition-all ${
                            driver.is_favorite
                              ? 'bg-pink-500/15 border-pink-500/40 text-pink-400'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-pink-400'
                          }`}
                          title={
                            driver.is_favorite
                              ? 'Remove from Favorites'
                              : 'Add to Favorites'
                          }
                        >
                          <Heart
                            size={17}
                            className={
                              driver.is_favorite ? 'fill-pink-400' : ''
                            }
                          />
                        </button>
                      </div>

                      {/* تفاصيل السواق */}
                      <div className='py-3 space-y-2 text-xs text-slate-300'>
                        <div className='flex items-center justify-between'>
                          <span className='text-slate-500 flex items-center gap-1.5'>
                            <Phone size={13} /> Driver Phone:
                          </span>
                          <span className='font-mono font-bold text-white'>
                            {driver.phone}
                          </span>
                        </div>

                        <div className='flex items-center justify-between'>
                          <span className='text-slate-500 flex items-center gap-1.5'>
                            <Phone size={13} /> Guarantor:
                          </span>
                          <span className='font-mono text-slate-300'>
                            {driver.guarantor_phone}
                          </span>
                        </div>

                        <div className='flex items-center justify-between'>
                          <span className='text-slate-500 flex items-center gap-1.5'>
                            <CreditCard size={13} /> National ID:
                          </span>
                          <span className='font-mono text-slate-300'>
                            {driver.national_id}
                          </span>
                        </div>

                        <div className='flex items-center justify-between'>
                          <span className='text-slate-500'>Card Code:</span>
                          <span className='font-mono text-slate-300'>
                            {driver.card_code}
                          </span>
                        </div>

                        <div className='flex items-center justify-between'>
                          <span className='text-slate-500 flex items-center gap-1.5'>
                            <Truck size={13} /> Completed Trips:
                          </span>
                          <span className='font-black text-blue-400'>
                            {driver.completed_deliveries || 0} Orders
                          </span>
                        </div>

                        <div className='pt-1 flex items-start gap-1.5 text-slate-400'>
                          <MapPin size={13} className='shrink-0 mt-0.5' />
                          <span className='line-clamp-2'>{driver.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* أزرار التحكم أسفل الكارت */}
                    <div className='pt-3 border-t border-slate-800/80 flex items-center gap-2'>
                      <button
                        onClick={() => toggleDriverActive(driver)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                          driver.is_active
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {driver.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => openDriverReviews(driver)}
                        className='p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 transition-colors'
                        title='Customer Reviews'
                      >
                        <MessageSquare size={16} />
                      </button>

                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            driver,
                            deleting: false,
                          })
                        }
                        className='p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-rose-400 transition-colors'
                        title='Delete Driver'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. فورم تسجيل سواق جديد (زرارين: PDF محلي + حفظ نصي في Supabase) */}
        <div className='bg-[#0e1626] border border-slate-800/90 rounded-2xl p-5 sm:p-8'>
          <div className='mb-6'>
            <h2 className='text-lg sm:text-xl font-black text-white flex items-center gap-2'>
              <UserPlus className='text-blue-400' size={22} />
              Register New Verified Driver
            </h2>
            <p className='text-xs text-slate-400 mt-1'>
              Step 1: Export local PDF with ID photos to your device. Step 2:
              Save text credentials to the cloud database.
            </p>
          </div>

          <form onSubmit={handleSaveDriverToDatabase} className='space-y-6'>
            {/* الحقول النصية */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div>
                <label className='block text-xs font-bold text-slate-300 mb-1.5'>
                  Full Name *
                </label>
                <input
                  type='text'
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder='e.g. Mohamed Ahmed Ali'
                  className='w-full bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none'
                />
              </div>

              <div>
                <label className='block text-xs font-bold text-slate-300 mb-1.5'>
                  Driver Phone (WhatsApp) *
                </label>
                <input
                  type='tel'
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='e.g. 01012345678'
                  className='w-full bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none font-mono'
                />
              </div>

              <div>
                <label className='block text-xs font-bold text-slate-300 mb-1.5'>
                  Guarantor Phone (الضامن) *
                </label>
                <input
                  type='tel'
                  required
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  placeholder='e.g. 01112345678'
                  className='w-full bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none font-mono'
                />
              </div>

              <div>
                <label className='block text-xs font-bold text-slate-300 mb-1.5'>
                  National ID Number (14 Digits) *
                </label>
                <input
                  type='text'
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder='e.g. 29901011234567'
                  className='w-full bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none font-mono'
                />
              </div>

              <div>
                <label className='block text-xs font-bold text-slate-300 mb-1.5'>
                  ID Card Code (Bottom Left) *
                </label>
                <input
                  type='text'
                  required
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value)}
                  placeholder='e.g. AB1234567'
                  className='w-full bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none font-mono'
                />
              </div>

              <div>
                <label className='block text-xs font-bold text-slate-300 mb-1.5'>
                  Full Residential Address *
                </label>
                <input
                  type='text'
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder='Village / District / Street...'
                  className='w-full bg-[#090f19] border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none'
                />
              </div>
            </div>

            {/* حقول الصور المحلية للـ PDF فقط */}
            <div className='pt-2 border-t border-slate-800/80'>
              <p className='text-xs font-bold text-amber-400 mb-3 flex items-center gap-1.5'>
                <ImageIcon size={15} />
                Local Archive Photos (Used ONLY for local PDF export — never
                uploaded online)
              </p>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <label className='bg-[#090f19] border border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-colors flex flex-col items-center justify-center text-center'>
                  <span className='text-xs font-bold text-slate-200'>
                    1. National ID (Front)
                  </span>
                  <span className='text-[11px] text-slate-500 mt-1 truncate max-w-full'>
                    {idFrontFile ? idFrontFile.name : 'Tap to select image'}
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) =>
                      setIdFrontFile(e.target.files ? e.target.files[0] : null)
                    }
                    className='hidden'
                  />
                </label>

                <label className='bg-[#090f19] border border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-colors flex flex-col items-center justify-center text-center'>
                  <span className='text-xs font-bold text-slate-200'>
                    2. National ID (Back)
                  </span>
                  <span className='text-[11px] text-slate-500 mt-1 truncate max-w-full'>
                    {idBackFile ? idBackFile.name : 'Tap to select image'}
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) =>
                      setIdBackFile(e.target.files ? e.target.files[0] : null)
                    }
                    className='hidden'
                  />
                </label>

                <label className='bg-[#090f19] border border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-colors flex flex-col items-center justify-center text-center'>
                  <span className='text-xs font-bold text-slate-200'>
                    3. Driver Personal Photo
                  </span>
                  <span className='text-[11px] text-slate-500 mt-1 truncate max-w-full'>
                    {personalPhotoFile
                      ? personalPhotoFile.name
                      : 'Tap to select image'}
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) =>
                      setPersonalPhotoFile(
                        e.target.files ? e.target.files[0] : null,
                      )
                    }
                    className='hidden'
                  />
                </label>
              </div>
            </div>

            {/* الزرارين الأساسيين */}
            <div className='flex flex-col sm:flex-row gap-3 pt-2'>
              <button
                type='button'
                onClick={handleGenerateLocalPdf}
                disabled={generatingPdf}
                className='flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all'
              >
                <FileDown size={19} />
                {generatingPdf
                  ? 'Generating PDF...'
                  : '1. Download Local PDF (With Photos)'}
              </button>

              <button
                type='submit'
                disabled={submittingDb}
                className='flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all'
              >
                <Database size={19} />
                {submittingDb
                  ? 'Saving to Database...'
                  : '2. Save Driver to System (Text Only)'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================= MODALS (بديل alert و confirm) ================= */}

      {/* 1. مودال الإشعارات (نجاح / خطأ / تحذير) */}
      {feedbackModal.isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200'>
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
                className='mt-6 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. مودال تأكيد الحذف */}
      {deleteModal.isOpen && deleteModal.driver && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl'>
            <div className='flex flex-col items-center text-center'>
              <div className='w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4'>
                <Trash2 size={28} />
              </div>

              <h3 className='text-lg font-black text-white'>
                Delete Driver Record?
              </h3>
              <p className='text-sm text-slate-300 mt-2'>
                Are you sure you want to permanently delete{' '}
                <span className='font-bold text-white'>
                  {deleteModal.driver.full_name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className='flex gap-3 w-full mt-6'>
                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: false,
                      driver: null,
                      deleting: false,
                    })
                  }
                  disabled={deleteModal.deleting}
                  className='flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDriver}
                  disabled={deleteModal.deleting}
                  className='flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors'
                >
                  {deleteModal.deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. مودال تقييمات العملاء للسواق */}
      {reviewsModal.isOpen && reviewsModal.driver && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm'>
          <div className='bg-[#0e1626] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] flex flex-col'>
            <div className='flex items-center justify-between pb-4 border-b border-slate-800'>
              <div>
                <h3 className='text-lg font-black text-white'>
                  {reviewsModal.driver.full_name} — Reviews
                </h3>
                <p className='text-xs text-amber-400 font-bold flex items-center gap-1 mt-0.5'>
                  <Star size={13} className='fill-amber-400' />
                  Average:{' '}
                  {Number(reviewsModal.driver.average_rating || 0).toFixed(1)} /
                  5 ({reviewsModal.driver.total_reviews || 0} ratings)
                </p>
              </div>
              <button
                onClick={() =>
                  setReviewsModal({
                    isOpen: false,
                    driver: null,
                    reviews: [],
                    loading: false,
                  })
                }
                className='p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white'
              >
                <X size={18} />
              </button>
            </div>

            <div className='py-4 overflow-y-auto space-y-3 flex-1'>
              {reviewsModal.loading ? (
                <p className='text-center text-sm text-slate-400 py-8'>
                  Loading customer reviews...
                </p>
              ) : reviewsModal.reviews.length === 0 ? (
                <div className='text-center py-8 bg-[#090f19] rounded-2xl border border-slate-800'>
                  <MessageSquare
                    size={28}
                    className='mx-auto text-slate-600 mb-2'
                  />
                  <p className='text-sm text-slate-400'>
                    No customer reviews recorded for this driver yet.
                  </p>
                </div>
              ) : (
                reviewsModal.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className='bg-[#090f19] border border-slate-800 rounded-2xl p-4 space-y-2'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold text-white'>
                        {rev.orders?.customer_name || 'Customer'}{' '}
                        {rev.orders?.order_number
                          ? `(Order #${rev.orders.order_number})`
                          : ''}
                      </span>
                      <div className='flex items-center gap-0.5'>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={
                              star <= rev.driver_rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-700'
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {rev.customer_review ? (
                      <p className='text-xs text-slate-300 leading-relaxed'>
                        "{rev.customer_review}"
                      </p>
                    ) : (
                      <p className='text-[11px] italic text-slate-500'>
                        Rated without written comment.
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
