import React, { useState } from 'react'
import { Wrench, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'

/**
 * MitigationPanel - Interface for applying bias mitigation techniques
 */
export function MitigationPanel({ apiBase, sensitiveAttr, results }) {
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState(null)
  const [mitigationResults, setMitigationResults] = useState(null)
  const [error, setError] = useState(null)

  const getRecommendations = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiBase}/mitigate/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fairness_metrics: results?.fairness_metrics || {},
          sensitive_attr: sensitiveAttr
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to get recommendations: ${errorText}`)
      }
      
      const data = await response.json()
      setRecommendations(data)
    } catch (err) {
      setError(err.message)
      console.error('Recommendation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyMitigation = async (recommendation) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiBase}/mitigate/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technique: recommendation.technique,
          technique_type: recommendation.type,
          sensitive_attr: sensitiveAttr
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to apply mitigation: ${errorText}`)
      }
      
      const data = await response.json()
      setMitigationResults(data)
    } catch (err) {
      setError(err.message)
      console.error('Mitigation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Bias Mitigation
          </CardTitle>
          <CardDescription>
            Apply techniques to reduce bias and improve fairness in your model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!recommendations ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Get personalized recommendations for reducing bias in your model
              </p>
              <Button onClick={getRecommendations} disabled={loading}>
                {loading ? 'Analyzing...' : 'Get Recommendations'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.summary && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Found {recommendations.summary.total_recommendations} recommendation(s). 
                    {recommendations.summary.high_priority > 0 && ` ${recommendations.summary.high_priority} high priority.`}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                {recommendations.recommendations && recommendations.recommendations.map((rec, idx) => (
                  <Card key={idx} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {rec.technique ? rec.technique.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Technique'}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {rec.plain_language || 'No description available'}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          rec.priority === 'high' ? 'destructive' :
                          rec.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {rec.priority ? rec.priority.toUpperCase() : 'MEDIUM'} Priority
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {rec.expected_impact && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Expected Impact:</p>
                            <p className="text-sm text-gray-600">{rec.expected_impact}</p>
                          </div>
                        )}
                        {rec.trade_offs && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Trade-offs:</p>
                            <p className="text-sm text-gray-600">{rec.trade_offs}</p>
                          </div>
                        )}
                        {rec.when_to_use && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">When to Use:</p>
                            <p className="text-sm text-gray-600">{rec.when_to_use}</p>
                          </div>
                        )}
                        <Button 
                          onClick={() => applyMitigation(rec)}
                          disabled={loading}
                          className="w-full"
                        >
                          {loading ? 'Applying...' : 'Apply This Technique'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {recommendations.next_steps && recommendations.next_steps.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                      {recommendations.next_steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mitigationResults && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  Mitigation Applied Successfully
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-green-700">
                    {mitigationResults.message || mitigationResults.plain_language || 'Bias mitigation has been applied to your model.'}
                  </p>
                  {mitigationResults.info && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-green-800">Details:</p>
                      <pre className="text-xs bg-white p-2 rounded mt-1 text-green-900 overflow-auto">
                        {JSON.stringify(mitigationResults.info, null, 2)}
                      </pre>
                    </div>
                  )}
                  {mitigationResults.improvement && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-green-800 mb-2">Fairness Improvement:</p>
                      {mitigationResults.improvement.plain_language && (
                        <p className="text-sm text-green-700 mb-3 italic">
                          {mitigationResults.improvement.plain_language}
                        </p>
                      )}
                      <div className="bg-white p-3 rounded">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-semibold">Metric</th>
                              <th className="text-right py-2 font-semibold">Before</th>
                              <th className="text-right py-2 font-semibold">After</th>
                              <th className="text-right py-2 font-semibold text-green-700">Improvement</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2">Selection Rate Disparity</td>
                              <td className="text-right">{(mitigationResults.improvement.before.selection_rate_disparity * 100).toFixed(1)}%</td>
                              <td className="text-right">{(mitigationResults.improvement.after.selection_rate_disparity * 100).toFixed(1)}%</td>
                              <td className="text-right text-green-700 font-semibold">
                                {mitigationResults.improvement.improvement.selection_rate >= 0 ? '↓' : '↑'} {Math.abs(mitigationResults.improvement.improvement.selection_rate * 100).toFixed(1)}%
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2">TPR Disparity (Equal Opportunity)</td>
                              <td className="text-right">{(mitigationResults.improvement.before.tpr_disparity * 100).toFixed(1)}%</td>
                              <td className="text-right">{(mitigationResults.improvement.after.tpr_disparity * 100).toFixed(1)}%</td>
                              <td className="text-right text-green-700 font-semibold">
                                {mitigationResults.improvement.improvement.tpr >= 0 ? '↓' : '↑'} {Math.abs(mitigationResults.improvement.improvement.tpr * 100).toFixed(1)}%
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2">FPR Disparity (Equalized Odds)</td>
                              <td className="text-right">{(mitigationResults.improvement.before.fpr_disparity * 100).toFixed(1)}%</td>
                              <td className="text-right">{(mitigationResults.improvement.after.fpr_disparity * 100).toFixed(1)}%</td>
                              <td className="text-right text-green-700 font-semibold">
                                {mitigationResults.improvement.improvement.fpr >= 0 ? '↓' : '↑'} {Math.abs(mitigationResults.improvement.improvement.fpr * 100).toFixed(1)}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="text-xs text-gray-500 mt-2">↓ indicates improvement (disparity reduced), ↑ indicates increase</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MitigationPanel

