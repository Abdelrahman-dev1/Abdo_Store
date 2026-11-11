'use client';

import React, { useState } from 'react';

// تحديد أنواع البيانات (TypeScript Props)
interface ShareButtonProps {
  productId: string | number;
  productName: string;
  // دالة اختيارية في حال أردت تنفيذ لوجيك إضافي عند الضغط (مثل الفلاش ديلز)
  onShare?: () => void;
  className?: string; // لتمكين تمرير classes إضافية من الخارج إن أردت
}

export default function ShareButton({
  productId,
  productName,
  onShare,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // 1. منع الكارد الأساسي من فتح تفاصيل المنتج أو حدوث أي تداخل
    e.preventDefault();
    e.stopPropagation();

    // تشغيل أي دالة خارجية ممررة لو وجدت
    if (onShare) {
      onShare();
    }

    // بناء رابط المنتج الحقيقي
    const productUrl = `${window.location.origin}/product/${productId}`;

    // 2. محاولة استخدام واجهة المشاركة الأصلية (للهواتف والأجهزة الداعمة)
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName || 'Abdo Store Product',
          text: `🔥 شاهد هذا المنتج الرائع: ${productName}`,
          url: productUrl,
        });
        return;
      } catch (err) {
        // لو المستخدم ألغى المشاركة أو حدث خطأ، نتجاهله أو نطبعه بالكونسول
        if ((err as Error).name !== 'AbortError') {
          console.log('Error sharing:', err);
        }
      }
    }

    // 3. النسخ الاحتياطي للحافظة لو المتصفح لا يدعم الـ Share API أو على سطح المكتب
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // ترجع الحالة الطبيعية بعد ثانيتين
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      type='button'
      onClick={handleShare}
      title='مشاركة المنتج'
      className={`relative z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600/20 via-blue-600/20 to-blue-600/30 hover:from-red-600/40 hover:to-blue-600/40 border border-red-500/30 hover:border-blue-400 text-white text-xs font-extrabold shadow-md transition-all duration-300 cursor-pointer active:scale-95 group ${className}`}
    >
      {/* أيقونة المشاركة مع أنيميشن دوران خفيف عند الـ Hover */}
      <svg
        className='w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3.6 3.6 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3.6 3.6 0 00-5.368-2.684z'
        />
      </svg>

      {/* النص المتغير بناءً على حالة النسخ أو المشاركة */}
      <span className='tracking-wide'>
        {copied ? 'Copied Link! 📋' : 'Share'}
      </span>
    </button>
  );
}
