import { useState } from 'react'
import { Wrench, TrendingUp, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'

/**
 * MitigationPanel - Interface for applying bias mitigation techniques
 */
export function MitigationPanel({ apiBase, sensitiveAttr, results = {} }) {
  // Safety check
  if (!apiBase) {
    return <div className="p-4 text-red-600">Error: API base URL not configured</div>
  }
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
      
      if (!response.ok) throw new Error('Failed to get recommendations')
      
      const data = await response.json()
      setRecommendations(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const applyMitigation = async (technique) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiBase}/mitigate/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technique,
          sensitive_attr: sensitiveAttr
        })
      })
      
      if (!response.ok) throw new Error('Failed to apply mitigation')
      
      const data = await response.json()
      setMitigationResults(data)
    } catch (err) {
      setError(err.message)
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
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {recommendations.summary || 'Here are recommended techniques based on your fairness metrics'}
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                {recommendations.recommendations?.map((rec, idx) => (
                  <Card key={idx} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {rec.technique?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {rec.plain_language}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          rec.priority === 'high' ? 'destructive' :
                          rec.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {rec.priority?.toUpperCase()} Priority
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Expected Impact:</p>
                          <p className="text-sm text-gray-600">{rec.expected_impact}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Trade-offs:</p>
                          <p className="text-sm text-gray-600">{rec.trade_offs}</p>
                        </div>
                        <Button 
                          onClick={() => applyMitigation(rec.technique)}
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
                    {mitigationResults.plain_language || 'Bias mitigation has been applied to your model.'}
                  </p>
                  {mitigationResults.improvement && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-green-800">Improvement:</p>
                      <pre className="text-xs bg-white p-2 rounded mt-1 text-green-900">
                        {JSON.stringify(mitigationResults.improvement, null, 2)}
                      </pre>
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

