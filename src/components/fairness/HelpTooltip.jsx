import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.jsx'

/**
 * HelpTooltip - Provides plain-language explanations for technical terms
 */
export function HelpTooltip({ term, explanation, example }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center ml-1 text-gray-500 hover:text-gray-700">
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{term}</p>
            <p className="text-sm text-gray-700">{explanation}</p>
            {example && (
              <p className="text-xs text-gray-600 italic border-l-2 border-blue-300 pl-2">
                Example: {example}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Pre-defined tooltips for common fairness metrics
export const FAIRNESS_TOOLTIPS = {
  demographic_parity: {
    term: "Equal Treatment",
    explanation: "Measures whether different groups (like different races or genders) receive positive outcomes at similar rates. A score close to 0 means groups are treated equally.",
    example: "If 50% of Group A gets approved but only 30% of Group B, the difference is 0.20, indicating unfair treatment."
  },
  equal_opportunity: {
    term: "Equal Opportunity",
    explanation: "Checks if qualified individuals from all groups have an equal chance of receiving positive outcomes. Focuses on people who deserve the positive outcome.",
    example: "Among people who should get approved, do all groups get approved at the same rate?"
  },
  equalized_odds: {
    term: "Balanced Accuracy",
    explanation: "Ensures the system makes correct and incorrect decisions at similar rates across all groups. Both benefits and mistakes should be distributed fairly.",
    example: "The system shouldn't be more accurate for one group than another."
  },
  disparate_impact: {
    term: "Impact Ratio",
    explanation: "Legal standard that compares selection rates between groups. A ratio below 0.8 (80%) may indicate discrimination.",
    example: "If Group A has 60% approval and Group B has 40%, the ratio is 0.67, which fails the 80% rule."
  },
  statistical_parity: {
    term: "Statistical Fairness",
    explanation: "Similar to Equal Treatment - ensures all groups receive outcomes in proportion to their representation.",
    example: "If 30% of applicants are from Group A, about 30% of approvals should go to Group A."
  }
}

