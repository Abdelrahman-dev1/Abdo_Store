'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // يبدأ يختفي بنعومة بعد ثانيتين
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    // يتشال تماماً من الشاشة بعد 2.6 ثانية
    const hideTimer = setTimeout(() => setVisible(false), 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#07090e] flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-out ${
        fadeOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* إضاءات نيون في الخلفية */}
      <div className='absolute w-72 h-72 bg-blue-600/20 rounded-full blur-[120px] animate-pulse' />
      <div className='absolute w-72 h-72 bg-red-600/20 rounded-full blur-[120px] animate-pulse delay-700' />

      {/* اللوجو مع أنيميشن */}
      <div className='relative mb-6 group'>
        <div className='absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 opacity-75 blur-md animate-spin-slow' />
        <div className='relative w-24 h-24 rounded-3xl bg-[#0e1626] border border-slate-700/80 flex items-center justify-center shadow-2xl'>
          {/* تقدر تستبدل الأيقونة دي بـ <img src="/logo.png" className="w-16 h-16 object-contain" /> */}
          <ShoppingBag className='w-11 h-11 text-white animate-bounce' />
        </div>
      </div>

      {/* الاسم الرئيسي بتدرج نيون */}
      <h1 className='text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-red-400 via-purple-300 to-blue-400 bg-clip-text text-transparent animate-fade-in-up'>
        ABDO STORE
      </h1>

      {/* الجملة الفرعية - اكتب أي حاجة هنا */}
      <p className='mt-2 text-xs sm:text-sm text-slate-400 font-semibold tracking-widest uppercase flex items-center gap-1.5'>
        <Sparkles size={14} className='text-amber-400 animate-pulse' />
        <span>Next-Gen Shopping Experience</span>
      </p>

      {/* شريط تحميل متحرك في الأسفل */}
      <div className='mt-8 w-44 h-1.5 bg-slate-800/90 rounded-full overflow-hidden p-[1px]'>
        <div className='h-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-full animate-[loadingBar_2s_ease-in-out_forwards]' />
      </div>

      <style jsx>{`
        @keyframes loadingBar {
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
