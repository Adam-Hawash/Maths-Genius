import { NextResponse } from "next/server";
var MAX_BYTES = 250 * 1024 * 1024;
function isBlockedHost(hostname) {
  var h = String(hostname || "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal"))
    return true;
  var m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    var a = parseInt(m[1], 10);
    var b = parseInt(m[2], 10);
    if (a === 127 || a === 10 || a === 0)
      return true;
    if (a === 172 && b >= 16 && b <= 31)
      return true;
    if (a === 192 && b === 168)
      return true;
    if (a === 169 && b === 254)
      return true;
  }
  return false;
}
export async function GET(request) {
  try {
    var url = new URL(request.url).searchParams.get("url") || "";
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "لينك غير صالح" }, { status: 400 });
    }
    var parsed = new URL(url);
    if (isBlockedHost(parsed.hostname)) {
      return NextResponse.json({ error: "اللينك غير مسموح" }, { status: 400 });
    }
    var upstream = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (books-proxy)" },
      redirect: "follow",
      cache: "no-store"
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "مقدرتش أجيب الملف من اللينك (" + upstream.status + ")" }, { status: 502 });
    }
    var len = parseInt(String(upstream.headers.get("content-length") || ""), 10);
    if (!isNaN(len) && len > MAX_BYTES) {
      return NextResponse.json({ error: "الملف أكبر من الحد المسموح (250MB)" }, { status: 413 });
    }
    var headers = new Headers;
    headers.set("Content-Type", upstream.headers.get("content-type") || "application/pdf");
    if (!isNaN(len))
      headers.set("Content-Length", String(len));
    headers.set("Cache-Control", "no-store");
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (e) {
    console.error("[books-proxy] error:", e);
    return NextResponse.json({ error: "فشل تحميل الملف من اللينك" }, { status: 500 });
  }
}
