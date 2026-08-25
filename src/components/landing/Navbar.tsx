'use client'

import { useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/stores/app-store'
import {
  Sun,
  Moon,
  LogOut,
  UserPlus,
  LogIn,
  Menu,
  X,
  Loader2,
  LayoutDashboard,
  Shield,
  Youtube,
} from 'lucide-react'
import { toast } from 'sonner'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const emptySubscribe = () => () => {}
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [mobileMenu, setMobileMenu] = useState(false)

  const {
    currentView,
    setView,
    showAdminLogin,
    setShowAdminLogin,
    currentStudent,
    currentAdmin,
    isAdminLoggedIn,
    setCurrentAdmin,
    setAdminLoggedIn,
    logout,
    siteConfig,
  } = useAppStore()

  const cfg = siteConfig
  const instructorPhoto = cfg.instructor_photo || ''
  const youtubeLink = cfg.social_youtube || ''
  const navBrand = cfg.navbar_brand || 'Maths Genius'
  const navSubtitle = cfg.navbar_subtitle || 'مستر وائل خضير'

  const isAuthenticated = !!currentStudent || isAdminLoggedIn
  const isAuthPage = currentView === 'auth-login' || currentView === 'auth-register'

  const handleLogout = () => {
    logout()
    setMobileMenu(false)
    toast.success('تم تسجيل الخروج')
  }

  const handleGoHome = () => {
    if (currentAdmin && isAdminLoggedIn) return
    setView('landing')
    setMobileMenu(false)
  }

  const handleLoginClick = () => {
    setView('auth-login')
    setMobileMenu(false)
  }

  const handleRegisterClick = () => {
    setView('auth-register')
    setMobileMenu(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0F0D0A]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand - Right side (RTL start) */}
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 transition-opacity hover:opacity-80 cursor-pointer"
          >
            {instructorPhoto ? (
              <Image
                src={instructorPhoto}
                alt="مستر وائل خضير"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-cover border border-[#C49A38]/30"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C49A38] text-white">
                <span className="text-xs font-bold">MG</span>
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold leading-tight text-white">
                {navBrand}
              </h1>
              <p className="text-[11px] text-white/40 leading-tight">
                {navSubtitle}
              </p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {currentStudent ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50">
                  أهلاً بـ{' '}
                  <span className="font-semibold text-white">
                    {currentStudent.name}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] border-white/10 text-white/70 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 ml-1" />
                  خروج
                </Button>
              </div>
            ) : isAdminLoggedIn && currentAdmin ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] text-white/70 hover:text-white"
                  onClick={() => setView('admin-dashboard')}
                >
                  <LayoutDashboard className="h-4 w-4 ml-1" />
                  لوحة التحكم
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] border-white/10 text-white/70 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 ml-1" />
                  خروج
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] border-white/10 text-white/70 hover:text-white"
                  onClick={handleLoginClick}
                >
                  <LogIn className="h-4 w-4 ml-1" />
                  سجل دخولك
                </Button>
                <Button
                  size="sm"
                  className="min-h-[44px] bg-[#C49A38] hover:bg-[#D4A843] text-white"
                  onClick={handleRegisterClick}
                >
                  <UserPlus className="h-4 w-4 ml-1" />
                  اعمل حساب
                </Button>
                {/* Discreet Admin Entry - hidden for auth pages */}
                {!isAuthPage && (
                  <button
                    onClick={() => setShowAdminLogin(true)}
                    className="text-[10px] text-white/15 hover:text-white/40 transition-colors cursor-pointer px-1"
                    aria-label="Admin"
                  >
                    Admin
                  </button>
                )}
              </>
            )}
          </nav>

          {/* YouTube + Theme Toggle + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {youtubeLink && (
              <a
                href={youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-white/40 hover:text-red-400 transition-colors"
                title="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            )}

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] text-white/40 hover:text-white"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-h-[44px] min-w-[44px] text-white/60 hover:text-white"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label={mobileMenu ? 'اقفل القائمة' : 'افتح القائمة'}
            >
              {mobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-white/5 bg-[#0F0D0A]/95 backdrop-blur-md px-4 py-3 space-y-2">
            {currentStudent ? (
              <>
                <p className="text-sm text-white/50 py-2">
                  أهلاً بـ{' '}
                  <span className="font-semibold text-white">
                    {currentStudent.name}
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] border-white/10 text-white/70"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 ml-1" />
                  خروج
                </Button>
              </>
            ) : isAdminLoggedIn && currentAdmin ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full min-h-[44px] justify-start text-white/70 hover:text-white"
                  onClick={() => {
                    setView('admin-dashboard')
                    setMobileMenu(false)
                  }}
                >
                  <LayoutDashboard className="h-4 w-4 ml-2" />
                  لوحة التحكم
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] border-white/10 text-white/70"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 ml-1" />
                  خروج
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] border-white/10 text-white/70"
                  onClick={handleLoginClick}
                >
                  <LogIn className="h-4 w-4 ml-1" />
                  سجل دخولك
                </Button>
                <Button
                  size="sm"
                  className="w-full min-h-[44px] bg-[#C49A38] hover:bg-[#D4A843] text-white"
                  onClick={handleRegisterClick}
                >
                  <UserPlus className="h-4 w-4 ml-1" />
                  اعمل حساب
                </Button>
                {!isAuthPage && (
                  <button
                    onClick={() => {
                      setShowAdminLogin(true)
                      setMobileMenu(false)
                    }}
                    className="w-full text-center text-[10px] text-white/15 hover:text-white/40 py-2 transition-colors cursor-pointer"
                  >
                    Admin
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </header>

      {/* Admin Login Dialog */}
      <AdminLoginDialog />
    </>
  )
}

function AdminLoginDialog() {
  const {
    showAdminLogin,
    setShowAdminLogin,
    setCurrentAdmin,
    setAdminLoggedIn,
    setView,
  } = useAppStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('اكتب الايميل والباسورد')
      return
    }
    if (loading) return
    setLoading(true)
    setStatusMsg('بيحاول يوصل بالسيرفر...')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      setStatusMsg('بيحقق من البيانات...')
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (res.ok) {
        setStatusMsg('بيحمل لوحة التحكم...')
        setCurrentAdmin(data.admin)
        setAdminLoggedIn(true)
        setShowAdminLogin(false)
        setView('admin-dashboard')
        toast.success('أهلاً بيك في لوحة التحكم')
      } else {
        toast.error(data.error || 'البيانات غلط')
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error('الانترنت بطيء شوية... حاول تاني')
      } else {
        toast.error('حصل مشكلة في الاتصال')
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
      setStatusMsg('')
    }
  }

  return (
    <Dialog open={showAdminLogin} onOpenChange={(open) => { if (!loading) setShowAdminLogin(open) }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-[#C49A38]" />
            دخول المشرفين
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="admin-dialog-email" className="text-white">
              الايميل
            </Label>
            <Input
              id="admin-dialog-email"
              type="email"
              placeholder="البريد الالكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleLogin()}
              dir="ltr"
              className="min-h-[44px] bg-white/5 border-white/10 text-white"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-dialog-password" className="text-white">
              الباسورد
            </Label>
            <Input
              id="admin-dialog-password"
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleLogin()}
              dir="ltr"
              className="min-h-[44px] bg-white/5 border-white/10 text-white"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          {statusMsg && (
            <p className="text-xs text-center text-white/40 animate-pulse">{statusMsg}</p>
          )}
          <Button
            className="w-full min-h-[44px] font-semibold bg-[#C49A38] hover:bg-[#D4A843] text-white"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                بيسجل دخول...
              </>
            ) : (
              'دخول لوحة التحكم'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
