'use client'

import { useEffect, useState } from 'react'
import { useAppStore, GRADES } from '@/stores/app-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Lock, PlayCircle } from 'lucide-react'
import Image from 'next/image'

export default function LessonsSection() {
  var store = useAppStore()
  var setView = store.setView
  var [videos, setVideos] = useState<any[]>([])
  var [loading, setLoading] = useState(true)
  var [selectedGrade, setSelectedGrade] = useState('')

  var getYouTubeId = function(url) {
    var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/)
    return match ? match[1] : null
  }

  useEffect(function() {
    setLoading(true)
    var params = new URLSearchParams({ pageSize: '12' })
    if (selectedGrade) params.set('grade', selectedGrade)
    fetch('/api/videos?' + params.toString())
      .then(function(r) { return r.json() })
      .then(function(data) { setVideos(data.videos || []) })
      .catch(function() {})
      .finally(function() { setLoading(false) })
  }, [selectedGrade])

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0F0D0A]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-[#C49A38]/10 text-[#E5BE5A] border-[#C49A38]/30 hover:bg-[#C49A38]/20">
            <BookOpen className="h-3.5 w-3.5 ml-1" />الدروس
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">الدروس المتاحة</h2>
          <p className="text-white/50 max-w-xl mx-auto">اختر درسك وابدأ التعلم. سجل دخولك للوصول للمحتوى الكامل.</p>
        </div>

        {/* Grade Filter */}
        <div className="flex justify-center mb-8">
          <select
            value={selectedGrade}
            onChange={function(e) { setSelectedGrade(e.target.value) }}
            className="h-10 rounded-lg border border-[#C49A38]/30 bg-[#1A1714] text-[#E5BE5A] px-4 text-sm appearance-none cursor-pointer"
          >
            <option value="">كل الصفوف</option>
            {GRADES.map(function(g) { return <option key={g} value={g}>{g}</option> })}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-[#C49A38] border-t-transparent rounded-full" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30">لا توجد دروس متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map(function(v) {
              var ytId = getYouTubeId(v.url)
              var thumb = v.thumbnail || (ytId ? 'https://img.youtube.com/vi/' + ytId + '/mqdefault.jpg' : null)
              return (
                <Card
                  key={v.id}
                  className="bg-[#1A1714] border-[#C49A38]/20 overflow-hidden cursor-pointer group hover:border-[#C49A38]/50 transition-all hover:shadow-lg hover:shadow-[#C49A38]/5"
                  onClick={function() { setView('auth-login') }}
                >
                  <div className="relative aspect-video bg-black/50">
                    {thumb ? (
                      <Image src={thumb} alt={v.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="300px" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><PlayCircle className="h-10 w-10 text-white/20" /></div>
                    )}
                    {/* Lock Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-[#C49A38]/90 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    {/* Price Badge */}
                    {v.price > 0 && (
                      <Badge className="absolute top-2 left-2 bg-[#C49A38] text-white border-0 text-[10px]">
                        {v.price} ج.م
                      </Badge>
                    )}
                    {v.price === 0 && (
                      <Badge className="absolute top-2 left-2 bg-emerald-500/90 text-white border-0 text-[10px]">
                        مجاني
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="font-semibold text-sm text-white truncate group-hover:text-[#E5BE5A] transition-colors">{v.title}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] border-[#C49A38]/30 text-[#C49A38]">{v.grade}</Badge>
                      <div className="flex items-center gap-1 text-[10px] text-white/30">
                        <Lock className="h-3 w-3" />
                        <span>سجل دخولك</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
