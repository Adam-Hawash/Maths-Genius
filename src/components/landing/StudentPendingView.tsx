'use client'

import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, ArrowRight } from 'lucide-react'

export function StudentPendingView() {
  const { currentStudent, setView, logout } = useAppStore()

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4">
      <Card className="max-w-md w-full text-center border-amber-200 dark:border-amber-800/50">
        <CardContent className="p-8 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold">انتظر موافقة المسؤول</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            مرحباً <span className="font-semibold text-foreground">{currentStudent?.name}</span>،
            طلب التسجيل الخاص بك قيد المراجعة. سيتم إشعارك فور الموافقة على حسابك.
          </p>
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">الصف:</span> <span className="font-medium">{currentStudent?.grade}</span></p>
            <p><span className="text-muted-foreground">الحالة:</span> <span className="font-medium text-amber-600 dark:text-amber-400">قيد المراجعة</span></p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={logout}>
              <ArrowRight className="h-4 w-4 ml-1" />
              تسجيل خروج
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
