'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Trash2,
  Save,
  Plus,
  Power,
  MessageSquare,
  ImagePlus,
  UploadCloud,
  Star,
  Award,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  ListFilter,
} from 'lucide-react';

// لو عندك ملف عميل Supabase جاهز في مشروعك، استبدل السطر ده بـ:
import { supabase } from '@/lib/supabase';

export type ReviewSourceType = 'admin_manual' | 'customer_text';

export interface ManageableReviewItem {
  id: string;
  source_type: ReviewSourceType;
  reviewer_name: string;
  reviewer_channel: string;
  rating: number;
  comment_text: string | null;
  image_url: string | null;
  admin_reply: string | null;
  likes_count: number;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
}

export default function CustomerReviewsManager() {
  // إعدادات السكشن
  const [isSectionEnabled, setIsSectionEnabled] = useState(true);
  const [allowCustomerReviews, setAllowCustomerReviews] = useState(true);
  const [adminOnlyMode, setAdminOnlyMode] = useState(false);
  const [autoPublishCustomer, setAutoPublishCustomer] = useState(true);
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [autoSlideMs, setAutoSlideMs] = useState(4500);

  // قائمة الريفيوز + حالة فتح/إغلاق القائمة
  const [items, setItems] = useState<ManageableReviewItem[]>([]);
  const [listOpen, setListOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  // فورم إضافة ريفيو جديد من الأدمن (نص فقط / صورة فقط / كلاهما)
  const [newName, setNewName] = useState('');
  const [newChannel, setNewChannel] = useState('واتساب');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newReply, setNewReply] = useState('');
  const [newFeatured, setNewFeatured] = useState(false);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAll = async () => {
    setLoading(true);
    const [settingsRes, itemsRes] = await Promise.all([
      supabase
        .from('store_reviews_settings')
        .select(
          'id, is_section_enabled, allow_customer_reviews, admin_only_mode, auto_publish_customer, cards_per_page, auto_slide_interval_ms',
        )
        .eq('id', 'default')
        .maybeSingle(),
      supabase
        .from('store_reviews_items')
        .select(
          'id, source_type, reviewer_name, reviewer_channel, rating, comment_text, image_url, admin_reply, likes_count, is_visible, is_featured, created_at',
        )
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);

    if (settingsRes.data) {
      setIsSectionEnabled(settingsRes.data.is_section_enabled);
      setAllowCustomerReviews(settingsRes.data.allow_customer_reviews);
      setAdminOnlyMode(settingsRes.data.admin_only_mode);
      setAutoPublishCustomer(settingsRes.data.auto_publish_customer);
      setCardsPerPage(settingsRes.data.cards_per_page || 4);
      setAutoSlideMs(settingsRes.data.auto_slide_interval_ms || 4500);
    }

    if (itemsRes.data) {
      setItems(itemsRes.data as ManageableReviewItem[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const persistSettings = async (
    overrides: Partial<{
      is_section_enabled: boolean;
      allow_customer_reviews: boolean;
      admin_only_mode: boolean;
      auto_publish_customer: boolean;
      cards_per_page: number;
      auto_slide_interval_ms: number;
    }> = {},
  ) => {
    setBusyKey('settings');
    const payload = {
      id: 'default',
      is_section_enabled: overrides.is_section_enabled ?? isSectionEnabled,
      allow_customer_reviews:
        overrides.allow_customer_reviews ?? allowCustomerReviews,
      admin_only_mode: overrides.admin_only_mode ?? adminOnlyMode,
      auto_publish_customer:
        overrides.auto_publish_customer ?? autoPublishCustomer,
      cards_per_page: Math.min(
        8,
        Math.max(1, overrides.cards_per_page ?? cardsPerPage),
      ),
      auto_slide_interval_ms: Math.min(
        20000,
        Math.max(2000, overrides.auto_slide_interval_ms ?? autoSlideMs),
      ),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('store_reviews_settings')
      .upsert(payload, { onConflict: 'id' });

    setBusyKey(null);
    if (error) {
      notify('error', 'تعذر حفظ إعدادات السكشن');
    } else {
      notify('success', 'تم تحديث إعدادات السكشن');
    }
  };

  // رفع صورة مباشرة إلى Cloudinary إذا كانت متغيرات Cloudinary مضبوطة
  const handleUploadScreenshot = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      notify(
        'error',
        'أضف NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME و NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET أو الصق رابط الصورة مباشرة',
      );
      return;
    }

    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );
      const data = await res.json();
      if (data.secure_url) {
        setNewImageUrl(data.secure_url);
        notify('success', 'تم رفع الصورة بنجاح');
      } else {
        notify('error', 'فشل رفع الصورة على Cloudinary');
      }
    } catch {
      notify('error', 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleCreateAdminReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = newComment.trim();
    const cleanImg = newImageUrl.trim();

    if (!cleanText && !cleanImg) {
      notify('error', 'أدخل نصاً أو صورة/سكرين شوت على الأقل');
      return;
    }

    setBusyKey('create');
    const { data, error } = await supabase
      .from('store_reviews_items')
      .insert({
        source_type: 'admin_manual',
        reviewer_name: newName.trim() || 'عميل مميز',
        reviewer_channel: newChannel.trim() || 'واتساب',
        rating: newRating,
        comment_text: cleanText || null,
        image_url: cleanImg || null,
        admin_reply: newReply.trim() || null,
        likes_count: 0,
        is_visible: true,
        is_featured: newFeatured,
      })
      .select()
      .single();

    setBusyKey(null);
    if (error || !data) {
      notify('error', 'تعذر إضافة الريفيو');
      return;
    }

    setItems((prev) => [data as ManageableReviewItem, ...prev]);
    setListOpen(true);
    setNewName('');
    setNewComment('');
    setNewImageUrl('');
    setNewReply('');
    setNewFeatured(false);
    notify('success', 'تمت إضافة الريفيو بنجاح');
  };

  const patchLocalItem = <K extends keyof ManageableReviewItem>(
    id: string,
    field: K,
    value: ManageableReviewItem[K],
  ) => {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleSaveItem = async (item: ManageableReviewItem) => {
    const cleanText = (item.comment_text || '').trim();
    const cleanImg = (item.image_url || '').trim();

    if (!cleanText && !cleanImg) {
      notify('error', 'لا يمكن ترك النص والصورة فارغين معاً');
      return;
    }

    setBusyKey(item.id);
    const { error } = await supabase
      .from('store_reviews_items')
      .update({
        reviewer_name: item.reviewer_name.trim() || 'عميل',
        reviewer_channel: item.reviewer_channel.trim() || 'المتجر',
        rating: item.rating,
        comment_text: cleanText || null,
        image_url: cleanImg || null,
        admin_reply: (item.admin_reply || '').trim() || null,
        is_visible: item.is_visible,
        is_featured: item.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    setBusyKey(null);
    if (error) {
      notify('error', 'فشل حفظ التعديلات');
    } else {
      notify('success', 'تم حفظ التعديلات');
    }
  };

  const handleDeleteItem = async (id: string) => {
    setBusyKey(id);
    const { error } = await supabase
      .from('store_reviews_items')
      .delete()
      .eq('id', id);
    setBusyKey(null);
    if (error) {
      notify('error', 'تعذر حذف العنصر');
    } else {
      setItems((prev) => prev.filter((row) => row.id !== id));
      notify('success', 'تم حذف العنصر');
    }
  };

  if (loading) {
    return (
      <div
        dir='rtl'
        className='rounded-2xl border border-slate-600/50 bg-slate-800/95 p-6 text-slate-200'
      >
        جاري تحميل لوحة إدارة الريفيوز...
      </div>
    );
  }

  return (
    <div
      dir='rtl'
      className='w-full rounded-2xl border border-slate-600/50 bg-slate-800/95 p-4 sm:p-6 text-slate-100 shadow-xl space-y-5'
    >
      {/* العنوان + زر تشغيل/إيقاف السكشن بالكامل */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-600/50 pb-4'>
        <div className='flex items-center gap-2.5'>
          <MessageSquare className='h-5 w-5 text-sky-300' />
          <div>
            <h2 className='text-base sm:text-lg font-bold text-white'>
              إدارة سكشن آراء العملاء
            </h2>
            <p className='text-xs text-slate-300'>
              تحكم في السكشن، تعليقات العملاء، إضافة السكرين شوت والنصوص،
              والردود.
            </p>
          </div>
        </div>

        <button
          type='button'
          onClick={() => {
            const next = !isSectionEnabled;
            setIsSectionEnabled(next);
            persistSettings({ is_section_enabled: next });
          }}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-bold transition-colors ${
            isSectionEnabled
              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
              : 'border-rose-400/50 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
          }`}
        >
          <Power className='h-4 w-4' />
          <span>
            {isSectionEnabled ? 'السكشن مفعّل' : 'السكشن متوقف بالكامل'}
          </span>
        </button>
      </div>

      {/* إشعار */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm ${
            toast.type === 'success'
              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
              : 'border-rose-400/50 bg-rose-500/20 text-rose-100'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className='h-4 w-4 shrink-0' />
          ) : (
            <AlertCircle className='h-4 w-4 shrink-0' />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* مفاتيح التحكم (تفعيل/إيقاف تعليق العملاء + وضع الأدمن فقط + نشر فوري) */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        <button
          type='button'
          onClick={() => {
            const next = !allowCustomerReviews;
            setAllowCustomerReviews(next);
            persistSettings({ allow_customer_reviews: next });
          }}
          className={`flex items-center justify-between rounded-xl border p-3 text-right transition-colors ${
            allowCustomerReviews
              ? 'border-sky-400/45 bg-sky-500/15 text-sky-100'
              : 'border-slate-600/50 bg-slate-900/65 text-slate-300'
          }`}
        >
          <div>
            <p className='text-xs font-bold'>تعليقات العملاء في الفرونت</p>
            <p className='text-[11px] opacity-85'>
              {allowCustomerReviews ? 'مسموح للعميل يكتب نص' : 'موقوف للعملاء'}
            </p>
          </div>
          <span className='rounded-lg bg-slate-900/60 px-2 py-1 text-[11px] font-semibold'>
            {allowCustomerReviews ? 'مفعّل' : 'مغلق'}
          </span>
        </button>

        <button
          type='button'
          onClick={() => {
            const next = !adminOnlyMode;
            setAdminOnlyMode(next);
            persistSettings({ admin_only_mode: next });
          }}
          className={`flex items-center justify-between rounded-xl border p-3 text-right transition-colors ${
            adminOnlyMode
              ? 'border-purple-400/50 bg-purple-500/20 text-purple-100'
              : 'border-slate-600/50 bg-slate-900/65 text-slate-200'
          }`}
        >
          <div>
            <p className='text-xs font-bold flex items-center gap-1'>
              <Lock className='h-3.5 w-3.5' />
              <span>وضع الأدمن فقط</span>
            </p>
            <p className='text-[11px] opacity-85'>
              {adminOnlyMode
                ? 'إخفاء نموذج إضافة العملاء'
                : 'يسمح بالعملاء حسب التفعيل'}
            </p>
          </div>
          <span className='rounded-lg bg-slate-900/60 px-2 py-1 text-[11px] font-semibold'>
            {adminOnlyMode ? 'نشط' : 'غير نشط'}
          </span>
        </button>

        <button
          type='button'
          onClick={() => {
            const next = !autoPublishCustomer;
            setAutoPublishCustomer(next);
            persistSettings({ auto_publish_customer: next });
          }}
          className={`flex items-center justify-between rounded-xl border p-3 text-right transition-colors ${
            autoPublishCustomer
              ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-100'
              : 'border-amber-400/45 bg-amber-500/15 text-amber-100'
          }`}
        >
          <div>
            <p className='text-xs font-bold'>نشر تعليق العميل</p>
            <p className='text-[11px] opacity-85'>
              {autoPublishCustomer ? 'فوري ريل تايم' : 'بموافقة الأدمن أولاً'}
            </p>
          </div>
          <span className='rounded-lg bg-slate-900/60 px-2 py-1 text-[11px] font-semibold'>
            {autoPublishCustomer ? 'فوري' : 'مراجعة'}
          </span>
        </button>
      </div>

      {/* إعدادات عدد الكروت وسرعة السلايدر */}
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-600/50 bg-slate-900/65 p-3'>
        <div className='flex flex-wrap items-center gap-4 text-xs'>
          <label className='flex items-center gap-2'>
            <span className='text-slate-200'>عدد الكروت بالصفحة:</span>
            <input
              type='number'
              min={1}
              max={8}
              value={cardsPerPage}
              onChange={(e) => setCardsPerPage(Number(e.target.value))}
              className='w-16 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-center text-white'
            />
          </label>

          <label className='flex items-center gap-2'>
            <span className='text-slate-200'>سرعة التنقل (مللي ثانية):</span>
            <input
              type='number'
              min={2000}
              max={20000}
              step={500}
              value={autoSlideMs}
              onChange={(e) => setAutoSlideMs(Number(e.target.value))}
              className='w-24 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-center text-white'
            />
          </label>
        </div>

        <button
          type='button'
          onClick={() => persistSettings()}
          disabled={busyKey === 'settings'}
          className='inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-bold text-white'
        >
          <Save className='h-3.5 w-3.5' />
          <span>حفظ إعدادات السلايدر</span>
        </button>
      </div>

      {/* إضافة ريفيو جديد من الأدمن (صورة فقط / نص فقط / صورة + نص) */}
      <form
        onSubmit={handleCreateAdminReview}
        className='rounded-xl border border-purple-400/35 bg-slate-900/70 p-4 space-y-3'
      >
        <div className='flex items-center justify-between'>
          <h3 className='text-xs sm:text-sm font-bold text-purple-200 flex items-center gap-1.5'>
            <ImagePlus className='h-4 w-4 text-purple-300' />
            <span>إضافة ريفيو من الإدارة (سكرين شوت / نص / كلاهما)</span>
          </h3>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5'>
          <input
            type='text'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='اسم العميل (مثال: كريم عادل)'
            className='rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none'
          />

          <input
            type='text'
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            placeholder='المصدر (واتساب / إنستغرام / فيسبوك)'
            className='rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none'
          />

          <div className='flex items-center justify-between rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5'>
            <span className='text-xs text-slate-300'>التقييم:</span>
            <div className='flex items-center gap-1'>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type='button'
                  onClick={() => setNewRating(num)}
                >
                  <Star
                    className={`h-4 w-4 ${
                      num <= newRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-500'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <textarea
          rows={2}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder='نص الريفيو (اختياري لو هتكتفي بصورة سكرين شوت)'
          className='w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none'
        />

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
          <div className='flex items-center gap-2'>
            <input
              type='text'
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder='رابط صورة السكرين شوت (اختياري)'
              className='w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none'
            />
            <label className='inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-600 bg-slate-700/80 hover:bg-slate-700 px-2.5 py-2 text-xs text-slate-100'>
              <UploadCloud className='h-4 w-4 text-sky-300' />
              <span>{uploadingImg ? '...' : 'رفع'}</span>
              <input
                type='file'
                accept='image/*'
                onChange={handleUploadScreenshot}
                className='hidden'
              />
            </label>
          </div>

          <input
            type='text'
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder='رد أو تعليق الإدارة على الريفيو (اختياري)'
            className='rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none'
          />
        </div>

        <div className='flex flex-wrap items-center justify-between gap-2 pt-1'>
          <label className='flex items-center gap-2 text-xs text-slate-200 cursor-pointer'>
            <input
              type='checkbox'
              checked={newFeatured}
              onChange={(e) => setNewFeatured(e.target.checked)}
              className='rounded border-slate-500 bg-slate-800'
            />
            <span>تثبيت كرأي مميز في المقدمة</span>
          </label>

          <button
            type='submit'
            disabled={busyKey === 'create'}
            className='inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-sky-600 hover:opacity-95 px-4 py-2 text-xs font-bold text-white'
          >
            <Plus className='h-4 w-4' />
            <span>إضافة الريفيو</span>
          </button>
        </div>
      </form>

      {/* شريط فتح/إغلاق قائمة الريفيوز والتحكمات مع اسكرول داخلي متوسط */}
      <div className='rounded-xl border border-slate-600/50 bg-slate-900/65 p-3.5 space-y-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <ListFilter className='h-4 w-4 text-sky-300' />
            <h3 className='text-xs sm:text-sm font-bold text-white'>
              الريفيوز المسجلة والتحكم بها ({items.length})
            </h3>
          </div>

          <button
            type='button'
            onClick={() => setListOpen((prev) => !prev)}
            className='inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-100 transition-colors'
          >
            <span>{listOpen ? 'إغلاق القائمة' : 'فتح القائمة'}</span>
            {listOpen ? (
              <ChevronUp className='h-3.5 w-3.5 text-sky-300' />
            ) : (
              <ChevronDown className='h-3.5 w-3.5 text-sky-300' />
            )}
          </button>
        </div>

        {listOpen && (
          <div className='max-h-[420px] overflow-y-auto pl-1 space-y-2.5 reviews-manager-scroll'>
            {items.length === 0 ? (
              <p className='py-6 text-center text-xs text-slate-300'>
                لا توجد ريفيوز مسجلة حتى الآن.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3 space-y-2 transition-colors ${
                    item.is_visible
                      ? 'border-slate-600/60 bg-slate-800/90'
                      : 'border-slate-700/60 bg-slate-800/45 opacity-70'
                  }`}
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='flex items-center gap-2 text-xs'>
                      <span className='font-bold text-white'>
                        {item.reviewer_name}
                      </span>
                      <span className='rounded-md bg-slate-700/80 px-2 py-0.5 text-[10px] text-slate-200'>
                        {item.source_type === 'admin_manual'
                          ? `أدمن • ${item.reviewer_channel}`
                          : `عميل • ${item.reviewer_channel}`}
                      </span>
                      <span className='text-[11px] text-rose-300'>
                        ♥ {item.likes_count}
                      </span>
                    </div>

                    <div className='flex items-center gap-1.5'>
                      <button
                        type='button'
                        onClick={() =>
                          patchLocalItem(
                            item.id,
                            'is_featured',
                            !item.is_featured,
                          )
                        }
                        title='مميز'
                        className={`rounded-lg border p-1.5 text-xs ${
                          item.is_featured
                            ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                            : 'border-slate-600 bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        <Award className='h-3.5 w-3.5' />
                      </button>

                      <button
                        type='button'
                        onClick={() => {
                          const nextVis = !item.is_visible;
                          patchLocalItem(item.id, 'is_visible', nextVis);
                          handleSaveItem({ ...item, is_visible: nextVis });
                        }}
                        title={item.is_visible ? 'إخفاء' : 'إظهار'}
                        className={`rounded-lg border p-1.5 text-xs ${
                          item.is_visible
                            ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                            : 'border-slate-600 bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {item.is_visible ? (
                          <Eye className='h-3.5 w-3.5' />
                        ) : (
                          <EyeOff className='h-3.5 w-3.5' />
                        )}
                      </button>

                      <button
                        type='button'
                        onClick={() => handleSaveItem(item)}
                        disabled={busyKey === item.id}
                        className='inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white'
                      >
                        <Save className='h-3.5 w-3.5' />
                        <span>حفظ</span>
                      </button>

                      <button
                        type='button'
                        onClick={() => handleDeleteItem(item.id)}
                        title='حذف'
                        className='rounded-lg border border-rose-400/45 bg-rose-500/15 p-1.5 text-rose-200 hover:bg-rose-500/25'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                    <textarea
                      rows={2}
                      value={item.comment_text || ''}
                      onChange={(e) =>
                        patchLocalItem(item.id, 'comment_text', e.target.value)
                      }
                      placeholder='نص الريفيو...'
                      className='rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none'
                    />

                    <textarea
                      rows={2}
                      value={item.admin_reply || ''}
                      onChange={(e) =>
                        patchLocalItem(item.id, 'admin_reply', e.target.value)
                      }
                      placeholder='رد الإدارة على هذا الريفيو...'
                      className='rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-xs text-sky-200 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none'
                    />
                  </div>

                  {item.image_url && (
                    <div className='flex items-center gap-3 pt-1'>
                      <Image
                        src={item.image_url}
                        alt={item.reviewer_name}
                        width={96}
                        height={56}
                        unoptimized
                        className='h-14 w-24 shrink-0 rounded-lg object-cover border border-slate-600'
                      />
                      <input
                        type='text'
                        value={item.image_url}
                        onChange={(e) =>
                          patchLocalItem(item.id, 'image_url', e.target.value)
                        }
                        className='flex-1 rounded-lg border border-slate-600 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-200'
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .reviews-manager-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .reviews-manager-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 9999px;
        }
        .reviews-manager-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.45);
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}
