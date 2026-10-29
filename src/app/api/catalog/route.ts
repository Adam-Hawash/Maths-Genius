import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/catalog — brands + categories for nav, filters and home sections */
export async function GET(_req: NextRequest) {
  try {
    const [brands, categories] = await Promise.all([
      db.brand.findMany({ orderBy: { name: "asc" } }),
      db.category.findMany({ orderBy: { sort: "asc" } }),
    ]);
    return NextResponse.json({ brands, categories });
  } catch (e) {
    console.error("catalog error", e);
    return NextResponse.json({ error: "تعذر تحميل الكتالوج" }, { status: 500 });
  }
}
