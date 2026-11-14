'use client';

import { useEffect, useMemo, useState } from 'react';
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
  RefreshCw,
  Package,
} from 'lucide-react';

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

const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  enabled: true,
  text: 'FLASH SALE: Enjoy Up To 40% OFF On Selected Items! Limited Time Only.',
  startEmoji: '💸',
  endEmoji: '🔥',
};

const inputClass =
  'w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs sm:text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/10';
const labelClass = 'mb-1.5 block text-xs font-bold text-slate-300';
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
    <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-900/50 px-4 py-3.5 transition hover:border-slate-700'>
      <div className='min-w-0'>
        <p className='text-xs sm:text-sm font-bold text-slate-200'>{label}</p>
        <p className='mt-0.5 text-[11px] leading-relaxed text-slate-400'>
          {description}
        </p>
      </div>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6.5' : 'left-0.5'}`}
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
      <div className='flex min-h-screen items-center justify-center bg-[#07090e] px-4 font-sans text-white'>
        <div className='flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-5 py-4 shadow-xl'>
          <Loader2 className='h-5 w-5 animate-spin text-blue-500' />
          <p className='text-xs font-bold tracking-wide text-slate-300'>
            Loading store controls...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen overflow-x-clip bg-[#07090e] font-sans text-slate-300 selection:bg-red-500 selection:text-white'>
      {/* Subtle ambient lighting */}
      <div className='pointer-events-none fixed -left-32 top-16 h-80 w-80 rounded-full bg-blue-600/10 blur-[100px]' />
      <div className='pointer-events-none fixed -right-32 top-1/3 h-80 w-80 rounded-full bg-red-600/10 blur-[100px]' />

      <header className='fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b border-slate-800/80 bg-[#07090e]/95 shadow-lg backdrop-blur-md'>
        <div className='mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6'>
          <Link
            href='/admin'
            className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-700 hover:text-white'
          >
            <ArrowLeft size={14} className='text-blue-400' />
            <span className='hidden sm:inline'>Dashboard</span>
          </Link>

          <div className='min-w-0 text-center'>
            <h1 className='text-sm sm:text-base font-black tracking-wider text-slate-100'>
              STORE SETTINGS
            </h1>
          </div>

          <button
            type='button'
            onClick={handleLogout}
            className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-900/30 hover:text-rose-300'
          >
            <span>Logout</span>
          </button>
        </div>

        <nav className='border-t border-slate-800/60 bg-[#090c12]/90'>
          <div className='mx-auto flex max-w-[1280px] items-center justify-center gap-3 px-4 py-2 sm:px-6'>
            <a
              href='#announcement-bar'
              className='inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-900/30'
            >
              <Megaphone size={13} className='text-red-400' /> Discount Bar
            </a>
            <a
              href='#reviews-control'
              className='inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-900/30'
            >
              <Star size={13} className='text-emerald-400' /> Reviews
            </a>
          </div>
        </nav>
      </header>

      <main className='relative z-10 mx-auto max-w-[1280px] space-y-6 px-4 pt-28 pb-6 sm:px-6 sm:py-8 sm:pt-32'>
        {/* Compact Hero Banner Card */}
        <section className='relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 shadow-sm'>
          <div className='absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-600/5 via-emerald-600/5 to-transparent' />
          <div className='relative flex flex-col justify-between gap-4 md:flex-row md:items-center'>
            <div>
              <div className='mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-950/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400'>
                <Sparkles size={12} className='text-blue-400' /> Control Center
              </div>
              <h2 className='text-xl font-black tracking-tight text-slate-100 sm:text-2xl'>
                Manage Customer Experience
              </h2>
              <p className='mt-1 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-400'>
                Control discount announcements and storefront reviews
                efficiently from one place.
              </p>
            </div>
            <div className='grid grid-cols-2 gap-2.5 md:min-w-[280px]'>
              <div className='rounded-xl border border-red-500/20 bg-red-950/20 p-3'>
                <Megaphone className='text-red-400' size={18} />
                <p className='mt-2 text-[11px] font-bold text-slate-400'>
                  Promotion
                </p>
                <p className='text-xs font-black text-slate-200'>
                  Discount Bar
                </p>
              </div>
              <div className='rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3'>
                <Star className='text-emerald-400' size={18} />
                <p className='mt-2 text-[11px] font-bold text-slate-400'>
                  Feedback
                </p>
                <p className='text-xs font-black text-slate-200'>Reviews</p>
              </div>
            </div>
          </div>
        </section>
        {feedback && (
          <div
            role='status'
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm shadow-sm ${
              feedback.type === 'error'
                ? 'border-rose-500/30 bg-rose-950/30 text-rose-200'
                : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertTriangle
                size={16}
                className='mt-0.5 shrink-0 text-rose-400'
              />
            ) : (
              <CheckCircle2
                size={16}
                className='mt-0.5 shrink-0 text-emerald-400'
              />
            )}
            <span className='font-semibold leading-relaxed'>
              {feedback.text}
            </span>
          </div>
        )}
        {/* Announcement Section */}
        <section
          id='announcement-bar'
          className='scroll-mt-28 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-sm'
        >
          <div className='border-b border-slate-800/80 bg-slate-900/90 p-4 sm:p-5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-950/30 text-red-400'>
                  <Megaphone size={20} />
                </div>
                <div>
                  <h2 className='text-sm sm:text-base font-black text-slate-100'>
                    Discount Announcement Bar
                  </h2>
                  <p className='text-xs text-slate-400'>
                    Edit promotional strip message & visibility
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  announcement.enabled
                    ? 'border border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                    : 'border border-slate-700 bg-slate-800 text-slate-400'
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
              description='Turn customer-facing bar on or off.'
            />

            <div>
              <div className='mb-1.5 flex items-center justify-between'>
                <label className={labelClass}>Promotion message</label>
                <span className='text-[11px] tabular-nums text-slate-500'>
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

            <div className='rounded-xl border border-slate-800/80 bg-[#07090e] p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-slate-400'>
                  Live preview
                </span>
              </div>
              {announcement.enabled && announcement.text.trim() ? (
                <div className='flex items-center justify-center rounded-lg border border-slate-800 bg-gradient-to-r from-red-600/80 via-emerald-600/80 to-blue-600/80 px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-white shadow-sm'>
                  <span className='mr-2 shrink-0'>
                    {announcement.startEmoji || '💸'}
                  </span>
                  <span className='break-words'>{announcement.text}</span>
                  <span className='ml-2 shrink-0'>
                    {announcement.endEmoji || '🔥'}
                  </span>
                </div>
              ) : (
                <div className='rounded-lg border border-dashed border-slate-800 bg-slate-900/40 px-4 py-4 text-center text-xs text-slate-500'>
                  Announcement bar is hidden or empty.
                </div>
              )}
            </div>

            <div className='flex items-center justify-end border-t border-slate-800/80 pt-4'>
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
        </section>
        {/* Reviews Section Wrapper */}
        <section id='reviews-control' className='scroll-mt-28 space-y-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='text-[10px] font-bold uppercase tracking-wider text-emerald-400'>
                Customer Feedback
              </p>
              <h2 className='text-xl font-black tracking-tight text-slate-100 sm:text-2xl'>
                Reviews Management
              </h2>
            </div>
            <span className='w-fit rounded-full border border-emerald-500/30 bg-emerald-950/20 px-3 py-1 text-xs font-bold text-emerald-300'>
              Database Connected
            </span>
          </div>
          <AdminReviewsManager />
        </section>
        <footer className='py-4 text-center text-xs text-slate-500'>
          Store Settings · Promotions & Reviews
        </footer>
      </main>
    </div>
  );
}

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
    <div className='overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-sm'>
      <div className='border-b border-slate-800/80 bg-slate-900/90 p-4 sm:p-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-950/30 text-emerald-400'>
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className='text-sm sm:text-base font-black text-slate-100'>
                Reviews Moderation
              </h2>
              <p className='text-xs text-slate-400'>Manage ratings & replies</p>
            </div>
          </div>
          <button
            type='button'
            onClick={() => void fetchData()}
            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-slate-700 hover:text-white'
          >
            <RefreshCw size={12} className='text-blue-400' /> Refresh
          </button>
        </div>

        <div className='mt-4 grid grid-cols-2 gap-3 max-w-sm'>
          <div className='rounded-xl border border-slate-800 bg-slate-900/80 p-3'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>
              All reviews
            </p>
            <p className='mt-0.5 text-lg font-black tabular-nums text-slate-100'>
              {totalCount}
            </p>
          </div>
          <div className='rounded-xl border border-slate-800 bg-slate-900/80 p-3'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-amber-400'>
              Hidden
            </p>
            <p className='mt-0.5 text-lg font-black tabular-nums text-slate-100'>
              {hiddenCount}
            </p>
          </div>
        </div>
      </div>

      <div className='p-4 sm:p-6 space-y-4'>
        {notice && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${noticeError ? 'bg-rose-950/30 text-rose-300 border border-rose-500/30' : 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30'}`}
          >
            {notice}
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className='flex flex-col sm:flex-row gap-2.5 items-center justify-between'>
          <div className='relative w-full sm:w-72'>
            <Search
              size={14}
              className='absolute left-3 top-3 text-slate-500'
            />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search reviews...'
              className='w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500/50'
            />
          </div>

          <div className='flex items-center gap-1.5 w-full sm:w-auto'>
            {(['all', 'visible', 'hidden'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  filter === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className='space-y-3 max-h-[500px] overflow-y-auto pr-1'>
          {loading ? (
            <div className='py-8 text-center text-xs text-slate-500'>
              Loading reviews...
            </div>
          ) : visibleReviews.length === 0 ? (
            <div className='py-8 text-center text-xs text-slate-500'>
              No reviews found.
            </div>
          ) : (
            visibleReviews.map((review) => {
              const isEditing = editingId === review.id;
              const productName =
                productNames.get(String(review.product_id)) || 'Product';

              return (
                <div
                  key={review.id}
                  className='rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 space-y-2.5 transition hover:border-slate-700/80'
                >
                  {isEditing ? (
                    <form onSubmit={handleUpdateReview} className='space-y-3'>
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
                          className='px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-bold text-slate-400 hover:text-white'
                        >
                          Cancel
                        </button>
                        <button
                          type='submit'
                          disabled={saving}
                          className='px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-500'
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs font-bold text-slate-200'>
                              {review.reviewer_name}
                            </span>
                            <span className='text-[10px] rounded-md bg-slate-800 px-2 py-0.5 text-slate-400'>
                              {productName}
                            </span>
                          </div>
                          <div className='flex items-center gap-1 mt-1 text-amber-400'>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={11}
                                className={
                                  i < review.rating
                                    ? 'fill-amber-400'
                                    : 'text-slate-700'
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <div className='flex items-center gap-1'>
                          <button
                            type='button'
                            onClick={() => toggleLike(review)}
                            className={`p-1.5 rounded-lg border transition ${
                              review.admin_liked
                                ? 'border-rose-500/30 bg-rose-950/20 text-rose-500'
                                : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
                            }`}
                            title='Like review'
                          >
                            <Heart
                              size={13}
                              className={
                                review.admin_liked ? 'fill-rose-500' : ''
                              }
                            />
                          </button>
                          <button
                            type='button'
                            onClick={() => toggleVisibility(review)}
                            className={`p-1.5 rounded-lg border transition ${
                              review.is_hidden
                                ? 'border-amber-500/30 bg-amber-950/20 text-amber-400'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                            title={
                              review.is_hidden ? 'Show review' : 'Hide review'
                            }
                          >
                            {review.is_hidden ? (
                              <EyeOff size={13} />
                            ) : (
                              <Eye size={13} />
                            )}
                          </button>
                          <button
                            type='button'
                            onClick={() => startEditing(review)}
                            className='p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition'
                            title='Edit'
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type='button'
                            onClick={() => handleDeleteReview(review)}
                            className='p-1.5 rounded-lg border border-rose-500/20 bg-rose-950/10 text-rose-400 hover:bg-rose-950/30 transition'
                            title='Delete'
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <p className='text-xs text-slate-300 leading-relaxed'>
                        {review.comment}
                      </p>

                      {review.admin_reply && (
                        <div className='mt-2 rounded-lg border border-blue-500/20 bg-blue-950/10 p-2.5 text-xs text-slate-300'>
                          <span className='font-bold text-blue-400 mr-1'>
                            Store Reply:
                          </span>
                          {review.admin_reply}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
