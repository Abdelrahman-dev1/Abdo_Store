'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Settings,
  Save,
  LogOut,
  Loader2,
  Store,
  Phone,
  Mail,
  DollarSign,
  Truck,
  Percent,
  Megaphone,
  ShieldAlert,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Store Settings States (Expanded with professional e-commerce options)
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [shippingCost, setShippingCost] = useState('50');
  const [taxRate, setTaxRate] = useState('0');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('1000');
  const [storeDescription, setStoreDescription] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (data) {
      setStoreName(data.store_name || '');
      setStorePhone(data.store_phone || '');
      setStoreEmail(data.store_email || '');
      setCurrency(data.store_currency || 'EGP');
      setShippingCost(data.shipping_cost?.toString() || '50');
      setTaxRate(data.tax_rate?.toString() || '0');
      setFreeShippingThreshold(
        data.free_shipping_threshold?.toString() || '1000',
      );
      setStoreDescription(data.store_description || '');
      setAnnouncementText(data.announcement_text || '');
      setMaintenanceMode(data.maintenance_mode || false);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    const { error } = await supabase.from('settings').upsert({
      id: 1,
      store_name: storeName,
      store_phone: storePhone,
      store_email: storeEmail,
      store_currency: currency,
      shipping_cost: parseFloat(shippingCost) || 0,
      tax_rate: parseFloat(taxRate) || 0,
      free_shipping_threshold: parseFloat(freeShippingThreshold) || 0,
      store_description: storeDescription,
      announcement_text: announcementText,
      maintenance_mode: maintenanceMode,
    });

    setSaving(false);

    if (error) {
      alert('Error saving settings: ' + error.message);
    } else {
      setSuccessMsg('Store settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
        <p className='text-xs font-medium'>Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#07090e] text-slate-100 pb-16 font-sans relative selection:bg-red-500 selection:text-white'>
      {/* Custom Neon Scrollbar Styles */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #07090e;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ef4444, #3b82f6);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #dc2626, #2563eb);
        }
      `}</style>

      {/* Background Glow Orbs */}
      <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
      <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

      {/* Admin Navbar */}
      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 grid grid-cols-3 items-center'>
          <div className='flex items-center justify-start'>
            <Link
              href='http://localhost:3000/admin'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <ArrowLeft size={16} />
              <span className='hidden sm:inline'>Back to Dashboard</span>
            </Link>
          </div>

          <div className='text-center'>
            <h1 className='text-sm sm:text-base font-black text-white tracking-tight'>
              Store Configuration
            </h1>
            <p className='text-[10px] sm:text-[11px] text-slate-400 font-medium'>
              Global Store Parameters & Controls
            </p>
          </div>

          <div className='flex items-center justify-end gap-2'>
            <button
              onClick={handleLogout}
              className='flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-red-500/30 cursor-pointer shadow-sm'
            >
              <LogOut size={15} />
              <span className='hidden sm:inline'>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className='max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10'>
        {/* Success Alert Banner */}
        {successMsg && (
          <div className='mb-6 p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-lg animate-in fade-in'>
            <CheckCircle2 className='w-5 h-5 text-emerald-400 flex-shrink-0' />
            <span className='font-bold'>{successMsg}</span>
          </div>
        )}

        <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-slate-800/95 shadow-2xl'>
          <div className='flex items-center gap-3 border-b border-slate-800 pb-5 mb-8'>
            <div className='w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20'>
              <Settings size={24} />
            </div>
            <div>
              <h2 className='text-lg font-black text-white'>
                General Store Settings
              </h2>
              <p className='text-xs text-slate-400'>
                Manage store identity, currency, shipping, and promotional bars
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Store Name */}
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Store Name
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className='w-full px-4 py-3.5 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='e.g. Modern Store'
                  />
                  <Store className='w-4 h-4 absolute left-3.5 top-4 text-slate-400' />
                </div>
              </div>

              {/* Official Phone */}
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Official WhatsApp Phone
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    required
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className='w-full px-4 py-3.5 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='01012345678'
                    dir='ltr'
                  />
                  <Phone className='w-4 h-4 absolute left-3.5 top-4 text-slate-400' />
                </div>
              </div>

              {/* Support Email */}
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Support Email Address
                </label>
                <div className='relative'>
                  <input
                    type='email'
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className='w-full px-4 py-3.5 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='support@store.com'
                    dir='ltr'
                  />
                  <Mail className='w-4 h-4 absolute left-3.5 top-4 text-slate-400' />
                </div>
              </div>

              {/* Store Currency */}
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Store Currency
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className='w-full px-4 py-3.5 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='EGP'
                  />
                  <DollarSign className='w-4 h-4 absolute left-3.5 top-4 text-slate-400' />
                </div>
              </div>

              {/* Shipping Cost */}
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Fixed Shipping Cost
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    step='0.01'
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className='w-full px-4 py-3.5 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='50'
                  />
                  <Truck className='w-4 h-4 absolute left-3.5 top-4 text-slate-400' />
                </div>
              </div>

              {/* Tax Rate */}
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Tax Rate Percentage (%)
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    step='0.01'
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className='w-full px-4 py-3.5 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                    placeholder='0'
                  />
                  <Percent className='w-4 h-4 absolute left-3.5 top-4 text-slate-400' />
                </div>
              </div>
            </div>

            {/* Free Shipping Threshold */}
            <div>
              <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                Free Shipping Threshold (Order Amount)
              </label>
              <input
                type='number'
                step='0.01'
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className='w-full px-4 py-3.5 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                placeholder='1000'
              />
              <p className='text-[11px] text-slate-500 mt-1.5'>
                Orders above this amount will get free shipping automatically.
              </p>
            </div>

            {/* Announcement Bar Text */}
            <div>
              <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                Top Announcement Bar Text (Offers & Alerts)
              </label>
              <div className='relative'>
                <input
                  type='text'
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className='w-full px-4 py-3.5 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                  placeholder='e.g. Free shipping on all orders over 1000 EGP! 🔥'
                />
                <Megaphone className='w-4 h-4 absolute left-3.5 top-4 text-slate-400' />
              </div>
            </div>

            {/* Store Description */}
            <div>
              <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                Store Description / Meta Bio
              </label>
              <textarea
                rows={3}
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 outline-none text-xs transition'
                placeholder='Brief description about your store...'
              />
            </div>

            {/* Maintenance Mode Toggle Switch */}
            <div className='p-4 bg-[#141d2f]/70 border border-slate-800 rounded-2xl flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintenanceMode ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}
                >
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className='text-xs font-bold text-white'>
                    Maintenance Mode
                  </div>
                  <div className='text-[11px] text-slate-400'>
                    Temporarily close storefront for visitors during updates
                  </div>
                </div>
              </div>

              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Submit Button */}
            <div className='pt-4 border-t border-slate-800 flex justify-end'>
              <button
                type='submit'
                disabled={saving}
                className='flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 transition duration-300 disabled:opacity-50 text-xs cursor-pointer'
              >
                {saving ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Store Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
