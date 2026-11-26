'use client';

import React, { useState } from 'react';

interface ShareButtonProps {
  productSlug: string | number; // تم استخدام الـ slug بدلاً من الـ id لجعل الرابط احترافي
  productName: string;
  productPrice?: number | string;
  compareAtPrice?: number | string; // السعر القديم لحساب الخصم
  onShare?: () => void;
  className?: string;
}

export default function ShareButton({
  productSlug,
  productName,
  productPrice,
  compareAtPrice,
  onShare,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onShare) {
      onShare();
    }

    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://abdo-store-kappa.vercel.app';

    const cleanSlug = encodeURIComponent(String(productSlug ?? '').trim());
    // بناء رابط المنتج باستخدام الـ slug
    const productUrl = `${origin}/products/${cleanSlug}`;

    // حساب الخصم لو السعر القديم أكبر من الحالي
    const current = Number(productPrice) || 0;
    const old = Number(compareAtPrice) || 0;
    const hasDiscount = old > current && current > 0;

    let discountText = '';
    if (hasDiscount) {
      const saving = old - current;
      const discountPercent = Math.round((saving / old) * 100);
      discountText = `💥 خصم نار ${discountPercent}%!\n💰 السعر الحالي: ${current} EGP (بدلاً من ${old} EGP)\n💸 وفرت: ${saving} EGP!\n`;
    } else if (current > 0) {
      discountText = `💰 السعر: ${current} EGP\n`;
    }

    // 🎛️ [مكان التحكم الكامل في نص رسالة الشير]
    const shareTitle = `⚡ ${productName} | Abdo Store`;
    const shareText = `⏳  المنتج لفترة محدودة جداً: ${productName}\n${discountText}🚨 متوفر الآن في Abdo Store`;

    // 1. استخدام واجهة المشاركة الأصلية (للهواتف)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: productUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.log('Error sharing:', err);
        }
      }
    }

    // 2. النسخ الاحتياطي للحافظة (للكمبيوتر أو المتصفحات الأخرى)
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        const fullClipboardMessage = `${shareText}\n${productUrl}`;
        await navigator.clipboard.writeText(fullClipboardMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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
      <span className='tracking-wide'>
        {copied ? 'Copied Link! 📋' : 'Share'}
      </span>
    </button>
  );
}

// 🔑 كلمات مفتاحية للبحث للتعديل: [ShareButtonProps, productUrl, shareText, discountText]
