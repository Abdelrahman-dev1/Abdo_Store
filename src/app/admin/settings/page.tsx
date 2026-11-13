'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  ArrowLeft,
  LogOut,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  Megaphone,
  Search,
  Heart,
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  X,
  Star,
  RefreshCw,
  Package,
  Smartphone,
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

type OrderFieldKey =
  | 'order_number'
  | 'order_date'
  | 'customer_name'
  | 'customer_phone'
  | 'customer_email'
  | 'customer_address'
  | 'city'
  | 'governorate'
  | 'postal_code'
  | 'customer_notes'
  | 'items'
  | 'subtotal'
  | 'discount_code'
  | 'discount_amount'
  | 'shipping_cost'
  | 'tax_amount'
  | 'payment_method'
  | 'payment_status'
  | 'delivery_method'
  | 'total_amount'
  | 'whatsapp_contact_link';

type ChannelConfig = {
  enabled: boolean;
  heading: string;
  footer: string;
  fields: Record<OrderFieldKey, boolean>;
};

type AnnouncementConfig = {
  enabled: boolean;
  text: string;
  startEmoji: string;
  endEmoji: string;
};

type SaveSection = 'telegram' | 'whatsapp' | 'announcement';

type SettingsUpdate = {
  telegram_enabled?: boolean;
  telegram_config?: {
    heading: string;
    footer: string;
    fields: Record<OrderFieldKey, boolean>;
  };
  whatsapp_enabled?: boolean;
  whatsapp_config?: {
    heading: string;
    footer: string;
    fields: Record<OrderFieldKey, boolean>;
  };
  announcement_enabled?: boolean;
  announcement_text?: string;
  announcement_emoji_start?: string;
  announcement_emoji_end?: string;
};
type ChannelName = 'telegram' | 'whatsapp';

const ORDER_FIELDS: {
  key: OrderFieldKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'order_number',
    label: 'Order number',
    description: 'Order ID or reference code',
  },
  {
    key: 'order_date',
    label: 'Order date',
    description: 'Date and time the order was created',
  },
  {
    key: 'customer_name',
    label: 'Customer name',
    description: 'Full name of the buyer',
  },
  {
    key: 'customer_phone',
    label: 'Phone number',
    description: 'Customer contact number',
  },
  {
    key: 'customer_email',
    label: 'Email address',
    description: 'Customer email, when available',
  },
  {
    key: 'customer_address',
    label: 'Street address',
    description: 'Street, building, apartment',
  },
  { key: 'city', label: 'City', description: 'Delivery city' },
  {
    key: 'governorate',
    label: 'Governorate / State',
    description: 'Region or governorate',
  },
  {
    key: 'postal_code',
    label: 'Postal code',
    description: 'ZIP or postal code',
  },
  {
    key: 'customer_notes',
    label: 'Customer notes',
    description: 'Special instructions from the buyer',
  },
  {
    key: 'items',
    label: 'Products and quantities',
    description: 'Product names, variants, quantity and line totals',
  },
  {
    key: 'subtotal',
    label: 'Subtotal',
    description: 'Products total before extra charges',
  },
  {
    key: 'discount_code',
    label: 'Discount / coupon code',
    description: 'Applied promo code',
  },
  {
    key: 'discount_amount',
    label: 'Discount amount',
    description: 'Money deducted from the order',
  },
  { key: 'shipping_cost', label: 'Shipping cost', description: 'Delivery fee' },
  {
    key: 'tax_amount',
    label: 'Tax amount',
    description: 'Tax charged on the order',
  },
  {
    key: 'payment_method',
    label: 'Payment method',
    description: 'Cash, card, wallet, etc.',
  },
  {
    key: 'payment_status',
    label: 'Payment status',
    description: 'Pending, paid, failed, etc.',
  },
  {
    key: 'delivery_method',
    label: 'Delivery method',
    description: 'Courier or delivery option',
  },
  {
    key: 'total_amount',
    label: 'Grand total',
    description: 'Final amount due',
  },
  {
    key: 'whatsapp_contact_link',
    label: 'WhatsApp contact link',
    description: 'Clickable link to contact the customer (Telegram only)',
  },
];

const DEFAULT_TELEGRAM_CONFIG: ChannelConfig = {
  enabled: true,
  heading: '🛒 NEW STORE ORDER',
  footer: 'Please contact the customer to confirm the order.',
  fields: {
    order_number: true,
    order_date: true,
    customer_name: true,
    customer_phone: true,
    customer_email: false,
    customer_address: true,
    city: true,
    governorate: true,
    postal_code: false,
    customer_notes: true,
    items: true,
    subtotal: true,
    discount_code: true,
    discount_amount: true,
    shipping_cost: true,
    tax_amount: true,
    payment_method: true,
    payment_status: true,
    delivery_method: true,
    total_amount: true,
    whatsapp_contact_link: true,
  },
};

const DEFAULT_WHATSAPP_CONFIG: ChannelConfig = {
  enabled: true,
  heading: 'Hello! Thank you for your order.',
  footer:
    'Our team will contact you shortly to confirm the details. Thank you for choosing us!',
  fields: {
    order_number: true,
    order_date: false,
    customer_name: false,
    customer_phone: false,
    customer_email: false,
    customer_address: true,
    city: true,
    governorate: true,
    postal_code: false,
    customer_notes: false,
    items: true,
    subtotal: true,
    discount_code: true,
    discount_amount: true,
    shipping_cost: true,
    tax_amount: true,
    payment_method: true,
    payment_status: false,
    delivery_method: true,
    total_amount: true,
    whatsapp_contact_link: false,
  },
};

const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  enabled: true,
  text: 'FLASH SALE: Enjoy Up To 40% OFF On Selected Cyber Tech Items! Limited Time Only.',
  startEmoji: '💸',
  endEmoji: '🔥',
};

const inputClass =
  'w-full min-w-0 rounded-xl border border-slate-700/80 bg-[#080e18] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const labelClass = 'mb-2 block text-sm font-bold tracking-wide text-slate-200';
const emptyReviewForm: ReviewForm = {
  reviewer_name: '',
  rating: 5,
  comment: '',
  admin_reply: '',
};

function normalizeChannelConfig(
  enabled: boolean | null | undefined,
  raw: unknown,
  defaults: ChannelConfig,
): ChannelConfig {
  const value =
    raw && typeof raw === 'object' ? (raw as Partial<ChannelConfig>) : {};
  return {
    enabled: enabled ?? defaults.enabled,
    heading:
      typeof value.heading === 'string' ? value.heading : defaults.heading,
    footer: typeof value.footer === 'string' ? value.footer : defaults.footer,
    fields: { ...defaults.fields, ...(value.fields || {}) },
  };
}

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
    <div className='flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#090f19] px-4 py-3.5'>
      <div className='min-w-0'>
        <p className='text-sm font-extrabold text-white'>{label}</p>
        <p className='mt-1 text-xs leading-5 text-slate-400'>{description}</p>
      </div>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-7 w-14 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-8' : 'left-1'}`}
        />
      </button>
    </div>
  );
}

function ChannelEditor({
  channel,
  title,
  subtitle,
  icon,
  config,
  saving,
  onChange,
  onSave,
}: {
  channel: ChannelName;
  title: string;
  subtitle: string;
  icon: ReactNode;
  config: ChannelConfig;
  saving: boolean;
  onChange: (patch: Partial<ChannelConfig>) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const visibleFields = ORDER_FIELDS.filter(
    (field) => channel === 'telegram' || field.key !== 'whatsapp_contact_link',
  );

  const setAllFields = (enabled: boolean) => {
    const fields = { ...config.fields };
    visibleFields.forEach((field) => {
      fields[field.key] = enabled;
    });
    onChange({ fields });
  };

  return (
    <form
      onSubmit={onSave}
      className='flex min-w-0 flex-col rounded-3xl border border-slate-800 bg-[#0d1522]/95 shadow-2xl'
    >
      <div
        className={`border-b border-slate-800 p-5 sm:p-6 ${channel === 'telegram' ? 'bg-gradient-to-r from-blue-500/[.14] to-slate-900/20' : 'bg-gradient-to-r from-emerald-500/[.14] to-slate-900/20'}`}
      >
        <div className='flex items-start gap-3'>
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${channel === 'telegram' ? 'border-blue-400/25 bg-blue-500/10 text-blue-300' : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'}`}
          >
            {icon}
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='text-lg font-black text-white sm:text-xl'>
              {title}
            </h3>
            <p className='mt-1 text-sm leading-6 text-slate-400'>{subtitle}</p>
          </div>
        </div>
      </div>

      <div className='flex-1 space-y-6 p-5 sm:p-6'>
        <Toggle
          checked={config.enabled}
          onChange={() => onChange({ enabled: !config.enabled })}
          label={`Enable ${title}`}
          description={
            channel === 'telegram'
              ? 'Send an order notification to your Telegram chat after checkout.'
              : 'Generate a WhatsApp message link with the selected order details.'
          }
        />

        <div>
          <label className={labelClass}>Message heading / opening</label>
          <textarea
            rows={3}
            maxLength={500}
            value={config.heading}
            onChange={(event) => onChange({ heading: event.target.value })}
            className={`${inputClass} resize-y`}
            placeholder='Write the first lines of the message...'
          />
          <p className='mt-2 text-xs leading-5 text-slate-500'>
            You can use: {'{{customer_name}}'}, {'{{order_number}}'},{' '}
            {'{{total_amount}}'}.
          </p>
        </div>

        <div>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
            <div>
              <h4 className='text-sm font-black text-white'>
                Choose order details
              </h4>
              <p className='mt-1 text-xs text-slate-400'>
                Only checked fields are added to this channel's message.
              </p>
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setAllFields(true)}
                className='rounded-lg border border-emerald-500/25 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10'
              >
                Select all
              </button>
              <button
                type='button'
                onClick={() => setAllFields(false)}
                className='rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800'
              >
                Clear
              </button>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {visibleFields.map((field) => (
              <label
                key={field.key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${config.fields[field.key] ? 'border-blue-500/30 bg-blue-500/[.07]' : 'border-slate-800 bg-[#090f19] hover:border-slate-700'}`}
              >
                <input
                  type='checkbox'
                  checked={Boolean(config.fields[field.key])}
                  onChange={(event) =>
                    onChange({
                      fields: {
                        ...config.fields,
                        [field.key]: event.target.checked,
                      },
                    })
                  }
                  className='mt-1 h-4 w-4 shrink-0 accent-emerald-500'
                />
                <span className='min-w-0'>
                  <span className='block text-sm font-bold text-slate-100'>
                    {field.label}
                  </span>
                  <span className='mt-0.5 block text-xs leading-5 text-slate-500'>
                    {field.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Message closing / footer</label>
          <textarea
            rows={3}
            maxLength={1000}
            value={config.footer}
            onChange={(event) => onChange({ footer: event.target.value })}
            className={`${inputClass} resize-y`}
            placeholder='Add a closing note or instructions...'
          />
        </div>

        <div className='rounded-xl border border-amber-500/20 bg-amber-500/[.06] p-3 text-xs leading-5 text-amber-200/90'>
          {channel === 'telegram'
            ? 'Telegram sends the order details directly to your configured bot chat. Keep your bot token in server environment variables only.'
            : 'WhatsApp creates a pre-filled wa.me link. It does not send automatically; someone must open the link and press Send.'}
        </div>
      </div>

      <div className='border-t border-slate-800 p-5 sm:px-6'>
        <button
          type='submit'
          disabled={saving}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${channel === 'telegram' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-950/30' : 'bg-gradient-to-r from-emerald-600 to-green-600 shadow-emerald-950/30'}`}
        >
          {saving ? (
            <Loader2 size={17} className='animate-spin' />
          ) : (
            <Save size={17} />
          )}
          {saving ? 'Saving...' : `Save ${title} Settings`}
        </button>
      </div>
    </form>
  );
}

export default function AdminSettingsPage() {
  const [settingsId, setSettingsId] = useState<string | number | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SaveSection | null>(null);
  const [telegramConfig, setTelegramConfig] = useState<ChannelConfig>(
    DEFAULT_TELEGRAM_CONFIG,
  );
  const [whatsappConfig, setWhatsappConfig] = useState<ChannelConfig>(
    DEFAULT_WHATSAPP_CONFIG,
  );
  const [announcement, setAnnouncement] =
    useState<AnnouncementConfig>(DEFAULT_ANNOUNCEMENT);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    const loadControlSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select(
          'id, telegram_enabled, telegram_config, whatsapp_enabled, whatsapp_config, announcement_enabled, announcement_text, announcement_emoji_start, announcement_emoji_end',
        )
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setFeedback({
          type: 'error',
          text: `Could not load settings: ${error.message}`,
        });
      } else if (data) {
        setSettingsId(data.id);
        setTelegramConfig(
          normalizeChannelConfig(
            data.telegram_enabled,
            data.telegram_config,
            DEFAULT_TELEGRAM_CONFIG,
          ),
        );
        setWhatsappConfig(
          normalizeChannelConfig(
            data.whatsapp_enabled,
            data.whatsapp_config,
            DEFAULT_WHATSAPP_CONFIG,
          ),
        );
        setAnnouncement({
          enabled: data.announcement_enabled ?? true,
          text: data.announcement_text || DEFAULT_ANNOUNCEMENT.text,
          startEmoji: data.announcement_emoji_start || '💸',
          endEmoji: data.announcement_emoji_end || '🔥',
        });
      } else {
        setFeedback({
          type: 'error',
          text: 'No settings row was found. Create the settings row in Supabase (id = 1), then refresh this page.',
        });
      }

      setSettingsLoading(false);
    };

    void loadControlSettings();
    return () => {
      active = false;
    };
  }, []);

  const updateChannel = (
    channel: ChannelName,
    patch: Partial<ChannelConfig>,
  ) => {
    const setter =
      channel === 'telegram' ? setTelegramConfig : setWhatsappConfig;
    setter((current) => ({
      ...current,
      ...patch,
      fields: { ...current.fields, ...(patch.fields || {}) },
    }));
  };

  const saveSettings = async (section: SaveSection, values: SettingsUpdate) => {
    if (settingsId === null) {
      setFeedback({
        type: 'error',
        text: 'No settings row was found. Run the control center SQL and make sure the settings row exists.',
      });
      return;
    }

    setSavingSection(section);
    setFeedback(null);

    const { data, error } = await supabase
      .from('settings')
      .update(values)
      .eq('id', settingsId)
      .select('id')
      .maybeSingle();

    setSavingSection(null);

    if (error) {
      setFeedback({
        type: 'error',
        text: `Could not save settings: ${error.message}`,
      });
      return;
    }
    if (!data) {
      setFeedback({
        type: 'error',
        text: 'No row was updated. Check the settings table row and its Supabase RLS UPDATE policy.',
      });
      return;
    }

    const names: Record<SaveSection, string> = {
      telegram: 'Telegram settings saved successfully.',
      whatsapp: 'WhatsApp settings saved successfully.',
      announcement: 'Announcement bar settings saved successfully.',
    };
    setFeedback({ type: 'success', text: names[section] });
  };

  const handleSaveTelegram = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveSettings('telegram', {
      telegram_enabled: telegramConfig.enabled,
      telegram_config: {
        heading: telegramConfig.heading,
        footer: telegramConfig.footer,
        fields: telegramConfig.fields,
      },
    });
  };

  const handleSaveWhatsapp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveSettings('whatsapp', {
      whatsapp_enabled: whatsappConfig.enabled,
      whatsapp_config: {
        heading: whatsappConfig.heading,
        footer: whatsappConfig.footer,
        fields: whatsappConfig.fields,
      },
    });
  };

  const handleSaveAnnouncement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveSettings('announcement', {
      announcement_enabled: announcement.enabled,
      announcement_text: announcement.text,
      announcement_emoji_start: announcement.startEmoji,
      announcement_emoji_end: announcement.endEmoji,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  if (settingsLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#07090e] px-4 font-sans text-slate-300'>
        <div className='flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#0d1522] px-5 py-4'>
          <Loader2 className='h-6 w-6 animate-spin text-blue-400' />
          <p className='text-sm font-semibold'>
            Loading Store Control Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen w-full overflow-x-clip bg-[#07090e] font-sans text-slate-100 selection:bg-red-500 selection:text-white'>
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          background: #07090e;
        }
        ::-webkit-scrollbar {
          width: 10px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #07090e;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            #ef4444,
            #10b981,
            #3b82f6,
            #eab308
          );
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            #dc2626,
            #059669,
            #2563eb,
            #ca8a04
          );
        }
      `}</style>

      <div className='pointer-events-none fixed -left-40 top-10 h-96 w-96 rounded-full bg-blue-600/[.10] blur-[140px]' />
      <div className='pointer-events-none fixed -right-40 top-1/3 h-96 w-96 rounded-full bg-red-600/[.09] blur-[140px]' />
      <div className='pointer-events-none fixed bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/[.07] blur-[140px]' />

      {/* Main navigation + section shortcuts */}

      <header className='fixed top-0 left-0 right-0 z-[9999] border-b  border-slate-800/90 bg-[#090f19] shadow-xl shadow-black/40 backdrop-blur-2xl'>
        <div className='mx-auto flex h-[66px] max-w-[1500px] items-center justify-between gap-3 px-3 sm:px-6'>
          <Link
            href='/admin'
            className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-xs font-extrabold text-slate-200 transition hover:border-blue-400/50 hover:text-white'
          >
            <ArrowLeft size={16} />
            <span className='hidden sm:inline'>Dashboard</span>
          </Link>
          <div className='min-w-0 text-center'>
            <h1 className='truncate text-sm font-black tracking-wide text-white sm:text-lg'>
              Store Control Center
            </h1>
            <p className='hidden text-xs font-medium text-slate-400 sm:block'>
              Manage messages, promotions and customer reviews
            </p>
          </div>
          <button
            type='button'
            onClick={handleLogout}
            className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[.08] px-3 py-2.5 text-xs font-extrabold text-red-300 transition hover:bg-red-500/15'
          >
            <LogOut size={15} />
            <span className='hidden sm:inline'>Logout</span>
          </button>
        </div>
        <nav
          aria-label='Settings sections'
          className='border-t border-slate-800/70 '
        >
          <div className='mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto px-3 py-2.5 sm:justify-center sm:px-6'>
            <a
              href='#order-messages'
              className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-2.5 text-xs font-extrabold text-blue-200 transition hover:bg-blue-500/20 sm:text-sm'
            >
              <Send size={15} /> Order Messages
            </a>
            <a
              href='#announcement-bar'
              className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-yellow-500/25 bg-yellow-500/[.08] px-4 py-2.5 text-xs font-extrabold text-yellow-200 transition hover:bg-yellow-500/[.15] sm:text-sm'
            >
              <Megaphone size={15} /> Announcement Bar
            </a>
            <a
              href='#reviews-control'
              className='inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[.08] px-4 py-2.5 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-500/[.15] sm:text-sm'
            >
              <Star size={15} /> Reviews Manager
            </a>
          </div>
        </nav>
      </header>

      <main className='mt-30 relative z-10 mx-auto max-w-[1500px] space-y-8 px-3 py-6 sm:space-y-10 sm:px-6 sm:py-9 lg:px-8'>
        <section className='rounded-3xl border border-slate-800 bg-gradient-to-br from-[#111b2a] via-[#0b1420] to-[#101b18] p-5 shadow-2xl sm:p-7 lg:p-8'>
          <div className='flex flex-col justify-between gap-5 md:flex-row md:items-center'>
            <div className='max-w-3xl'>
              <p className='mb-2 text-xs font-black uppercase tracking-[.2em] text-yellow-300'>
                Store administration
              </p>
              <h2 className='text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl'>
                Store Operations{' '}
                <span className='bg-gradient-to-r from-red-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent'>
                  Dashboard
                </span>
              </h2>
              <p className='mt-3 text-sm leading-7 text-slate-300 sm:text-base'>
                Configure exactly what customers receive, what your team sees in
                Telegram, and how your store communicates promotions and review
                responses.
              </p>
            </div>
            <div className='grid grid-cols-3 gap-2 md:min-w-[330px]'>
              <div className='rounded-2xl border border-blue-500/20 bg-blue-500/[.07] p-3 text-center'>
                <Send className='mx-auto text-blue-300' size={20} />
                <p className='mt-2 text-xs font-extrabold text-white'>
                  Telegram
                </p>
              </div>
              <div className='rounded-2xl border border-emerald-500/20 bg-emerald-500/[.07] p-3 text-center'>
                <Smartphone className='mx-auto text-emerald-300' size={20} />
                <p className='mt-2 text-xs font-extrabold text-white'>
                  WhatsApp
                </p>
              </div>
              <div className='rounded-2xl border border-yellow-500/20 bg-yellow-500/[.07] p-3 text-center'>
                <Star className='mx-auto text-yellow-300' size={20} />
                <p className='mt-2 text-xs font-extrabold text-white'>
                  Reviews
                </p>
              </div>
            </div>
          </div>
        </section>

        {feedback && (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm shadow-lg ${feedback.type === 'error' ? 'border-red-500/30 bg-red-950/40 text-red-200' : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'}`}
          >
            {feedback.type === 'error' ? (
              <AlertTriangle size={20} className='mt-0.5 shrink-0' />
            ) : (
              <CheckCircle2 size={20} className='mt-0.5 shrink-0' />
            )}
            <span className='font-bold leading-6'>{feedback.text}</span>
          </div>
        )}

        {/* 1. Separate Telegram and WhatsApp controls */}
        <section id='order-messages' className='scroll-mt-36 space-y-5'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='text-xs font-black uppercase tracking-[.18em] text-blue-300'>
                01 / Customer communication
              </p>
              <h2 className='mt-1 text-2xl font-black text-white sm:text-3xl'>
                Order Messages Control
              </h2>
              <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-400'>
                Telegram and WhatsApp are configured separately. Choose which
                order details each channel receives, add your own opening and
                closing text, and save each channel independently.
              </p>
            </div>
            <span className='w-fit rounded-full border border-blue-500/20 bg-blue-500/[.08] px-3 py-2 text-xs font-bold text-blue-200'>
              Independent channel settings
            </span>
          </div>

          <div className='grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-2'>
            <ChannelEditor
              channel='telegram'
              title='Telegram Notifications'
              subtitle='Full order alert for your store team and administrators.'
              icon={<Send size={23} />}
              config={telegramConfig}
              saving={savingSection === 'telegram'}
              onChange={(patch) => updateChannel('telegram', patch)}
              onSave={handleSaveTelegram}
            />
            <ChannelEditor
              channel='whatsapp'
              title='WhatsApp Message'
              subtitle='Pre-filled customer message with the order details you select.'
              icon={<Smartphone size={23} />}
              config={whatsappConfig}
              saving={savingSection === 'whatsapp'}
              onChange={(patch) => updateChannel('whatsapp', patch)}
              onSave={handleSaveWhatsapp}
            />
          </div>

          <div className='relative mt-5 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#10251f] via-[#101c22] to-[#111827] p-5 shadow-xl sm:p-7'>
            <div className='pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-[70px]' />

            <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-start gap-4'>
                <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300'>
                  <Smartphone size={27} />
                </div>

                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h3 className='text-lg font-black text-white sm:text-xl'>
                      WhatsApp Business Integration
                    </h3>

                    <span className='rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-300'>
                      Coming Soon
                    </span>
                  </div>

                  <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-300'>
                    Official WhatsApp Business API integration for automated
                    order confirmations, customer notifications and business
                    messaging.
                  </p>

                  <p className='mt-2 text-xs leading-5 text-slate-400'>
                    This is a future integration placeholder. Your current
                    WhatsApp message link will continue working independently.
                  </p>
                </div>
              </div>

              <div className='shrink-0 rounded-xl border border-slate-700/80 bg-slate-950/40 px-4 py-3 text-center'>
                <p className='text-xs font-bold text-slate-300'>
                  Not connected
                </p>
                <p className='mt-1 text-xs text-slate-500'>
                  No API credentials required now
                </p>
              </div>
            </div>
          </div>

          <div className='rounded-2xl border border-yellow-500/20 bg-yellow-500/[.055] p-4 text-sm leading-6 text-yellow-100/90'>
            <strong className='text-yellow-200'>Checkout integration:</strong>{' '}
            the API can only include details that your checkout sends to it. The
            updated route accepts common order formats and product arrays. Make
            sure your checkout request includes the complete order object and
            its items; the integration notes in the README show the expected
            payload.
          </div>
        </section>

        {/* 2. Announcement controls */}
        <section
          id='announcement-bar'
          className='scroll-mt-36 overflow-hidden rounded-3xl border border-slate-800 bg-[#0d1522]/95 shadow-2xl'
        >
          <div className='border-b border-slate-800 bg-gradient-to-r from-red-500/[.14] via-yellow-500/[.06] to-blue-500/[.12] p-5 sm:p-7'>
            <div className='flex flex-wrap items-center gap-4'>
              <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-500/10 text-yellow-300'>
                <Megaphone size={27} />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-xs font-black uppercase tracking-[.18em] text-yellow-300'>
                  02 / Storefront promotion
                </p>
                <h2 className='mt-1 text-xl font-black text-white sm:text-2xl'>
                  Announcement Bar Control
                </h2>
                <p className='mt-1 text-sm text-slate-400'>
                  Manage the promotional banner displayed at the top of your
                  store.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSaveAnnouncement}
            className='space-y-6 p-5 sm:p-7'
          >
            <Toggle
              checked={announcement.enabled}
              onChange={() =>
                setAnnouncement((current) => ({
                  ...current,
                  enabled: !current.enabled,
                }))
              }
              label='Show announcement bar'
              description='Turn the banner on or off without deleting its content.'
            />

            <div>
              <label className={labelClass}>Promotion text</label>
              <textarea
                rows={3}
                maxLength={240}
                value={announcement.text}
                onChange={(event) =>
                  setAnnouncement((current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
                className={`${inputClass} resize-y`}
                placeholder='FLASH SALE: Enjoy Up To 40% OFF...'
              />
              <p className='mt-2 text-right text-xs text-slate-500'>
                {announcement.text.length}/240 characters
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className={labelClass}>Leading emoji</label>
                <input
                  maxLength={8}
                  value={announcement.startEmoji}
                  onChange={(event) =>
                    setAnnouncement((current) => ({
                      ...current,
                      startEmoji: event.target.value,
                    }))
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
                    setAnnouncement((current) => ({
                      ...current,
                      endEmoji: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder='🔥'
                />
              </div>
            </div>

            <div className='rounded-2xl border border-slate-700 bg-[#070b12] p-4 sm:p-5'>
              <div className='mb-4 flex items-center gap-2'>
                <Eye size={16} className='text-yellow-300' />
                <p className='text-xs font-black uppercase tracking-[.16em] text-slate-300'>
                  Live preview
                </p>
              </div>
              {announcement.enabled && announcement.text.trim() ? (
                <div className='flex justify-center'>
                  <div className='inline-flex max-w-full items-center justify-center gap-2.5 rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-red-600/95 via-emerald-600/95 to-blue-600/95 px-4 py-3 text-center text-sm font-extrabold leading-6 text-white shadow-xl sm:px-6'>
                    <span className='shrink-0 text-base'>
                      {announcement.startEmoji || '💸'}
                    </span>
                    <span className='break-words'>{announcement.text}</span>
                    <span className='shrink-0 text-base'>
                      {announcement.endEmoji || '🔥'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className='py-5 text-center text-sm text-slate-500'>
                  The announcement bar is currently hidden.
                </p>
              )}
            </div>

            <div className='flex justify-end border-t border-slate-800 pt-5'>
              <button
                type='submit'
                disabled={savingSection === 'announcement'}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-yellow-600 to-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:brightness-110 disabled:opacity-50 sm:w-auto'
              >
                {savingSection === 'announcement' ? (
                  <Loader2 size={17} className='animate-spin' />
                ) : (
                  <Save size={17} />
                )}
                {savingSection === 'announcement'
                  ? 'Saving Banner...'
                  : 'Save Announcement Settings'}
              </button>
            </div>
          </form>
        </section>




        {/* 3. Reviews controls */}
        <section className='scroll-mt-36 space-y-4'>
          <div>
            <p className='text-xs font-black uppercase tracking-[.18em] text-emerald-300'>
              03 / Customer feedback
            </p>
            <h2 className='mt-1 text-2xl font-black text-white sm:text-3xl'>
              Reviews Control Center
            </h2>
            <p className='mt-2 text-sm leading-6 text-slate-400'>
              Add, edit, hide, delete and reply to customer reviews. The review
              manager below is connected to your existing reviews and products
              tables.
            </p>
          </div>
          <AdminReviewsManager />
        </section>





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


// const firstProduct = productResult.data?.[0];

// if (firstProduct) {
//   setNewProductId((current) =>
//     current || String(firstProduct.id),
//   );
// }




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

    // لا نغيّر اختيار المنتج الذي اختاره الأدمن بالفعل.
    if (productResult.data?.[0]) {
      setNewProductId((current) => current || String(productResult.data[0].id));
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

  // المزامنة تعتمد على Supabase channel واحد طوال فترة وجود المكون.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const likedCount = reviews.filter((review) => review.admin_liked).length;

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
    setNotice(
      'No review was updated. Check the review ID and Supabase RLS UPDATE/SELECT policies.',
    );
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

  if (error) {
    setNotice(`Could not update store reaction: ${error.message}`);
    setNoticeError(true);
    return;
  }

  if (!data) {
    setNotice(
      'Store reaction was not saved. Check Supabase RLS UPDATE/SELECT policies.',
    );
    setNoticeError(true);
    return;
  }

  setReviews((current) =>
    current.map((item) =>
      item.id === review.id ? { ...item, admin_liked: data.admin_liked } : item,
    ),
  );

  setNotice('Store reaction updated.');
  setNoticeError(false);
};





const toggleVisibility = async (review: ReviewRow) => {
  const nextHidden = !review.is_hidden;

  const { data, error } = await supabase
    .from('reviews')
    .update({ is_hidden: nextHidden })
    .eq('id', review.id)
    .select('id, is_hidden')
    .maybeSingle();

  if (error) {
    setNotice(`Could not change review visibility: ${error.message}`);
    setNoticeError(true);
    return;
  }

  if (!data) {
    setNotice(
      'Review visibility was not changed. Check Supabase RLS UPDATE/SELECT policies.',
    );
    setNoticeError(true);
    return;
  }

  setReviews((current) =>
    current.map((item) =>
      item.id === review.id ? { ...item, is_hidden: data.is_hidden } : item,
    ),
  );

  setNotice(
    data.is_hidden
      ? 'Review hidden from customers.'
      : 'Review is visible to customers.',
  );

  setNoticeError(false);
};





const handleDeleteReview = async (review: ReviewRow) => {
  const confirmed = window.confirm(
    `Delete the review by ${review.reviewer_name}? This cannot be undone.`,
  );

  if (!confirmed) return;

  setSaving(true);
  setNotice('');

  const { data, error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', review.id)
    .select('id')
    .maybeSingle();

  setSaving(false);

  if (error) {
    setNotice(`Could not delete review: ${error.message}`);
    setNoticeError(true);
    return;
  }

  if (!data) {
    setNotice(
      'Nothing was deleted from the database. The most likely cause is a missing or blocking Supabase RLS DELETE policy.',
    );
    setNoticeError(true);
    return;
  }

  setReviews((current) => current.filter((item) => item.id !== data.id));

  if (editingId === review.id) {
    cancelEditing();
  }

  setNotice('Review deleted permanently.');
  setNoticeError(false);

  // تحديث القائمة من قاعدة البيانات للتأكد من الحالة النهائية.
  await fetchData(false);
};




  return (
    <section
      id='reviews-control'
      className='scroll-mt-36 overflow-hidden rounded-3xl border border-slate-800/90 bg-[#0d1522]/95 shadow-2xl'
    >
      <div className='border-b border-slate-800/80 bg-gradient-to-r from-red-500/[.09] via-emerald-500/[.05] to-blue-500/[.09] p-5 sm:p-7'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-red-500/20 via-emerald-500/15 to-blue-500/20 text-white'>
              <MessageSquare size={23} />
            </div>
            <div>
              <h2 className='text-base font-black text-white sm:text-lg'>
                Reviews Control Center
              </h2>
              <p className='mt-1 text-sm text-slate-500'>
                Moderate customer feedback, publish store replies and manage
                reactions.
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={() => void fetchData()}
            className='inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-300 transition hover:border-blue-500/40 hover:text-white'
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className='mt-6 grid grid-cols-3 gap-2 sm:gap-3'>
          <div className='rounded-2xl border border-blue-500/15 bg-blue-500/[.06] p-3'>
            <p className='text-xs font-black uppercase tracking-wider text-blue-300/70'>
              All reviews
            </p>
            <p className='mt-1 text-xl font-black tabular-nums text-white'>
              {totalCount}
            </p>
          </div>
          <div className='rounded-2xl border border-amber-500/15 bg-amber-500/[.06] p-3'>
            <p className='text-xs font-black uppercase tracking-wider text-amber-300/70'>
              Hidden
            </p>
            <p className='mt-1 text-xl font-black tabular-nums text-white'>
              {hiddenCount}
            </p>
          </div>
          <div className='rounded-2xl border border-red-500/15 bg-red-500/[.06] p-3'>
            <p className='text-xs font-black uppercase tracking-wider text-red-300/70'>
              Store likes
            </p>
            <p className='mt-1 text-xl font-black tabular-nums text-white'>
              {likedCount}
            </p>
          </div>
        </div>
      </div>

      <div className='space-y-6 p-5 sm:p-7'>
        {notice && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${noticeError ? 'border-red-500/30 bg-red-500/[.08] text-red-300' : 'border-emerald-500/30 bg-emerald-500/[.08] text-emerald-300'}`}
          >
            {notice}
          </div>
        )}

        {/* Admin Add Review */}
        <form
          onSubmit={handleAddReview}
          className='rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[.055] to-blue-500/[.035] p-4 sm:p-5'
        >
          <div className='mb-4 flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300'>
              <Plus size={17} />
            </div>
            <div>
              <h3 className='text-sm font-black text-white'>
                Add a Review as Admin
              </h3>
              <p className='text-sm text-slate-500'>
                Create a review and optionally publish an official store
                response.
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div>
              <label className={labelClass}>Product</label>
              <select
                required
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
                className={inputClass}
              >
                <option value=''>Choose a product</option>
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Reviewer Name</label>
              <input
                required
                maxLength={80}
                value={newReview.reviewer_name}
                onChange={(e) =>
                  setNewReview((current) => ({
                    ...current,
                    reviewer_name: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder='Customer name'
              />
            </div>
            <div>
              <label className={labelClass}>Rating</label>
              <select
                value={newReview.rating}
                onChange={(e) =>
                  setNewReview((current) => ({
                    ...current,
                    rating: Number(e.target.value),
                  }))
                }
                className={inputClass}
              >
                <option value={5}>★★★★★ — 5 / 5</option>
                <option value={4}>★★★★☆ — 4 / 5</option>
                <option value={3}>★★★☆☆ — 3 / 5</option>
                <option value={2}>★★☆☆☆ — 2 / 5</option>
                <option value={1}>★☆☆☆☆ — 1 / 5</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Review Comment</label>
              <textarea
                required
                rows={2}
                maxLength={1500}
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview((current) => ({
                    ...current,
                    comment: e.target.value,
                  }))
                }
                className={`${inputClass} resize-y`}
                placeholder='Write the review...'
              />
            </div>
            <div className='md:col-span-2'>
              <label className={labelClass}>
                Official Store Reply (Optional)
              </label>
              <textarea
                rows={2}
                maxLength={1500}
                value={newReview.admin_reply}
                onChange={(e) =>
                  setNewReview((current) => ({
                    ...current,
                    admin_reply: e.target.value,
                  }))
                }
                className={`${inputClass} resize-y`}
                placeholder='Write a public reply from the store...'
              />
            </div>
          </div>

          <div className='mt-4 flex justify-end'>
            <button
              type='submit'
              disabled={saving || products.length === 0}
              className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 px-5 py-3 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {saving ? (
                <Loader2 size={14} className='animate-spin' />
              ) : (
                <Plus size={14} />
              )}
              Add Review
            </button>
          </div>
          {products.length === 0 && !loading && (
            <p className='mt-3 text-sm text-amber-300'>
              No products were found. Add a product first.
            </p>
          )}
        </form>

        {/* Search + filters */}
        <div className='flex flex-col gap-3 lg:flex-row'>
          <div className='relative flex-1'>
            <Search
              size={15}
              className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500'
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-10`}
              placeholder='Search reviewer, comment or product...'
            />
          </div>
          <div className='grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-[#080e18] p-1'>
            {(['all', 'visible', 'hidden'] as const).map((value) => (
              <button
                key={value}
                type='button'
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-2 text-sm font-black capitalize transition ${filter === value ? 'bg-gradient-to-r from-red-600/80 to-blue-600/80 text-white shadow' : 'text-slate-500 hover:text-slate-200'}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-black uppercase tracking-[.14em] text-slate-300'>
              Customer feedback
            </h3>
            <span className='text-sm text-slate-500'>
              {visibleReviews.length} shown
            </span>
          </div>

          {loading ? (
            <div className='flex min-h-36 items-center justify-center gap-2 text-sm text-slate-400'>
              <Loader2 size={17} className='animate-spin text-blue-400' />{' '}
              Loading reviews...
            </div>
          ) : visibleReviews.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-slate-800 bg-[#080e18] px-4 py-12 text-center'>
              <MessageSquare
                size={25}
                className='mx-auto mb-3 text-slate-600'
              />
              <p className='text-sm font-bold text-slate-300'>
                No reviews match this view
              </p>
              <p className='mt-1 text-sm text-slate-600'>
                Try another filter or search term.
              </p>
            </div>
          ) : (
            visibleReviews.map((review) => {
              const isEditing = editingId === review.id;
              const productName =
                productNames.get(String(review.product_id)) ||
                `Product #${review.product_id}`;

              return (



                <article
                  key={review.id}
                  className={`rounded-2xl border bg-[#080e18] p-4 transition ${review.is_hidden ? 'border-amber-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  {isEditing ? (
                    <form onSubmit={handleUpdateReview} className='space-y-3'>
                      <div className='flex items-center justify-between gap-3'>
                        <div className='flex items-center gap-2 text-sm font-black text-blue-300'>
                          <Pencil size={14} /> Edit review & store reply
                        </div>
                        <button
                          type='button'
                          onClick={cancelEditing}
                          className='rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white'
                          aria-label='Cancel editing'
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div>
                          <label className={labelClass}>Reviewer Name</label>
                          <input
                            required
                            maxLength={80}
                            value={editForm.reviewer_name}
                            onChange={(e) =>
                              setEditForm((current) => ({
                                ...current,
                                reviewer_name: e.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Rating</label>
                          <select
                            value={editForm.rating}
                            onChange={(e) =>
                              setEditForm((current) => ({
                                ...current,
                                rating: Number(e.target.value),
                              }))
                            }
                            className={inputClass}
                          >
                            {[5, 4, 3, 2, 1].map((number) => (
                              <option key={number} value={number}>
                                {number} / 5 stars
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Customer Comment</label>
                        <textarea
                          required
                          rows={3}
                          maxLength={1500}
                          value={editForm.comment}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              comment: e.target.value,
                            }))
                          }
                          className={`${inputClass} resize-y`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Official Store Reply
                        </label>
                        <textarea
                          rows={3}
                          maxLength={1500}
                          value={editForm.admin_reply}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              admin_reply: e.target.value,
                            }))
                          }
                          className={`${inputClass} resize-y`}
                          placeholder='Reply publicly as the store...'
                        />
                      </div>
                      <div className='flex justify-end gap-2'>
                        <button
                          type='button'
                          onClick={cancelEditing}
                          className='rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-400 transition hover:text-white'
                        >
                          Cancel
                        </button>
                        <button
                          type='submit'
                          disabled={saving}
                          className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50'
                        >
                          {saving ? (
                            <Loader2 size={13} className='animate-spin' />
                          ) : (
                            <Save size={13} />
                          )}{' '}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className='flex flex-wrap items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h4 className='text-sm font-black text-white'>
                              {review.reviewer_name}
                            </h4>
                            {review.is_hidden && (
                              <span className='rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[8px] font-black uppercase text-amber-300'>
                                Hidden
                              </span>
                            )}
                          </div>
                          <p className='mt-1 flex items-center gap-1 text-sm text-slate-500'>
                            <Package size={11} /> {productName}
                          </p>
                          <div className='mt-2 flex items-center gap-0.5 text-amber-400'>
                            {Array.from({
                              length: Math.max(
                                0,
                                Math.min(5, Number(review.rating) || 0),
                              ),
                            }).map((_, index) => (
                              <Star
                                key={index}
                                size={12}
                                className='fill-amber-400'
                              />
                            ))}
                            <span className='ml-1 text-sm font-bold text-amber-300'>
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                        <time className='text-sm text-slate-600'>
                          {new Date(review.created_at).toLocaleDateString(
                            'en-US',
                          )}
                        </time>
                      </div>

                      <p className='mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300'>
                        {review.comment}
                      </p>

                      {review.admin_reply && (
                        <div className='mt-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[.05] p-3'>
                          <p className='mb-1 flex items-center gap-1.5 text-sm font-black uppercase tracking-wider text-emerald-300'>
                            <MessageSquare size={11} /> Store reply
                          </p>
                          <p className='whitespace-pre-wrap break-words text-sm leading-5 text-slate-400'>
                            {review.admin_reply}
                          </p>
                        </div>
                      )}

                      <div className='mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3'>
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <button
                            type='button'
                            onClick={() => void toggleLike(review)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-bold transition ${review.admin_liked ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-red-300'}`}
                          >
                            <Heart
                              size={13}
                              className={
                                review.admin_liked
                                  ? 'fill-red-400 text-red-400'
                                  : ''
                              }
                            />{' '}
                            {review.admin_liked ? 'Liked' : 'Like'}
                          </button>
                          <button
                            type='button'
                            onClick={() => startEditing(review)}
                            className='inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm font-bold text-slate-400 transition hover:border-blue-500/30 hover:text-blue-300'
                          >
                            <Pencil size={12} /> Edit / Reply
                          </button>
                          <button
                            type='button'
                            onClick={() => void toggleVisibility(review)}
                            className='inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm font-bold text-slate-400 transition hover:text-amber-300'
                          >
                            {review.is_hidden ? (
                              <Eye size={12} />
                            ) : (
                              <EyeOff size={12} />
                            )}
                            {review.is_hidden ? 'Show' : 'Hide'}
                          </button>
                        </div>
                        <button
                          type='button'
                          onClick={() => void handleDeleteReview(review)}
                          className='inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[.06] px-2.5 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/15'
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>




              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
