'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Crown, 
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Award,
  Ban,
  RotateCcw
} from 'lucide-react';

interface AgentData {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  agentProfile?: {
    verified: boolean;
    blueTickStatus: 'none' | 'pending' | 'verified' | 'suspended';
    blueTickVerifiedAt?: string;
    blueTickVerifiedBy?: string;
    blueTickSuspendedAt?: string;
    blueTickSuspendedBy?: string;
    blueTickSuspensionReason?: string;
    verificationHistory?: Array<{
      action: 'granted' | 'suspended' | 'reinstated';
      reason: string;
      adminId: string;
      adminName: string;
      timestamp: string;
    }>;
  };
}

export default function BlueTickManagementPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'grant' | 'suspend' | 'reinstate'>('grant');
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Helper function to check if user is ultimate superadmin
  const isUltimateSuperadmin = (user: any) => {
    return user?.phone === '0610251014' || 
           user?.fullName === 'Kobac Real Estate' ||
           user?.fullName?.toLowerCase().includes('kobac')
  }

  useEffect(() => {
    // Check if user has access to this page
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/admin/agents/blue-tick');
        if (response.status === 403) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        fetchAgents();
      } catch (error) {
        console.error('Error checking access:', error);
        setAccessDenied(true);
        setLoading(false);
      }
    };
    
    checkAccess();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/agents/blue-tick');
      const result = await response.json();
      
      if (response.ok) {
        setAgents(result.data);
      } else {
        alert(result.error || 'Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      alert('Error fetching agents');
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || 
                         agent.agentProfile?.blueTickStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAction = async () => {
    if (!selectedAgent || !actionReason.trim()) {
      alert('Please provide a reason for this action');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch('/api/admin/agents/blue-tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          action: actionType,
          reason: actionReason
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Blue tick ${actionType}ed successfully for ${selectedAgent.fullName}`);
        setShowActionModal(false);
        setSelectedAgent(null);
        setActionReason('');
        fetchAgents(); // Refresh the list
      } else {
        alert(result.error || 'Failed to perform action');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Error performing action');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'suspended': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Shield className="w-3 h-3 mr-1" />
            None
          </span>
        );
    }
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
              Only the ultimate superadmin can access blue tick management features.
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center mb-4"
          >
            <Crown className="w-12 h-12 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold text-white">Blue Tick Management</h1>
          </motion.div>
          <p className="text-gray-300 text-lg">
            Ultimate Superadmin Control Panel - Manage Agent Verification Badges
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-400 mr-3" />
              <div>
                <p className="text-gray-300 text-sm">Total Agents</p>
                <p className="text-2xl font-bold text-white">{agents.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
              <div>
                <p className="text-gray-300 text-sm">Verified</p>
                <p className="text-2xl font-bold text-white">
                  {agents.filter(a => a.agentProfile?.blueTickStatus === 'verified').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-400 mr-3" />
              <div>
                <p className="text-gray-300 text-sm">Suspended</p>
                <p className="text-2xl font-bold text-white">
                  {agents.filter(a => a.agentProfile?.blueTickStatus === 'suspended').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-gray-300 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {agents.filter(a => a.agentProfile?.blueTickStatus === 'pending').length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search agents by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="none">No Badge</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="suspended">Suspended</option>
              </select>
              
              <button
                onClick={fetchAgents}
                disabled={loading}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Agents List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading agents...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Blue Tick
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredAgents.map((agent, index) => (
                    <motion.tr
                      key={agent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={agent.agentProfile?.verified ? '/icons/verified-badge.png' : '/icons/default-avatar.png'}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {agent.fullName}
                              {agent.agentProfile?.blueTickStatus === 'verified' && (
                                <Award className="inline w-4 h-4 text-blue-500 ml-2" />
                              )}
                            </div>
                            <div className="text-sm text-gray-300">{agent.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          agent.status === 'active' ? 'bg-green-100 text-green-800' :
                          agent.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {agent.status === 'active' ? 'Active' : 
                           agent.status === 'pending_verification' ? 'Pending' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(agent.agentProfile?.blueTickStatus || 'none')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setActionType('grant');
                              setShowActionModal(true);
                            }}
                            disabled={agent.agentProfile?.blueTickStatus === 'verified'}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors flex items-center"
                          >
                            <Award className="w-3 h-3 mr-1" />
                            Grant
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setActionType('suspend');
                              setShowActionModal(true);
                            }}
                            disabled={agent.agentProfile?.blueTickStatus === 'suspended'}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors flex items-center"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Suspend
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setActionType('reinstate');
                              setShowActionModal(true);
                            }}
                            disabled={agent.agentProfile?.blueTickStatus !== 'suspended'}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors flex items-center"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reinstate
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Modal */}
        <AnimatePresence>
          {showActionModal && selectedAgent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {actionType === 'grant' && 'Grant Blue Tick'}
                  {actionType === 'suspend' && 'Suspend Blue Tick'}
                  {actionType === 'reinstate' && 'Reinstate Blue Tick'}
                </h3>
                
                <div className="mb-4">
                  <p className="text-gray-600 mb-2">Agent: <span className="font-medium">{selectedAgent.fullName}</span></p>
                  <p className="text-gray-600">Current Status: <span className="font-medium">{selectedAgent.agentProfile?.blueTickStatus || 'none'}</span></p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for {actionType}ing blue tick:
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder={`Enter reason for ${actionType}ing blue tick...`}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setSelectedAgent(null);
                      setActionReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAction}
                    disabled={processing || !actionReason.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {processing ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
