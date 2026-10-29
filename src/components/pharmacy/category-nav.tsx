'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CategoryDTO } from '@/lib/types'
import { GROUP_LABELS } from '@/lib/types'

type Props = {
  categories: CategoryDTO[]
  activeGroup: string | null
  onSelectGroup: (group: string | null) => void
}

export function CategoryNav({ categories, activeGroup, onSelectGroup }: Props) {
  const groups = useMemo(() => {
    const order: string[] = []
    const counts = new Map<string, number>()
    for (const c of categories) {
      if (!counts.has(c.group)) order.push(c.group)
      counts.set(c.group, (counts.get(c.group) || 0) + 1)
    }
    return order.map((g) => ({ group: g, count: counts.get(g) || 0 }))
  }, [categories])

  return (
    <nav aria-label="تصفح الأقسام" className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4">
        <div className="ph-scroll-x flex items-center gap-2 overflow-x-auto py-2.5">
          <button
            type="button"
            onClick={() => onSelectGroup(null)}
            className={cn(
              'flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition',
              activeGroup === null
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent'
            )}
          >
            🏪 الكل
          </button>
          {groups.map(({ group, count }) => (
            <button
              key={group}
              type="button"
              onClick={() => onSelectGroup(group)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition',
                activeGroup === group
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent'
              )}
              aria-pressed={activeGroup === group}
            >
              <span>{groupEmoji(group)}</span>
              {GROUP_LABELS[group] || group}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={cn('h-5 px-1.5 text-[10px]', activeGroup === group && 'bg-white/20 text-white')}
                >
                  {count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

function groupEmoji(group: string): string {
  switch (group) {
    case 'health':
      return '🩺'
    case 'beauty':
      return '✨'
    case 'mother-baby':
      return '🍼'
    case 'devices':
      return '🩻'
    case 'personal-care':
      return '🧼'
    case 'nutrition':
      return '🥗'
    default:
      return '🏷️'
  }
}
