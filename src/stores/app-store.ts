import { create } from 'zustand'

// ===== Grades Data =====
export const GRADES = [
  'الصف السادس الابتدائي',
  'الصف الأول الاعدادي',
  'الصف الثاني الاعدادي',
  'الصف الثالث الاعدادي',
  'أولى بكالوريا',
] as const

// ===== View Types =====
export type AppView =
  | 'landing'
  | 'auth-login'
  | 'auth-register'
  | 'student-pending'
  | 'student-portal'
  | 'student-payment-pending'
  | 'admin-dashboard'

// ===== Original Types =====
export interface Student {
  id: string
  name: string
  phone: string
  grade: string
  status: string
  parentName: string
  parentPhone: string
  loginCount: number
  lastLogin: string | null
  watchedVideoCount?: number
  createdAt: string
  updatedAt: string
}

export interface Admin {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface GalleryImage {
  id: string
  title: string
  filePath: string
  type: string
  videoUrl: string
  sortOrder: number
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  grade: string
  createdAt: string
}

export interface Discussion {
  id: string
  studentId: string
  studentName: string
  grade: string
  content: string
  isAdminReply: boolean
  createdAt: string
}

export interface StudentActivity {
  id: string
  studentId: string
  action: string
  details: string
  createdAt: string
  student?: { name: string; grade: string; phone: string; status: string }
}

export interface Stats {
  totalStudents: number
  pendingStudents: number
  approvedStudents: number
  totalVideos: number
  totalHomework: number
  totalExams: number
  totalAnnouncements: number
  totalDiscussions: number
  grades: string[]
}

export interface SiteConfig {
  [key: string]: string
}

export interface SocialLinks {
  social_facebook: string
  social_whatsapp_channel: string
  social_instagram: string
  social_youtube: string
}

// ===== New Types (Homework/Exam System) =====
export interface Video {
  id: string
  title: string
  description?: string
  url: string
  thumbnailUrl?: string
  subject?: string
  grade?: string
  order: number
  isPublished: boolean
  price?: number
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation?: string
  homeworkId?: string
  examId?: string
}

export interface Homework {
  id: string
  title: string
  description?: string
  subject?: string
  grade?: string
  dueDate?: string
  isPublished: boolean
  questions?: Question[]
  createdAt: string
  updatedAt: string
}

export interface Exam {
  id: string
  title: string
  description?: string
  subject?: string
  grade?: string
  duration?: number
  isPublished: boolean
  questions?: Question[]
  createdAt: string
  updatedAt: string
}

export interface HomeworkResult {
  id: string
  studentId: string
  homeworkId: string
  score: number
  totalQuestions: number
  questionDetails: string
  createdAt: string
  student?: any
}

export interface ExamResult {
  id: string
  studentId: string
  examId: string
  score: number
  totalQuestions: number
  questionDetails: string
  createdAt: string
  student?: any
}

export interface Payment {
  id: string
  studentId: string
  videoId: string
  method: string
  amount: number
  receiptPath?: string
  status: string
  adminNote?: string
  createdAt: string
  updatedAt: string
  student?: any
  video?: Video
}

// ===== Store Interface =====
interface AppState {
  // Navigation
  currentView: AppView
  setView: (view: AppView) => void

  // Auth - Student
  currentStudent: Student | null
  setCurrentStudent: (student: Student | null) => void

  // Auth - Admin
  currentAdmin: Admin | null
  setCurrentAdmin: (admin: Admin | null) => void
  isAdminLoggedIn: boolean
  setAdminLoggedIn: (v: boolean) => void

  // Auth - UI state
  showStudentLogin: boolean
  setShowStudentLogin: (v: boolean) => void
  showStudentRegister: boolean
  setShowStudentRegister: (v: boolean) => void
  showAdminLogin: boolean
  setShowAdminLogin: (v: boolean) => void

  // Tab state
  adminTab: string
  setAdminTab: (tab: string) => void
  studentTab: string
  setStudentTab: (tab: string) => void

  // Site Config
  siteConfig: SiteConfig
  setSiteConfig: (config: SiteConfig) => void
  configLoaded: boolean
  setConfigLoaded: (v: boolean) => void

  // Social Links
  socialLinks: SocialLinks
  setSocialLinks: (links: SocialLinks) => void

  // Stats
  stats: Stats | null
  setStats: (stats: Stats | null) => void

  // Gallery
  galleryImages: GalleryImage[]
  setGalleryImages: (images: GalleryImage[]) => void

  // User alias (used by StudentPortal & AdminDashboard)
  user: any
  setUser: (user: any) => void

  // Logout
  logout: () => void
}

// ===== Store =====
export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'landing',
  setView: (view) => set({ currentView: view }),

  // Auth - Student
  currentStudent: null,
  setCurrentStudent: (student) => set({ currentStudent: student, user: student }),

  // Auth - Admin
  currentAdmin: null,
  setCurrentAdmin: (admin) => set({ currentAdmin: admin, user: admin }),
  isAdminLoggedIn: false,
  setAdminLoggedIn: (v) => set({ isAdminLoggedIn: v }),

  // Auth - UI state
  showStudentLogin: false,
  setShowStudentLogin: (v) => set({ showStudentLogin: v }),
  showStudentRegister: false,
  setShowStudentRegister: (v) => set({ showStudentRegister: v }),
  showAdminLogin: false,
  setShowAdminLogin: (v) => set({ showAdminLogin: v }),

  // Tab state
  adminTab: 'students',
  setAdminTab: (tab) => set({ adminTab: tab }),
  studentTab: 'videos',
  setStudentTab: (tab) => set({ studentTab: tab }),

  // Site Config
  siteConfig: {},
  setSiteConfig: (config) => set({ siteConfig: config }),
  configLoaded: false,
  setConfigLoaded: (v) => set({ configLoaded: v }),

  // Social Links
  socialLinks: {
    social_facebook: '',
    social_whatsapp_channel: '',
    social_instagram: '',
    social_youtube: '',
  },
  setSocialLinks: (links) => set({ socialLinks: links }),

  // Stats
  stats: null,
  setStats: (stats) => set({ stats }),

  // Gallery
  galleryImages: [],
  setGalleryImages: (images) => set({ galleryImages: images }),

  // User alias
  user: null,
  setUser: (user) => set({ user }),

  // Logout
  logout: () =>
    set({
      currentStudent: null,
      currentAdmin: null,
      user: null,
      isAdminLoggedIn: false,
      currentView: 'landing',
      adminTab: 'students',
      studentTab: 'videos',
      showStudentLogin: false,
      showStudentRegister: false,
      showAdminLogin: false,
    }),
}))
