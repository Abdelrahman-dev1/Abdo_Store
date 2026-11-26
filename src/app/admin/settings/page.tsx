'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Megaphone,
  Save,
  Sparkles,
  Zap,
  Star,
  MessageSquare,
  Search,
  Heart,
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  X,
     MessageSquareQuote,

  RefreshCw,
  Gift,
  Truck,
  Percent,
  Clock,
  Layers,
  DollarSign,
  Calendar,
  MapPin,
  ShoppingBag,
  ChevronRight,
  UserCheck,
  Store,
  ArrowUpDown,
  ChevronLeft,
} from 'lucide-react';
import BenefitsBarManager from '@/components/Benefits/BenefitsBarManager';
import CustomerReviewsManager from '@/components/ReviewsSite/CustomerReviewsManager';
import TechShowcaseManager from '@/components/Showcase/TechShowcaseManager';
import SectionDivider from '@/components/SectionDivider';

type ProductOption = {
  id: string | number;
  name: string;
};

type ReviewRow = {
  id: string | number;
  product_id: string | number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  admin_reply: string | null;
  admin_liked: boolean;
  is_hidden: boolean;
};

type ReviewForm = {
  reviewer_name: string;
  rating: number;
  comment: string;
  admin_reply: string;
};

type AnnouncementConfig = {
  enabled: boolean;
  text: string;
  startEmoji: string;
  endEmoji: string;
};

type RewardType = 'free_shipping' | 'discount';
type ConditionType =
  | 'min_order_amount'
  | 'completed_orders_cycle'
  | 'time_window';

type PromoRuleRow = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  reward_type: RewardType;
  reward_value: number | null;
  condition_type: ConditionType;
  condition_config: Record<string, unknown>;
  customer_message: string | null;
  admin_alert_text: string | null;
  created_at?: string;
};

type PromoRuleFormState = {
  title: string;
  description: string;
  is_active: boolean;
  priority: number;
  reward_type: RewardType;
  reward_value: number;
  condition_type: ConditionType;
  min_amount: number;
  required_completed: number;
  free_on_order_number: number;
  start_hour: string;
  end_hour: string;
  customer_message: string;
  admin_alert_text: string;
};

const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  enabled: true,
  text: 'FLASH SALE: Enjoy Up To 40% OFF On Selected Items! Limited Time Only.',
  startEmoji: '💸',
  endEmoji: '🔥',
};



const inputClass =
  'w-full min-w-0 rounded-xl border border-slate-600/80 bg-[#1e2736] px-4 py-2.5 text-xs sm:text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20';
const labelClass = 'mb-1.5 block text-xs font-bold text-slate-200';
const emptyReviewForm: ReviewForm = {
  reviewer_name: '',
  rating: 5,
  comment: '',
  admin_reply: '',
};

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-600/70 bg-[#253042] px-4 py-3.5 transition hover:border-slate-500'>
      <div className='min-w-0'>
        <p className='text-xs sm:text-sm font-bold text-white'>{label}</p>
        <p className='mt-0.5 text-[11px] leading-relaxed text-slate-300'>
          {description}
        </p>
      </div>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-emerald-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-6.5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settingsId, setSettingsId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] =
    useState<AnnouncementConfig>(DEFAULT_ANNOUNCEMENT);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select(
          'id, announcement_enabled, announcement_text, announcement_emoji_start, announcement_emoji_end',
        )
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setFeedback({
          type: 'error',
          text: `Could not load announcement settings: ${error.message}`,
        });
      } else if (data) {
        setSettingsId(data.id);
        setAnnouncement({
          enabled: data.announcement_enabled ?? DEFAULT_ANNOUNCEMENT.enabled,
          text: data.announcement_text ?? DEFAULT_ANNOUNCEMENT.text,
          startEmoji:
            data.announcement_emoji_start ?? DEFAULT_ANNOUNCEMENT.startEmoji,
          endEmoji:
            data.announcement_emoji_end ?? DEFAULT_ANNOUNCEMENT.endEmoji,
        });
        setFeedback(null);
      } else {
        setFeedback({
          type: 'error',
          text: 'No settings row was found. Create the settings row in Supabase, then refresh this page.',
        });
      }

      setLoading(false);
    };

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const updateAnnouncement = (patch: Partial<AnnouncementConfig>) => {
    setAnnouncement((current) => ({ ...current, ...patch }));
    setFeedback(null);
  };

  const handleSaveAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (settingsId === null) {
      setFeedback({
        type: 'error',
        text: 'Settings row is missing. No changes were saved.',
      });
      return;
    }

    if (announcement.enabled && !announcement.text.trim()) {
      setFeedback({
        type: 'error',
        text: 'Enter promotional text before enabling the announcement bar.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from('settings')
      .update({
        announcement_enabled: announcement.enabled,
        announcement_text: announcement.text.trim(),
        announcement_emoji_start: announcement.startEmoji,
        announcement_emoji_end: announcement.endEmoji,
      })
      .eq('id', settingsId)
      .select('id')
      .maybeSingle();

    setSaving(false);

    if (error) {
      setFeedback({
        type: 'error',
        text: `Could not save announcement settings: ${error.message}`,
      });
      return;
    }

    if (!data) {
      setFeedback({
        type: 'error',
        text: 'No settings row was updated. Check the settings row and its Supabase RLS UPDATE policy.',
      });
      return;
    }

    setFeedback({
      type: 'success',
      text: 'Announcement bar settings saved successfully.',
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#18202c] px-4 font-sans text-white'>
        <div className='flex items-center gap-3 rounded-xl border border-slate-600 bg-[#222c3c] px-5 py-4 shadow-xl'>
          <Loader2 className='h-5 w-5 animate-spin text-blue-400' />
          <p className='text-xs font-bold tracking-wide text-slate-200'>
            Loading store controls...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen overflow-x-clip bg-[#18202c] font-sans text-slate-100 selection:bg-blue-500 selection:text-white'>
      {/* Balanced mid-tone ambient accents */}
      <div className='pointer-events-none fixed -left-32 top-16 h-80 w-80 rounded-full bg-blue-500/15 blur-[110px]' />
      <div className='pointer-events-none fixed -right-32 top-1/3 h-80 w-80 rounded-full bg-amber-500/10 blur-[110px]' />
      <div className='pointer-events-none fixed bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-[110px]' />

      <header className='fixed top-0 left-0 right-0 z-50 border-b border-slate-700/80 bg-[#1c2534]/95 shadow-md backdrop-blur-md transition-all duration-300'>
        <div className='mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6'>
          <Link
            href='/admin'
            className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-600 bg-[#263244] px-3 py-2 text-xs font-bold text-slate-100 transition hover:border-blue-400/60 hover:bg-[#2d3b50]'
          >
            <ArrowLeft size={14} className='text-blue-400' />
            <span className='hidden sm:inline'>Dashboard</span>
          </Link>

          <div className='min-w-0 text-center'>
            <h1 className='text-sm sm:text-base font-black tracking-wider text-white'>
              STORE SETTINGS
            </h1>
          </div>

          <button
            type='button'
            onClick={handleLogout}
            className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/25 hover:text-white cursor-pointer'
          >
            <span>Logout</span>
          </button>
        </div>

        <nav
          aria-label='تنقل سريع للإعدادات'
          className='scroll-smooth border-t border-slate-700/70 bg-[#212b3c]/95'
        >
          <div className='mx-auto flex max-w-[1280px] items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto px-2.5 py-1.5 sm:px-5 sm:py-2 no-scrollbar'>
            <a
              href='#promo-rules'
              className='inline-flex shrink-0 items-center gap-1 rounded-md sm:rounded-lg border border-amber-400/40 bg-amber-500/15 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/25 whitespace-nowrap'
            >
              <Gift size={12} className='shrink-0 text-amber-300' />
              <span>Loyalty &amp; Rules</span>
            </a>

            <a
              href='#store-branches'
              className='inline-flex shrink-0 items-center gap-1 rounded-md sm:rounded-lg border border-blue-400/40 bg-blue-500/15 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-blue-200 transition hover:bg-blue-500/25 whitespace-nowrap'
            >
              <Store size={12} className='shrink-0 text-blue-300' />
              <span>Branches</span>
            </a>

            <a
              href='#announcement-bar'
              className='inline-flex shrink-0 items-center gap-1 rounded-md sm:rounded-lg border border-red-400/40 bg-red-500/15 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-red-200 transition hover:bg-red-500/25 whitespace-nowrap'
            >
              <Megaphone size={12} className='shrink-0 text-red-300' />
              <span>Discount Bar</span>
            </a>

            <a
              href='#reviews-control'
              className='inline-flex shrink-0 items-center gap-1 rounded-md sm:rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-500/25 whitespace-nowrap'
            >
              <Star size={12} className='shrink-0 text-emerald-300' />
              <span>Reviews</span>
            </a>

            {/* لينك الانتقال إلى مكون شريط المميزات */}
            <a
              href='#benefits-bar-section'
              className='inline-flex shrink-0 items-center gap-1 rounded-md sm:rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-cyan-200 transition hover:bg-cyan-500/25 whitespace-nowrap'
            >
              <Zap size={12} className='shrink-0 text-cyan-300' />
              <span>Benefits Bar</span>
            </a>

            {/* لينك الانتقال إلى مكون الريفيوز */}
            <a
              href='#store-reviews-section'
              className='inline-flex shrink-0 items-center gap-1 rounded-md sm:rounded-lg border border-purple-400/40 bg-purple-500/15 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-purple-200 transition hover:bg-purple-500/25 whitespace-nowrap'
            >
              <MessageSquareQuote
                size={12}
                className='shrink-0 text-purple-300'
              />
              <span>Customer Reviews</span>
            </a>

            {/* لينك الانتقال إلى مكون بانر الأجهزة */}
            <a
              href='#tech-showcase-section'
              className='inline-flex shrink-0 items-center gap-1 rounded-md sm:rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/15 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/25 whitespace-nowrap'
            >
              <Zap size={12} className='shrink-0 text-fuchsia-300' />
              <span>Tech Banner</span>
            </a>
          </div>
        </nav>
      </header>

      <main className='relative z-10 mx-auto max-w-[1280px] space-y-6 px-4 pt-28 pb-8 sm:px-6 sm:pt-32'>
        {/* Hero Banner Card */}
        <section className='relative overflow-hidden rounded-2xl border border-slate-600/70 bg-[#222c3c] p-5 sm:p-6 shadow-md'>
          <div className='absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-500/10 via-amber-500/5 to-transparent' />
          <div className='relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
            <div>
              <div className='mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-200'>
                <Zap size={12} className='text-blue-300' /> Control Center
              </div>
              <h2 className='text-xl font-black tracking-tight text-white sm:text-2xl'>
                Manage Promotions, Loyalty Rules & Storefront
              </h2>
              <p
                dir='ltr'
                className='mt-1 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300'
              >
                تحكّم في مكافآت العملاء الديناميكية، وقواعد الشحن المجاني،
                وإعلانات الخصومات، والتقييمات وغير ذالك من مساحة عمل واحدة
                منظمة.
              </p>
            </div>
            <div className='grid grid-cols-3 gap-2.5 sm:min-w-[340px]'>
              <div className='rounded-xl border border-amber-400/35 bg-amber-500/10 p-3'>
                <Gift className='text-amber-300' size={18} />
                <p className='mt-2 text-[10px] font-bold text-slate-300'>
                  Dynamic
                </p>
                <p className='text-xs font-black text-white'>Loyalty Rules</p>
              </div>
              <div className='rounded-xl border border-red-400/35 bg-red-500/10 p-3'>
                <Megaphone className='text-red-300' size={18} />
                <p className='mt-2 text-[10px] font-bold text-slate-300'>
                  Storefront
                </p>
                <p className='text-xs font-black text-white'>Discount Bar</p>
              </div>
              <div className='rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3'>
                <Star className='text-emerald-300' size={18} />
                <p className='mt-2 text-[10px] font-bold text-slate-300'>
                  Feedback
                </p>
                <p className='text-xs font-black text-white'>Reviews</p>
              </div>
            </div>
          </div>
        </section>

        {feedback && (
          <div
            role='status'
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm shadow-sm ${
              feedback.type === 'error'
                ? 'border-red-400/50 bg-red-500/15 text-red-100'
                : 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertTriangle
                size={16}
                className='mt-0.5 shrink-0 text-red-300'
              />
            ) : (
              <CheckCircle2
                size={16}
                className='mt-0.5 shrink-0 text-emerald-300'
              />
            )}
            <span className='font-semibold leading-relaxed'>
              {feedback.text}
            </span>
          </div>
        )}

        {/* Dynamic Loyalty & Promo Rules Section */}
        <section id='promo-rules' className='scroll-mt-28'>
          <AdminPromoRulesManager />
        </section>

        {/* Store Branches Section */}
        <section id='store-branches' className='scroll-mt-28'>
          <AdminBranchesManager />
        </section>
        <SectionDivider />
        <SectionDivider />
        <SectionDivider />

        {/* Announcement Section */}
        <section
          id='announcement-bar'
          className='scroll-mt-28 overflow-hidden rounded-2xl border border-slate-600/70 bg-[#222c3c] shadow-md'
        >
          <>
            <div className='border-b border-slate-600/70 bg-[#273245] p-4 sm:p-5'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/40 bg-red-500/15 text-red-300'>
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h2 className='text-sm sm:text-base font-black text-white'>
                      Discount Announcement Bar
                    </h2>
                    <p className='text-xs text-slate-300'>
                      تعديل نص الشريط الترويجي وحالة ظهوره
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    announcement.enabled
                      ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                      : 'border border-slate-500 bg-slate-700 text-slate-300'
                  }`}
                >
                  {announcement.enabled ? 'Enabled' : 'Hidden'}
                </span>
              </div>
            </div>

            <form
              onSubmit={handleSaveAnnouncement}
              className='space-y-4 p-4 sm:p-6'
            >
              <Toggle
                checked={announcement.enabled}
                onChange={() =>
                  updateAnnouncement({ enabled: !announcement.enabled })
                }
                label='Show discount bar on the storefront'
                description='تشغيل أو إيقاف الشريط الظاهر للعملاء.'
              />

              <div>
                <div className='mb-1.5 flex items-center justify-between'>
                  <label className={labelClass}>Promotion message</label>
                  <span className='text-[11px] tabular-nums text-slate-300'>
                    {announcement.text.length}/240
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={240}
                  value={announcement.text}
                  onChange={(event) =>
                    updateAnnouncement({ text: event.target.value })
                  }
                  className={`${inputClass} resize-none`}
                  placeholder='Example: FLASH SALE — Up To 40% OFF Today!'
                />
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div>
                  <label className={labelClass}>Leading emoji</label>
                  <input
                    maxLength={8}
                    value={announcement.startEmoji}
                    onChange={(event) =>
                      updateAnnouncement({ startEmoji: event.target.value })
                    }
                    className={inputClass}
                    placeholder='💸'
                  />
                </div>
                <div>
                  <label className={labelClass}>Trailing emoji</label>
                  <input
                    maxLength={8}
                    value={announcement.endEmoji}
                    onChange={(event) =>
                      updateAnnouncement({ endEmoji: event.target.value })
                    }
                    className={inputClass}
                    placeholder='🔥'
                  />
                </div>
              </div>

              <div className='rounded-xl border border-slate-600/70 bg-[#1a222f] p-4'>
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-[11px] font-bold uppercase tracking-wider text-slate-300'>
                    Live preview
                  </span>
                </div>
                {announcement.enabled && announcement.text.trim() ? (
                  <div className='flex items-center justify-center rounded-lg border border-slate-600 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-white shadow-sm'>
                    <span className='mr-2 shrink-0'>
                      {announcement.startEmoji || '💸'}
                    </span>
                    <span className='break-words'>{announcement.text}</span>
                    <span className='ml-2 shrink-0'>
                      {announcement.endEmoji || '🔥'}
                    </span>
                  </div>
                ) : (
                  <div className='rounded-lg border border-dashed border-slate-600 bg-[#222c3c] px-4 py-4 text-center text-xs text-slate-300'>
                    Announcement bar is hidden or empty.
                  </div>
                )}
              </div>

              <div className='flex items-center justify-end border-t border-slate-600/70 pt-4'>
                <button
                  type='submit'
                  disabled={saving}
                  className='inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition disabled:opacity-50 cursor-pointer'
                >
                  {saving ? (
                    <Loader2 size={15} className='animate-spin' />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? 'Saving...' : 'Save discount bar'}
                </button>
              </div>
            </form>
          </>
        </section>
        <SectionDivider />
        <SectionDivider />
        <SectionDivider />

        {/* Reviews Section Wrapper */}
        <section id='reviews-control' className='scroll-mt-28 space-y-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='text-[10px] font-bold uppercase tracking-wider text-emerald-300'>
                Customer Feedback
              </p>
              <h2 className='text-xl font-black tracking-tight text-white sm:text-2xl'>
                Reviews Management
              </h2>
            </div>
            <span className='w-fit rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200'>
              Database Connected
            </span>
          </div>
          <AdminReviewsManager />
        </section>
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* فاصل ملون ميكس بين السكاشن */}
        <div
          aria-hidden='true'
          className='my-5 sm:my-7 h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-rose-500/75 via-purple-500/80 via-emerald-400/75 via-sky-400/75 to-transparent shadow-[0_0_12px_rgba(168,85,247,0.35)]'
        />
        <div
          aria-hidden='true'
          className='my-5 sm:my-7 h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-rose-500/75 via-purple-500/80 via-emerald-400/75 via-sky-400/75 to-transparent shadow-[0_0_12px_rgba(168,85,247,0.35)]'
        />
        <div
          aria-hidden='true'
          className='my-5 sm:my-7 h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-rose-500/75 via-purple-500/80 via-emerald-400/75 via-sky-400/75 to-transparent shadow-[0_0_12px_rgba(168,85,247,0.35)]'
        />
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        <div id='benefits-bar-section' className='scroll-mt-24'>
          <BenefitsBarManager />
        </div>

        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}

        {/* فاصل ملون ميكس بين السكاشن */}

        <SectionDivider />
        <SectionDivider />
        <SectionDivider />

        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        <div id='store-reviews-section' className='scroll-mt-24'>
          <CustomerReviewsManager />
        </div>

        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        <SectionDivider />
        <SectionDivider />
        <SectionDivider />

        {/* ======================== */}
        <div id='tech-showcase-section' className='scroll-mt-24'>
          <TechShowcaseManager />
        </div>
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        {/* ======================== */}
        <footer className='py-4 text-center text-xs text-slate-400'>
          Store Settings · Loyalty Rules, Promotions & Reviews
        </footer>
      </main>
    </div>
  );
}

/* ============================================================================
   DYNAMIC LOYALTY & PROMO RULES MANAGER (promo_rules table)
============================================================================ */
/* ============================================================================
   DYNAMIC LOYALTY & PROMO RULES MANAGER (All 8 Conditions + 5 Rewards + Custom)
============================================================================ */
type RewardType =
  | 'free_shipping'
  | 'shipping_discount_percent'
  | 'fixed_discount'
  | 'percent_discount'
  | 'custom_gift';

type ConditionType =
  | 'min_order_amount'
  | 'completed_orders_cycle'
  | 'days_of_week'
  | 'time_window'
  | 'first_order'
  | 'specific_city'
  | 'min_items_count'
  | 'custom_manual';

type PromoRuleRow = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  display_order: number;
  is_stackable: boolean;
  reward_type: RewardType;
  reward_value: number | null;
  custom_reward_label: string | null;
  condition_type: ConditionType;
  custom_condition_label: string | null;
  condition_config: Record<string, unknown>;
  customer_message: string | null;
  admin_alert_text: string | null;
  created_at?: string;
};

type PromoRuleFormState = {
  title: string;
  description: string;
  is_active: boolean;
  priority: number;
  display_order: number;
  is_stackable: boolean;
  reward_type: RewardType;
  reward_value: number;
  custom_reward_label: string;
  condition_type: ConditionType;
  custom_condition_label: string;
  min_amount: number;
  required_completed: number;
  free_on_order_number: number;
  days_of_week: string[];
  start_hour: string;
  end_hour: string;
  cities_text: string;
  min_items: number;
  manual_condition_note: string;
  customer_message: string;
  admin_alert_text: string;
};

const WEEK_DAYS = [
  { key: 'sat', label: 'السبت' },
  { key: 'sun', label: 'الأحد' },
  { key: 'mon', label: 'الإثنين' },
  { key: 'tue', label: 'الثلاثاء' },
  { key: 'wed', label: 'الأربعاء' },
  { key: 'thu', label: 'الخميس' },
  { key: 'fri', label: 'الجمعة' },
];

const emptyRuleForm: PromoRuleFormState = {
  title: '',
  description: '',
  is_active: true,
  priority: 1,
  display_order: 1,
  is_stackable: true,
  reward_type: 'free_shipping',
  reward_value: 0,
  custom_reward_label: '',
  condition_type: 'min_order_amount',
  custom_condition_label: '',
  min_amount: 1000,
  required_completed: 5,
  free_on_order_number: 6,
  days_of_week: ['fri'],
  start_hour: '00:00',
  end_hour: '05:00',
  cities_text: '',
  min_items: 3,
  manual_condition_note: '',
  customer_message: '',
  admin_alert_text: '',
};

function AdminPromoRulesManager() {
  const [rules, setRules] = useState<PromoRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoRuleFormState>(emptyRuleForm);

  const loadRules = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data, error } = await supabase
      .from('promo_rules')
      .select('*')
      .order('display_order', { ascending: true })
      .order('priority', { ascending: true });

    if (error) {
      setNotice({
        type: 'error',
        text: `تعذر تحميل القواعد: ${error.message}`,
      });
    } else {
      setRules((data ?? []) as PromoRuleRow[]);
    }
    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    void loadRules(true);
  }, []);

  const openCreateForm = () => {
    setEditingRuleId(null);
    setForm({
      ...emptyRuleForm,
      priority: rules.length + 1,
      display_order: rules.length + 1,
    });
    setShowForm(true);
    setNotice(null);
  };

  const openEditForm = (rule: PromoRuleRow) => {
    const cfg = rule.condition_config || {};
    setEditingRuleId(rule.id);
    setForm({
      title: rule.title || '',
      description: rule.description || '',
      is_active: rule.is_active,
      priority: rule.priority ?? 1,
      display_order: rule.display_order ?? rule.priority ?? 1,
      is_stackable: rule.is_stackable ?? true,
      reward_type: rule.reward_type || 'free_shipping',
      reward_value: Number(rule.reward_value ?? 0),
      custom_reward_label: rule.custom_reward_label || '',
      condition_type: rule.condition_type || 'min_order_amount',
      custom_condition_label: rule.custom_condition_label || '',
      min_amount: Number(cfg.min_amount ?? 1000),
      required_completed: Number(cfg.required_completed ?? 5),
      free_on_order_number: Number(cfg.free_on_order_number ?? 6),
      days_of_week: Array.isArray(cfg.days) ? (cfg.days as string[]) : ['fri'],
      start_hour: String(cfg.start_hour ?? '00:00'),
      end_hour: String(cfg.end_hour ?? '05:00'),
      cities_text: Array.isArray(cfg.cities)
        ? (cfg.cities as string[]).join('، ')
        : '',
      min_items: Number(cfg.min_items ?? 3),
      manual_condition_note: String(cfg.note ?? ''),
      customer_message: rule.customer_message || '',
      admin_alert_text: rule.admin_alert_text || '',
    });
    setShowForm(true);
    setNotice(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRuleId(null);
    setForm(emptyRuleForm);
  };

  const toggleWeekDay = (dayKey: string) => {
    setForm((prev) => {
      const exists = prev.days_of_week.includes(dayKey);
      const next = exists
        ? prev.days_of_week.filter((d) => d !== dayKey)
        : [...prev.days_of_week, dayKey];
      return { ...prev, days_of_week: next.length ? next : [dayKey] };
    });
  };

  const buildConditionConfig = (state: PromoRuleFormState) => {
    switch (state.condition_type) {
      case 'min_order_amount':
        return { min_amount: Math.max(0, Number(state.min_amount) || 0) };
      case 'completed_orders_cycle': {
        const req = Math.max(1, Number(state.required_completed) || 5);
        return {
          required_completed: req,
          free_on_order_number: Math.max(
            req + 1,
            Number(state.free_on_order_number) || req + 1,
          ),
        };
      }
      case 'days_of_week':
        return { days: state.days_of_week };
      case 'time_window':
        return {
          start_hour: state.start_hour || '00:00',
          end_hour: state.end_hour || '05:00',
        };
      case 'first_order':
        return { is_first_order: true };
      case 'specific_city':
        return {
          cities: state.cities_text
            .split(/[,،\n]+/)
            .map((c) => c.trim())
            .filter(Boolean),
        };
      case 'min_items_count':
        return { min_items: Math.max(1, Number(state.min_items) || 1) };
      case 'custom_manual':
        return {
          note: state.manual_condition_note.trim(),
          min_items:
            Number(state.min_items) > 0 ? Number(state.min_items) : undefined,
        };
    }


  };

  const handleSaveRule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setNotice({ type: 'error', text: 'اكتب اسم القاعدة أولاً.' });
      return;
    }

    setSaving(true);
    setNotice(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
      priority: Math.max(1, Number(form.priority) || 1),
      display_order: Math.max(1, Number(form.display_order) || 1),
      is_stackable: form.is_stackable,
      reward_type: form.reward_type,
      reward_value:
        form.reward_type === 'free_shipping' ||
        form.reward_type === 'custom_gift'
          ? 0
          : Math.max(0, Number(form.reward_value) || 0),
      custom_reward_label:
        form.reward_type === 'custom_gift'
          ? form.custom_reward_label.trim() || null
          : null,
      condition_type: form.condition_type,
      custom_condition_label:
        form.condition_type === 'custom_manual'
          ? form.custom_condition_label.trim() || null
          : null,
      condition_config: buildConditionConfig(form),
      customer_message: form.customer_message.trim() || null,
      admin_alert_text: form.admin_alert_text.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingRuleId) {
      const { error } = await supabase
        .from('promo_rules')
        .update(payload)
        .eq('id', editingRuleId);

      setSaving(false);
      if (error) {
        setNotice({
          type: 'error',
          text: `خطأ أثناء تعديل القاعدة: ${error.message}`,
        });
        return;
      }
      setNotice({ type: 'success', text: 'تم تحديث القاعدة بنجاح.' });
    } else {
      const { error } = await supabase.from('promo_rules').insert(payload);

      setSaving(false);
      if (error) {
        setNotice({
          type: 'error',
          text: `خطأ أثناء إضافة القاعدة: ${error.message}`,
        });
        return;
      }
      setNotice({ type: 'success', text: 'تمت إضافة القاعدة الجديدة بنجاح.' });
    }

    closeForm();
    await loadRules(false);
  };

  const handleToggleRule = async (rule: PromoRuleRow) => {
    const nextActive = !rule.is_active;
    const { error } = await supabase
      .from('promo_rules')
      .update({ is_active: nextActive, updated_at: new Date().toISOString() })
      .eq('id', rule.id);

    if (error) {
      setNotice({
        type: 'error',
        text: `تعذر تغيير حالة القاعدة: ${error.message}`,
      });
      return;
    }

    setRules((prev) =>
      prev.map((item) =>
        item.id === rule.id ? { ...item, is_active: nextActive } : item,
      ),
    );
  };

  const handleDeleteRule = async (rule: PromoRuleRow) => {
    const ok = window.confirm(`هل أنت متأكد من حذف قاعدة "${rule.title}"؟`);
    if (!ok) return;

    const { error } = await supabase
      .from('promo_rules')
      .delete()
      .eq('id', rule.id);

    if (error) {
      setNotice({
        type: 'error',
        text: `تعذر حذف القاعدة: ${error.message}`,
      });
      return;
    }

    setRules((prev) => prev.filter((item) => item.id !== rule.id));
    if (editingRuleId === rule.id) closeForm();
    setNotice({ type: 'success', text: 'تم حذف القاعدة نهائياً.' });
  };

  const formatRewardBadge = (rule: PromoRuleRow) => {
    if (rule.reward_type === 'free_shipping') return 'شحن مجاني 100%';
    if (rule.reward_type === 'shipping_discount_percent')
      return `خصم ${rule.reward_value ?? 50}% على الشحن`;
    if (rule.reward_type === 'fixed_discount')
      return `خصم ${rule.reward_value ?? 0} ج`;
    if (rule.reward_type === 'percent_discount')
      return `خصم ${rule.reward_value ?? 0}%`;
    return rule.custom_reward_label || 'هدية / مكافأة مخصصة';
  };

  const formatConditionSummary = (rule: PromoRuleRow) => {
    const cfg = rule.condition_config || {};
    switch (rule.condition_type) {
      case 'min_order_amount':
        return `فاتورة ≥ ${cfg.min_amount ?? 1000} ج`;
      case 'completed_orders_cycle':
        return `كل ${cfg.required_completed ?? 5} مكتملة ← الطلب ${
          cfg.free_on_order_number ?? 6
        }`;
      case 'days_of_week': {
        const keys = Array.isArray(cfg.days) ? (cfg.days as string[]) : [];
        const names = keys
          .map((k) => WEEK_DAYS.find((d) => d.key === k)?.label || k)
          .join('، ');
        return `أيام: ${names || 'محددة'}`;
      }
      case 'time_window':
        return `ساعات: ${cfg.start_hour ?? '00:00'} - ${cfg.end_hour ?? '05:00'}`;
      case 'first_order':
        return 'أول أوردر للعميل الجديد';
      case 'specific_city': {
        const cities = Array.isArray(cfg.cities)
          ? (cfg.cities as string[]).join('، ')
          : '';
        return `مدن: ${cities || 'محددة'}`;
      }
      case 'min_items_count':
        return `عدد قطع ≥ ${cfg.min_items ?? 3}`;
      case 'custom_manual': {
        const base =
          rule.custom_condition_label || String(cfg.note || 'شرط حر / مخصص');
        return cfg.min_items ? `${base} (≥ ${cfg.min_items} قطع)` : base;
      }
    }
  };

  const activeRulesCount = rules.filter((r) => r.is_active).length;
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
const [conditionModalOpen, setConditionModalOpen] = useState(false);

const conditionTypeOptions: {
  value: ConditionType;
  title: string;
  desc: string;
  icon: string;
  accent: string;
}[] = [
  {
    value: 'min_order_amount',
    title: 'حد أدنى لقيمة الفاتورة',
    desc: 'يُفعَّل عندما يصل إجمالي الطلب لحد معين',
    icon: '💰',
    accent: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
  },
  {
    value: 'completed_orders_cycle',
    title: 'دورة طلبات مكتملة (ولاء)',
    desc: 'يُفعَّل كل عدد محدد من الطلبات المكتملة',
    icon: '🔄',
    accent: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-300',
  },
  {
    value: 'days_of_week',
    title: 'أيام محددة في الأسبوع (مثل الجمعة)',
    desc: 'يعمل في أيام معينة فقط من الأسبوع',
    icon: '📅',
    accent: 'border-blue-500/35 bg-blue-500/10 text-blue-300',
  },
  {
    value: 'time_window',
    title: 'ساعات محددة في اليوم (مثل بعد 12 بليل)',
    desc: 'يعمل خلال فترة زمنية محددة يومياً',
    icon: '⏰',
    accent: 'border-indigo-500/35 bg-indigo-500/10 text-indigo-300',
  },
  {
    value: 'first_order',
    title: 'أول أوردر لعميل جديد',
    desc: 'مخصص لأول طلب ناجح للعميل',
    icon: '🌟',
    accent: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
  },
  {
    value: 'specific_city',
    title: 'مدينة / محافظة معينة',
    desc: 'يعمل للطلبات الموجهة لمنطقة أو محافظة محددة',
    icon: '📍',
    accent: 'border-rose-500/35 bg-rose-500/10 text-rose-300',
  },
  {
    value: 'min_items_count',
    title: 'عدد قطع معين في الأوردر',
    desc: 'يُفعَّل عند الوصول لعدد منتجات محدد',
    icon: '🛍️',
    accent: 'border-teal-500/35 bg-teal-500/10 text-teal-300',
  },
  {
    value: 'custom_manual',
    title: 'شرط حر / مخصص تكتبه بنفسك',
    desc: 'إدخال شرط مخصص يدوياً حسب السيناريو',
    icon: '✍️',
    accent: 'border-slate-500/35 bg-slate-500/10 text-slate-300',
  },
];

const selectedConditionOption =
  conditionTypeOptions.find((item) => item.value === form.condition_type) ||
  conditionTypeOptions[0];
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
const [rewardModalOpen, setRewardModalOpen] = useState(false);

const rewardTypeOptions: {
  value: RewardType;
  title: string;
  desc: string;
  icon: string;
  accent: string;
}[] = [
  {
    value: 'free_shipping',
    title: 'شحن مجاني بالكامل (100%)',
    desc: 'إعفاء العميل من مصاريف الشحن بالكامل',
    icon: '🚚',
    accent: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-300',
  },
  {
    value: 'shipping_discount_percent',
    title: 'خصم نسبة على الشحن (مثلاً 50%)',
    desc: 'تخفيض جزء من تكلفة الشحن بنسبة مئوية',
    icon: '📦',
    accent: 'border-blue-500/35 bg-blue-500/10 text-blue-300',
  },
  {
    value: 'fixed_discount',
    title: 'خصم مبلغ ثابت (جنيه)',
    desc: 'خصم قيمة محددة بالجنيه من إجمالي الطلب',
    icon: '💵',
    accent: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
  },
  {
    value: 'percent_discount',
    title: 'خصم نسبة مئوية (%)',
    desc: 'خصم نسبة مئوية على قيمة المنتجات أو الطلب',
    icon: '🏷️',
    accent: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
  },
  {
    value: 'custom_gift',
    title: 'هدية / ميزة حرة تكتبها بنفسك',
    desc: 'إضافة هدية مجانية أو ميزة مخصصة للعميل',
    icon: '🎁',
    accent: 'border-rose-500/35 bg-rose-500/10 text-rose-300',
  },
];

const selectedRewardOption =
  rewardTypeOptions.find((item) => item.value === form.reward_type) ||
  rewardTypeOptions[0];
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
// ===========================
  return (
    <>
      <SectionDivider />
      <SectionDivider />
      <SectionDivider />

      <div className='overflow-hidden rounded-2xl border border-slate-600/70 bg-[#222c3c] shadow-md'>
        <div className='border-b border-slate-600/70 bg-[#273245] p-4 sm:p-5'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-300'>
                <Gift size={20} />
              </div>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <h2 className='text-sm sm:text-base font-black text-white'>
                    Loyalty & Promo Engine
                  </h2>
                  <span className='rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200'>
                    {activeRulesCount} Active / {rules.length} Total
                  </span>
                </div>
                <p className='text-xs text-slate-300'>
                  تحكم شامل في الشروط (فاتورة، ولاء، أيام الأسبوع، ساعات، مدن،
                  أول طلب، قطع) والمكافآت
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => void loadRules()}
                className='inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-[#1e2736] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-blue-400/60 hover:text-white cursor-pointer'
              >
                <RefreshCw size={13} className='text-blue-400' />
                <span className='hidden sm:inline'>Refresh</span>
              </button>
              <button
                type='button'
                onClick={openCreateForm}
                className='inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 shadow-sm transition cursor-pointer'
              >
                <Plus size={15} /> إضافة قاعدة جديدة
              </button>
            </div>
          </div>
        </div>

        <div className='p-4 sm:p-6 space-y-4'>
          {notice && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                notice.type === 'error'
                  ? 'border-red-400/50 bg-red-500/15 text-red-100'
                  : 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
              }`}
            >
              {notice.type === 'error' ? (
                <AlertTriangle size={15} className='shrink-0 text-red-300' />
              ) : (
                <CheckCircle2 size={15} className='shrink-0 text-emerald-300' />
              )}
              <span>{notice.text}</span>
            </div>
          )}

          {showForm && (
            <form
              onSubmit={handleSaveRule}
              className='rounded-2xl border border-blue-400/40 bg-[#1c2432] p-4 sm:p-5 space-y-4 shadow-inner'
            >
              <div className='flex items-center justify-between border-b border-slate-600/70 pb-3'>
                <h3 className='text-xs sm:text-sm font-black text-white flex items-center gap-2'>
                  <Zap size={15} className='text-amber-300' />
                  {editingRuleId
                    ? 'تعديل القاعدة الحالية'
                    : 'إنشاء قاعدة عرض / ولاء جديدة'}
                </h3>
                <button
                  type='button'
                  onClick={closeForm}
                  className='rounded-lg border border-slate-600 bg-slate-700/60 p-1.5 text-slate-300 hover:text-white cursor-pointer'
                >
                  <X size={14} />
                </button>
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-4'>
                <div className='sm:col-span-2'>
                  <label className={labelClass}>اسم القاعدة</label>
                  <input
                    type='text'
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className={inputClass}
                    placeholder='مثال: خصم الجمعة أو شحن مجاني للطلب السادس'
                  />
                </div>
                <div>
                  <label className={labelClass}>ترتيب الظهور للعميل</label>
                  <input
                    type='number'
                    min={1}
                    value={form.display_order}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        display_order: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                    title='1 يظهر أول عرض في قائمة العميل بالكونفيرم'
                  />
                </div>
                <div>
                  <label className={labelClass}>أولوية الحساب (1 الأقوى)</label>
                  <input
                    type='number'
                    min={1}
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>وصف مختصر (اختياري)</label>
                <input
                  type='text'
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={inputClass}
                  placeholder='توضيح داخلي للقاعدة...'
                />
              </div>

              {/* Reward & Condition Selectors */}
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div>
                  <label className={labelClass}>نوع المكافأة (النتيجة)</label>
                  <button
                    type='button'
                    onClick={() => setRewardModalOpen(true)}
                    className={`${inputClass} w-full flex items-center justify-between gap-2 text-right cursor-pointer transition-all duration-150 hover:border-cyan-400/50 active:scale-[0.99]`}
                  >
                    <span className='flex items-center gap-2 min-w-0'>
                      <span
                        className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs shrink-0 ${selectedRewardOption.accent}`}
                      >
                        {selectedRewardOption.icon}
                      </span>
                      <span className='truncate text-xs font-bold text-white'>
                        {selectedRewardOption.title}
                      </span>
                    </span>
                    <span className='text-[10px] text-cyan-300 shrink-0'>
                      ▾
                    </span>
                  </button>
                </div>

                <div>
                  <label className={labelClass}>نوع الشرط (متى يشتغل؟)</label>
                  <button
                    type='button'
                    onClick={() => setConditionModalOpen(true)}
                    className={`${inputClass} w-full flex items-center justify-between gap-2 text-right cursor-pointer transition-all duration-150 hover:border-cyan-400/50 active:scale-[0.99]`}
                  >
                    <span className='flex items-center gap-2 min-w-0'>
                      <span
                        className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs shrink-0 ${selectedConditionOption.accent}`}
                      >
                        {selectedConditionOption.icon}
                      </span>
                      <span className='truncate text-xs font-bold text-white'>
                        {selectedConditionOption.title}
                      </span>
                    </span>
                    <span className='text-[10px] text-cyan-300 shrink-0'>
                      ▾
                    </span>
                  </button>
                </div>
              </div>

              {/* Dynamic Reward & Condition Inputs */}
              <div className='rounded-xl border border-slate-600/70 bg-[#253042] p-3.5 space-y-3'>
                {(form.reward_type === 'fixed_discount' ||
                  form.reward_type === 'percent_discount' ||
                  form.reward_type === 'shipping_discount_percent') && (
                  <div>
                    <label className={labelClass}>
                      {form.reward_type === 'fixed_discount'
                        ? 'قيمة الخصم بالجنيه'
                        : 'نسبة الخصم (%)'}
                    </label>
                    <input
                      type='number'
                      min={1}
                      max={form.reward_type === 'fixed_discount' ? 100000 : 100}
                      value={form.reward_value}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          reward_value: Number(e.target.value),
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                )}

                {form.reward_type === 'custom_gift' && (
                  <div>
                    <label className={labelClass}>
                      اكتب اسم الهدية أو المكافأة الحرة
                    </label>
                    <input
                      type='text'
                      required
                      value={form.custom_reward_label}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          custom_reward_label: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder='مثال: تغليف هدايا مجاني / مشروب مجاني مع الطلب'
                    />
                  </div>
                )}

                {form.condition_type === 'min_order_amount' && (
                  <div>
                    <label className={labelClass}>
                      الحد الأدنى لإجمالي الفاتورة (جنيه)
                    </label>
                    <input
                      type='number'
                      min={1}
                      value={form.min_amount}
                      onChange={(e) =>
                        setForm({ ...form, min_amount: Number(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </div>
                )}

                {form.condition_type === 'completed_orders_cycle' && (
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div>
                      <label className={labelClass}>
                        عدد الطلبات المكتملة المطلوبة
                      </label>
                      <input
                        type='number'
                        min={1}
                        value={form.required_completed}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setForm({
                            ...form,
                            required_completed: val,
                            free_on_order_number: val + 1,
                          });
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        رقم الطلب المجاني في الدورة
                      </label>
                      <input
                        type='number'
                        min={2}
                        value={form.free_on_order_number}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            free_on_order_number: Number(e.target.value),
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {form.condition_type === 'days_of_week' && (
                  <div>
                    <label className={labelClass}>
                      اختر الأيام التي يطبق فيها العرض
                    </label>
                    <div className='flex flex-wrap gap-2 pt-1'>
                      {WEEK_DAYS.map((day) => {
                        const active = form.days_of_week.includes(day.key);
                        return (
                          <button
                            key={day.key}
                            type='button'
                            onClick={() => toggleWeekDay(day.key)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                              active
                                ? 'border-amber-400 bg-amber-500 text-slate-950'
                                : 'border-slate-600 bg-[#1e2736] text-slate-300 hover:text-white'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {form.condition_type === 'time_window' && (
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div>
                      <label className={labelClass}>من الساعة</label>
                      <input
                        type='time'
                        value={form.start_hour}
                        onChange={(e) =>
                          setForm({ ...form, start_hour: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>إلى الساعة</label>
                      <input
                        type='time'
                        value={form.end_hour}
                        onChange={(e) =>
                          setForm({ ...form, end_hour: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {form.condition_type === 'first_order' && (
                  <p className='text-xs text-emerald-200 font-semibold'>
                    ✓ يطبق تلقائياً لأي عميل ليس لديه طلبات مكتملة سابقة (0
                    طلبات delivered).
                  </p>
                )}

                {form.condition_type === 'specific_city' && (
                  <div>
                    <label className={labelClass}>
                      أسماء المدن أو المحافظات (افصل بينهم بفاصلة)
                    </label>
                    <input
                      type='text'
                      required
                      value={form.cities_text}
                      onChange={(e) =>
                        setForm({ ...form, cities_text: e.target.value })
                      }
                      className={inputClass}
                      placeholder='مثال: القاهرة، الجيزة، المنصورة'
                    />
                  </div>
                )}

                {form.condition_type === 'min_items_count' && (
                  <div>
                    <label className={labelClass}>
                      الحد الأدنى لعدد القطع في الأوردر
                    </label>
                    <input
                      type='number'
                      min={1}
                      value={form.min_items}
                      onChange={(e) =>
                        setForm({ ...form, min_items: Number(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </div>
                )}

                {form.condition_type === 'custom_manual' && (
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div>
                      <label className={labelClass}>عنوان الشرط المخصص</label>
                      <input
                        type='text'
                        required
                        value={form.custom_condition_label}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            custom_condition_label: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder='مثال: عرض عملاء VIP / موسم العيد'
                      />
                    </div>
                    <div>
                      <label className={labelClass}>تفاصيل الشرط</label>
                      <input
                        type='text'
                        value={form.manual_condition_note}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            manual_condition_note: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder='وصف الشرط ليظهر في التنبيه...'
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Customer & Admin Messages */}
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div>
                  <label className={labelClass}>
                    الرسالة للعميل في الكونفيرم عند تحقق الشرط
                  </label>
                  <textarea
                    rows={2}
                    value={form.customer_message}
                    onChange={(e) =>
                      setForm({ ...form, customer_message: e.target.value })
                    }
                    className={`${inputClass} resize-none`}
                    placeholder='مبروك! أوردرك مؤهل للعرض...'
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    إشارة التنبيه للأدمن في لوحة الأوردرات
                  </label>
                  <textarea
                    rows={2}
                    value={form.admin_alert_text}
                    onChange={(e) =>
                      setForm({ ...form, admin_alert_text: e.target.value })
                    }
                    className={`${inputClass} resize-none`}
                    placeholder='تنبيه: الأوردر محقق شرط...'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <Toggle
                  checked={form.is_stackable}
                  onChange={() =>
                    setForm({ ...form, is_stackable: !form.is_stackable })
                  }
                  label='قابل للتجميع مع عروض أخرى (Stackable)'
                  description='لو مفعّل: العميل ياخد العرض ده حتى لو حقق عرض تاني معاه.'
                />
                <Toggle
                  checked={form.is_active}
                  onChange={() =>
                    setForm({ ...form, is_active: !form.is_active })
                  }
                  label='تفعيل القاعدة فوراً'
                  description='تشغيل أو إيقاف القاعدة على الموقع.'
                />
              </div>

              <div className='flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2'>
                <button
                  type='button'
                  onClick={closeForm}
                  className='rounded-xl border border-slate-600 bg-slate-700/60 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer'
                >
                  إلغاء
                </button>
                <button
                  type='submit'
                  disabled={saving}
                  className='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-black text-white shadow-sm transition disabled:opacity-50 cursor-pointer'
                >
                  {saving ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : (
                    <Save size={14} />
                  )}
                  {editingRuleId ? 'حفظ التعديلات' : 'إضافة القاعدة'}
                </button>
              </div>
            </form>
          )}

          {/* Rules List */}
          {loading ? (
            <div className='py-8 text-center text-xs text-slate-300'>
              جاري تحميل القواعد...
            </div>
          ) : rules.length === 0 ? (
            <div className='rounded-xl border border-dashed border-slate-600 bg-[#1c2432] p-8 text-center'>
              <p className='text-xs sm:text-sm font-bold text-slate-200'>
                لا توجد قواعد مضافة حالياً
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                    rule.is_active
                      ? 'border-slate-500/80 bg-[#273245]'
                      : 'border-slate-700/80 bg-[#1d2533] opacity-75'
                  }`}
                >
                  <div className='space-y-2.5'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex flex-wrap items-center gap-1.5'>
                        <span className='inline-flex items-center gap-1 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/40 px-2 py-0.5 text-[10px] font-black'>
                          <Truck size={11} /> {formatRewardBadge(rule)}
                        </span>

                        <span className='inline-flex items-center gap-1 rounded-md border border-slate-500/60 bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-200'>
                          {rule.condition_type === 'days_of_week' && (
                            <Calendar size={11} className='text-amber-300' />
                          )}
                          {rule.condition_type === 'specific_city' && (
                            <MapPin size={11} className='text-red-300' />
                          )}
                          {rule.condition_type === 'min_items_count' && (
                            <ShoppingBag
                              size={11}
                              className='text-emerald-300'
                            />
                          )}
                          {rule.condition_type === 'first_order' && (
                            <UserCheck size={11} className='text-blue-300' />
                          )}
                          {formatConditionSummary(rule)}
                        </span>

                        {rule.is_stackable && (
                          <span className='rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200'>
                            يُجمع مع غيره
                          </span>
                        )}
                      </div>

                      <button
                        type='button'
                        onClick={() => void handleToggleRule(rule)}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black transition cursor-pointer ${
                          rule.is_active
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 hover:bg-emerald-500/30'
                            : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                        }`}
                      >
                        {rule.is_active ? 'مفعّلة ✓' : 'متوقفة'}
                      </button>
                    </div>

                    <div>
                      <h3 className='text-xs sm:text-sm font-black text-white'>
                        {rule.title}
                      </h3>
                      {rule.description && (
                        <p className='mt-0.5 text-[11px] leading-relaxed text-slate-300'>
                          {rule.description}
                        </p>
                      )}
                    </div>

                    {rule.customer_message && (
                      <div className='rounded-lg border border-slate-600/70 bg-[#1c2432] px-3 py-2 text-[11px] text-slate-200'>
                        <span className='font-bold text-amber-300'>
                          رسالة العميل:{' '}
                        </span>
                        {rule.customer_message}
                      </div>
                    )}
                  </div>

                  <div className='mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-600/60 pt-2.5'>
                    <span className='inline-flex items-center gap-1 text-[10px] font-bold text-slate-300'>
                      <ArrowUpDown size={11} className='text-amber-300' />
                      ظهور للعميل: #{rule.display_order ?? rule.priority} ·
                      أولوية: #{rule.priority}
                    </span>
                    <div className='flex items-center gap-1.5'>
                      <button
                        type='button'
                        onClick={() => openEditForm(rule)}
                        className='inline-flex items-center gap-1 rounded-lg border border-blue-400/40 bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-200 transition hover:bg-blue-500/25 cursor-pointer'
                      >
                        <Pencil size={12} /> تعديل
                      </button>
                      <button
                        type='button'
                        onClick={() => void handleDeleteRule(rule)}
                        className='inline-flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-500/15 px-2.5 py-1 text-[11px] font-bold text-red-200 transition hover:bg-red-500/25 cursor-pointer'
                      >
                        <Trash2 size={12} /> حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {rewardModalOpen && (
          <div
            className='fixed inset-0 z-40 flex items-center justify-center pt-16 pb-4 px-3 sm:pt-20 sm:pb-6 sm:px-4 bg-black/75 backdrop-blur-sm'
            onClick={() => setRewardModalOpen(false)}
          >
            <div
              role='dialog'
              aria-modal='true'
              dir='rtl'
              onClick={(e) => e.stopPropagation()}
              className='w-full max-w-[270px] sm:max-w-[300px] flex flex-col rounded-2xl border border-slate-700/80 bg-[#09101d] p-3 text-white shadow-2xl shadow-black/80'
            >
              {/* Header */}
              <div className='flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80 shrink-0'>
                <div className='min-w-0'>
                  <h3 className='text-xs sm:text-[13px] font-extrabold text-white truncate'>
                    اختر نوع المكافأة
                  </h3>
                  <p className='text-[10px] text-slate-400 truncate mt-0.5'>
                    حدد نتيجة المكافأة للعميل
                  </p>
                </div>

                <button
                  type='button'
                  onClick={() => setRewardModalOpen(false)}
                  className='rounded-lg px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer shrink-0'
                  aria-label='إغلاق'
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Options List */}
              {/* Scrollable Options List */}
              <div className='mt-2 space-y-1 max-h-[48vh] sm:max-h-[52vh] overflow-y-auto overscroll-contain pl-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/70'>
                {rewardTypeOptions.map((option) => {
                  const isSelected = form.reward_type === option.value;
                  return (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => {
                        setForm({
                          ...form,
                          reward_type: option.value,
                        });
                        setRewardModalOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl border text-right transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? 'border-cyan-400/60 bg-gradient-to-l from-cyan-500/15 via-blue-600/15 to-red-500/10 ring-1 ring-cyan-400/30'
                          : 'border-slate-800 bg-[#0d1628]/80 hover:border-slate-700 hover:bg-[#111d34]'
                      }`}
                    >
                      <span className='flex items-center gap-2 min-w-0'>
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center text-xs sm:text-sm shrink-0 ${option.accent}`}
                        >
                          {option.icon}
                        </span>
                        <span className='min-w-0'>
                          <span className='block text-[11px] sm:text-xs font-extrabold text-white leading-snug'>
                            {option.title}
                          </span>
                          <span className='block text-[9px] sm:text-[10px] text-slate-400 leading-snug'>
                            {option.desc}
                          </span>
                        </span>
                      </span>

                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-black shrink-0 ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                            : 'border-slate-700 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {conditionModalOpen && (
          <div
            className='fixed inset-0 z-40 flex items-center justify-center pt-20 pb-5 px-3 sm:pt-24 sm:pb-7 sm:px-4 bg-black/75 backdrop-blur-sm'
            onClick={() => setConditionModalOpen(false)}
          >
            <div
              role='dialog'
              aria-modal='true'
              dir='rtl'
              onClick={(e) => e.stopPropagation()}
              className='w-full max-w-[250px] sm:max-w-[275px] flex flex-col rounded-2xl border border-slate-700/80 bg-[#09101d] p-2.5 text-white shadow-2xl shadow-black/80'
            >
              {/* Header */}
              <div className='flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80 shrink-0'>
                <div className='min-w-0'>
                  <h3 className='text-xs font-extrabold text-white truncate'>
                    اختر نوع الشرط
                  </h3>
                  <p className='text-[9px] text-slate-400 truncate mt-0.5'>
                    متى يتم تفعيل القاعدة؟
                  </p>
                </div>

                <button
                  type='button'
                  onClick={() => setConditionModalOpen(false)}
                  className='rounded-lg px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer shrink-0'
                  aria-label='إغلاق'
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Options List */}
              <div className='mt-2 space-y-1 max-h-[48vh] sm:max-h-[52vh] overflow-y-auto overscroll-contain pl-1'>
                {conditionTypeOptions.map((option) => {
                  const isSelected = form.condition_type === option.value;
                  return (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => {
                        setForm({
                          ...form,
                          condition_type: option.value,
                        });
                        setConditionModalOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-1.5 p-1.5 rounded-xl border text-right transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? 'border-cyan-400/60 bg-gradient-to-l from-cyan-500/15 via-blue-600/15 to-red-500/10 ring-1 ring-cyan-400/30'
                          : 'border-slate-800 bg-[#0d1628]/80 hover:border-slate-700 hover:bg-[#111d34]'
                      }`}
                    >
                      <span className='flex items-center gap-1.5 min-w-0'>
                        <span
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border flex items-center justify-center text-[11px] sm:text-xs shrink-0 ${option.accent}`}
                        >
                          {option.icon}
                        </span>
                        <span className='min-w-0'>
                          <span className='block text-[10px] sm:text-[11px] font-extrabold text-white leading-tight'>
                            {option.title}
                          </span>
                          <span className='block text-[9px] text-slate-400 leading-tight mt-0.5'>
                            {option.desc}
                          </span>
                        </span>
                      </span>

                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-black shrink-0 ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                            : 'border-slate-700 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
        {/* ================================================= */}
      </div>
    </>
  );
}

/* ============================================================================
   STORE BRANCHES MANAGER (store_branches table -> used in Checkout)
============================================================================ */
type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  sort_order: number;
};

function AdminBranchesManager() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const loadBranches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_branches')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data) {
      setBranches(data as BranchRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadBranches();
  }, []);

  const handleAddBranch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setNotice(null);

    const { error } = await supabase.from('store_branches').insert({
      name: name.trim(),
      address: address.trim() || null,
      is_active: true,
      sort_order: branches.length + 1,
    });

    setSaving(false);
    if (error) {
      setNotice(`خطأ: ${error.message}`);
      return;
    }

    setName('');
    setAddress('');
    setNotice('تمت إضافة الفرع وسيظهر فوراً في صفحة التشيك أوت.');
    await loadBranches();
  };

  const toggleBranch = async (branch: BranchRow) => {
    const next = !branch.is_active;
    const { error } = await supabase
      .from('store_branches')
      .update({ is_active: next })
      .eq('id', branch.id);

    if (!error) {
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? { ...b, is_active: next } : b)),
      );
    }
  };

  const deleteBranch = async (branch: BranchRow) => {
    if (!window.confirm(`حذف فرع "${branch.name}"؟`)) return;
    const { error } = await supabase
      .from('store_branches')
      .delete()
      .eq('id', branch.id);
    if (!error) {
      setBranches((prev) => prev.filter((b) => b.id !== branch.id));
    }
  };

  return (
    <>
      <SectionDivider />
      <SectionDivider />
      <SectionDivider />

      <div className='overflow-hidden rounded-2xl border border-slate-600/70 bg-[#222c3c] shadow-md'>
        <div className='border-b border-slate-600/70 bg-[#273245] p-4 sm:p-5'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/40 bg-blue-500/15 text-blue-300'>
              <Store size={20} />
            </div>
            <div>
              <h2 className='text-sm sm:text-base font-black text-white'>
                Store Branches (فروع المحل)
              </h2>
              <p className='text-xs text-slate-300'>
                أضف فروع المحل ليختار العميل الفرع الأقرب له في صفحة التشيك أوت
              </p>
            </div>
          </div>
        </div>

        <div className='p-4 sm:p-6 space-y-4'>
          {notice && (
            <div className='rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-semibold text-emerald-100'>
              {notice}
            </div>
          )}

          <form
            onSubmit={handleAddBranch}
            className='grid grid-cols-1 gap-2.5 sm:grid-cols-3'
          >
            <input
              type='text'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='اسم الفرع (مثال: فرع مدينة نصر)'
              className={inputClass}
            />
            <input
              type='text'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='عنوان مختصر (اختياري)'
              className={inputClass}
            />
            <button
              type='submit'
              disabled={saving}
              className='inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition cursor-pointer disabled:opacity-50'
            >
              <Plus size={15} /> إضافة فرع
            </button>
          </form>

          {loading ? (
            <p className='text-xs text-slate-300'>جاري تحميل الفروع...</p>
          ) : branches.length === 0 ? (
            <p className='rounded-xl border border-dashed border-slate-600 bg-[#1c2432] p-4 text-center text-xs text-slate-300'>
              لم يتم إضافة فروع بعد. أضف أول فرع بالأعلى.
            </p>
          ) : (
            <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className='flex items-center justify-between gap-2 rounded-xl border border-slate-600/70 bg-[#273245] px-3.5 py-3'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-xs sm:text-sm font-black text-white'>
                      {branch.name}
                    </p>
                    {branch.address && (
                      <p className='truncate text-[11px] text-slate-300'>
                        {branch.address}
                      </p>
                    )}
                  </div>
                  <div className='flex items-center gap-1.5 shrink-0'>
                    <button
                      type='button'
                      onClick={() => void toggleBranch(branch)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black cursor-pointer ${
                        branch.is_active
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
                          : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {branch.is_active ? 'متاح' : 'مغلق'}
                    </button>
                    <button
                      type='button'
                      onClick={() => void deleteBranch(branch)}
                      className='rounded-lg border border-red-400/40 bg-red-500/15 p-1.5 text-red-200 hover:bg-red-500/25 cursor-pointer'
                      title='حذف الفرع'
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}









/* ============================================================================
   EXISTING REVIEWS MANAGER (Preserved Logic + Upgraded Mid-Tone UI)
============================================================================ */
function AdminReviewsManager() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  const [newProductId, setNewProductId] = useState('');
  const [newReview, setNewReview] = useState<ReviewForm>(emptyReviewForm);

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<ReviewForm>(emptyReviewForm);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);

    const [reviewResult, productResult] = await Promise.all([
      supabase
        .from('reviews')
        .select(
          'id, product_id, reviewer_name, rating, comment, created_at, admin_reply, admin_liked, is_hidden',
        )
        .order('created_at', { ascending: false }),

      supabase.from('products').select('id, name').order('name'),
    ]);

    if (reviewResult.error) {
      setNotice(`Could not load reviews: ${reviewResult.error.message}`);
      setNoticeError(true);
    } else {
      setReviews((reviewResult.data ?? []) as ReviewRow[]);
    }

    if (productResult.error) {
      setNotice(`Could not load products: ${productResult.error.message}`);
      setNoticeError(true);
    } else {
      setProducts((productResult.data ?? []) as ProductOption[]);

      if (productResult.data?.[0]) {
        setNewProductId(
          (current) => current || String(productResult.data[0].id),
        );
      }
    }

    if (showLoader) setLoading(false);
  };

  useEffect(() => {
    void fetchData(true);

    const channel = supabase
      .channel('admin-reviews-live-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
        },
        () => {
          void fetchData(false);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const productNames = useMemo(() => {
    return new Map(
      products.map((product) => [String(product.id), product.name]),
    );
  }, [products]);

  const visibleReviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'visible' && !review.is_hidden) ||
        (filter === 'hidden' && review.is_hidden);

      const productName = productNames.get(String(review.product_id)) || '';
      const matchesSearch =
        !query ||
        review.reviewer_name.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query) ||
        (review.admin_reply || '').toLowerCase().includes(query) ||
        productName.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [reviews, filter, search, productNames]);


const reviewsSliderRef = useRef<HTMLDivElement | null>(null);

const scrollReviewsSlider = (direction: 'start' | 'prev' | 'next' | 'end') => {
  const el = reviewsSliderRef.current;
  if (!el) return;

  if (direction === 'start') {
    el.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (direction === 'end') {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  } else if (direction === 'prev') {
    el.scrollBy({ top: -260, behavior: 'smooth' });
  } else {
    el.scrollBy({ top: 260, behavior: 'smooth' });
  }
};

  const totalCount = reviews.length;
  const hiddenCount = reviews.filter((review) => review.is_hidden).length;

  const handleAddReview = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newProductId) {
      setNotice('Add at least one product before creating a review.');
      setNoticeError(true);
      return;
    }

    setSaving(true);
    setNotice('');

    const { error } = await supabase.from('reviews').insert({
      product_id: newProductId,
      reviewer_name: newReview.reviewer_name.trim(),
      rating: newReview.rating,
      comment: newReview.comment.trim(),
      admin_reply: newReview.admin_reply.trim() || null,
      admin_liked: false,
      is_hidden: false,
    });

    setSaving(false);

    if (error) {
      setNotice(`Could not add review: ${error.message}`);
      setNoticeError(true);
      return;
    }

    setNewReview(emptyReviewForm);
    setNotice('Review added successfully.');
    setNoticeError(false);
    await fetchData();
  };

  const startEditing = (review: ReviewRow) => {
    setEditingId(review.id);
    setEditForm({
      reviewer_name: review.reviewer_name,
      rating: review.rating,
      comment: review.comment,
      admin_reply: review.admin_reply || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(emptyReviewForm);
  };

  const handleUpdateReview = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingId === null) return;

    if (!editForm.reviewer_name.trim() || !editForm.comment.trim()) {
      setNotice('Reviewer name and comment are required.');
      setNoticeError(true);
      return;
    }

    setSaving(true);
    setNotice('');

    const { data, error } = await supabase
      .from('reviews')
      .update({
        reviewer_name: editForm.reviewer_name.trim(),
        rating: editForm.rating,
        comment: editForm.comment.trim(),
        admin_reply: editForm.admin_reply.trim() || null,
      })
      .eq('id', editingId)
      .select('id')
      .maybeSingle();

    setSaving(false);

    if (error) {
      setNotice(`Could not update review: ${error.message}`);
      setNoticeError(true);
      return;
    }

    if (!data) {
      setNotice('No review was updated.');
      setNoticeError(true);
      return;
    }

    setNotice('Review updated successfully.');
    setNoticeError(false);

    cancelEditing();
    await fetchData(false);
  };

  const toggleLike = async (review: ReviewRow) => {
    const nextLiked = !review.admin_liked;

    const { data, error } = await supabase
      .from('reviews')
      .update({ admin_liked: nextLiked })
      .eq('id', review.id)
      .select('id, admin_liked')
      .maybeSingle();

    if (error || !data) {
      setNotice(`Could not update store reaction.`);
      setNoticeError(true);
      return;
    }

    setReviews((current) =>
      current.map((item) =>
        item.id === review.id
          ? { ...item, admin_liked: data.admin_liked }
          : item,
      ),
    );
  };

  const toggleVisibility = async (review: ReviewRow) => {
    const nextHidden = !review.is_hidden;

    const { data, error } = await supabase
      .from('reviews')
      .update({ is_hidden: nextHidden })
      .eq('id', review.id)
      .select('id, is_hidden')
      .maybeSingle();

    if (error || !data) {
      setNotice(`Could not change review visibility.`);
      setNoticeError(true);
      return;
    }

    setReviews((current) =>
      current.map((item) =>
        item.id === review.id ? { ...item, is_hidden: data.is_hidden } : item,
      ),
    );
  };

  const handleDeleteReview = async (review: ReviewRow) => {
    const confirmed = window.confirm(
      `Delete the review by ${review.reviewer_name}?`,
    );

    if (!confirmed) return;

    setSaving(true);
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', review.id)
      .select('id')
      .maybeSingle();

    setSaving(false);

    if (error || !data) {
      setNotice(`Could not delete review.`);
      setNoticeError(true);
      return;
    }

    setReviews((current) => current.filter((item) => item.id !== data.id));
    if (editingId === review.id) cancelEditing();
    setNotice('Review deleted permanently.');
    setNoticeError(false);
    await fetchData(false);
  };

  return (
    <div className='overflow-hidden rounded-2xl border border-slate-600/70 bg-[#222c3c] shadow-md'>
      <div className='border-b border-slate-600/70 bg-[#273245] p-4 sm:p-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'>
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className='text-sm sm:text-base font-black text-white'>
                Reviews Moderation
              </h2>
              <p className='text-xs text-slate-300'>إدارة التقييمات والردود</p>
            </div>
          </div>
          <button
            type='button'
            onClick={() => void fetchData()}
            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-[#1e2736] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-blue-400/60 hover:text-white cursor-pointer'
          >
            <RefreshCw size={12} className='text-blue-400' /> Refresh
          </button>
        </div>

        <div className='mt-4 grid grid-cols-2 gap-3 max-w-sm'>
          <div className='rounded-xl border border-slate-600/70 bg-[#1e2736] p-3'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-slate-300'>
              All reviews
            </p>
            <p className='mt-0.5 text-lg font-black tabular-nums text-white'>
              {totalCount}
            </p>
          </div>
          <div className='rounded-xl border border-amber-400/35 bg-[#1e2736] p-3'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-amber-300'>
              Hidden
            </p>
            <p className='mt-0.5 text-lg font-black tabular-nums text-white'>
              {hiddenCount}
            </p>
          </div>
        </div>
      </div>

      <div className='p-4 sm:p-6 space-y-4'>
        {notice && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              noticeError
                ? 'bg-red-500/15 text-red-100 border border-red-400/50'
                : 'bg-emerald-500/15 text-emerald-100 border border-emerald-400/50'
            }`}
          >
            {notice}
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className='flex flex-col sm:flex-row gap-2.5 items-center justify-between'>
          <div className='relative w-full sm:w-72'>
            <Search
              size={14}
              className='absolute left-3 top-3 text-slate-400'
            />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search reviews...'
              className='w-full rounded-xl border border-slate-600/80 bg-[#1e2736] pl-9 pr-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-400 focus:border-blue-400'
            />
          </div>

          <div className='flex items-center gap-1.5 w-full sm:w-auto'>
            {(['all', 'visible', 'hidden'] as const).map((tab) => (
              <button
                key={tab}
                type='button'
                onClick={() => setFilter(tab)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                  filter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#1e2736] border border-slate-600/80 text-slate-300 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {/* Reviews Vertical Scroll List */}
        {/* Reviews Compact Vertical Scroll List */}
        <div className='space-y-2.5 px-3 sm:px-6'>
          <div className='flex items-center justify-between gap-2 px-1'>
            <span className='text-[11px] font-bold text-slate-300'>
              Reviews List{' '}
              <span className='px-2 py-0.5 rounded-full bg-slate-800 text-blue-300 font-mono text-[10px]'>
                {visibleReviews.length}
              </span>
            </span>
            {visibleReviews.length > 3 && (
              <span className='text-[10px] text-slate-400'>
                Scroll / Touch inside list
              </span>
            )}
          </div>

          {loading ? (
            <div className='py-6 text-center text-xs text-slate-300'>
              Loading reviews...
            </div>
          ) : visibleReviews.length === 0 ? (
            <div className='py-6 text-center text-xs text-slate-300'>
              No reviews found.
            </div>
          ) : (
            <div
              className={`flex flex-col gap-2.5 pr-1.5 scroll-smooth touch-pan-y overscroll-contain ${
                visibleReviews.length > 3
                  ? 'max-h-[260px] overflow-y-scroll rounded-xl border border-slate-700/70 bg-[#1c2534]/65 p-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-900/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-500/50 hover:[&::-webkit-scrollbar-thumb]:bg-blue-400/70'
                  : ''
              }`}
            >
              {visibleReviews.map((review) => {
                const isEditing = editingId === review.id;
                const productName =
                  productNames.get(String(review.product_id)) || 'Product';

                return (
                  <div
                    key={review.id}
                    className='rounded-xl border border-slate-600/70 bg-[#273245] p-2.5 sm:p-3 space-y-2 transition hover:border-slate-500 shrink-0'
                  >
                    {isEditing ? (
                      <form
                        onSubmit={handleUpdateReview}
                        className='space-y-2.5'
                      >
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                          <div>
                            <label className={labelClass}>Reviewer Name</label>
                            <input
                              type='text'
                              value={editForm.reviewer_name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  reviewer_name: e.target.value,
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Rating (1-5)</label>
                            <input
                              type='number'
                              min='1'
                              max='5'
                              value={editForm.rating}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  rating: Number(e.target.value),
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Comment</label>
                          <textarea
                            rows={2}
                            value={editForm.comment}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                comment: e.target.value,
                              })
                            }
                            className={`${inputClass} resize-none`}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Admin Reply</label>
                          <input
                            type='text'
                            value={editForm.admin_reply}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                admin_reply: e.target.value,
                              })
                            }
                            className={inputClass}
                            placeholder='Add store reply...'
                          />
                        </div>
                        <div className='flex justify-end gap-2 pt-1'>
                          <button
                            type='button'
                            onClick={cancelEditing}
                            className='px-2.5 py-1 rounded-lg border border-slate-600 bg-slate-700/60 text-[11px] font-bold text-slate-200 hover:text-white cursor-pointer'
                          >
                            Cancel
                          </button>
                          <button
                            type='submit'
                            disabled={saving}
                            className='px-2.5 py-1 rounded-lg bg-blue-600 text-[11px] font-bold text-white hover:bg-blue-500 cursor-pointer'
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0'>
                            <div className='flex flex-wrap items-center gap-1.5'>
                              <span className='text-[11px] font-bold text-white truncate'>
                                {review.reviewer_name}
                              </span>
                              <span className='text-[10px] rounded-md border border-slate-500/60 bg-[#1e2736] px-1.5 py-0.5 text-slate-200'>
                                {productName}
                              </span>
                            </div>
                            <div className='flex items-center gap-0.5 mt-1 text-amber-400'>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  className={
                                    i < review.rating
                                      ? 'fill-amber-400'
                                      : 'text-slate-600'
                                  }
                                />
                              ))}
                            </div>
                          </div>

                          <div className='flex items-center gap-1 shrink-0'>
                            <button
                              type='button'
                              onClick={() => toggleLike(review)}
                              className={`p-1 rounded-lg border transition cursor-pointer ${
                                review.admin_liked
                                  ? 'border-red-400/50 bg-red-500/20 text-red-300'
                                  : 'border-slate-600 bg-[#1e2736] text-slate-300 hover:text-white'
                              }`}
                              title='Like review'
                            >
                              <Heart
                                size={12}
                                className={
                                  review.admin_liked ? 'fill-red-400' : ''
                                }
                              />
                            </button>
                            <button
                              type='button'
                              onClick={() => toggleVisibility(review)}
                              className={`p-1 rounded-lg border transition cursor-pointer ${
                                review.is_hidden
                                  ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                                  : 'border-slate-600 bg-[#1e2736] text-slate-300 hover:text-white'
                              }`}
                              title={
                                review.is_hidden ? 'Show review' : 'Hide review'
                              }
                            >
                              {review.is_hidden ? (
                                <EyeOff size={12} />
                              ) : (
                                <Eye size={12} />
                              )}
                            </button>
                            <button
                              type='button'
                              onClick={() => startEditing(review)}
                              className='p-1 rounded-lg border border-slate-600 bg-[#1e2736] text-slate-300 hover:text-white transition cursor-pointer'
                              title='Edit'
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type='button'
                              onClick={() => handleDeleteReview(review)}
                              className='p-1 rounded-lg border border-red-400/40 bg-red-500/15 text-red-300 hover:bg-red-500/25 transition cursor-pointer'
                              title='Delete'
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <p className='text-[11px] text-slate-200 leading-relaxed'>
                          {review.comment}
                        </p>

                        {review.admin_reply && (
                          <div className='mt-1.5 rounded-lg border border-blue-400/40 bg-blue-500/15 p-2 text-[11px] text-slate-100'>
                            <span className='font-bold text-blue-300 mr-1'>
                              Store Reply:
                            </span>
                            {review.admin_reply}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
