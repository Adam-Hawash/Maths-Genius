import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/products
 * Query: q, category, brand (csv), skinType (csv), sale=1, featured=1, isNew=1,
 *        min, max, sort (newest|price-asc|price-desc|rating), limit, offset
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() || "";
    const category = sp.get("category") || "";
    const brandCsv = sp.get("brand") || "";
    const skinCsv = sp.get("skinType") || "";
    const sale = sp.get("sale") === "1";
    const featured = sp.get("featured") === "1";
    const isNew = sp.get("isNew") === "1";
    const min = parseFloat(sp.get("min") || "");
    const max = parseFloat(sp.get("max") || "");
    const sort = sp.get("sort") || "newest";
    const limit = Math.min(parseInt(sp.get("limit") || "60", 10) || 60, 100);
    const offset = parseInt(sp.get("offset") || "0", 10) || 0;

    const where: Prisma.ProductWhereInput = { active: true };
    if (q) {
      where.OR = [
        { nameAr: { contains: q } },
        { nameEn: { contains: q } },
        { descAr: { contains: q } },
        { descEn: { contains: q } },
        { brand: { is: { OR: [{ name: { contains: q } }, { nameAr: { contains: q } }] } } },
      ];
    }
    if (category) where.category = { is: { slug: category } };
    const brandSlugs = brandCsv.split(",").map((s) => s.trim()).filter(Boolean);
    if (brandSlugs.length) where.brand = { is: { slug: { in: brandSlugs } } };
    const skins = skinCsv.split(",").map((s) => s.trim()).filter(Boolean);
    if (skins.length) where.skinType = { in: skins };
    if (sale) where.compareAtPrice = { not: null, gt: 0 };
    if (featured) where.featured = true;
    if (isNew) where.isNew = true;
    if (!Number.isNaN(min) || !Number.isNaN(max)) {
      where.price = {};
      if (!Number.isNaN(min)) where.price.gte = min;
      if (!Number.isNaN(max)) where.price.lte = max;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price-asc" ? { price: "asc" }
      : sort === "price-desc" ? { price: "desc" }
      : sort === "rating" ? { rating: "desc" }
      : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          brand: { select: { slug: true, name: true, nameAr: true, color: true } },
          category: { select: { slug: true, nameAr: true, nameEn: true, group: true, icon: true } },
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({ products, total });
  } catch (e) {
    console.error("products error", e);
    return NextResponse.json({ error: "تعذر تحميل المنتجات" }, { status: 500 });
  }
}
