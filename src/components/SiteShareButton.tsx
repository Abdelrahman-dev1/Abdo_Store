'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Share2 } from 'lucide-react';

const SITE_URL = 'https://abdo-store-kappa.vercel.app';
const SHARE_TITLE = '⚡ Abdo Store';
const SHARE_TEXT =
  '🔥 تسوّق أفضل المنتجات بأعلى جودة وأفضل الأسعار من Abdo Store — شحن سريع وتجربة تسوّق مميزة:';

interface SiteShareButtonProps {
  className?: string;
}

export default function SiteShareButton({
  className = '',
}: SiteShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerCopiedFeedback = () => {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2200);
  };

  const handleShareSite = async () => {
    const targetUrl =
      typeof window !== 'undefined' && window.location?.href
        ? window.location.href
        : SITE_URL;

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: targetUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
        console.error('Error sharing site:', err);
      }
    }

    // Fallback لو المتصفح مش بيدعم Web Share API: نسخ النص والرابط
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${SHARE_TEXT}\n${targetUrl}`);
        triggerCopiedFeedback();
      }
    } catch (err) {
      console.error('Error copying link:', err);
    }
  };

  return (
    <button
      type='button'
      onClick={handleShareSite}
      aria-label={copied ? 'Store link copied' : 'Share store link'}
      title={copied ? 'Store link copied' : 'Share store link'}
      className={`group relative overflow-hidden inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer shrink-0 select-none active:scale-95 hover:-translate-y-0.5 ${
        copied
          ? 'bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-[#090f19] border-emerald-400/60 text-emerald-300 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-400/25'
          : 'bg-gradient-to-br from-rose-500/15 via-[#131d33]/95 to-[#090f19] hover:from-rose-500/25 hover:via-sky-500/15 hover:to-[#0e1626] border-slate-700/80 hover:border-sky-400/60 text-slate-200 hover:text-white shadow-lg shadow-black/40 hover:shadow-sky-950/40'
      } ${className}`}
    >
      {/* لمعة خفيفة بتتحرك عند الـ hover */}
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent'
      />

      {/* توهج خلفي ناعم */}
      <span
        aria-hidden='true'
        className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          copied
            ? 'bg-emerald-500/10'
            : 'bg-gradient-to-tr from-rose-500/10 via-transparent to-sky-500/15'
        }`}
      />

      <span className='relative z-10 flex items-center justify-center'>
        {copied ? (
          <Check
            size={20}
            strokeWidth={2.5}
            className='text-emerald-300 scale-100 transition-transform duration-200'
          />
        ) : (
          <Share2
            size={19}
            strokeWidth={2.1}
            className='rotate-180 text-sky-300 group-hover:text-rose-300 group-hover:scale-105 transition-all duration-300'
          />
        )}
      </span>
    </button>
  );
}
