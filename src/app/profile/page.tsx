'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
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
 const router = useRouter();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [success, setSuccess] = useState(false);
 const [user, setUser] = useState<any>(null);
 const [orders, setOrders] = useState<any[]>([]);
 const [orderFilter, setOrderFilter] = useState('all');
 const [promoRules, setPromoRules] = useState<any[]>([]);
 const [clientNow, setClientNow] = useState<Date | undefined>(undefined);

 const [fullName, setFullName] = useState('');
 const [phone, setPhone] = useState('');
 const [city, setCity] = useState('');
 const [address, setAddress] = useState('');

 // جلب الأوردرات الخاصة بالمستخدم من Supabase
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

 // جلب بيانات البروفايل والأوردرات عند فتح الصفحة
 async function fetchUserDataAndOrders() {
   const {
     data: { user },
   } = await supabase.auth.getUser();
   if (!user) {
     router.push('/');
     return;
   }
   setUser(user);

   // 1. جلب بيانات ملف المستخدم من جدول profiles
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

   // 2. جلب أوردرات العميل
   fetchOrders(user.id);
 }

 // استدعاء دالة جلب البيانات عند التحميل الأولي
 useEffect(() => {
   fetchUserDataAndOrders();
 }, []);

 // جلب قواعد العروض النشطة وضبط وقت الكلاينت بأمان
 useEffect(() => {
   setClientNow(new Date());
   let active = true;
   (async () => {
     const { data } = await supabase
       .from('promo_rules')
       .select('*')
       .eq('is_active', true)
       .order('priority', { ascending: true });
     if (active) setPromoRules(data ?? []);
   })();
   return () => {
     active = false;
   };
 }, []);

 const completedOrdersCount = useMemo(
   () =>
     orders.filter(
       (o) =>
         o.status === 'delivered' ||
         o.status === 'completed' ||
         o.status === 'تم التسليم',
     ).length,
   [orders],
 );

 const loyaltyCycleInfo = useMemo(() => {
   const cycleRules = promoRules.filter(
     (r) => r.condition_type === 'completed_orders_cycle',
   );
   const hasFirstOrderRule = promoRules.some(
     (r) => r.condition_type === 'first_order',
   );

   const activeCycleRule = cycleRules[0];
   const everyN = Math.max(
     1,
     Number(activeCycleRule?.condition_config?.every_n_orders ?? 6),
   );
   const startAfter = Math.max(
     0,
     Number(activeCycleRule?.condition_config?.start_after_completed ?? 5),
   );

   const positionInCycle = completedOrdersCount % everyN;
   const remainingForNextReward =
     positionInCycle === 0 && completedOrdersCount > 0
       ? 0
       : everyN - positionInCycle;

   const progressPercent = Math.min(
     100,
     Math.round((positionInCycle / everyN) * 100),
   );

   const isEligibleNow = Boolean(
     activeCycleRule &&
     completedOrdersCount >= startAfter &&
     completedOrdersCount > 0 &&
     completedOrdersCount % everyN === 0,
   );

   return {
     activeCycleRule,
     hasFirstOrderRule,
     everyN,
     startAfter,
     positionInCycle,
     remainingForNextReward,
     progressPercent,
     isEligibleNow,
   };
 }, [promoRules, completedOrdersCount, clientNow]);

 // حفظ تعديلات البروفايل في قاعدة البيانات
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

 // تسجيل الخروج
 const handleLogout = async () => {
   await supabase.auth.signOut();
   router.push('/');
 };

 // إلغاء الأوردر
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

 // دالة عرض شارة الحالة للأوردرات
 const getStatusBadge = (status: string) => {
   switch (status) {
     case 'pending':
       return (
         <span className='bg-amber-950/40 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 w-fit'>
           <Clock size={11} /> Pending Review
         </span>
       );
     case 'shipping':
     case 'جاري الشحن':
       return (
         <span className='bg-blue-950/40 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 w-fit'>
           <Truck size={11} /> Shipping
         </span>
       );
     case 'delivered':
     case 'تم التسليم':
       return (
         <span className='bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 w-fit'>
           <CheckCircle2 size={11} /> Delivered
         </span>
       );
     case 'cancelled':
     case 'ملغي':
       return (
         <span className='bg-red-950/40 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 w-fit'>
           <XCircle size={11} /> Cancelled
         </span>
       );
     default:
       return (
         <span className='bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold border border-slate-700'>
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
     {/* تخصيص الـ Scrollbar */}

     {/* خلفيات مضيئة جمالية */}
     <div className='fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none' />
     <div className='fixed bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none' />

     {/* شريط التنقل الرئيسي (Navbar) */}
     <nav className='bg-[#0e1626]/95 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50'>
       <div className='max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between'>
         <Link
           href='/'
           onClick={(e) => {
             if (window.location.pathname === '/') {
               e.preventDefault();
               window.scrollTo({ top: 0, behavior: 'smooth' });
             }
           }}
           className='text-sm sm:text-lg font-black flex items-center gap-2 sm:gap-3 text-white shrink-0 cursor-pointer group'
         >
           <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2px] shadow-lg shadow-red-600/20 overflow-hidden flex items-center justify-center'>
             <Image
               src='/fav-me-3.webp'
               alt='Abdo'
               width={300}
               height={300}
               className='w-full h-full object-cover object-[50%_5%] rounded-[10px] transform group-hover:scale-110 transition-transform duration-500'
             />
           </div>
           <span className='text-xs sm:text-lg font-black bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent tracking-wide'>
             Abdo Store
           </span>
         </Link>

         <div className='flex items-center gap-2'>
           <Link
             href='/'
             className='flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm'
           >
             <ArrowLeft size={14} />
             <span className='hidden sm:inline'>Storefront</span>
           </Link>
           <button
             onClick={handleLogout}
             className='flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition border border-red-500/30 shadow-sm cursor-pointer'
           >
             <LogOut size={13} />
             <span className='hidden sm:inline'>Sign Out</span>
           </button>
         </div>
       </div>
     </nav>

     {/* المحتوى الرئيسي للقسمين */}
     <main className='max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10 space-y-6 sm:space-y-8'>
       {/* ================================================= */}
       {/* السكشن الأول: فورم البيانات الشخصية وعنوان الشحن */}
       {/* ================================================= */}
       <section className='bg-[#0e1626]/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800/95 shadow-xl space-y-4'>
         <div className='border-b border-slate-800/80 pb-3 flex items-center gap-2.5'>
           <User className='w-5 h-5 text-blue-400' />
           <div>
             <h1 className='text-sm sm:text-base font-black text-white'>
               Profile & Delivery Address
             </h1>
             <p className='text-[10px] sm:text-xs text-slate-400'>
               Manage your personal information and default shipping address
             </p>
           </div>
         </div>

         {success && (
           <div className='bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-2.5 sm:p-3 rounded-xl text-xs flex items-center gap-2 backdrop-blur-md'>
             <CheckCircle2 size={15} /> Profile details saved successfully!
           </div>
         )}

         <form onSubmit={handleSaveProfile} className='space-y-3.5'>
           <div>
             <label className='block text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1'>
               Email Address
             </label>
             <div className='relative'>
               <input
                 type='text'
                 disabled
                 value={user?.email || ''}
                 className='w-full px-3.5 py-2.5 pl-10 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed'
               />
               <Mail className='w-4 h-4 absolute left-3 top-3 text-slate-600' />
             </div>
           </div>

           <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
             <div>
               <label className='block text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1'>
                 Full Name *
               </label>
               <div className='relative'>
                 <input
                   type='text'
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   className='w-full px-3.5 py-2.5 pl-10 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                   placeholder='Enter your full name'
                   required
                 />
                 <User className='w-4 h-4 absolute left-3 top-3 text-slate-400' />
               </div>
             </div>

             <div>
               <label className='block text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1'>
                 Phone Number *
               </label>
               <div className='relative'>
                 <input
                   type='tel'
                   value={phone}
                   onChange={(e) => setPhone(e.target.value)}
                   className='w-full px-3.5 py-2.5 pl-10 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                   placeholder='01012345678'
                   dir='ltr'
                   required
                 />
                 <Phone className='w-4 h-4 absolute left-3 top-3 text-slate-400' />
               </div>
             </div>
           </div>

           <div>
             <label className='block text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1'>
               Detailed Address *
             </label>
             <div className='relative'>
               <input
                 type='text'
                 value={address}
                 onChange={(e) => setAddress(e.target.value)}
                 className='w-full px-3.5 py-2.5 pl-10 bg-[#141d2f] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition'
                 placeholder='Street name / Building number / Apartment'
                 required
               />
               <MapPin className='w-4 h-4 absolute left-3 top-3 text-slate-400' />
             </div>
           </div>

           <button
             type='submit'
             disabled={saving}
             className='w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950/40 transition duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50'
           >
             {saving ? (
               <>
                 <Loader2 className='w-4 h-4 animate-spin text-white' />
                 <span>Saving Changes...</span>
               </>
             ) : (
               <>
                 <Save size={14} />
                 <span>Save Profile Details</span>
               </>
             )}
           </button>
         </form>
       </section>

       {/* ================================================= */}
       {/* السكشن الثاني: سجل الأوردرات والفواتير (مضغوط ومقاسات مدروسة) */}
       {/* ================================================= */}
       <section className='space-y-3.5'>
         <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5'>
           <div>
             <h2 className='text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2'>
               <Package className='w-4 h-4 sm:w-5 sm:h-5 text-blue-400 animate-pulse' />
               <span>Order History & Invoices</span>
             </h2>
             <p className='text-[10px] sm:text-xs text-slate-400 mt-0.5'>
               Track your past purchases, status updates, and detailed invoices
             </p>
           </div>

           <div className='flex flex-col sm:items-end gap-1'>
             <a
               href='https://wa.me/201016605189?text=Hello,%20I%20would%20like%20to%20inquire%20about%20my%20orders%20in%20the%20store'
               target='_blank'
               rel='noopener noreferrer'
               className='flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40 hover:scale-[1.02] active:scale-95 cursor-pointer'
             >
               <MessageCircle size={14} /> Contact via WhatsApp
             </a>
             <span className='text-[10px] text-emerald-400/90 font-semibold tracking-wide italic'>
               ✨ Admin will reply to you soon
             </span>
           </div>
         </div>
         {/* ============================= */}
         {/* ============================= */}
         {/* ============================= */}
         {/* ============================= */}
         {/* ============================= */}
         {/* ============================= */}

         {/* عدّاد الولاء المباشر */}
         <div className='rounded-2xl border border-slate-800/90 bg-gradient-to-br from-[#131d31] via-[#0e1626] to-[#131d31] p-4 shadow-lg space-y-3'>
           <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
             <div className='space-y-0.5'>
               <div className='flex items-center gap-2'>
                 <span className='inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm'>
                   🎁
                 </span>
                 <h3 className='text-xs sm:text-sm font-black text-white'>
                   Loyalty & Reward Counter
                 </h3>
               </div>
               <p className='text-[11px] text-slate-300 pr-9'>
                 {orders.length === 0 && loyaltyCycleInfo.hasFirstOrderRule
                   ? 'أول أوردر ليك مؤهل لعرض العميل الجديد! بعد إتمامه هيبدأ عدّاد الولاء.'
                   : loyaltyCycleInfo.isEligibleNow
                     ? `مبروك! رصيدك (${completedOrdersCount} طلب مكتمل) مؤهل لمكافأة: ${loyaltyCycleInfo.activeCycleRule?.title || 'مكافأة الولاء'}`
                     : `أتممت ${completedOrdersCount} طلب مكتمل · متبقي ${loyaltyCycleInfo.remainingForNextReward} طلب للوصول للمحطة الجاية (${loyaltyCycleInfo.positionInCycle}/${loyaltyCycleInfo.everyN})`}
               </p>
             </div>

             <div className='flex items-center gap-2 self-end sm:self-center shrink-0'>
               <span className='text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'>
                 {completedOrdersCount} Completed
               </span>
               <span className='text-[11px] font-black px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/25'>
                 {loyaltyCycleInfo.progressPercent}%
               </span>
             </div>
           </div>

           {/* شريط تقدم الدورة */}
           <div className='space-y-1'>
             <div className='h-2 w-full overflow-hidden rounded-full bg-slate-800/90 p-[1px]'>
               <div
                 className='h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-400 transition-all duration-500'
                 style={{ width: `${loyaltyCycleInfo.progressPercent}%` }}
               />
             </div>
             <div className='flex items-center justify-between text-[10px] text-slate-400 font-semibold'>
               <span>
                 الدورة: كل {loyaltyCycleInfo.everyN} طلبات مكتملة
                 {loyaltyCycleInfo.startAfter > 0
                   ? ` (يبدأ بعد ${loyaltyCycleInfo.startAfter} مكتملين)`
                   : ''}
               </span>
               <span className='text-amber-300/90'>
                 يرجى تذكير الأدمن لاعتماد المكافأة عند الطلب
               </span>
             </div>
           </div>
         </div>

         {/* ============================= */}
         {/* ============================= */}
         {/* ============================= */}
         {/* ============================= */}
         {/* ============================= */}
         {/* أزرار الفلتر الـ 5 */}
         {(() => {
           const totalCount = orders.length;
           const pendingCount = orders.filter(
             (o) => o.status === 'pending',
           ).length;
           const shippedCount = orders.filter(
             (o) =>
               o.status === 'shipped' ||
               o.status === 'shipping' ||
               o.status === 'processing',
           ).length;
           const completedCount = orders.filter(
             (o) => o.status === 'delivered' || o.status === 'completed',
           ).length;
           const cancelledCount = orders.filter(
             (o) => o.status === 'cancelled',
           ).length;

           return (
             <div className='grid grid-cols-2 sm:grid-cols-5 gap-2'>
               <button
                 type='button'
                 onClick={() => setOrderFilter('all')}
                 className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border ${
                   orderFilter === 'all'
                     ? 'bg-blue-950/40 border-blue-500/60 shadow-blue-950/30'
                     : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
                 }`}
               >
                 <div>
                   <span className='text-[9px] sm:text-[10px] text-slate-300 uppercase font-bold tracking-wider'>
                     All
                   </span>
                   <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                     {totalCount}
                   </p>
                 </div>
                 <div className='w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs'>
                   📦
                 </div>
               </button>

               <button
                 type='button'
                 onClick={() => setOrderFilter('pending')}
                 className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border ${
                   orderFilter === 'pending'
                     ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-950/30'
                     : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
                 }`}
               >
                 <div>
                   <span className='text-[9px] sm:text-[10px] text-amber-400 uppercase font-bold tracking-wider'>
                     Pending
                   </span>
                   <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                     {pendingCount}
                   </p>
                 </div>
                 <div className='w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs'>
                   ⏳
                 </div>
               </button>

               <button
                 type='button'
                 onClick={() => setOrderFilter('shipped')}
                 className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border ${
                   orderFilter === 'shipped'
                     ? 'bg-indigo-950/40 border-indigo-500/60 shadow-indigo-950/30'
                     : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
                 }`}
               >
                 <div>
                   <span className='text-[9px] sm:text-[10px] text-indigo-400 uppercase font-bold tracking-wider'>
                     Shipped
                   </span>
                   <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                     {shippedCount}
                   </p>
                 </div>
                 <div className='w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs'>
                   🚀
                 </div>
               </button>

               <button
                 type='button'
                 onClick={() => setOrderFilter('completed')}
                 className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border ${
                   orderFilter === 'completed'
                     ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/30'
                     : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
                 }`}
               >
                 <div>
                   <span className='text-[9px] sm:text-[10px] text-emerald-400 uppercase font-bold tracking-wider'>
                     Completed
                   </span>
                   <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                     {completedCount}
                   </p>
                 </div>
                 <div className='w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs'>
                   ✅
                 </div>
               </button>

               <button
                 type='button'
                 onClick={() => setOrderFilter('cancelled')}
                 className={`text-left p-2.5 rounded-xl flex items-center justify-between shadow transition-all cursor-pointer border col-span-2 sm:col-span-1 ${
                   orderFilter === 'cancelled'
                     ? 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/30'
                     : 'bg-[#131d31] border-slate-700/60 hover:border-slate-600'
                 }`}
               >
                 <div>
                   <span className='text-[9px] sm:text-[10px] text-rose-400 uppercase font-bold tracking-wider'>
                     Cancelled
                   </span>
                   <p className='text-sm sm:text-base font-black text-white mt-0.5'>
                     {cancelledCount}
                   </p>
                 </div>
                 <div className='w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-xs'>
                   ❌
                 </div>
               </button>
             </div>
           );
         })()}

         {orders.length === 0 ? (
           <div className='bg-[#131d31]/90 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/60 text-center space-y-2.5 shadow-xl'>
             <Package size={36} className='mx-auto text-slate-500' />
             <p className='text-slate-300 text-xs font-medium'>
               You haven&apos;t placed any orders yet.
             </p>
           </div>
         ) : (
           <div className='max-h-[420px] overflow-y-auto pr-1.5 space-y-3 custom-scrollbar'>
             {orders
               .filter((order) => {
                 if (orderFilter === 'all') return true;
                 if (orderFilter === 'pending')
                   return order.status === 'pending';
                 if (orderFilter === 'shipped')
                   return (
                     order.status === 'shipped' ||
                     order.status === 'shipping' ||
                     order.status === 'processing'
                   );
                 if (orderFilter === 'completed')
                   return (
                     order.status === 'delivered' ||
                     order.status === 'completed'
                   );
                 if (orderFilter === 'cancelled')
                   return order.status === 'cancelled';
                 return true;
               })
               .map((order) => {
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
                     className='bg-gradient-to-br from-[#162238] to-[#11192b] backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-slate-700/60 shadow-lg space-y-3 transition-all duration-300 hover:border-slate-600'
                   >
                     <div className='flex flex-col gap-2 border-b border-slate-700/60 pb-2.5'>
                       <div className='flex justify-between items-center'>
                         <span className='font-black text-[11px] text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-500/30'>
                           ORDER #{order.id.slice(0, 8).toUpperCase()}
                         </span>
                         {getStatusBadge(order.status)}
                       </div>

                       <div className='bg-[#0f172a] p-2.5 rounded-xl border border-slate-700/50 space-y-1 text-xs'>
                         <div className='flex items-center justify-between text-slate-200'>
                           <span className='text-slate-400'>Customer:</span>
                           <span className='font-bold text-white'>
                             {order.customer_name ||
                               order.name ||
                               'Valued Customer'}
                           </span>
                         </div>
                         <div className='flex items-center justify-between text-slate-200'>
                           <span className='text-slate-400'>Phone:</span>
                           <span className='font-semibold text-emerald-400 dir-ltr'>
                             {order.customer_phone || order.phone || 'N/A'}
                           </span>
                         </div>
                         <div className='flex items-start justify-between text-slate-200 gap-2'>
                           <span className='text-slate-400 shrink-0 flex items-center gap-1'>
                             <MapPin size={11} className='text-rose-400' />{' '}
                             Address:
                           </span>
                           <span className='text-right text-slate-200 line-clamp-1'>
                             {order.city ? `${order.city}, ` : ''}
                             {order.customer_address || 'Not Specified'}
                           </span>
                         </div>
                       </div>

                       <div className='flex justify-between items-center text-[10px] text-slate-400 px-0.5'>
                         <span>Ordered on:</span>
                         <span className='font-medium text-slate-300'>
                           {new Date(order.created_at).toLocaleString('en-US')}
                         </span>
                       </div>
                     </div>

                     <div className='flex items-center justify-between bg-[#19253d] p-2.5 rounded-xl border border-slate-700/50'>
                       <div>
                         <span className='text-[9px] text-slate-400 block uppercase font-bold tracking-wider'>
                           Total Amount
                         </span>
                         <span className='font-black text-xs sm:text-sm text-emerald-400'>
                           {order.total_amount}{' '}
                           <span className='text-[10px] text-slate-400 font-normal'>
                             EGP
                           </span>
                         </span>
                       </div>

                       {order.status === 'pending' && (
                         <button
                           onClick={() => handleCancelOrder(order.id)}
                           className='bg-red-950/50 hover:bg-red-900/70 text-red-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-500/30 transition cursor-pointer flex items-center gap-1 active:scale-95'
                           title='Cancel Order'
                         >
                           <XCircle size={13} /> Cancel
                         </button>
                       )}
                     </div>

                     <div className='space-y-1.5'>
                       <h4 className='text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between'>
                         <span>Ordered Products</span>
                         <span className='text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/20 text-[9px]'>
                           {itemsList.length} items
                         </span>
                       </h4>

                       <div className='bg-[#0f172a]/90 rounded-xl p-2 max-h-32 overflow-y-auto divide-y divide-slate-800/80 border border-slate-700/50 custom-scrollbar'>
                         {itemsList.length === 0 ? (
                           <p className='text-xs text-slate-500 py-1 text-center'>
                             No product details recorded.
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
                                 className='py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-2'
                               >
                                 <div className='flex items-center gap-2 min-w-0 flex-1'>
                                   <Image
                                     src={itemImg}
                                     alt={item.name || 'Store Item'}
                                     width={50}
                                     height={50}
                                     className='w-8 h-8 object-cover rounded-lg border border-slate-700 shrink-0 bg-slate-900'
                                   />
                                   <div className='min-w-0 flex-1'>
                                     <span className='font-bold text-slate-200 block truncate text-[11px]'>
                                       {item.name}
                                     </span>
                                     <span className='text-slate-400 text-[10px]'>
                                       Qty:{' '}
                                       <strong className='text-white'>
                                         {item.quantity}
                                       </strong>{' '}
                                       × {item.price} EGP
                                     </span>
                                   </div>
                                 </div>
                                 <span className='font-black text-white shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]'>
                                   {item.price * item.quantity} EGP
                                 </span>
                               </div>
                             );
                           })
                         )}
                       </div>
                     </div>

                     <div>
                       <a
                         href={`https://wa.me/201016605189?text=${encodeURIComponent(`Hello, I would like to modify or inquire about Order #${order.id.slice(0, 8).toUpperCase()}`)}`}
                         target='_blank'
                         rel='noopener noreferrer'
                         className='w-full bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer'
                       >
                         <MessageCircle size={13} /> Modify or Inquire via
                         WhatsApp
                       </a>
                     </div>
                   </div>
                 );
               })}
           </div>
         )}
       </section>
     </main>
   </div>
 );
}
