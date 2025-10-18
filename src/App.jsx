import { useState, useCallback } from 'react'
import { Upload, BarChart3, Shield, AlertTriangle, FileText, BookOpen, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Label } from '@/components/ui/label.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { HelpTooltip, FAIRNESS_TOOLTIPS } from '@/components/fairness/HelpTooltip.jsx'
import { RiskIndicator, RiskBadge } from '@/components/fairness/RiskIndicator.jsx'
import { MitigationPanel } from '@/components/fairness/MitigationPanel.jsx'
import { ReportsPanel } from '@/components/fairness/ReportsPanel.jsx'
import { ExplainSHAPSummary, ExplainIndividual, ExplainGroupComparison, ExplainFairnessAware } from '@/components/explainability/ExplainabilityComponents.jsx'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/fairness`
  : 'https://fairness-toolkit-backend.onrender.com/api/fairness'

function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [dataInfo, setDataInfo] = useState(null)
  const [config, setConfig] = useState({
    targetColumn: '',
    sensitiveAttributes: [],
    featureColumns: [],
    modelType: 'random_forest'
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileUpload = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    setUploadProgress(30)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      })
      
      setUploadProgress(70)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }
      
      const data = await response.json()
      
      // Validate response data
      if (!data.data_info || !data.data_info.columns || data.data_info.columns.length === 0) {
        throw new Error('Invalid response from server: no columns found in uploaded file')
      }
      
      setDataInfo(data.data_info)
      setUploadProgress(100)
      setCurrentStep(1)
      
      // Auto-configure if possible
      if (data.data_info?.columns?.length > 0) {
        const cols = data.data_info.columns
        setConfig(prev => ({
          ...prev,
          targetColumn: cols.includes('two_year_recid') ? 'two_year_recid' : cols[cols.length - 1],
          sensitiveAttributes: cols.filter(c => ['race', 'sex', 'age_cat'].includes(c)),
          featureColumns: []
        }))
      }
    } catch (err) {
      // Check if it's a network error
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000')
      } else {
        setError(err.message)
      }
      setUploadProgress(0)
      setCurrentStep(0) // Stay on upload page
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file)
    } else {
      setError('Please upload a CSV file')
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const loadDemo = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/datasets/compas`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load demo dataset')
      }
      
      const data = await response.json()
      setDataInfo(data.data_info)
      setCurrentStep(1)
      
      // Auto-configure for COMPAS
      setConfig({
        targetColumn: 'two_year_recid',
        sensitiveAttributes: ['race', 'sex'],
        featureColumns: [],
        modelType: 'random_forest'
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getModelRecommendation = useCallback(async () => {
    if (!config.targetColumn || config.sensitiveAttributes.length === 0) {
      setError('Please configure target column and sensitive attributes first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/recommend_model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_column: config.targetColumn,
          sensitive_attributes: config.sensitiveAttributes
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Model recommendation failed')
      }
      
      const data = await response.json()
      const topChoice = data.top_choice
      
      setConfig(prev => ({
        ...prev,
        modelType: topChoice.model,
        modelRecommendation: topChoice,
        allRecommendations: data.recommendations
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [config.targetColumn, config.sensitiveAttributes])

  const runAnalysis = useCallback(async () => {
    if (!config.targetColumn || config.sensitiveAttributes.length === 0) {
      setError('Please configure target column and sensitive attributes')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_column: config.targetColumn,
          sensitive_attributes: config.sensitiveAttributes,
          feature_columns: config.featureColumns,
          model_type: config.modelType
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }
      
      const data = await response.json()
      setResults(data.results)
      setCurrentStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [config])

  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Dataset
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing your dataset for fairness analysis. The dataset should include features, target variable, and sensitive attributes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input').click()}
          >
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse and select a file</p>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="outline">Choose File</Button>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Datasets</CardTitle>
          <CardDescription>Try the toolkit with these sample datasets to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">COMPAS Recidivism Dataset</h3>
                <p className="text-sm text-muted-foreground">
                  Criminal justice risk assessment data with race and gender attributes
                </p>
              </div>
              <Button onClick={loadDemo} disabled={loading}>
                Load Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderConfigStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Configure Analysis
          </CardTitle>
          <CardDescription>
            Select the target variable, sensitive attributes, and model type for your fairness analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Column</Label>
            <Select value={config.targetColumn} onValueChange={(val) => setConfig(prev => ({ ...prev, targetColumn: val }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select target column" />
              </SelectTrigger>
              <SelectContent>
                {dataInfo?.columns?.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sensitive Attributes</Label>
            <div className="flex flex-wrap gap-2">
              {dataInfo?.columns?.map(col => (
                <Button
                  key={col}
                  variant={config.sensitiveAttributes.includes(col) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      sensitiveAttributes: prev.sensitiveAttributes.includes(col)
                        ? prev.sensitiveAttributes.filter(c => c !== col)
                        : [...prev.sensitiveAttributes, col]
                    }))
                  }}
                >
                  {col}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Model Type</Label>
            <div className="flex gap-2">
              <Select value={config.modelType} onValueChange={(val) => setConfig(prev => ({ ...prev, modelType: val }))} className="flex-1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random_forest">Random Forest</SelectItem>
                  <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                  <SelectItem value="gradient_boosting">Gradient Boosting</SelectItem>
                  <SelectItem value="svm">Support Vector Machine (SVM)</SelectItem>
                  <SelectItem value="decision_tree">Decision Tree</SelectItem>
                  <SelectItem value="naive_bayes">Naive Bayes</SelectItem>
                  <SelectItem value="knn">K-Nearest Neighbors (KNN)</SelectItem>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={getModelRecommendation}
                disabled={loading || !config.targetColumn || config.sensitiveAttributes.length === 0}
              >
                Recommend
              </Button>
            </div>
            {config.modelRecommendation && (
              <Alert className="mt-2">
                <AlertDescription>
                  <strong>Recommended:</strong> {config.modelRecommendation.name}
                  <br />
                  <span className="text-sm text-muted-foreground">{config.modelRecommendation.reasons[0]}</span>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Button onClick={runAnalysis} disabled={loading || !config.targetColumn || config.sensitiveAttributes.length === 0} className="w-full">
            {loading ? 'Running Analysis...' : 'Run Fairness Analysis'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderBiasCard = (title, level) => {
    const colors = {
      'Low Bias': 'bg-green-100 text-green-800 border-green-300',
      'Moderate Bias': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'High Bias': 'bg-red-100 text-red-800 border-red-300'
    }
    return (
      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[level] || colors['Low Bias']}`}>
        {level}
      </div>
    )
  }

  const renderResultsStep = () => {
    if (!results) return null

    const firstSensAttr = config.sensitiveAttributes[0]
    const biasData = results.bias_detection?.[firstSensAttr]
    const biasDetails = results.bias_detection_details?.[firstSensAttr]

    return (
      <Tabs defaultValue="fairness" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fairness">
            <Shield className="h-4 w-4 mr-2" />
            Fairness
          </TabsTrigger>
          <TabsTrigger value="bias">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Bias
          </TabsTrigger>
          <TabsTrigger value="explain">
            <BookOpen className="h-4 w-4 mr-2" />
            Explain
          </TabsTrigger>
          <TabsTrigger value="mitigate">
            <Wrench className="h-4 w-4 mr-2" />
            Mitigation
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fairness" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fairness Metrics</CardTitle>
              <CardDescription>Comprehensive fairness analysis across demographic groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Model Performance</h3>
                  <p className="text-2xl font-bold">{(results.model_performance?.accuracy * 100).toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>

                {Object.entries(results.fairness_analysis || {}).map(([attr, metrics]) => (
                  <div key={attr} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 capitalize">{attr} Fairness Analysis</h3>
                    <div className="space-y-3">
                      {metrics.summary?.map((item, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-sm font-medium">{item['Metric Name']}</span>
                            <HelpTooltip 
                              term={item['Metric Name']}
                              explanation={FAIRNESS_TOOLTIPS[item['Metric Name']?.toLowerCase().replace(/ /g, '_')]?.explanation || 'Fairness metric'}
                              example={FAIRNESS_TOOLTIPS[item['Metric Name']?.toLowerCase().replace(/ /g, '_')]?.example}
                            />
                          </div>
                          <RiskIndicator value={item.Value} metricName={item['Metric Name']} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bias Detection Results</CardTitle>
              <CardDescription>Comprehensive analysis of potential biases across different demographic groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                {Object.entries(results.bias_detection || {}).map(([attr, bias]) => (
                  <Card key={attr}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">{attr} Bias Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {bias.comprehensive ? (
                        // New comprehensive bias assessment
                        <>
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="text-sm font-medium">Representation:</span>
                              <p className="text-xs text-muted-foreground mt-1">{bias.comprehensive.representation.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderBiasCard(attr, bias.comprehensive.representation.level)}
                              <span className="text-xs text-muted-foreground">{bias.comprehensive.representation.value.toFixed(4)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="text-sm font-medium">Outcome:</span>
                              <p className="text-xs text-muted-foreground mt-1">{bias.comprehensive.outcome.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderBiasCard(attr, bias.comprehensive.outcome.level)}
                              <span className="text-xs text-muted-foreground">{bias.comprehensive.outcome.value.toFixed(4)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="text-sm font-medium">Prediction:</span>
                              <p className="text-xs text-muted-foreground mt-1">{bias.comprehensive.prediction.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderBiasCard(attr, bias.comprehensive.prediction.level)}
                              <span className="text-xs text-muted-foreground">{bias.comprehensive.prediction.value.toFixed(4)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="text-sm font-medium">Calibration:</span>
                              <p className="text-xs text-muted-foreground mt-1">{bias.comprehensive.calibration.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderBiasCard(attr, bias.comprehensive.calibration.level)}
                              <span className="text-xs text-muted-foreground">{bias.comprehensive.calibration.value.toFixed(4)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="text-sm font-medium">Individual Fairness:</span>
                              <p className="text-xs text-muted-foreground mt-1">{bias.comprehensive.individual.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderBiasCard(attr, bias.comprehensive.individual.level)}
                              <span className="text-xs text-muted-foreground">{bias.comprehensive.individual.value.toFixed(4)}</span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold">Overall Assessment:</span>
                              {renderBiasCard(attr, bias.comprehensive.overall.level)}
                            </div>
                          </div>
                        </>
                      ) : (
                        // Legacy fallback
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Representation:</span>
                            {renderBiasCard(attr, bias.representation)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Outcome:</span>
                            {renderBiasCard(attr, bias.outcome)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Prediction:</span>
                            {renderBiasCard(attr, bias.prediction)}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Bias Analysis</CardTitle>
                  <CardDescription>Explore different types of bias for each sensitive attribute</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="race" className="w-full">
                    <TabsList>
                      {config.sensitiveAttributes.map(attr => (
                        <TabsTrigger key={attr} value={attr} className="capitalize">{attr}</TabsTrigger>
                      ))}
                    </TabsList>

                    {config.sensitiveAttributes.map(attr => {
                      const details = results.bias_detection_details?.[attr]
                      return (
                        <TabsContent key={attr} value={attr} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Representation Bias</CardTitle>
                                <CardDescription>Distribution of groups in the dataset</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {details?.representation_data && (
                                  <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={details.representation_data}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="group" />
                                      <YAxis />
                                      <Tooltip />
                                      <Bar dataKey="proportion" fill="hsl(var(--chart-1))" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Outcome Bias</CardTitle>
                                <CardDescription>Outcome rates across different groups</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {details?.outcome_bias_data && (
                                  <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={details.outcome_bias_data}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="group" />
                                      <YAxis />
                                      <Tooltip />
                                      <Bar dataKey="rate" fill="hsl(var(--chart-2))" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">True Positive Rate</CardTitle>
                                <CardDescription>TPR by group</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {details?.tpr_data && (
                                  <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={details.tpr_data}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="group" />
                                      <YAxis />
                                      <Tooltip />
                                      <Bar dataKey="rate" fill="hsl(var(--chart-3))" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">False Positive Rate</CardTitle>
                                <CardDescription>FPR by group</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {details?.fpr_data && (
                                  <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={details.fpr_data}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="group" />
                                      <YAxis />
                                      <Tooltip />
                                      <Bar dataKey="rate" fill="hsl(var(--chart-4))" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explain" className="space-y-4">
          {/* Feature Importance */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Importance</CardTitle>
              <CardDescription>Understanding which features drive model predictions</CardDescription>
            </CardHeader>
            <CardContent>
              {results.explainability?.feature_importance?.data && results.explainability.feature_importance.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={results.explainability.feature_importance.data.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="importance" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No feature importance available.</p>
              )}
            </CardContent>
          </Card>

          {/* SHAP Summary */}
          <Card>
            <CardHeader>
              <CardTitle>SHAP Values - Global Explanation</CardTitle>
              <CardDescription>SHAP (SHapley Additive exPlanations) shows how each feature contributes to predictions across all instances</CardDescription>
            </CardHeader>
            <CardContent>
              <ExplainSHAPSummary apiBase={API_BASE} />
            </CardContent>
          </Card>

          {/* Individual Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Prediction Explanation</CardTitle>
              <CardDescription>Understand why the model made a specific prediction for a particular instance</CardDescription>
            </CardHeader>
            <CardContent>
              <ExplainIndividual apiBase={API_BASE} />
            </CardContent>
          </Card>

          {/* Group Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Group-Specific SHAP Analysis</CardTitle>
              <CardDescription>Compare how features affect predictions differently across demographic groups</CardDescription>
            </CardHeader>
            <CardContent>
              <ExplainGroupComparison apiBase={API_BASE} sensitiveAttributes={config.sensitiveAttributes} />
            </CardContent>
          </Card>

          {/* Fairness-Aware Features */}
          <Card>
            <CardHeader>
              <CardTitle>Fairness-Aware Feature Analysis</CardTitle>
              <CardDescription>Identify features that contribute most to prediction disparities across groups</CardDescription>
            </CardHeader>
            <CardContent>
              <ExplainFairnessAware apiBase={API_BASE} sensitiveAttributes={config.sensitiveAttributes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Comprehensive Fairness Analysis Report</span>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch(`${API_BASE}/export/report`)
                      const data = await response.json()
                      if (data.report) {
                        // Create a download link for the markdown report
                        const blob = new Blob([data.report], { type: 'text/markdown' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `fairness-analysis-report-${new Date().toISOString().split('T')[0]}.md`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }
                    } catch (err) {
                      setError('Failed to download report')
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </CardTitle>
              <CardDescription>
                Detailed analysis with metric explanations, interpretations, and actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    This report presents a comprehensive fairness analysis of a <strong>{results.model_performance?.model_type?.replace('_', ' ')}</strong> model 
                    trained to predict <strong>{results.model_performance?.target_column}</strong>.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{(results.model_performance?.accuracy * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Model Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{results.data_summary?.total_samples?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Samples</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{Object.keys(results.fairness_analysis || {}).length}</p>
                      <p className="text-xs text-muted-foreground">Attributes Analyzed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fairness Metrics Explained */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Understanding Fairness Metrics</h3>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">1. Selection Rate Disparity (max–min)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>What it measures:</strong> The difference between the highest and lowest rates at which different groups are predicted positive.</p>
                      <p><strong>Formula:</strong> <code className="bg-muted px-2 py-1 rounded">max(selection_rate) - min(selection_rate)</code></p>
                      <p><strong>Interpretation:</strong> 0.00 = perfect demographic parity; larger values = bigger gaps between groups.</p>
                      <p><strong>Fairness Notion:</strong> Demographic Parity</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">2. TPR Disparity (max–min)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>What it measures:</strong> Among truly positive cases, the difference in correct identification rates between groups.</p>
                      <p><strong>Formula:</strong> <code className="bg-muted px-2 py-1 rounded">max(TPR) - min(TPR)</code> where TPR = TP / (TP + FN)</p>
                      <p><strong>Interpretation:</strong> 0.00 = equal opportunity for all groups; larger values = some groups miss more benefits.</p>
                      <p><strong>Fairness Notion:</strong> Equal Opportunity</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">3. FPR Disparity (max–min)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>What it measures:</strong> Among truly negative cases, the difference in false alarm rates between groups.</p>
                      <p><strong>Formula:</strong> <code className="bg-muted px-2 py-1 rounded">max(FPR) - min(FPR)</code> where FPR = FP / (FP + TN)</p>
                      <p><strong>Interpretation:</strong> 0.00 = equal false positive burden; larger values = some groups wrongly flagged more.</p>
                      <p><strong>Fairness Notion:</strong> Part of Equalized Odds</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Disparity Thresholds */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Disparity Assessment Thresholds</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Level</th>
                        <th className="text-left p-3">Range</th>
                        <th className="text-left p-3">Interpretation</th>
                        <th className="text-left p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-3">✅ Very Low</td>
                        <td className="p-3">≤ 0.05</td>
                        <td className="p-3">Excellent fairness</td>
                        <td className="p-3">Monitor regularly</td>
                      </tr>
                      <tr className="border-t bg-muted/30">
                        <td className="p-3">✅ Low</td>
                        <td className="p-3">0.05 - 0.10</td>
                        <td className="p-3">Good fairness</td>
                        <td className="p-3">Continue monitoring</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-3">⚠️ Moderate</td>
                        <td className="p-3">0.10 - 0.20</td>
                        <td className="p-3">Investigate causes</td>
                        <td className="p-3">Review and analyze</td>
                      </tr>
                      <tr className="border-t bg-muted/30">
                        <td className="p-3">❌ High</td>
                        <td className="p-3">≥ 0.20</td>
                        <td className="p-3">Action needed</td>
                        <td className="p-3">Immediate mitigation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * These are rules of thumb. Appropriate thresholds depend on domain, risk, and sample sizes.
                </p>
              </div>

              {/* Analysis Results */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Analysis Results by Attribute</h3>
                <div className="space-y-4">
                  {Object.entries(results.fairness_analysis || {}).map(([attr, data]) => (
                    <Card key={attr}>
                      <CardHeader>
                        <CardTitle className="text-base capitalize">{attr} Analysis</CardTitle>
                        <CardDescription>
                          Groups: {data.groups ? Object.keys(data.groups).join(', ') : 'N/A'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-3">Metric</th>
                                <th className="text-left p-3">Value</th>
                                <th className="text-left p-3">Assessment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.summary?.map((item, idx) => {
                                const value = item.Value
                                let assessment = ''
                                let badgeClass = ''
                                if (value <= 0.05) {
                                  assessment = '✅ Very Low'
                                  badgeClass = 'bg-green-100 text-green-800'
                                } else if (value <= 0.10) {
                                  assessment = '✅ Low'
                                  badgeClass = 'bg-green-100 text-green-800'
                                } else if (value <= 0.20) {
                                  assessment = '⚠️ Moderate'
                                  badgeClass = 'bg-yellow-100 text-yellow-800'
                                } else {
                                  assessment = '❌ High'
                                  badgeClass = 'bg-red-100 text-red-800'
                                }
                                return (
                                  <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                    <td className="p-3">{item['Metric Name']}</td>
                                    <td className="p-3 font-mono">{value.toFixed(3)}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass}`}>
                                        {assessment}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-3">How to Act on These Metrics</h3>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>If Selection Rate Disparity is High:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>Check if your decision threshold causes disparate impact</li>
                        <li>Consider calibrated thresholds per group or reweighting</li>
                        <li>Review feature importance for biased predictors</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>If TPR Disparity is High:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>One group is less likely to be correctly helped when truly positive</li>
                        <li>Examine features informative for underperforming groups</li>
                        <li>Check sampling/label quality or consider threshold tuning</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>If FPR Disparity is High:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>One group gets more false alarms</li>
                        <li>Review calibration and cost-sensitive training</li>
                        <li>Use fairness constraints that balance FPR across groups</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* Download Section */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Complete Report Available</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download the comprehensive markdown report with detailed explanations, methodology, 
                      references, and specific recommendations based on your analysis results.
                    </p>
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch(`${API_BASE}/export/report`)
                          const data = await response.json()
                          if (data.report) {
                            const blob = new Blob([data.report], { type: 'text/markdown' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `fairness-analysis-report-${new Date().toISOString().split('T')[0]}.md`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }
                        } catch (err) {
                          setError('Failed to download report')
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Full Report (.md)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mitigation Tab */}
        <TabsContent value="mitigate" className="space-y-4">
          <MitigationPanel 
            apiBase={API_BASE}
            sensitiveAttr={firstSensAttr}
            results={results}
          />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <ReportsPanel 
            apiBase={API_BASE}
            results={results}
            sensitiveAttr={firstSensAttr}
          />
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Fairness & Explainability Toolkit</h1>
          <p className="text-muted-foreground">
            Comprehensive bias detection and fairness analysis for public policy AI systems
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Analysis Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${currentStep >= 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {currentStep >= 0 ? '✓' : '○'} Data Upload
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {currentStep >= 1 ? '✓' : '○'} Configuration
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  {currentStep >= 2 ? '●' : '○'} Analysis
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  ○ Report
                </div>
              </div>
            </div>
            <Progress value={(currentStep / 3) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Tabs value={['upload', 'config', 'results'][currentStep]} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" onClick={() => setCurrentStep(0)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="config" disabled={currentStep < 1} onClick={() => setCurrentStep(1)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Config
            </TabsTrigger>
            <TabsTrigger value="results" disabled={currentStep < 2}>
              <Shield className="h-4 w-4 mr-2" />
              Fairness
            </TabsTrigger>
            <TabsTrigger value="report" disabled={currentStep < 2}>
              <FileText className="h-4 w-4 mr-2" />
              Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            {renderUploadStep()}
          </TabsContent>

          <TabsContent value="config">
            {renderConfigStep()}
          </TabsContent>

          <TabsContent value="results">
            {renderResultsStep()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
