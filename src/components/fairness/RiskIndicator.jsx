import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * RiskIndicator - Traffic light system for fairness metrics
 * 🟢 Green: Fair (< 0.1)
 * 🟡 Yellow: Moderate concern (0.1 - 0.2)
 * 🔴 Red: High risk (> 0.2)
 */
export function RiskIndicator({ value, metricName }) {
  const absValue = Math.abs(value)
  
  let level, color, icon, message, bgColor, textColor
  
  if (absValue < 0.1) {
    level = 'low'
    color = 'text-green-600'
    bgColor = 'bg-green-50'
    textColor = 'text-green-800'
    icon = <CheckCircle className="h-5 w-5" />
    message = 'Fair - No significant bias detected'
  } else if (absValue < 0.2) {
    level = 'moderate'
    color = 'text-yellow-600'
    bgColor = 'bg-yellow-50'
    textColor = 'text-yellow-800'
    icon = <AlertTriangle className="h-5 w-5" />
    message = 'Moderate Concern - Some bias detected'
  } else {
    level = 'high'
    color = 'text-red-600'
    bgColor = 'bg-red-50'
    textColor = 'text-red-800'
    icon = <AlertCircle className="h-5 w-5" />
    message = 'High Risk - Significant bias detected'
  }
  
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', bgColor)}>
      <div className={color}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className={cn('font-medium text-sm', textColor)}>
            {message}
          </span>
          <span className={cn('text-sm font-mono', textColor)}>
            {value.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Simple badge version for compact display
 */
export function RiskBadge({ value }) {
  const absValue = Math.abs(value)
  
  if (absValue < 0.1) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✓ Fair
      </span>
    )
  } else if (absValue < 0.2) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        ⚠ Moderate
      </span>
    )
  } else {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        ✕ High Risk
      </span>
    )
  }
}

