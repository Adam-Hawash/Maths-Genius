'use client'

import { useAppStore } from '@/stores/app-store'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { StudentPendingView } from '@/components/landing/StudentPendingView'
import { LoginView, RegisterView } from '@/components/landing/AuthPages'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const HeroSection = dynamic(() => import('@/components/landing/HeroSection'), {
  loading: () => <div className="min-h-[70vh] bg-[#0F0D0A]" />,
})
const FeaturesGuideSection = dynamic(() => import('@/components/landing/FeaturesGuideSection'), {
  loading: () => <div className="h-20" />,
})
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection').then(function(m) { return { default: m.FeaturesSection } }), {
  loading: () => <div className="h-20" />,
})
const GradesSection = dynamic(() => import('@/components/landing/GradesSection').then(function(m) { return { default: m.GradesSection } }), {
  loading: () => <div className="h-20" />,
})
const TipsSection = dynamic(() => import('@/components/landing/TipsSection'), {
  loading: () => <div className="h-20" />,
})
const GallerySection = dynamic(() => import('@/components/landing/GallerySection'), {
  loading: () => <div className="h-20" />,
})
const WhatsAppButton = dynamic(() => import('@/components/landing/WhatsAppButton').then(m => ({ default: m.WhatsAppButton })), {
  ssr: false,
})
const VideoProtection = dynamic(() => import('@/components/landing/VideoProtection').then(m => ({ default: m.VideoProtection })), {
  ssr: false,
})
const StudentPortal = dynamic(() => import('@/components/student/StudentPortal').then(m => ({ default: m.StudentPortal })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>,
})
const AdminDashboard = dynamic(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>,
})

export default function HomePage() {
  // ✅ التحسين 6: جلب setGalleryImages من الـ store
  const { currentView, setGalleryImages } = useAppStore()

  // ✅ التحسين 6: جلب بيانات المعرض مبكراً عشان الصور تكون جاهزة
  useEffect(function() {
    fetch('/api/gallery')
      .then(function(r) { return r.json() })
      .then(function(d) { setGalleryImages(d.images || []) })
      .catch(function() {})
  }, [])

  const showFooter = currentView === 'landing'
  const showWhatsApp = currentView === 'landing' || currentView === 'auth-login' || currentView === 'auth-register'

  return (
    <div className="min-h-screen flex flex-col">
      <VideoProtection />
      <Navbar />

      {currentView === 'landing' && (
        <main className="flex-1">
          <HeroSection />
          <FeaturesGuideSection />
          <FeaturesSection />
          <GradesSection />
          <TipsSection />
          <GallerySection />
        </main>
      )}

      {currentView === 'auth-login' && (
        <main className="flex-1">
          <LoginView />
        </main>
      )}

      {currentView === 'auth-register' && (
        <main className="flex-1">
          <RegisterView />
        </main>
      )}

      {currentView === 'student-pending' && <StudentPendingView />}
      {currentView === 'student-portal' && <StudentPortal />}
      {currentView === 'admin-dashboard' && <AdminDashboard />}

      {showFooter && <Footer />}
      {showWhatsApp && <WhatsAppButton />}
    </div>
  )
}
