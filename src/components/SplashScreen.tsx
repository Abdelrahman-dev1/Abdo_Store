'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Compass } from 'lucide-react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const openTimer = window.setTimeout(() => setGateOpen(true), 1200);
    const leaveTimer = window.setTimeout(() => setLeaving(true), 1500);
    const hideTimer = window.setTimeout(() => setVisible(false), 1850);

    // أمان إضافي لضمان عدم بقاء الشاشة في أي ظرف
    const safetyTimer = window.setTimeout(() => setVisible(false), 3200);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#07090e] flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-350 ease-out ${
        leaving
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* إضاءات Ambient Shadow خفيفة بنفس روح الصورة + لمسة زمردي */}
      <div className='pointer-events-none absolute -top-20 -left-20 w-64 h-64 bg-rose-600/20 rounded-full blur-[90px]' />
      <div className='pointer-events-none absolute top-1/3 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[90px]' />
      <div className='pointer-events-none absolute -bottom-20 left-1/3 w-64 h-64 bg-purple-600/20 rounded-full blur-[90px]' />
      <div className='pointer-events-none absolute bottom-8 right-1/4 w-52 h-52 bg-emerald-500/15 rounded-full blur-[80px]' />

      {/* المحتوى الرئيسي */}
      <div className='relative z-10 w-full max-w-sm px-6 flex flex-col items-center'>
        {/* بوابة الضوء السريعة مع أيقونة المتجر */}
        <div className='relative mb-6 flex items-center justify-center'>
          {/* هالة الإضاءة الخلفية */}
          <div
            className={`absolute -inset-2 rounded-3xl blur-xl transition-all duration-350 ${
              gateOpen
                ? 'bg-gradient-to-tr from-rose-500/60 via-emerald-400/55 to-blue-500/65 scale-125 opacity-100'
                : 'bg-gradient-to-tr from-rose-500/35 via-purple-500/35 to-blue-500/35 opacity-85'
            }`}
          />

          {/* إطار البوابة */}
          <div className='relative w-20 h-20 rounded-3xl bg-[#0e1626] border border-slate-700/80 shadow-2xl overflow-hidden flex items-center justify-center'>
            {/* نور يفتح للداخل لحظة وصول التحميل */}
            <div
              className={`absolute inset-0 transition-opacity duration-250 ${
                gateOpen ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background:
                  'radial-gradient(circle, rgba(52,211,153,0.45) 0%, rgba(96,165,250,0.35) 55%, rgba(168,85,247,0.25) 100%)',
              }}
            />

            {/* ضلفتا البوابة الخفيفتان */}
            <div
              className={`absolute inset-y-0 left-0 w-1/2 bg-[#0b1120] border-r border-purple-400/30 transition-transform duration-300 ease-out ${
                gateOpen ? '-translate-x-full' : 'translate-x-0'
              }`}
            />
            <div
              className={`absolute inset-y-0 right-0 w-1/2 bg-[#0b1120] border-l border-blue-400/30 transition-transform duration-300 ease-out ${
                gateOpen ? 'translate-x-full' : 'translate-x-0'
              }`}
            />

            {/* الأيقونة الرئيسية */}
            <ShoppingBag
              className={`relative z-10 w-9 h-9 text-white transition-transform duration-250 ${
                gateOpen ? 'scale-110 text-emerald-300' : 'scale-100'
              }`}
            />
          </div>
        </div>

        {/* اسم المتجر بنفس التدرج والشادو القريب من الصورة */}
        <h1
          className='text-4xl sm:text-5xl font-black tracking-wide text-center bg-clip-text text-transparent'
          style={{
            backgroundImage:
              'linear-gradient(90deg, #ff6b7a 0%, #e598d8 35%, #a78bfa 68%, #60a5fa 100%)',
            filter:
              'drop-shadow(0 0 18px rgba(244, 63, 94, 0.35)) drop-shadow(0 0 24px rgba(59, 130, 246, 0.35))',
          }}
        >
          Abdo Store
        </h1>

        {/* جملة الوصف المطلوبة */}
        <p
          dir='rtl'
          className='mt-2.5 text-sm sm:text-base font-bold text-slate-200/95 flex items-center justify-center gap-2 text-center'
        >
          <Compass className='w-4 h-4 text-emerald-400 shrink-0' />
          <span>راحتك في الاختيار تبدأ من هنا</span>
        </p>

        {/* شريط التحميل السريع والخفيف بـ CSS فقط */}
        <div className='mt-7 w-48 h-2 bg-[#0e1626] border border-slate-800/90 rounded-full overflow-hidden p-[1px]'>
          <div
            className='h-full rounded-full'
            style={{
              background:
                'linear-gradient(90deg, #f43f5e 0%, #c084fc 35%, #38bdf8 70%, #10b981 100%)',
              animation:
                'fastSplashBar 1.25s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes fastSplashBar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
