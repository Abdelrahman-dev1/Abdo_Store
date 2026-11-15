import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          // تم تمرير الـ options هنا لضمان حفظ إعدادات الكوكيز بشكل صحيح وآمن
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // تحديث الجلسة وجلب المستخدم الحالي (يُفضل استخدام getUser للأمان العالي)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isLoginPage = pathname === '/admin/login';

  // 1. حماية مسارات الـ Admin والتأكد من الصلاحيات
  if (isAdminRoute) {
    if (error || !user) {
      // توجيه لصفحة الدخول مع حفظ الصفحة الأصلية للعودة إليها لاحقاً
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect_to', pathname);
      return NextResponse.redirect(url);
    }

    // 🛡️ [إضافة احترافية]: التحقق مما إذا كان المستخدم يملك صلاحية الأدمن فعلياً
    // يمكنك جلب الدور من user_metadata أو من جدول profiles في قاعدة البيانات
    const userRole = user.app_metadata?.role || user.user_metadata?.role;

    if (userRole !== 'admin') {
      // إذا كان مسجلاً دخولاً لكنه ليس أدمن، نحوله لصفحة غير مسموح أو الرئيسية
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized'; // أو يمكنك توجيهه للرئيسية '/'
      return NextResponse.redirect(url);
    }
  }

  // 2. إذا كان المستخدم مسجلاً دخولاً بالفعل وحاول دخول صفحة تسجيل الدخول، نوجهه للوحة التحكم مباشرة
  if (isLoginPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * مطابقة جميع المسارات التي تبدأ بـ admin لتطبيق الحماية عليها
     * ويمكنك توسيع النطاق لاحقاً حسب الحاجة
     */
    '/admin/:path*',
  ],
};
