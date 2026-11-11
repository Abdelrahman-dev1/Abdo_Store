'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShoppingBag,
  Search,
  Home,
  LogOut,
  Package,
  Phone,
  MapPin,
  User,
  Clock,
  ArrowLeft,
  Loader2,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
      setFilteredOrders(data);
    }
    setLoading(false);
  };

  // Calculate actual counts for each status
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const shippingCount = orders.filter((o) => o.status === 'shipping').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  // Filter orders based on search query and status filter card
  useEffect(() => {
    let result = orders;

    // Apply status filter
    if (selectedStatusFilter !== 'all') {
      result = result.filter((o) => o.status === selectedStatusFilter);
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(q) ||
          o.customer_phone?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q),
      );
    }

    setFilteredOrders(result);
  }, [searchQuery, selectedStatusFilter, orders]);

  // Update order status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } else {
      alert('Error updating order status: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

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
              href='/admin'
              className='flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
            >
              <ArrowLeft size={16} />
              <span className='hidden sm:inline'>Back to Dashboard</span>
            </Link>
          </div>

          <div className='text-center'>
            <h1 className='text-sm sm:text-base font-black text-white tracking-tight'>
              Customer Orders Management
            </h1>
            <p className='text-[10px] sm:text-[11px] text-slate-400 font-medium'>
              Store Invoices & Control
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
      <main className='max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 relative z-10'>
        {/* Interactive Filter Cards / Stats Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
          {/* All Orders */}
          <div
            onClick={() => setSelectedStatusFilter('all')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
              selectedStatusFilter === 'all'
                ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-900/30 scale-[1.02]'
                : 'bg-[#0e1626]/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>
                All Orders
              </p>
              <h4 className='text-xl font-black text-white mt-1'>
                {totalCount}
              </h4>
            </div>
            <div className='w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300'>
              <LayoutGrid size={18} />
            </div>
          </div>

          {/* Pending */}
          <div
            onClick={() => setSelectedStatusFilter('pending')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
              selectedStatusFilter === 'pending'
                ? 'bg-amber-600/20 border-amber-500 shadow-lg shadow-amber-900/30 scale-[1.02]'
                : 'bg-[#0e1626]/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <p className='text-[11px] font-bold text-amber-400 uppercase tracking-wider'>
                Pending
              </p>
              <h4 className='text-xl font-black text-amber-300 mt-1'>
                {pendingCount}
              </h4>
            </div>
            <div className='w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400'>
              <Clock3 size={18} />
            </div>
          </div>

          {/* Shipping */}
          <div
            onClick={() => setSelectedStatusFilter('shipping')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
              selectedStatusFilter === 'shipping'
                ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-900/30 scale-[1.02]'
                : 'bg-[#0e1626]/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <p className='text-[11px] font-bold text-blue-400 uppercase tracking-wider'>
                Shipped
              </p>
              <h4 className='text-xl font-black text-blue-300 mt-1'>
                {shippingCount}
              </h4>
            </div>
            <div className='w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400'>
              <Truck size={18} />
            </div>
          </div>

          {/* Delivered */}
          <div
            onClick={() => setSelectedStatusFilter('delivered')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
              selectedStatusFilter === 'delivered'
                ? 'bg-emerald-600/20 border-emerald-500 shadow-lg shadow-emerald-900/30 scale-[1.02]'
                : 'bg-[#0e1626]/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <p className='text-[11px] font-bold text-emerald-400 uppercase tracking-wider'>
                Delivered
              </p>
              <h4 className='text-xl font-black text-emerald-300 mt-1'>
                {deliveredCount}
              </h4>
            </div>
            <div className='w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400'>
              <CheckCircle2 size={18} />
            </div>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => setSelectedStatusFilter('cancelled')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between col-span-2 sm:col-span-1 ${
              selectedStatusFilter === 'cancelled'
                ? 'bg-red-600/20 border-red-500 shadow-lg shadow-red-900/30 scale-[1.02]'
                : 'bg-[#0e1626]/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <p className='text-[11px] font-bold text-red-400 uppercase tracking-wider'>
                Cancelled
              </p>
              <h4 className='text-xl font-black text-red-300 mt-1'>
                {cancelledCount}
              </h4>
            </div>
            <div className='w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400'>
              <XCircle size={18} />
            </div>
          </div>
        </div>

        {/* Search & Header Bar */}
        <div className='bg-[#0e1626]/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4'>
          <div className='flex items-center gap-3 w-full sm:w-auto'>
            <div className='w-3 h-3 rounded-full bg-blue-500 animate-ping flex-shrink-0' />
            <h2 className='text-sm sm:text-base font-bold text-white'>
              Showing {filteredOrders.length} Orders{' '}
              {selectedStatusFilter !== 'all' && `(${selectedStatusFilter})`}
            </h2>
          </div>

          <div className='relative w-full sm:w-80'>
            <Search
              size={18}
              className='absolute left-3.5 top-3 text-slate-400 pointer-events-none'
            />
            <input
              type='text'
              placeholder='Search by name, phone, or order id...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 bg-[#141d2f]/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition'
              dir='ltr'
            />
          </div>
        </div>

        {/* Orders List / Loading State */}
        {loading ? (
          <div className='flex flex-col items-center justify-center py-24 text-slate-400 space-y-3'>
            <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
            <p className='text-xs font-medium'>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className='bg-[#0e1626]/80 backdrop-blur-xl p-16 rounded-3xl border border-slate-800/80 text-center text-slate-400 text-xs space-y-2'>
            <Package className='w-12 h-12 mx-auto text-slate-600 mb-2' />
            <p className='font-bold text-sm text-slate-300'>
              No matching orders found
            </p>
            <p>
              Try searching with a different keyword or selecting another
              filter.
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {filteredOrders.map((order, index) => {
              let itemsList = [];
              try {
                itemsList =
                  typeof order.items === 'string'
                    ? JSON.parse(order.items)
                    : order.items || [];
              } catch (e) {
                itemsList = [];
              }

              // Alternating backgrounds & glowing separator bar between orders
              const isEven = index % 2 === 0;

              return (
                <div key={order.id}>
                  <div
                    className={`${
                      isEven ? 'bg-[#0e1626]/95' : 'bg-[#090f1a]/95'
                    } backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 transition-all duration-300 hover:border-slate-700`}
                  >
                    {/* Order Top Section: ID & Status & Total Box */}
                    <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 border-b border-slate-800 pb-6'>
                      <div className='space-y-4 w-full lg:w-auto'>
                        <div className='flex flex-wrap items-center gap-3'>
                          <span className='font-black text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700/80 tracking-wider'>
                            ORDER #{order.id.slice(0, 8).toUpperCase()}
                          </span>

                          {/* Status Dropdown */}
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value)
                            }
                            className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer transition ${
                              order.status === 'pending'
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                : order.status === 'shipping'
                                  ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                                  : order.status === 'delivered'
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                                    : 'bg-red-950/40 text-red-300 border-red-500/40'
                            }`}
                          >
                            <option
                              value='pending'
                              className='bg-[#0e1626] text-amber-300'
                            >
                              ⏳ Pending Review
                            </option>
                            <option
                              value='shipping'
                              className='bg-[#0e1626] text-blue-300'
                            >
                              🚚 Shipping
                            </option>
                            <option
                              value='delivered'
                              className='bg-[#0e1626] text-emerald-300'
                            >
                              ✅ Delivered
                            </option>
                            <option
                              value='cancelled'
                              className='bg-[#0e1626] text-red-300'
                            >
                              ❌ Cancelled
                            </option>
                          </select>
                        </div>

                        {/* Customer Info Clean Grid */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs text-slate-300'>
                          <div className='flex items-center gap-2.5 bg-[#141d2f] px-3.5 py-2.5 rounded-xl border border-slate-800'>
                            <User
                              size={15}
                              className='text-blue-400 flex-shrink-0'
                            />
                            <div className='truncate'>
                              <span className='text-slate-500 block text-[10px] uppercase font-semibold'>
                                Customer
                              </span>
                              <span className='font-bold text-white'>
                                {order.customer_name || 'Not Specified'}
                              </span>
                            </div>
                          </div>

                          <div
                            className='flex items-center gap-2.5 bg-[#141d2f] px-3.5 py-2.5 rounded-xl border border-slate-800'
                            dir='ltr'
                          >
                            <div className='truncate text-left w-full'>
                              <span className='text-slate-500 block text-[10px] uppercase font-semibold'>
                                Phone
                              </span>
                              <span className='font-bold text-white'>
                                {order.customer_phone ||
                                  order.phone ||
                                  'Not Specified'}
                              </span>
                            </div>
                            <Phone
                              size={15}
                              className='text-emerald-400 flex-shrink-0'
                            />
                          </div>

                          <div className='flex items-center gap-2.5 bg-[#141d2f] px-3.5 py-2.5 rounded-xl border border-slate-800 sm:col-span-2 md:col-span-1'>
                            <MapPin
                              size={15}
                              className='text-red-400 flex-shrink-0'
                            />
                            <div className='truncate'>
                              <span className='text-slate-500 block text-[10px] uppercase font-semibold'>
                                Address
                              </span>
                              <span className='font-bold text-white'>
                                {order.city ? `${order.city}, ` : ''}
                                {order.customer_address || 'Not Specified'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Total Price & Timestamp Box */}
                      <div className='text-left bg-[#141d2f] p-4 rounded-2xl border border-slate-800 w-full lg:w-auto min-w-[220px] flex lg:flex-col justify-between items-center lg:items-end flex-shrink-0'>
                        <div>
                          <span className='text-[11px] text-slate-400 block font-semibold uppercase tracking-wider'>
                            Total Amount
                          </span>
                          <span className='font-black text-xl text-white'>
                            {order.total_amount}{' '}
                            <span className='text-xs text-slate-400 font-normal'>
                              EGP
                            </span>
                          </span>
                        </div>
                        <span className='text-[11px] text-slate-400 flex items-center gap-1.5 mt-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800'>
                          <Clock size={13} className='text-blue-400' />
                          {new Date(order.created_at).toLocaleString('en-US')}
                        </span>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className='space-y-3'>
                      <h4 className='text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider'>
                        <Package size={16} className='text-blue-400' />
                        <span>Ordered Products ({itemsList.length})</span>
                      </h4>

                      <div className='bg-[#141d2f]/70 rounded-2xl p-4 border border-slate-800 divide-y divide-slate-800'>
                        {itemsList.length === 0 ? (
                          <p className='text-xs text-slate-500 py-3 text-center font-medium'>
                            No detailed products recorded for this order.
                          </p>
                        ) : (
                          itemsList.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className='py-3.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-4'
                            >
                              <div className='flex items-center gap-4'>
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className='w-12 h-12 object-cover rounded-xl border border-slate-700 flex-shrink-0 shadow-md'
                                  />
                                )}
                                <div>
                                  <span className='font-bold text-slate-100 text-sm block mb-1'>
                                    {item.name}
                                  </span>
                                  <span className='text-slate-400 text-xs'>
                                    Qty:{' '}
                                    <strong className='text-white'>
                                      {item.quantity}
                                    </strong>{' '}
                                    × Unit Price:{' '}
                                    <strong className='text-white'>
                                      {item.price} EGP
                                    </strong>
                                  </span>
                                </div>
                              </div>

                              <span className='font-black text-sm text-white bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-700/80 flex-shrink-0'>
                                {item.price * item.quantity} EGP
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Distinct glowing divider between orders */}
                  {index < filteredOrders.length - 1 && (
                    <div className='my-6 flex items-center justify-center'>
                      <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent' />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
