'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Database, Trash2, RefreshCw } from 'lucide-react'

export default function ResetDatabasePage() {
  const [isResetting, setIsResetting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL properties and reset the property ID counter!\n\nAre you sure you want to continue?')) {
      return
    }

    if (!confirm('🚨 FINAL WARNING: This action cannot be undone!\n\nType "RESET" to confirm:')) {
      return
    }

    setIsResetting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        console.log('✅ Database reset successful:', data)
      } else {
        setError(data.error || 'Failed to reset database')
        console.error('❌ Database reset failed:', data)
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('❌ Network error:', err)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Database Reset
            </h1>
            <p className="text-gray-600">
              Prepare your database for production deployment
            </p>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-2">⚠️ DANGER ZONE</h3>
                <ul className="text-red-700 space-y-1 text-sm">
                  <li>• This will <strong>DELETE ALL PROPERTIES</strong> from the database</li>
                  <li>• The property ID counter will be reset to start from 1</li>
                  <li>• This action <strong>CANNOT BE UNDONE</strong></li>
                  <li>• Only use this when preparing for production deployment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="text-center mb-8">
            <Button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Resetting Database...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Reset Database for Production
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                ✅ Database Reset Successful
              </h3>
              <div className="text-green-700 space-y-2">
                <p><strong>Properties deleted:</strong> {result.deletedProperties}</p>
                <p><strong>Remaining properties:</strong> {result.remainingProperties}</p>
                <p><strong>Next property ID:</strong> {result.nextPropertyId}</p>
              </div>
              <p className="text-green-600 text-sm mt-4">
                🎉 Your database is now clean and ready for production!
              </p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-blue-800 mb-3">📋 Instructions</h3>
            <ol className="text-blue-700 space-y-2 text-sm">
              <li>1. Make sure you have backed up any important data</li>
              <li>2. Click the reset button above</li>
              <li>3. Confirm the action when prompted</li>
              <li>4. Wait for the reset to complete</li>
              <li>5. Your database will be clean and ready for production</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
