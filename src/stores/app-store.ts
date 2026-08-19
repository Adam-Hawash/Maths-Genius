import { create } from 'zustand';

// ===== Grades Data =====
export const GRADES = [
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'اولي بكالوريا',
];

// ===== Types =====
export type AppView =
  | 'landing'
  | 'login'
  | 'admin'
  | 'student-portal'
  | 'student-payment-pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  grade?: string;
  createdAt?: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  subject?: string;
  grade?: string;
  order: number;
  isPublished: boolean;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  homeworkId?: string;
  examId?: string;
}

export interface Homework {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  dueDate?: string;
  isPublished: boolean;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  duration?: number;
  isPublished: boolean;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkResult {
  id: string;
  studentId: string;
  homeworkId: string;
  score: number;
  totalQuestions: number;
  questionDetails: string;
  createdAt: string;
  student?: User;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  totalQuestions: number;
  questionDetails: string;
  createdAt: string;
  student?: User;
}

export interface Payment {
  id: string;
  studentId: string;
  videoId: string;
  method: string;
  amount: number;
  receiptPath?: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  student?: User;
  video?: Video;
}

export interface SiteConfig {
  id: string;
  key: string;
  value: string;
}

// ===== Store Interface =====
interface AppState {
  user: User | null;
  view: AppView;

  setUser: (user: User | null) => void;
  setView: (view: AppView) => void;
  logout: () => void;
}

// ===== Store =====
export const useAppStore = create<AppState>((set) => ({
  user: null,
  view: 'landing',

  setUser: (user) => set({ user }),
  setView: (view) => set({ view }),
  logout: () => set({ user: null, view: 'landing' }),
}));
