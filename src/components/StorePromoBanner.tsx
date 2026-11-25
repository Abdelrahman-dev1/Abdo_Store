'use client';

import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Gift,
  Zap,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getConditionLabel,
  getRewardLabel,
  PromoRule,
} from '@/lib/promoEngine';

export default function StorePromoBanner() {
  const [rules, setRules] = useState<PromoRule[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('promo_rules')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('priority', { ascending: true });

      if (!active) return;
      setRules((data ?? []) as PromoRule[]);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const countLabel = `(${rules.length})`;
  const rewardWord =
    rules.length === 1 ? 'مكافأة استثنائية لك ⚡' : 'مكافآت استثنائية لك ⚡';

  return (
    <div className='mx-auto w-full max-w-4xl px-3 sm:px-5 pt-10 sm:pt-14'>
      {/* البانر الرئيسي - محاط بتأثير نبض خفيف وجذاب لخطف العين ودفعه للضغط */}
      <div className='group relative overflow-hidden rounded-2xl border border-cyan-400/35 bg-gradient-to-r from-[#1c2333] via-[#232b42] to-[#1d2638] shadow-lg shadow-cyan-950/30 transition-all duration-300 hover:border-cyan-400/70 hover:shadow-cyan-500/10'>
        {/* شريط علوي ملون نابض */}
        <div className='absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-500 via-violet-500 via-cyan-400 to-emerald-400 opacity-95 animate-pulse' />

        {/* شريط العنوان المضغوط والتحفيزي */}
        <button
          type='button'
          onClick={() => setOpen((prev) => !prev)}
          className='flex w-full items-center justify-between gap-2.5 px-3.5 py-3 sm:px-4 sm:py-3.5 text-right transition-colors duration-200 hover:bg-white/[0.03] cursor-pointer'
        >
          <div className='flex items-center gap-2 sm:gap-3 min-w-0 flex-1'>
            {/* صندوق الهدية الذي يتنطنط بحيوية (bounce) مع توهج محفز */}
            <div className='relative flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/25 via-violet-500/25 to-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-md group-hover:scale-110 transition-transform duration-300'>
              <Gift
                size={15}
                className='sm:w-4 sm:h-4 animate-bounce duration-1000'
              />
              {/* نقطة تنبيه نبضية تحفيزية */}
              <span className='absolute -top-1 -right-1 flex h-2 w-2 sm:h-2.5 sm:w-2.5'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80' />
                <span className='relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-500' />
              </span>
            </div>

            {/* العنوان التحفيزي: جملة الموبايل كما هي + جملة أطول للشاشات الكبيرة + الرقم في البداية */}
            <div
              dir='rtl'
              className='flex items-center gap-1.5 sm:gap-2 min-w-0'
            >
              <span className='whitespace-nowrap text-[11px] sm:text-[13px] font-extrabold text-slate-100 tracking-tight sm:tracking-wide inline-flex items-center gap-1'>
                {!loaded ? (
                  <>
                    <span className='sm:hidden'>🔥 مفاجآت ومكافآت متجرك</span>
                    <span className='hidden sm:inline'>
                      🔥 مفاجآت ومكافآت متجرك الحصرية في انتظارك الآن
                    </span>
                  </>
                ) : rules.length > 0 ? (
                  <>
                    <bdi dir='ltr' className='text-cyan-300'>
                      {countLabel}
                    </bdi>
                    <span className='sm:hidden'>{rewardWord}</span>
                    <span className='hidden sm:inline'>
                      {rules.length === 1
                        ? 'مكافأة استثنائية بانتظارك لتفعيلها في طلبك ⚡'
                        : 'مكافآت استثنائية بانتظارك لتفعيلها في طلبك ⚡'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className='sm:hidden'>
                      💎 العروض والهدايا الحصرية
                    </span>
                    <span className='hidden sm:inline'>
                      💎 اكتشف أقوى العروض والهدايا الحصرية داخل المتجر
                    </span>
                  </>
                )}
              </span>
            </div>

            {/* شارة تفاعلية متحركة خفيفة في نفس السطر */}
            {rules.length > 0 && (
              <span className='inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/15 border border-emerald-400/35 px-1.5 sm:px-2.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-emerald-300 animate-pulse'>
                <Flame
                  size={10}
                  className='sm:w-[11px] sm:h-[11px] text-rose-400'
                />
                جاهزة للتفعيل
              </span>
            )}
          </div>

          {/* زر الفتح مع سهم متحرك يحفز على الضغط */}
          <div className='inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 px-2.5 py-1 text-xs font-extrabold text-cyan-200 transition-all duration-300 group-hover:bg-cyan-500/30 group-hover:text-white shadow-sm'>
            <span>{open ? 'إخفاء' : 'اكتشف '}</span>
            {open ? (
              <ChevronUp size={14} className='text-rose-300' />
            ) : (
              <ChevronDown size={14} className='text-cyan-300 animate-bounce' />
            )}
          </div>
        </button>

        {/* تفاصيل العروض عند الفتح (مدمجة ومريحة للموبايل) */}
        {open && (
          <div className='border-t border-slate-700/60 bg-[#161c2b]/95 px-3.5 py-3 sm:px-4 sm:py-3.5 animate-fadeIn'>
            {rules.length === 0 ? (
              <div className='flex items-center justify-center gap-2 py-3 text-center'>
                <Zap size={14} className='text-cyan-400 animate-pulse' />
                <p className='text-xs font-semibold text-slate-300'>
                  ترقبنا.. باقة عروض مذهلة ستتوفر قريباً جداً 💝
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
                {rules.map((rule, idx) => {
                  const accentStyles = [
                    {
                      bar: 'bg-cyan-400',
                      badge: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-200',
                      icon: 'text-cyan-400',
                    },
                    {
                      bar: 'bg-emerald-400',
                      badge:
                        'bg-emerald-500/15 border-emerald-400/35 text-emerald-200',
                      icon: 'text-emerald-400',
                    },
                    {
                      bar: 'bg-rose-400',
                      badge: 'bg-rose-500/15 border-rose-400/35 text-rose-200',
                      icon: 'text-rose-400',
                    },
                  ][idx % 3];

                  return (
                    <div
                      key={rule.id}
                      className='relative overflow-hidden rounded-xl border border-slate-700/70 bg-[#1e2638] p-2.5 transition-all duration-300 hover:border-cyan-400/50 hover:bg-[#232f46]'
                    >
                      <div
                        className={`absolute inset-y-0 right-0 w-[3px] ${accentStyles.bar}`}
                      />

                      <div className='flex items-center justify-between gap-2 pr-1'>
                        <p className='truncate text-xs font-black text-slate-100'>
                          {rule.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold ${accentStyles.badge}`}
                        >
                          {getRewardLabel(rule)}
                        </span>
                      </div>

                      <div className='mt-1.5 flex items-center gap-1.5 pr-1 text-[11px] font-medium text-slate-200'>
                        <CheckCircle2
                          size={12}
                          className={`shrink-0 ${accentStyles.icon}`}
                        />
                        <span className='truncate'>
                          {getConditionLabel(rule)}
                        </span>
                      </div>

                      {rule.description && (
                        <p className='mt-1.5 pr-1 text-[11px] leading-snug text-slate-300/85 line-clamp-2 border-t border-slate-700/40 pt-1.5'>
                          {rule.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
