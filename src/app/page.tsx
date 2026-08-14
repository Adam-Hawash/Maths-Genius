'use client'

import { useAppStore } from '@/stores/app-store'
import { Navbar } from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import FeaturesGuideSection from '@/components/landing/FeaturesGuideSection'
import { GradesSection } from '@/components/landing/GradesSection'
import TipsSection from '@/components/landing/TipsSection'
import GallerySection from '@/components/landing/GallerySection'
import { Footer } from '@/components/landing/Footer'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import { VideoProtection } from '@/components/landing/VideoProtection'
import { StudentPendingView } from '@/components/landing/StudentPendingView'
import { StudentPortal } from '@/components/student/StudentPortal'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { LoginView, RegisterView } from '@/components/landing/AuthPages'

export default function HomePage() {
  const { currentView } = useAppStore()

  const showFooter =
    currentView === 'landing'

  const showWhatsApp =
    currentView === 'landing' ||
    currentView === 'auth-login' ||
    currentView === 'auth-register'

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
