'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Tag, Flame, Headphones, Sparkles } from 'lucide-react';

// استخدم عميل Supabase الموجود في مشروعك لو عندك ملف جاهز مثل:
import { supabase } from '@/lib/supabase';


export type AccentColor = 'red' | 'blue' | 'green' | 'purple';

export interface BenefitItem {
  id: string;
  title: string;
  emoji: string;
  accent_color: AccentColor;
  sort_order: number;
  is_visible: boolean;
}

interface BenefitsBarSettings {
  id: string;
  is_enabled: boolean;
  slider_duration_sec: number;
}

const COLOR_STYLES: Record<
  AccentColor,
  {
    badgeBg: string;
    border: string;
    text: string;
    glow: string;
    dot: string;
  }
> = {
  red: {
    badgeBg: 'bg-rose-500/20 border-rose-400/40',
    border: 'border-rose-400/35 hover:border-rose-400/60',
    text: 'text-rose-200',
    glow: 'from-rose-500/25 via-rose-500/10 to-transparent',
    dot: 'bg-rose-400',
  },
  purple: {
    badgeBg: 'bg-purple-500/20 border-purple-400/40',
    border: 'border-purple-400/35 hover:border-purple-400/60',
    text: 'text-purple-200',
    glow: 'from-purple-500/25 via-purple-500/10 to-transparent',
    dot: 'bg-purple-400',
  },
  green: {
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40',
    border: 'border-emerald-400/35 hover:border-emerald-400/60',
    text: 'text-emerald-200',
    glow: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
    dot: 'bg-emerald-400',
  },
  blue: {
    badgeBg: 'bg-sky-500/20 border-sky-400/40',
    border: 'border-sky-400/35 hover:border-sky-400/60',
    text: 'text-sky-200',
    glow: 'from-sky-500/25 via-sky-500/10 to-transparent',
    dot: 'bg-sky-400',
  },
};

function FallbackIcon({ color }: { color: AccentColor }) {
  switch (color) {
    case 'red':
      return <Tag className='w-3.5 h-3.5 text-rose-300' />;
    case 'purple':
      return <Flame className='w-3.5 h-3.5 text-purple-300' />;
    case 'green':
      return <ShieldCheck className='w-3.5 h-3.5 text-emerald-300' />;
    case 'blue':
      return <Headphones className='w-3.5 h-3.5 text-sky-300' />;
    default:
      return <Sparkles className='w-3.5 h-3.5 text-slate-300' />;
  }
}

export default function BenefitsBar() {
  const [settings, setSettings] = useState<BenefitsBarSettings | null>(null);
  const [items, setItems] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBenefitsData = async () => {
    const [settingsRes, itemsRes] = await Promise.all([
      supabase
        .from('benefits_bar_settings')
        .select('id, is_enabled, slider_duration_sec')
        .eq('id', 'default')
        .maybeSingle(),
      supabase
        .from('benefits_bar_items')
        .select('id, title, emoji, accent_color, sort_order, is_visible')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (settingsRes.data) {
      setSettings(settingsRes.data);
    } else {
      setSettings({ id: 'default', is_enabled: true, slider_duration_sec: 28 });
    }

    if (itemsRes.data) {
      setItems(itemsRes.data as BenefitItem[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchBenefitsData();

    const channel = supabase
      .channel('benefits_bar_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'benefits_bar_settings' },
        () => fetchBenefitsData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'benefits_bar_items' },
        () => fetchBenefitsData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // تكرار العناصر لضمان حركة دائرية مستمرة بلا فراغات على كل الشاشات
  const trackItems = useMemo(() => {
    if (items.length === 0) return [];
    return [...items, ...items, ...items];
  }, [items]);

  if (loading) return null;
  if (!settings?.is_enabled || items.length === 0) return null;

  const duration = settings.slider_duration_sec || 28;

  return (
    <section
      dir='rtl'
      aria-label='مميزات المتجر'
      className='relative w-full overflow-hidden border-y border-white/10 bg-gradient-to-r from-rose-950/55 via-purple-950/55 via-45% to-sky-950/55 backdrop-blur-md py-2.5 sm:py-3 select-none'
    >
      {/* طبقة إضاءة لونية متدرجة ناعمة في الخلفية */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(244,63,94,0.16)_0%,rgba(168,85,247,0.16)_33%,rgba(16,185,129,0.16)_66%,rgba(56,189,248,0.16)_100%)]'
      />

      {/* تلاشي ناعم على الأطراف */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-16 bg-gradient-to-l from-[#07090e] to-transparent'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-16 bg-gradient-to-r from-[#07090e] to-transparent'
      />

      {/* حاوية السلايدر */}
      <div className='group relative flex overflow-hidden'>
        <div
          style={{ animationDuration: `${duration}s` }}
          className='benefits-marquee flex w-max items-center gap-3 sm:gap-5 px-2 group-hover:[animation-play-state:paused]'
        >
          {trackItems.map((item, idx) => {
            const style = COLOR_STYLES[item.accent_color] || COLOR_STYLES.blue;
            return (
              <div
                key={`${item.id}-${idx}`}
                className={`relative flex items-center gap-2 sm:gap-2.5 rounded-full border ${style.border} bg-[#0b111e]/80 px-3.5 py-1.5 sm:px-4 sm:py-1.5 shadow-sm transition-transform duration-200 hover:scale-[1.02]`}
              >
                <span
                  aria-hidden='true'
                  className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r ${style.glow} opacity-75`}
                />

                <span
                  className={`relative flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border ${style.badgeBg} text-sm sm:text-base`}
                >
                  {item.emoji?.trim() ? (
                    <span>{item.emoji}</span>
                  ) : (
                    <FallbackIcon color={item.accent_color} />
                  )}
                </span>

                <span className='relative whitespace-nowrap text-xs sm:text-sm font-semibold tracking-wide text-slate-100'>
                  {item.title}
                </span>

                <span
                  aria-hidden='true'
                  className={`relative mr-1 h-1.5 w-1.5 rounded-full ${style.dot} opacity-80`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .benefits-marquee {
          animation-name: benefitsScrollRtl;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        @keyframes benefitsScrollRtl {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(33.3333%, 0, 0);
          }
        }
      `}</style>
    </section>
  );
}
