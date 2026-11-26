'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Heart,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Review = {
  id: string | number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  admin_reply: string | null;
  admin_liked: boolean | null;
};

type CustomerReviewsProps = {
  productId: string | number;
};

export default function CustomerReviews({ productId }: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
// ================
// ================
const [isRatingOpen, setIsRatingOpen] = useState(false);

const ratingOptions = [
  {
    value: 5,
    label: 'ممتاز',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    value: 4,
    label: 'جيد جداً',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  {
    value: 3,
    label: 'متوسط',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  {
    value: 2,
    label: 'مقبول',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  {
    value: 1,
    label: 'سيئ',
    badge: 'bg-red-500/20 text-red-300 border-red-500/35',
  },
];

const selectedRating =
  ratingOptions.find((item) => item.value === rating) || ratingOptions[0];
// ================
// ================
// ================
const renderStars = (count) => (
  <span className='inline-flex items-center gap-0.5 text-sm leading-none'>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= count ? 'text-amber-400' : 'text-slate-600/80'}
      >
        ★
      </span>
    ))}
  </span>
);
// ================
// ================
// ================
  const fetchReviews = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);

      const { data, error } = await supabase
        .from('reviews')
        .select(
          'id, reviewer_name, rating, comment, created_at, admin_reply, admin_liked, is_hidden',
        )
        .eq('product_id', productId)
        // إظهار التقييمات القديمة التي قد تكون is_hidden فيها NULL.
        .or('is_hidden.eq.false,is_hidden.is.null')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch reviews error:', error);
        setNotice('Could not load reviews. Please refresh the page.');
        setNoticeError(true);
      } else {
        setReviews((data ?? []) as Review[]);
      }

      if (showLoader) setLoading(false);
    },
    [productId],
  );


useEffect(() => {
  void fetchReviews(true);

  // تحديث دوري بدون Realtime
  const refreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void fetchReviews(false);
    }
  }, 15000);

  const handleFocus = () => {
    void fetchReviews(false);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void fetchReviews(false);
    }
  };

  window.addEventListener('focus', handleFocus);

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.clearInterval(refreshTimer);

    window.removeEventListener('focus', handleFocus);

    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [fetchReviews, productId]);





  const handleAddReview = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice('');

    if (!reviewerName.trim() || !comment.trim()) {
      setNotice('Please complete your name and review.');
      setNoticeError(true);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      reviewer_name: reviewerName.trim(),
      rating,
      comment: comment.trim(),
      admin_liked: false,
      is_hidden: false,
      admin_reply: null,
    });

    setSubmitting(false);

    if (error) {
      console.error('Add review error:', error);
      setNotice(`Could not submit your review: ${error.message}`);
      setNoticeError(true);
      return;
    }

    setReviewerName('');
    setRating(5);
    setComment('');
    setNotice('Your review was submitted successfully.');
    setNoticeError(false);

    await fetchReviews(false);
  };

  return (
    <section className='relative overflow-hidden rounded-3xl border border-slate-800/90 bg-[#080d16] p-5 shadow-2xl sm:p-7'>
      <div className='pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-red-600/10 blur-[100px]' />
      <div className='pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]' />

      <div className='relative z-10'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5'>
          <div className='flex items-center gap-3'>
            <div className='flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-gradient-to-br from-red-500/20 via-amber-500/10 to-blue-500/20 text-amber-300'>
              <Star size={22} className='fill-amber-300' />
            </div>

            <div>
              <h2 className='text-base font-black tracking-tight text-white sm:text-lg'>
                Customer Reviews & Ratings
              </h2>
              <p className='mt-1 text-sm font-medium text-slate-300'>
                آراء حقيقية من عملائنا
              </p>
            </div>
          </div>

          <div className='rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300'>
            {reviews.length} {reviews.length === 1 ? 'REVIEW' : 'REVIEWS'}
          </div>
        </div>

        {notice && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              noticeError
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {notice}
          </div>
        )}

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_.85fr] lg:gap-8'>
          {/* Reviews List */}
          <div className='min-w-0 space-y-3'>
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='text-sm font-black uppercase tracking-[.12em] text-slate-200'>
                What customers say
              </h3>
              <span className='text-xs text-slate-400'>Newest first</span>
            </div>

            {loading ? (
              <div className='flex min-h-40 items-center justify-center gap-2 text-sm text-slate-400'>
                <Loader2 size={18} className='animate-spin text-blue-400' />
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className='flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-5 text-center'>
                <MessageCircle size={25} className='mb-3 text-slate-500' />
                <p className='text-sm font-bold text-slate-200'>
                  No reviews yet
                </p>
                <p className='mt-1 text-xs text-slate-400'>
                  Be the first to share your experience.
                </p>
              </div>
            ) : (
              <div className='max-h-[420px] space-y-3 overflow-y-auto pr-1 [scrollbar-color:#334155_transparent] [scrollbar-width:thin]'>
                {reviews.map((rev) => (
                  <article
                    key={rev.id}
                    className='group rounded-2xl border border-slate-800 bg-gradient-to-br from-[#111b2b] to-[#0b111d] p-4 transition hover:border-slate-700'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-black text-slate-100'>
                          {rev.reviewer_name}
                        </p>

                        <div className='mt-1.5 flex items-center gap-0.5 text-amber-400'>
                          {Array.from({
                            length: Math.max(
                              0,
                              Math.min(5, Number(rev.rating) || 0),
                            ),
                          }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              className='fill-amber-400'
                            />
                          ))}

                          <span className='ml-1 text-xs font-bold text-amber-300'>
                            {rev.rating}/5
                          </span>
                        </div>
                      </div>

                      {rev.admin_liked && (
                        <span className='inline-flex shrink-0 items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-300'>
                          <Heart
                            size={12}
                            className='fill-red-400 text-red-400'
                          />
                          Liked by store
                        </span>
                      )}
                    </div>

                    <p className='mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300'>
                      {rev.comment}
                    </p>

                    <div className='mt-3 border-t border-slate-800/80 pt-2 text-xs text-slate-400'>
                      {new Date(rev.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>

                    {rev.admin_reply?.trim() && (
                      <div className='mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[.06] p-3'>
                        <div className='mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-300'>
                          <ShieldCheck size={14} />
                          Store response
                        </div>

                        <p className='whitespace-pre-wrap break-words text-sm leading-6 text-slate-300'>
                          {rev.admin_reply}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Add Review Form */}
          <form
            onSubmit={handleAddReview}
            className='h-fit rounded-2xl border border-slate-800 bg-gradient-to-br from-[#121c2c] to-[#0b111d] p-4 shadow-xl sm:p-5'
          >
            <div className='mb-5 flex items-center gap-2'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600/20 to-blue-600/20 text-emerald-300'>
                <MessageCircle size={18} />
              </div>

              <div>
                <h3 className='text-base font-black text-white'>
                  Write a Review
                </h3>
                <p className='text-xs text-slate-400'>
                  Tell others what you think
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='mb-2 block text-sm font-bold text-slate-300'>
                  Your name <span className='text-red-400'>*</span>
                </label>

                <input
                  type='text'
                  required
                  maxLength={80}
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className='w-full rounded-xl border border-slate-700 bg-[#080e18] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10'
                  placeholder='مثال: أحمد محمد'
                />
              </div>

              <div>
                <label className='mb-2 block text-sm font-bold text-slate-300'>
                  Your rating <span className='text-red-400'>*</span>
                </label>

                <div className='relative w-full'>
                  {/* زر الفتح الصغير */}
                  <button
                    type='button'
                    onClick={() => setIsRatingOpen((prev) => !prev)}
                    className='flex w-full items-center justify-between gap-2 rounded-xl border border-blue-500/30 bg-gradient-to-l from-slate-900/95 via-[#0b1324] to-slate-900/95 px-3 py-2 text-xs shadow-sm transition hover:border-blue-400/50 focus:outline-none'
                  >
                    <div className='flex items-center gap-2'>
                      {renderStars(selectedRating.value)}
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${selectedRating.badge}`}
                      >
                        {selectedRating.label}
                      </span>
                    </div>

                    <svg
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                        isRatingOpen ? 'rotate-180 text-blue-300' : ''
                      }`}
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>

                  {/* القائمة المنسدلة */}
                  {isRatingOpen && (
                    <>
                      <div
                        className='fixed inset-0 z-10'
                        onClick={() => setIsRatingOpen(false)}
                      />

                      <div className='absolute right-0 left-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-slate-700/80 bg-[#0b1220]/95 p-1 shadow-xl backdrop-blur-md'>
                        {ratingOptions.map((option) => {
                          const isSelected = option.value === rating;
                          return (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => {
                                setRating(option.value);
                                setIsRatingOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                                isSelected
                                  ? 'bg-gradient-to-l from-blue-600/20 via-emerald-500/15 to-rose-500/20 text-white'
                                  : 'text-slate-300 hover:bg-slate-800/70'
                              }`}
                            >
                              {renderStars(option.value)}
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${option.badge}`}
                              >
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className='mb-2 block text-sm font-bold text-slate-300'>
                  Your comment <span className='text-red-400'>*</span>
                </label>

                <textarea
                  required
                  rows={5}
                  maxLength={1500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className='w-full resize-y rounded-xl border border-slate-700 bg-[#080e18] px-3.5 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/10'
                  placeholder='...شاركنا تجربتك مع هذا المنتج'
                />

                <p className='mt-1 text-right text-xs text-slate-400'>
                  {comment.length}/1500
                </p>
              </div>

              <button
                type='submit'
                disabled={submitting}
                className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-emerald-600 to-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50'
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className='animate-spin' />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
