import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Loader2, AlertCircle, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// SHAP Summary Component
export function ExplainSHAPSummary({ apiBase }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shapData, setShapData] = useState(null)

  const loadSHAPSummary = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const explainBase = apiBase.replace('/api/fairness', '/api/explainability')
      const response = await fetch(`${explainBase}/shap/summary`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setShapData(data)
      }
    } catch (err) {
      setError(`Failed to load SHAP summary: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={loadSHAPSummary} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Computing SHAP Values...' : 'Compute SHAP Summary'}
        </Button>
        <div className="text-sm text-muted-foreground">
          <Info className="inline h-4 w-4 mr-1" />
          May take 10-30 seconds
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {shapData && (
        <div className="space-y-4">
          {/* SHAP Summary Plot */}
          {shapData.summary_plot && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">SHAP Summary Plot</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Each dot represents an instance. Red = high feature value, Blue = low feature value.
                Position on x-axis shows impact on prediction.
              </p>
              <img 
                src={shapData.summary_plot} 
                alt="SHAP Summary" 
                className="w-full h-auto"
              />
            </div>
          )}

          {/* SHAP Importance Table */}
          {shapData.shap_importance && shapData.shap_importance.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Top Features by Mean |SHAP|</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shapData.shap_importance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="importance" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Individual Prediction Explanation Component
export function ExplainIndividual({ apiBase }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [instances, setInstances] = useState([])
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [explanation, setExplanation] = useState(null)

  useEffect(() => {
    loadInstances()
  }, [])

  const loadInstances = async () => {
    try {
      const explainBase = apiBase.replace('/api/fairness', '/api/explainability')
      const response = await fetch(`${explainBase}/test_instances`)
      const data = await response.json()
      
      if (data.instances) {
        setInstances(data.instances.slice(0, 50)) // Show first 50
        if (data.instances.length > 0) {
          setSelectedInstance(0)
        }
      }
    } catch (err) {
      console.error('Failed to load instances:', err)
    }
  }

  const explainInstance = async () => {
    if (selectedInstance === null) return
    
    setLoading(true)
    setError(null)
    
    try {
      const explainBase = apiBase.replace('/api/fairness', '/api/explainability')
      const response = await fetch(`${explainBase}/shap/individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_idx: selectedInstance })
      })
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setExplanation(data.explanation)
      }
    } catch (err) {
      setError(`Failed to explain instance: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Instance</label>
          <Select 
            value={selectedInstance?.toString()} 
            onValueChange={(val) => setSelectedInstance(parseInt(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an instance" />
            </SelectTrigger>
            <SelectContent>
              {instances.map((inst) => (
                <SelectItem key={inst.index} value={inst.index.toString()}>
                  Instance #{inst.index} - Predicted: {inst.predicted}, Actual: {inst.actual}
                  {inst.sensitive_attributes && Object.entries(inst.sensitive_attributes).length > 0 && 
                    ` (${Object.entries(inst.sensitive_attributes).map(([k,v]) => `${k}=${v}`).join(', ')})`
                  }
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={explainInstance} disabled={loading || selectedInstance === null} className="mt-6">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Explain
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {explanation && (
        <div className="space-y-4">
          {/* Prediction Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground">Prediction</div>
              <div className="text-2xl font-bold">{explanation.predicted_label ?? explanation.prediction}</div>
            </div>
            {explanation.actual_label !== undefined && (
              <div className="border rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground">Actual</div>
                <div className="text-2xl font-bold">{explanation.actual_label}</div>
              </div>
            )}
            {explanation.prediction_proba && (
              <div className="border rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="text-2xl font-bold">
                  {(Math.max(...explanation.prediction_proba) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Waterfall Plot */}
          {explanation.waterfall_plot && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">SHAP Waterfall Plot</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Shows how each feature pushes the prediction from the base value (average prediction) to the final prediction.
              </p>
              <img 
                src={explanation.waterfall_plot} 
                alt="SHAP Waterfall" 
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Top Contributing Features */}
          {explanation.feature_contributions && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Top Feature Contributions</h4>
              <div className="space-y-2">
                {explanation.feature_contributions.slice(0, 10).map((fc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{fc.feature}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Value: {fc.value.toFixed(3)}</span>
                      <span className={fc.contribution === 'Positive' ? 'text-green-600' : 'text-red-600'}>
                        SHAP: {fc.shap_value.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Group Comparison Component
export function ExplainGroupComparison({ apiBase, sensitiveAttributes }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedAttribute, setSelectedAttribute] = useState(null)
  const [comparisonData, setComparisonData] = useState(null)

  useEffect(() => {
    if (sensitiveAttributes && sensitiveAttributes.length > 0) {
      setSelectedAttribute(sensitiveAttributes[0])
    }
  }, [sensitiveAttributes])

  const compareGroups = async () => {
    if (!selectedAttribute) return
    
    setLoading(true)
    setError(null)
    
    try {
      const explainBase = apiBase.replace('/api/fairness', '/api/explainability')
      const response = await fetch(`${explainBase}/shap/group_comparison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensitive_attribute: selectedAttribute })
      })
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setComparisonData(data)
      }
    } catch (err) {
      setError(`Failed to compare groups: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Sensitive Attribute</label>
          <Select 
            value={selectedAttribute} 
            onValueChange={setSelectedAttribute}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select attribute" />
            </SelectTrigger>
            <SelectContent>
              {sensitiveAttributes?.map((attr) => (
                <SelectItem key={attr} value={attr}>{attr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={compareGroups} disabled={loading || !selectedAttribute} className="mt-6">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Compare Groups
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {comparisonData && (
        <div className="space-y-4">
          {/* Feature Disparities */}
          {comparisonData.feature_disparities && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Features with Largest SHAP Disparities</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Features where SHAP values differ most across {selectedAttribute} groups
              </p>
              <div className="space-y-2">
                {comparisonData.feature_disparities.slice(0, 10).map((fd, idx) => (
                  <div key={idx} className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{fd.feature}</span>
                      <span className="text-sm text-muted-foreground">
                        Disparity: {fd.disparity.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1 text-xs">
                      {Object.entries(fd.group_values).map(([group, val]) => (
                        <span key={group} className="bg-muted px-2 py-1 rounded">
                          {group}: {val.toFixed(4)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fairness Insights */}
          {comparisonData.fairness_insights && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Fairness Insight:</strong> {comparisonData.fairness_insights.interpretation}
                <br />
                <strong>Most Disparate Features:</strong> {comparisonData.fairness_insights.most_disparate_features?.join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}

// Fairness-Aware Features Component
export function ExplainFairnessAware({ apiBase, sensitiveAttributes }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)

  const analyzeFairnessFeatures = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const explainBase = apiBase.replace('/api/fairness', '/api/explainability')
      const response = await fetch(`${explainBase}/fairness_aware_features`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setAnalysisData(data)
      }
    } catch (err) {
      setError(`Failed to analyze features: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={analyzeFairnessFeatures} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Analyzing...' : 'Analyze Fairness-Aware Features'}
        </Button>
        <div className="text-sm text-muted-foreground">
          <Info className="inline h-4 w-4 mr-1" />
          Identifies features causing bias
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisData?.fairness_aware_analysis && (
        <div className="space-y-4">
          {Object.entries(analysisData.fairness_aware_analysis).map(([attr, analysis]) => (
            <div key={attr} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 capitalize">Analysis for {attr}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {analysis.interpretation}
              </p>

              {/* Top Biased Features */}
              {analysis.top_biased_features && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold">Top Features Contributing to Bias</h5>
                  {analysis.top_biased_features.slice(0, 10).map((feature, idx) => (
                    <div key={idx} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{feature.feature}</span>
                        <span className="text-sm font-semibold text-red-600">
                          Bias Score: {feature.bias_score.toFixed(4)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                        <div>
                          <span className="text-muted-foreground">SHAP Disparity: </span>
                          {feature.shap_disparity.toFixed(4)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Feature Disparity: </span>
                          {feature.feature_disparity.toFixed(4)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1 text-xs flex-wrap">
                        {Object.entries(feature.group_shap_values).map(([group, val]) => (
                          <span key={group} className="bg-muted px-2 py-1 rounded">
                            {group}: {val.toFixed(4)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendation */}
              {analysis.recommendation && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommendation:</strong> {analysis.recommendation}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

