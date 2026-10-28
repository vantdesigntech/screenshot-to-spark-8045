import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { PHOTO_REVIEW_COPY, type ReviewStatus } from '../types'

interface PhotoReviewBadgeProps {
  status: ReviewStatus
  compact?: boolean
  showDetails?: boolean
}

export function PhotoReviewBadge({
  status,
  compact = false,
  showDetails = false,
}: PhotoReviewBadgeProps) {
  const copy = PHOTO_REVIEW_COPY[status]

  const toneClasses: Record<ReviewStatus, string> = {
    passed_photo_review:
      'bg-success/12 text-emerald-700 border-success/25',
    pending: 'bg-primary/12 text-amber-800 border-primary/25',
    manual_review: 'bg-success/12 text-sky-800 border-success/25',
    rejected: 'bg-destructive/12 text-red-700 border-destructive/25',
  }

  const renderIcon = () => {
    switch (status) {
      case 'passed_photo_review':
        return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      case 'pending':
        return <Clock className="w-3.5 h-3.5 shrink-0" />
      case 'manual_review':
        return <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      case 'rejected':
        return <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
    }
  }

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${toneClasses[status]}`}
        title={copy.description}
      >
        {renderIcon()}
        <span>{copy.badgeLabel}</span>
      </span>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-secondary/45 p-4 md:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${toneClasses[status]}`}
        >
          {renderIcon()}
          <span>{copy.badgeLabel}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Control documental y visual (No físico)
        </span>
      </div>

      <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
        {copy.description}
      </p>

      {showDetails && (
        <div className="rounded-xl bg-background/80 border border-border/80 p-3 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-foreground">
              Límites de la revisión fotográfica:{' '}
            </span>
            {copy.limitsDisclaimer}
          </div>
        </div>
      )}
    </div>
  )
}
