import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // تحديث الجلسة والتحقق من المستخدم
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  // استخراج الدور من user_metadata
  const userRole = user?.user_metadata?.role;

  // 1. إذا كان زائر محاولاً دخول مسار الأدمن (وليس صفحة تسجيل الدخول) وهو غير مسجل
  if (isAdminRoute && !isLoginPage && !user) {
    const loginUrl = new URL('/admin/login', request.url);
    // 💡 [تحسين UX]: حفظ المسار الذي كان يحاول زيارته للعودة إليه بعد تسجيل الدخول
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. إذا كان مستخدماً مسجلاً (لكنه customer عادي وليس admin) وحاول دخول مسار الأدمن
  if (isAdminRoute && !isLoginPage && user && userRole !== 'admin') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // 3. إذا كان المستخدم مسجلاً دخول بالفعل وحاول فتح صفحة اللوجن
  if (isLoginPage && user) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect_to');

    if (userRole === 'admin') {
      // إذا كان أدمن، نتوجه لوحة التحكم أو لصفحة العودة إن وجدت
      const targetUrl = redirectUrl || '/admin';
      return NextResponse.redirect(new URL(targetUrl, request.url));
    } else {
      // إذا كان مستخدماً عادياً (Customer) وحاول فتح صفحة اللوجن، نوجهه للرئيسية
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
