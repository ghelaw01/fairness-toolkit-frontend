import { useState } from 'react'
import { Info, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx'

/**
 * ComprehensiveMetricsDisplay - Display all fairness metrics with definitions
 */
export function ComprehensiveMetricsDisplay({ metrics, attribute }) {
  const [expandedMetrics, setExpandedMetrics] = useState(new Set())
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  if (!metrics || !metrics.summary || metrics.summary.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No metrics available</p>
        </CardContent>
      </Card>
    )
  }

  // Group metrics by category
  const metricsByCategory = metrics.summary.reduce((acc, metric) => {
    const category = metric.Category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(metric)
    return acc
  }, {})

  // Get unique categories and statuses
  const categories = Object.keys(metricsByCategory).sort()
  const allStatuses = [...new Set(metrics.summary.map(m => m.Status))]

  // Filter metrics
  const filteredMetrics = metrics.summary.filter(metric => {
    const categoryMatch = categoryFilter === 'all' || metric.Category === categoryFilter
    const statusMatch = statusFilter === 'all' || metric.Status === statusFilter
    return categoryMatch && statusMatch
  })

  const toggleMetric = (metricName) => {
    const newExpanded = new Set(expandedMetrics)
    if (newExpanded.has(metricName)) {
      newExpanded.delete(metricName)
    } else {
      newExpanded.add(metricName)
    }
    setExpandedMetrics(newExpanded)
  }

  const getStatusBadge = (status) => {
    if (status.includes('Fair')) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Fair</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">⚠ Unfair</Badge>
    }
  }

  const getValueColor = (metric) => {
    const value = Math.abs(metric.Value)
    const threshold = metric.Threshold

    if (metric['Ideal Value'] === 0) {
      // Difference metrics
      if (value <= threshold) return 'text-green-600 font-semibold'
      if (value <= threshold * 2) return 'text-yellow-600 font-semibold'
      return 'text-red-600 font-semibold'
    } else {
      // Ratio metrics
      if (metric.Value >= threshold) return 'text-green-600 font-semibold'
      if (metric.Value >= threshold * 0.9) return 'text-yellow-600 font-semibold'
      return 'text-red-600 font-semibold'
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Classification': '📊',
      'Regression': '📈',
      'Composite': '🎯',
      'Individual': '👤',
      'Causal': '🔗',
      'Other': '📋'
    }
    return icons[category] || '📋'
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="capitalize">{attribute} Fairness Analysis</CardTitle>
              <CardDescription>
                {filteredMetrics.length} of {metrics.summary.length} metrics shown
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryIcon(cat)} {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="✓ Fair">✓ Fair</SelectItem>
                  <SelectItem value="⚠ Unfair">⚠ Unfair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.summary.filter(m => m.Status.includes('Fair')).length}
              </div>
              <div className="text-sm text-muted-foreground">Fair Metrics</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {metrics.summary.filter(m => m.Status.includes('Unfair')).length}
              </div>
              <div className="text-sm text-muted-foreground">Unfair Metrics</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {categories.length}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>

          {/* Metrics List */}
          <div className="space-y-2">
            {filteredMetrics.map((metric, idx) => (
              <Card key={idx} className="border-l-4" style={{
                borderLeftColor: metric.Status.includes('Fair') ? '#22c55e' : '#ef4444'
              }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {getCategoryIcon(metric.Category)} {metric.Category}
                        </span>
                        {getStatusBadge(metric.Status)}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{metric['Metric Name']}</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p className="font-semibold mb-1">Definition:</p>
                              <p className="text-sm mb-2">{metric.Definition}</p>
                              <p className="font-semibold mb-1">Formula:</p>
                              <code className="text-xs bg-muted p-1 rounded">{metric.Formula}</code>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Current Value</p>
                          <p className={`text-xl font-mono ${getValueColor(metric)}`}>
                            {metric.Value.toFixed(4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ideal Value</p>
                          <p className="text-xl font-mono text-muted-foreground">
                            {metric['Ideal Value'].toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Threshold</p>
                          <p className="text-xl font-mono text-muted-foreground">
                            {metric['Ideal Value'] === 0 ? '≤' : '≥'} {metric.Threshold.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {expandedMetrics.has(metric['Metric Name']) && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-semibold mb-1">Definition:</p>
                          <p className="text-sm mb-2">{metric.Definition}</p>
                          
                          <p className="text-sm font-semibold mb-1">Formula:</p>
                          <code className="text-xs bg-background p-2 rounded block mb-2">
                            {metric.Formula}
                          </code>
                          
                          <p className="text-sm font-semibold mb-1">Interpretation:</p>
                          <p className="text-sm">{metric.Interpretation}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMetric(metric['Metric Name'])}
                      className="ml-2"
                    >
                      {expandedMetrics.has(metric['Metric Name']) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

