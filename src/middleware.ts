import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAdminHostname } from "@/lib/site";

function isAdminHost(host: string) {
  return isAdminHostname(host);
}

function isPublicAdminPath(pathname: string) {
  return (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/admin/forgot" ||
    pathname.startsWith("/admin/forgot/") ||
    pathname === "/admin/update-password" ||
    pathname.startsWith("/admin/update-password/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/api/")
  );
}

function isPublicAccountPath(pathname: string) {
  return (
    pathname === "/account/login" ||
    pathname.startsWith("/account/login/") ||
    pathname === "/account/signup" ||
    pathname.startsWith("/account/signup/") ||
    pathname === "/account/forgot" ||
    pathname.startsWith("/account/forgot/") ||
    pathname === "/account/update-password" ||
    pathname.startsWith("/account/update-password/")
  );
}

function markAdminRequest(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-flobites-admin", "1");
  return requestHeaders;
}

function nextAdmin(request: NextRequest, base?: NextResponse) {
  const requestHeaders = markAdminRequest(request);
  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  if (base) {
    base.cookies.getAll().forEach((c) => res.cookies.set(c.name, c.value));
  }
  res.headers.set("x-flobites-admin", "1");
  return res;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => to.cookies.set(c.name, c.value));
  return to;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const adminHost = isAdminHost(host);
  const onAdminTree = adminHost || pathname.startsWith("/admin");

  if (adminHost && (pathname === "/" || pathname === "")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    const requestHeaders = markAdminRequest(request);
    const res = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    res.headers.set("x-flobites-admin", "1");
    return res;
  }

  if (
    adminHost &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/images") &&
    !pathname.startsWith("/favicon")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    const requestHeaders = markAdminRequest(request);
    const res = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    res.headers.set("x-flobites-admin", "1");
    return res;
  }

  // Storefront: refresh auth cookies + protect /account/*
  if (!onAdminTree) {
    const { supabaseResponse, user } = await updateSession(request);

    if (pathname.startsWith("/account")) {
      const publicAuth = isPublicAccountPath(pathname);

      if (!publicAuth && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/account/login";
        url.searchParams.set("next", pathname);
        return copyCookies(supabaseResponse, NextResponse.redirect(url));
      }

      if (
        user &&
        (pathname.startsWith("/account/login") ||
          pathname.startsWith("/account/signup") ||
          pathname.startsWith("/account/forgot"))
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/account";
        url.search = "";
        return copyCookies(supabaseResponse, NextResponse.redirect(url));
      }
    }

    return supabaseResponse;
  }

  if (isPublicAdminPath(pathname)) {
    const { supabaseResponse, user, supabase } = await updateSession(request);
    if (
      user &&
      pathname.startsWith("/admin/login") &&
      !pathname.startsWith("/admin/update-password") &&
      supabase
    ) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, is_active")
        .eq("id", user.id)
        .maybeSingle();

      const isStaff =
        profile?.is_active === true &&
        (profile.role === "admin" || profile.role === "staff");

      // Only staff go to the dashboard — non-staff must not bounce /admin ↔ /admin/login.
      if (isStaff) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        url.search = "";
        const res = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((c) => {
          res.cookies.set(c.name, c.value);
        });
        res.headers.set("x-flobites-admin", "1");
        return res;
      }
    }
    return nextAdmin(request, supabaseResponse);
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set(
      "next",
      pathname.startsWith("/admin") ? pathname : "/admin",
    );
    const res = NextResponse.redirect(url);
    res.headers.set("x-flobites-admin", "1");
    return res;
  }

  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    const isStaff =
      profile?.is_active === true &&
      (profile.role === "admin" || profile.role === "staff");

    if (!isStaff) {
      // Break redirect loop: sign out non-staff and send them to the storefront account.
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      const res = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => {
        res.cookies.set(c.name, c.value);
      });
      return res;
    }
  }

  return nextAdmin(request, supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
