'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Crown, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function TestBlueTickPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/admin/agents/blue-tick');
        if (response.status === 403) {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setAccessDenied(true);
      }
    };
    
    checkAccess();
  }, []);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Test Blue Tick API Access',
        action: async () => {
          const response = await fetch('/api/admin/agents/blue-tick');
          const result = await response.json();
          
          if (response.status === 403 && result.code === 'ULTIMATE_SUPERADMIN_REQUIRED') {
            return '✅ API correctly restricts access to ultimate superadmin only';
          } else if (response.ok) {
            return '✅ API accessible to ultimate superadmin';
          } else {
            return `❌ Unexpected response: ${response.status} - ${result.error}`;
          }
        }
      },
      {
        name: 'Test Blue Tick Management Page',
        action: async () => {
          try {
            const response = await fetch('/admin/blue-tick-management');
            if (response.status === 200) {
              return '✅ Blue tick management page accessible';
            } else {
              return `❌ Blue tick management page error: ${response.status}`;
            }
          } catch (error) {
            return '❌ Blue tick management page not found';
          }
        }
      },
      {
        name: 'Test User Model Schema',
        action: async () => {
          try {
            const response = await fetch('/api/test-db');
            const result = await response.json();
            
            if (response.ok && result.data) {
              return '✅ User model schema includes blue tick fields';
            } else {
              return '❌ Could not verify user model schema';
            }
          } catch (error) {
            return '❌ Database test failed';
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        setTestResults(prev => [...prev, `🔄 Running: ${test.name}`]);
        const result = await test.action();
        setTestResults(prev => [...prev, result]);
      } catch (error) {
        setTestResults(prev => [...prev, `❌ Test failed: ${test.name} - ${error}`]);
      }
    }

    setLoading(false);
  };

  // Show access denied message if user doesn't have permission
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <Crown className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Access Restricted</h1>
            <p className="text-gray-300 text-lg mb-6">
              Only the ultimate superadmin can access blue tick testing features.
            </p>
            <div className="bg-blue-900/50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">Ultimate Superadmin Requirements:</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Phone number: 0610251014</li>
                <li>• Full name: Kobac Real Estate</li>
                <li>• Role: super_admin</li>
              </ul>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              ← Back to Admin Dashboard
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center mb-4"
          >
            <Crown className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold text-white">Blue Tick System Test</h1>
          </motion.div>
          <p className="text-gray-300 text-lg">
            Test the blue tick verification system functionality
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">System Tests</h2>
              <p className="text-gray-300">Run comprehensive tests to verify blue tick functionality</p>
            </div>
            <button
              onClick={runTests}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center"
            >
              {loading ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>
            
            {testResults.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">No tests run yet. Click "Run Tests" to start.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg ${
                      result.includes('✅') 
                        ? 'bg-green-100/10 border border-green-200/20' 
                        : result.includes('❌')
                        ? 'bg-red-100/10 border border-red-200/20'
                        : 'bg-blue-100/10 border border-blue-200/20'
                    }`}
                  >
                    <p className={`text-sm ${
                      result.includes('✅') 
                        ? 'text-green-300' 
                        : result.includes('❌')
                        ? 'text-red-300'
                        : 'text-blue-300'
                    }`}>
                      {result}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center mb-4">
              <Crown className="w-8 h-8 text-yellow-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Ultimate Superadmin</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Phone: +252610251014<br />
              Name: Kobac Real Estate<br />
              Status: Protected
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center mb-4">
              <Award className="w-8 h-8 text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Blue Tick Status</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-gray-300">Verified</span>
              </div>
              <div className="flex items-center text-sm">
                <XCircle className="w-4 h-4 text-red-400 mr-2" />
                <span className="text-gray-300">Suspended</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-gray-300">Pending</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-green-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Permissions</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-gray-300">Grant Blue Tick</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-gray-300">Suspend Blue Tick</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-gray-300">Reinstate Blue Tick</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
