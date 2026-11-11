'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShoppingBag,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Package,
  Clock,
  Truck,
  LogOut,
  XCircle,
  MessageCircle,
  Loader2,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchUserDataAndOrders();
  }, []);

  const fetchUserDataAndOrders = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/';
      return;
    }
    setUser(user);

    // 1. Fetch Profile Data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setFullName(profileData.full_name || user.user_metadata?.full_name || '');
      setPhone(profileData.phone || '');
      setCity(profileData.city || '');
      setAddress(profileData.address || '');
    } else {
      setFullName(user.user_metadata?.full_name || '');
    }

    // 2. Fetch Customer Orders
    fetchOrders(user.id);
  };

  const fetchOrders = async (userId: string) => {
    const { data: userOrders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && userOrders) {
      setOrders(userOrders);
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      phone,
      city,
      address,
      updated_at: new Date(),
    });

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert('Error saving profile: ' + error.message);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (!error) {
      alert('Order cancelled successfully.');
      fetchOrders(user.id);
    } else {
      alert('Error cancelling order: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className='bg-amber-950/40 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 w-fit'>
            <Clock size={13} /> Pending Review
          </span>
        );
      case 'shipping':
      case 'جاري الشحن':
        return (
          <span className='bg-blue-950/40 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 w-fit'>
            <Truck size={13} /> Shipping
          </span>
        );
      case 'delivered':
      case 'تم التسليم':
        return (
          <span className='bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 w-fit'>
            <CheckCircle2 size={13} /> Delivered
          </span>
        );
      case 'cancelled':
      case 'ملغي':
        return (
          <span className='bg-red-950/40 text-red-300 border border-red-500/40 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 w-fit'>
            <XCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className='bg-slate-800 text-slate-300 px-3 py-1 rounded-xl text-xs font-bold border border-slate-700'>
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-400 space-y-3 font-sans'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
        <p className='text-xs font-medium'>Loading your profile...</p>
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

      {/* Navbar */}
      <nav className='bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between'>
          <Link
            href='/'
            className='text-base sm:text-lg font-black flex items-center gap-2.5 text-white'
          >
            <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center shadow-lg shadow-red-600/20'>
              <ShoppingBag className='w-5 h-5 text-white' />
            </div>
            <span>Online Store</span>
          </Link>

          <div className='flex items-center gap-3'>
            <Link
              href='/'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <ArrowLeft size={16} />
              <span className='hidden sm:inline'>Storefront</span>
            </Link>
            <button
              onClick={handleLogout}
              className='flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition border border-red-500/30 shadow-sm cursor-pointer'
            >
              <LogOut size={15} />
              <span className='hidden sm:inline'>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className='max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10 space-y-10'>
        {/* Profile Details & Shipping Address Form */}
        <div className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl space-y-6'>
          <div className='border-b border-slate-800 pb-4 flex items-center gap-3'>
            <User className='w-6 h-6 text-blue-400' />
            <div>
              <h1 className='text-lg font-black text-white'>
                Profile & Delivery Address
              </h1>
              <p className='text-xs text-slate-400'>
                Manage your personal information and default shipping address
              </p>
            </div>
          </div>

          {success && (
            <div className='bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl text-xs flex items-center gap-2 backdrop-blur-md'>
              <CheckCircle2 size={18} /> Profile details saved successfully!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className='space-y-4'>
            <div>
              <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                Email Address
              </label>
              <div className='relative'>
                <input
                  type='text'
                  disabled
                  value={user?.email || ''}
                  className='w-full px-4 py-3 pl-11 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed'
                />
                <Mail className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-600' />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Full Name *
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                    placeholder='Enter your full name'
                    required
                  />
                  <User className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                </div>
              </div>
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Phone Number *
                </label>
                <div className='relative'>
                  <input
                    type='tel'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                    placeholder='01012345678'
                    dir='ltr'
                    required
                  />
                  <Phone className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Governorate / City *
                </label>
                <input
                  type='text'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className='w-full px-4 py-3 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                  placeholder='e.g. Cairo'
                  required
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2'>
                  Detailed Address *
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className='w-full px-4 py-3 pl-11 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                    placeholder='Street name / Building number / Apartment'
                    required
                  />
                  <MapPin className='w-4 h-4 absolute left-3.5 top-3.5 text-slate-400' />
                </div>
              </div>
            </div>

            <button
              type='submit'
              disabled={saving}
              className='w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950/50 transition duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50'
            >
              {saving ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin text-white' />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Profile Details</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Previous Orders & Invoices Section */}
        <div className='space-y-6'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div>
              <h2 className='text-xl font-black text-white tracking-tight flex items-center gap-2.5'>
                <Package className='w-6 h-6 text-blue-400' />
                <span>Order History & Invoices</span>
              </h2>
              <p className='text-xs text-slate-400 mt-1'>
                Track your past purchases and detailed order invoices
              </p>
            </div>

            {/* General WhatsApp Support Button */}
            <a
              href='https://wa.me/201016605189?text=Hello,%20I%20would%20like%20to%20inquire%20about%20my%20orders%20in%20the%20store'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50'
            >
              <MessageCircle size={16} /> Contact via WhatsApp
            </a>
          </div>

          {orders.length === 0 ? (
            <div className='bg-[#0e1626]/90 backdrop-blur-xl p-12 rounded-3xl border border-slate-800 text-center space-y-3 shadow-2xl'>
              <Package size={48} className='mx-auto text-slate-600' />
              <p className='text-slate-300 text-xs font-medium'>
                You haven't placed any orders yet.
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {orders.map((order) => {
                let itemsList = [];
                try {
                  itemsList =
                    typeof order.items === 'string'
                      ? JSON.parse(order.items)
                      : order.items || [];
                } catch (e) {
                  itemsList = [];
                }

                return (
                  <div
                    key={order.id}
                    className='bg-[#0e1626]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 transition hover:border-slate-700'
                  >
                    {/* Order Header */}
                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5'>
                      <div className='space-y-2'>
                        <div className='flex flex-wrap items-center gap-3'>
                          <span className='font-black text-xs text-slate-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700'>
                            ORDER #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>

                        <p className='text-xs text-slate-400 flex items-center gap-1.5 pt-1'>
                          <MapPin
                            size={14}
                            className='text-red-400 flex-shrink-0'
                          />
                          <span>
                            Address: {order.city ? `${order.city} - ` : ''}
                            {order.customer_address || 'N/A'}
                          </span>
                        </p>

                        <p className='text-[11px] text-slate-500'>
                          Ordered on:{' '}
                          {new Date(order.created_at).toLocaleString('en-US')}
                        </p>
                      </div>

                      <div className='flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end'>
                        <div className='text-left bg-[#141d2f] p-4 rounded-2xl border border-slate-800 min-w-[160px]'>
                          <span className='text-[11px] text-slate-400 block uppercase font-semibold'>
                            Total Amount
                          </span>
                          <span className='font-black text-lg text-white'>
                            {order.total_amount}{' '}
                            <span className='text-xs text-slate-400 font-normal'>
                              EGP
                            </span>
                          </span>
                        </div>

                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className='bg-red-950/40 hover:bg-red-900/40 text-red-400 p-3 rounded-2xl text-xs font-bold border border-red-500/30 transition cursor-pointer'
                            title='Cancel Order'
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className='space-y-3'>
                      <h4 className='text-xs font-bold text-slate-300 uppercase tracking-wider'>
                        Ordered Products ({itemsList.length}):
                      </h4>
                      <div className='bg-[#141d2f]/70 rounded-2xl p-4 divide-y divide-slate-800/80 border border-slate-800'>
                        {itemsList.length === 0 ? (
                          <p className='text-xs text-slate-500 py-2 text-center'>
                            No product details recorded for this order.
                          </p>
                        ) : (
                          itemsList.map((item: any, idx: number) => {
                            const itemImg =
                              item.image ||
                              item.images?.[0] ||
                              'https://via.placeholder.com/80';
                            return (
                              <div
                                key={idx}
                                className='py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs'
                              >
                                <div className='flex items-center gap-3.5'>
                                  <img
                                    src={itemImg}
                                    alt={item.name}
                                    className='w-12 h-12 object-cover rounded-xl border border-slate-700 shrink-0 bg-slate-900'
                                  />
                                  <div>
                                    <span className='font-bold text-slate-200 block mb-0.5'>
                                      {item.name}
                                    </span>
                                    <span className='text-slate-400'>
                                      Qty:{' '}
                                      <strong className='text-white'>
                                        {item.quantity}
                                      </strong>{' '}
                                      × {item.price} EGP
                                    </span>
                                  </div>
                                </div>
                                <span className='font-black text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800'>
                                  {item.price * item.quantity} EGP
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Order Specific WhatsApp Support */}
                    <div className='flex justify-end pt-2'>
                      <a
                        href={`https://wa.me/201016605189?text=Hello,%20I%20would%20like%20to%20modify%20or%20inquire%20about%20Order%20%23${order.id.slice(0, 8).toUpperCase()}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition'
                      >
                        <MessageCircle size={15} /> Modify or Inquire about this
                        order via WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
