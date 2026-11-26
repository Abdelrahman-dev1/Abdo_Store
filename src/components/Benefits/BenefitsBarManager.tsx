'use client';

import React, { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Save,
  Plus,
  Trash2,
  Power,
  Sparkles,
  Gauge,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ListFilter,
} from 'lucide-react';

// لو عندك عميل Supabase جاهز في مشروعك، استبدل السطر ده بـ:
import { supabase } from '@/lib/supabase';


type AccentColor = 'red' | 'blue' | 'green' | 'purple';

interface BenefitItem {
  id: string;
  title: string;
  emoji: string;
  accent_color: AccentColor;
  sort_order: number;
  is_visible: boolean;
}

const COLOR_OPTIONS: {
  value: AccentColor;
  label: string;
  swatch: string;
  chip: string;
}[] = [
  {
    value: 'red',
    label: 'أحمر',
    swatch: 'bg-rose-500',
    chip: 'border-rose-400/45 bg-rose-500/20 text-rose-100',
  },
  {
    value: 'purple',
    label: 'بنفسجي',
    swatch: 'bg-purple-500',
    chip: 'border-purple-400/45 bg-purple-500/20 text-purple-100',
  },
  {
    value: 'green',
    label: 'أخضر',
    swatch: 'bg-emerald-500',
    chip: 'border-emerald-400/45 bg-emerald-500/20 text-emerald-100',
  },
  {
    value: 'blue',
    label: 'أزرق',
    swatch: 'bg-sky-500',
    chip: 'border-sky-400/45 bg-sky-500/20 text-sky-100',
  },
];

const QUICK_EMOJIS = [
  '💰',
  '🔥',
  '🛡️',
  '🎧',
  '🚚',
  '⚡',
  '🎁',
  '⭐',
  '💎',
  '✅',
];

export default function BenefitsBarManager() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [durationSec, setDurationSec] = useState(28);
  const [items, setItems] = useState<BenefitItem[]>([]);
  const [listOpen, setListOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    const [settingsRes, itemsRes] = await Promise.all([
      supabase
        .from('benefits_bar_settings')
        .select('id, is_enabled, slider_duration_sec')
        .eq('id', 'default')
        .maybeSingle(),
      supabase
        .from('benefits_bar_items')
        .select('id, title, emoji, accent_color, sort_order, is_visible')
        .order('sort_order', { ascending: true }),
    ]);

    if (settingsRes.data) {
      setIsEnabled(settingsRes.data.is_enabled);
      setDurationSec(settingsRes.data.slider_duration_sec);
    }

    if (itemsRes.data) {
      setItems(itemsRes.data as BenefitItem[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleBar = async () => {
    const nextValue = !isEnabled;
    setIsEnabled(nextValue);
    setSavingId('settings');

    const { error } = await supabase.from('benefits_bar_settings').upsert(
      {
        id: 'default',
        is_enabled: nextValue,
        slider_duration_sec: durationSec,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    setSavingId(null);
    if (error) {
      setIsEnabled(!nextValue);
      showToast('error', 'حدث خطأ أثناء تحديث حالة الشريط');
    } else {
      showToast(
        'success',
        nextValue ? 'تم تفعيل شريط المميزات' : 'تم إيقاف شريط المميزات',
      );
    }
  };

  const handleSaveSpeed = async () => {
    setSavingId('speed');
    const clamped = Math.min(120, Math.max(8, Number(durationSec) || 28));
    setDurationSec(clamped);

    const { error } = await supabase.from('benefits_bar_settings').upsert(
      {
        id: 'default',
        is_enabled: isEnabled,
        slider_duration_sec: clamped,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    setSavingId(null);
    if (error) {
      showToast('error', 'فشل حفظ سرعة السلايدر');
    } else {
      showToast('success', 'تم تحديث سرعة السلايدر');
    }
  };

  const handleLocalChange = <K extends keyof BenefitItem>(
    id: string,
    field: K,
    value: BenefitItem[K],
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const normalized = reordered.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setItems(normalized);
    setSavingId('order');

    const results = await Promise.all(
      normalized.map((item) =>
        supabase
          .from('benefits_bar_items')
          .update({
            sort_order: item.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id),
      ),
    );

    setSavingId(null);
    if (results.some((r) => r.error)) {
      showToast('error', 'تعذر حفظ الترتيب الجديد');
      loadData();
    } else {
      showToast('success', 'تم تحديث ترتيب المميزات');
    }
  };

  const handleToggleItemVisibility = async (item: BenefitItem) => {
    const nextVisible = !item.is_visible;
    handleLocalChange(item.id, 'is_visible', nextVisible);
    setSavingId(item.id);

    const { error } = await supabase
      .from('benefits_bar_items')
      .update({ is_visible: nextVisible, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    setSavingId(null);
    if (error) {
      handleLocalChange(item.id, 'is_visible', !nextVisible);
      showToast('error', 'تعذر تغيير حالة الظهور');
    } else {
      showToast('success', nextVisible ? 'تم إظهار الميزة' : 'تم إخفاء الميزة');
    }
  };

  const handleSaveItem = async (item: BenefitItem) => {
    if (!item.title.trim()) {
      showToast('error', 'اكتب نص الميزة أولاً');
      return;
    }
    setSavingId(item.id);

    const { error } = await supabase
      .from('benefits_bar_items')
      .update({
        title: item.title.trim(),
        emoji: item.emoji.trim() || '✨',
        accent_color: item.accent_color,
        sort_order: item.sort_order,
        is_visible: item.is_visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    setSavingId(null);
    if (error) {
      showToast('error', 'حدث خطأ أثناء حفظ التعديل');
    } else {
      showToast('success', 'تم حفظ التعديلات بنجاح');
    }
  };

  const handleAddItem = async () => {
    setSavingId('new');
    const nextOrder =
      items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 1;
    const colors: AccentColor[] = ['red', 'purple', 'green', 'blue'];
    const nextColor = colors[items.length % colors.length];

    const { data, error } = await supabase
      .from('benefits_bar_items')
      .insert({
        title: 'ميزة جديدة',
        emoji: '✨',
        accent_color: nextColor,
        sort_order: nextOrder,
        is_visible: true,
      })
      .select()
      .single();

    setSavingId(null);
    if (error || !data) {
      showToast('error', 'تعذر إضافة ميزة جديدة');
    } else {
      setItems((prev) => [...prev, data as BenefitItem]);
      setListOpen(true);
      showToast('success', 'تمت إضافة ميزة جديدة');
    }
  };

  const handleDeleteItem = async (id: string) => {
    setSavingId(id);
    const { error } = await supabase
      .from('benefits_bar_items')
      .delete()
      .eq('id', id);
    setSavingId(null);

    if (error) {
      showToast('error', 'تعذر حذف الميزة');
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast('success', 'تم حذف الميزة');
    }
  };

  if (loading) {
    return (
      <div
        dir='rtl'
        className='rounded-2xl border border-slate-600/50 bg-slate-800/95 p-6 text-slate-200'
      >
        جاري تحميل إعدادات شريط المميزات...
      </div>
    );
  }

  const visibleItems = items.filter((i) => i.is_visible);

  return (
    <div
      dir='rtl'
      className='w-full rounded-2xl border border-slate-600/50 bg-slate-800/95 p-4 sm:p-6 text-slate-100 shadow-xl space-y-5'
    >
      {/* الهيدر + زر تشغيل/إيقاف الشريط بالكامل */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-600/50 pb-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <Sparkles className='w-5 h-5 text-purple-300' />
            <h2 className='text-base sm:text-lg font-bold text-white'>
              إدارة شريط مميزات المتجر
            </h2>
          </div>
          <p className='text-xs sm:text-sm text-slate-300'>
            تحكم في النصوص، الإيموجي، الألوان، الترتيب، وإظهار أو إيقاف الشريط
            بالكامل.
          </p>
        </div>

        <button
          type='button'
          onClick={handleToggleBar}
          disabled={savingId === 'settings'}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
            isEnabled
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 hover:bg-emerald-500/30'
              : 'bg-rose-500/20 text-rose-200 border border-rose-400/50 hover:bg-rose-500/30'
          }`}
        >
          <Power className='w-4 h-4' />
          <span>
            {isEnabled ? 'الشريط مفعّل حالياً' : 'الشريط متوقف حالياً'}
          </span>
        </button>
      </div>

      {/* إشعار حالة الحفظ */}
      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm ${
            statusMsg.type === 'success'
              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
              : 'border-rose-400/50 bg-rose-500/20 text-rose-100'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className='w-4 h-4 shrink-0' />
          ) : (
            <AlertCircle className='w-4 h-4 shrink-0' />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* معاينة حية مصغرة للمميزات الظاهرة */}
      <div className='rounded-xl border border-slate-600/50 bg-slate-900/65 p-3 space-y-2'>
        <div className='flex items-center justify-between text-[11px] text-slate-300'>
          <span>معاينة المميزات الظاهرة ({visibleItems.length})</span>
          <span>{isEnabled ? 'الحالة: ظاهر في المتجر' : 'الحالة: متوقف'}</span>
        </div>
        <div className='flex items-center gap-2 overflow-x-auto pb-1 benefits-manager-scroll'>
          {visibleItems.length === 0 ? (
            <span className='text-xs text-slate-400'>
              لا توجد مميزات ظاهرة حالياً.
            </span>
          ) : (
            visibleItems.map((item) => {
              const colorObj =
                COLOR_OPTIONS.find((c) => c.value === item.accent_color) ||
                COLOR_OPTIONS[3];
              return (
                <span
                  key={item.id}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${colorObj.chip}`}
                >
                  <span>{item.emoji || '✨'}</span>
                  <span>{item.title}</span>
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* التحكم في سرعة السلايدر */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-600/50 bg-slate-900/65 p-3.5'>
        <div className='flex items-center gap-2.5'>
          <Gauge className='w-4 h-4 text-sky-300 shrink-0' />
          <div>
            <p className='text-xs sm:text-sm font-semibold text-slate-100'>
              سرعة حركة السلايدر (بالثواني)
            </p>
            <p className='text-[11px] text-slate-300'>
              رقم أقل = حركة أسرع | رقم أكبر = حركة أهدأ (الموصى به: 24 إلى 32)
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <input
            type='number'
            min={8}
            max={120}
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
            className='w-20 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-center text-sm text-white focus:border-sky-400 focus:outline-none'
          />
          <button
            type='button'
            onClick={handleSaveSpeed}
            disabled={savingId === 'speed'}
            className='inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition-colors'
          >
            <Save className='w-3.5 h-3.5' />
            <span>حفظ السرعة</span>
          </button>
        </div>
      </div>

      {/* صندوق فتح/إغلاق عناصر المميزات مع اسكرول داخلي متوسط */}
      <div className='rounded-xl border border-slate-600/50 bg-slate-900/65 p-3.5 space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <ListFilter className='w-4 h-4 text-purple-300' />
            <h3 className='text-xs sm:text-sm font-bold text-white'>
              عناصر المميزات ({items.length})
            </h3>
          </div>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleAddItem}
              disabled={savingId === 'new'}
              className='inline-flex items-center gap-1.5 rounded-lg border border-purple-400/50 bg-purple-500/20 hover:bg-purple-500/30 px-3 py-1.5 text-xs font-bold text-purple-100 transition-colors'
            >
              <Plus className='w-3.5 h-3.5' />
              <span>إضافة ميزة</span>
            </button>

            <button
              type='button'
              onClick={() => setListOpen((prev) => !prev)}
              className='inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-100 transition-colors'
            >
              <span>{listOpen ? 'إغلاق العناصر' : 'فتح العناصر'}</span>
              {listOpen ? (
                <ChevronUp className='w-3.5 h-3.5 text-sky-300' />
              ) : (
                <ChevronDown className='w-3.5 h-3.5 text-sky-300' />
              )}
            </button>
          </div>
        </div>

        {listOpen && (
          <div className='max-h-[420px] overflow-y-auto pl-1 space-y-3 benefits-manager-scroll'>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-xl border p-3.5 sm:p-4 transition-all ${
                  item.is_visible
                    ? 'border-slate-600/60 bg-slate-800/90'
                    : 'border-slate-700/60 bg-slate-800/45 opacity-70'
                }`}
              >
                <div className='grid grid-cols-1 md:grid-cols-12 gap-3 items-center'>
                  {/* أزرار الترتيب */}
                  <div className='md:col-span-1 flex md:flex-col items-center justify-start md:justify-center gap-1'>
                    <button
                      type='button'
                      disabled={idx === 0 || savingId === 'order'}
                      onClick={() => handleMoveItem(idx, 'up')}
                      title='تحريك لأعلى'
                      className='rounded-md border border-slate-600 bg-slate-900/70 p-1 text-slate-200 hover:bg-slate-700 disabled:opacity-35'
                    >
                      <ArrowUp className='w-3 h-3' />
                    </button>
                    <button
                      type='button'
                      disabled={
                        idx === items.length - 1 || savingId === 'order'
                      }
                      onClick={() => handleMoveItem(idx, 'down')}
                      title='تحريك لأسفل'
                      className='rounded-md border border-slate-600 bg-slate-900/70 p-1 text-slate-200 hover:bg-slate-700 disabled:opacity-35'
                    >
                      <ArrowDown className='w-3 h-3' />
                    </button>
                  </div>

                  {/* حقل الإيموجي */}
                  <div className='md:col-span-2'>
                    <label className='block text-[11px] text-slate-300 mb-1'>
                      الإيموجي
                    </label>
                    <input
                      type='text'
                      maxLength={4}
                      value={item.emoji}
                      onChange={(e) =>
                        handleLocalChange(item.id, 'emoji', e.target.value)
                      }
                      className='w-full rounded-lg border border-slate-600 bg-slate-900/85 px-2.5 py-2 text-center text-lg focus:border-purple-400 focus:outline-none'
                    />
                  </div>

                  {/* حقل النص */}
                  <div className='md:col-span-4'>
                    <label className='block text-[11px] text-slate-300 mb-1'>
                      نص الميزة
                    </label>
                    <input
                      type='text'
                      value={item.title}
                      onChange={(e) =>
                        handleLocalChange(item.id, 'title', e.target.value)
                      }
                      placeholder='مثال: أسعار تنافسية'
                      className='w-full rounded-lg border border-slate-600 bg-slate-900/85 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-purple-400 focus:outline-none'
                    />
                  </div>

                  {/* اختيار اللون */}
                  <div className='md:col-span-2'>
                    <label className='block text-[11px] text-slate-300 mb-1'>
                      اللون
                    </label>
                    <div className='flex items-center gap-1.5 pt-1'>
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type='button'
                          title={c.label}
                          onClick={() =>
                            handleLocalChange(item.id, 'accent_color', c.value)
                          }
                          className={`h-6 w-6 rounded-full ${c.swatch} transition-transform ${
                            item.accent_color === c.value
                              ? 'ring-2 ring-white scale-110'
                              : 'opacity-55 hover:opacity-95'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* أزرار التحكم (إظهار/إخفاء - حفظ - حذف) */}
                  <div className='md:col-span-3 flex items-center justify-end gap-2 pt-2 md:pt-4'>
                    <button
                      type='button'
                      onClick={() => handleToggleItemVisibility(item)}
                      title={item.is_visible ? 'إخفاء الميزة' : 'إظهار الميزة'}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${
                        item.is_visible
                          ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                          : 'border-slate-600 bg-slate-700/60 text-slate-300 hover:text-white'
                      }`}
                    >
                      {item.is_visible ? (
                        <Eye className='w-4 h-4' />
                      ) : (
                        <EyeOff className='w-4 h-4' />
                      )}
                      <span className='hidden sm:inline'>
                        {item.is_visible ? 'ظاهر' : 'مخفي'}
                      </span>
                    </button>

                    <button
                      type='button'
                      onClick={() => handleSaveItem(item)}
                      disabled={savingId === item.id}
                      className='inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-rose-600 via-purple-600 to-sky-600 hover:opacity-90 px-3 py-2 text-xs font-bold text-white transition-opacity'
                    >
                      <Save className='w-3.5 h-3.5' />
                      <span>حفظ</span>
                    </button>

                    <button
                      type='button'
                      onClick={() => handleDeleteItem(item.id)}
                      title='حذف الميزة'
                      className='rounded-lg border border-rose-400/40 bg-rose-500/15 p-2 text-rose-200 hover:bg-rose-500/25 transition-colors'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </div>

                {/* شريط اختيار سريع للإيموجي */}
                <div className='mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-700/70 pt-2'>
                  <span className='text-[11px] text-slate-300 ml-1'>
                    إيموجي سريع:
                  </span>
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type='button'
                      onClick={() => handleLocalChange(item.id, 'emoji', em)}
                      className='rounded-md bg-slate-700/60 hover:bg-slate-600 px-1.5 py-0.5 text-sm transition-colors'
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .benefits-manager-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .benefits-manager-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 9999px;
        }
        .benefits-manager-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.45);
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}
