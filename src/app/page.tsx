'use client'

import { useAppStore } from '@/stores/app-store'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { StudentPendingView } from '@/components/landing/StudentPendingView'
import { StudentPaymentView } from '@/components/landing/StudentPaymentView'
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
const LessonsSection = dynamic(() => import('@/components/landing/LessonsSection'), {
  loading: () => <div className="h-20" />,
  ssr: false,
})
const WhatsAppButton = dynamic(() => import('@/components/landing/WhatsAppButton').then(m => ({ default: m.WhatsAppButton })), {
  ssr: false,
})
const VideoProtection = dynamic(() => import('@/components/landing/VideoProtection').then(m => ({ default: m.VideoProtection })), {
  ssr: false,
})
const StudentPortal = dynamic(() => import('@/components/student/StudentPortal').then(m => ({ default: m.default || m.StudentPortal })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>,
})
const AdminDashboard = dynamic(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.default || m.AdminDashboard })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>,
})

export default function HomePage() {
  var store = useAppStore()
  var currentView = store.currentView || 'landing'
  var setGalleryImages = (store as any).setGalleryImages || function(){}
  var siteConfig = store.siteConfig || {}
  var configLoaded = store.configLoaded
  var setSiteConfig = store.setSiteConfig
  var setConfigLoaded = store.setConfigLoaded
  var setStats = store.setStats

  // Load config + gallery + stats on mount — NON-BLOCKING, page renders immediately
  useEffect(function() {
    // Use server-injected config as instant fallback
    if (typeof window !== 'undefined' && (window as any).__INITIAL_CONFIG__) {
      var injected = (window as any).__INITIAL_CONFIG__
      if (injected && Object.keys(injected).length > 0 && !configLoaded) {
        setSiteConfig(injected)
        setConfigLoaded(true)
      }
    }

    // Fetch fresh data in background (non-blocking)
    Promise.all([
      fetch('/api/config').then(function(r) { return r.json() }).catch(function() { return {} }),
      fetch('/api/gallery').then(function(r) { return r.json() }).catch(function() { return {} }),
      fetch('/api/stats').then(function(r) { return r.json() }).catch(function() { return {} }),
    ]).then(function(results) {
      var cfg = results[0]
      var gal = results[1]
      var sta = results[2]
      // Defensive: if config API returned error shape, unwrap defaults
      if (cfg && cfg.error && cfg.defaults) {
        console.warn('page.tsx: config API returned error shape, using defaults')
        cfg = cfg.defaults
      }
      if (cfg && Object.keys(cfg).length > 0) {
        setSiteConfig(cfg)
        setConfigLoaded(true)
      }
      if (gal && gal.images) {
        setGalleryImages(gal.images)
      }
      if (sta && sta.stats) {
        setStats(sta.stats)
      }
    })
  }, [])

  var showFooter = currentView === 'landing'
  var showWhatsApp = currentView === 'landing' || currentView === 'auth-login' || currentView === 'auth-register'

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
          <LessonsSection />
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
      {currentView === 'student-payment' && <StudentPaymentView />}
      {currentView === 'admin-dashboard' && <AdminDashboard />}

      {showFooter && <Footer />}
      {showWhatsApp && <WhatsAppButton />}
    </div>
  )
}
