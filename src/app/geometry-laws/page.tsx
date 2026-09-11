import type { Metadata } from 'next'
import { GeometryLaws } from '@/components/landing/GeometryLaws'

export var metadata: Metadata = {
  title: 'Geometry Laws — قوانين الهندسة | Math Genius',
  description:
    'كل قوانين الهندسة في صفحة واحدة: مساحات ومحيطات كل الأشكال، الحجوم ومساحات السطح، ونظرية فيثاغورس — من منصة Math Genius مستر وائل خضير.',
}

export default function GeometryLawsPage() {
  return <GeometryLaws />
}
