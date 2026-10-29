'use client'

import { useCallback, useEffect, useState } from 'react'
import type { BrandDTO, CategoryDTO, ProductDTO, SettingsDTO } from '@/lib/types'

export function usePharmacyData() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [brands, setBrands] = useState<BrandDTO[]>([])
  const [settings, setSettings] = useState<SettingsDTO>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [pRes, cRes, bRes, sRes] = await Promise.all([
        fetch('/api/pharmacy/products', { cache: 'no-store' }),
        fetch('/api/pharmacy/categories', { cache: 'no-store' }),
        fetch('/api/pharmacy/brands', { cache: 'no-store' }),
        fetch('/api/pharmacy/settings', { cache: 'no-store' }),
      ])
      if (!pRes.ok || !cRes.ok || !bRes.ok || !sRes.ok) {
        throw new Error('network')
      }
      const [pData, cData, bData, sData] = await Promise.all([
        pRes.json(),
        cRes.json(),
        bRes.json(),
        sRes.json(),
      ])
      setProducts(pData.products || [])
      setCategories(cData.categories || [])
      setBrands(bData.brands || [])
      setSettings(sData.settings || {})
    } catch {
      setError('تعذر تحميل بيانات المتجر — تأكد من اتصالك وحاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { products, categories, brands, settings, loading, error, reload: load }
}
