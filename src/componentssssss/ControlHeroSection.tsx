'use client';

import React from 'react';
import { Settings } from 'lucide-react';

interface HeroAdminTriggerProps {
  onClick: () => void;
  className?: string;
}

export default function HeroAdminTrigger({
  onClick,
  className = '',
}: HeroAdminTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:border-rose-500/80 text-xs font-bold backdrop-blur-md transition-all duration-300 shadow-xl group ${className}`}
      title='إدارة وتحكم في سكشن الهيرو والسليدر'
    >
      <Settings
        size={16}
        className='text-rose-400 group-hover:rotate-90 transition-transform duration-500'
      />
      <span>التحكم في الهيرو سكشن</span>
    </button>
  );
}
