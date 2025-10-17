import { useState } from 'react'
import { FileText, Download, Users, Briefcase, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'

/**
 * ReportsPanel - Generate and download various reports
 */
export function ReportsPanel({ apiBase, results, sensitiveAttr }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedReport, setGeneratedReport] = useState(null)

  const generateReport = async (stakeholderType = 'executive') => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiBase}/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fairness_metrics: results?.fairness_metrics || {},
          mitigation_recommendations: results?.mitigation_recommendations || {},
          sensitive_attr: sensitiveAttr,
          stakeholder_type: stakeholderType
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate report')
      
      const data = await response.json()
      setGeneratedReport(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadData = async (format) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${apiBase}/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fairness_metrics: results?.fairness_metrics || {},
          mitigation_recommendations: results?.mitigation_recommendations || {}
        })
      })
      
      if (!response.ok) throw new Error(`Failed to export ${format}`)
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fairness_results.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
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
            <FileText className="h-5 w-5" />
            Reports & Exports
          </CardTitle>
          <CardDescription>
            Generate reports for different stakeholders and export your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stakeholder Reports */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stakeholder Reports</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => generateReport('executive')}>
                <CardHeader>
                  <Briefcase className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle className="text-base">Executive Summary</CardTitle>
                  <CardDescription className="text-xs">
                    High-level overview for leadership
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => generateReport('technical')}>
                <CardHeader>
                  <Users className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-base">Technical Report</CardTitle>
                  <CardDescription className="text-xs">
                    Detailed metrics for data scientists
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => generateReport('compliance')}>
                <CardHeader>
                  <Shield className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-base">Compliance Report</CardTitle>
                  <CardDescription className="text-xs">
                    Audit trail for regulators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Data Export */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Export Data</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => downloadData('csv')}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadData('excel')}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadData('json')}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {generatedReport && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Generated Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {generatedReport.report || JSON.stringify(generatedReport, null, 2)}
                  </pre>
                </div>
                <Button className="mt-4 w-full" onClick={() => {
                  const blob = new Blob([generatedReport.report || JSON.stringify(generatedReport, null, 2)], { type: 'text/markdown' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'fairness_report.md'
                  a.click()
                  window.URL.revokeObjectURL(url)
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

