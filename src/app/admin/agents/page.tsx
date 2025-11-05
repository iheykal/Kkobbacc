'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatPhoneNumber } from '@/lib/utils'
import { Users, Camera, Edit, Save, X, Crown, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation';

interface Agent {
  _id: string
  fullName: string
  phone: string
  role: string
  status: string
  profile: {
    avatar: string
    location?: string
    occupation?: string
    company?: string
  }
  createdAt: string
}

// Ultimate superadmin protection constants
const ULTIMATE_SUPERADMIN_PHONE = '0610251014'
const ULTIMATE_SUPERADMIN_NAME = 'Kobac Real Estate'

// Helper function to check if user is ultimate superadmin
const isUltimateSuperadmin = (agent: Agent) => {
  return agent.phone === ULTIMATE_SUPERADMIN_PHONE || 
         agent.fullName === ULTIMATE_SUPERADMIN_NAME ||
         agent.fullName.toLowerCase().includes('kobac')
}

export default function SuperAdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingAvatar, setEditingAvatar] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const router = useRouter();

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users?role=agent,agency', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (response.ok) {
        setAgents(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch agents')
      }
    } catch (error) {
      setError('Error fetching agents')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpdate = async (agentId: string, file: File) => {
    try {
      setUploading(agentId)
      
      console.log('📤 Starting avatar upload for agent:', agentId);
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await fetch(`/api/admin/agents/${agentId}/avatar`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      })
      
      console.log('📥 Upload response status:', response.status);
      
      const result = await response.json()
      console.log('📥 Upload response data:', result);
      
      if (response.ok) {
        console.log('✅ Avatar upload successful!');
        console.log('📊 Upload info:', result.uploadInfo);
        console.log('👤 Updated agent data:', result.data);
        
        // Update the agent in the list
        setAgents(prev => {
          const updated = prev.map(agent => 
          agent._id === agentId 
            ? { ...agent, profile: { ...agent.profile, avatar: result.data.profile.avatar } }
            : agent
          );
          
          const updatedAgent = updated.find(a => a._id === agentId);
          console.log('🔄 Updated agent in list:', {
            id: updatedAgent?._id,
            name: updatedAgent?.fullName,
            avatar: updatedAgent?.profile?.avatar,
            avatarType: updatedAgent?.profile?.avatar ? 
              (updatedAgent.profile.avatar.includes('r2.dev') ? 'R2' : 
               updatedAgent.profile.avatar.includes('unsplash') ? 'Fallback' : 'Local') : 'None'
          });
          
          return updated;
        });
        
        const uploadMethod = result.uploadInfo?.method || 'Unknown';
        const isR2 = result.uploadInfo?.isR2 || false;
        
        if (isR2) {
          alert('Agent avatar updated successfully and saved to Cloudflare R2!');
        } else if (uploadMethod === 'Fallback') {
          alert('Avatar upload failed, using default image. Please try again.');
        } else {
          alert('Agent avatar updated successfully!');
        }
      } else {
        console.error('❌ Avatar upload failed:', result);
        alert(`Failed to update avatar: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error updating agent avatar:', error);
      alert('Error updating agent avatar')
    } finally {
      setUploading(null)
      setEditingAvatar(null)
    }
  }

  const handleFileSelect = (agentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleAvatarUpdate(agentId, file)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading agents...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            SuperAdmin Dashboard
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto mb-8">
            Manage agents and their profile images
          </p>
          
          {/* Register New Agent Button */}
          <motion.button
            onClick={() => router.push('/register-agent')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mb-6"
          >
            👤 Register New Agent (Auto Cloudflare R2)
          </motion.button>
          
          {/* Test Authentication Button */}
          <motion.button
            onClick={async () => {
              try {
                console.log('🔐 Testing authentication...');
                const response = await fetch('/api/auth/me', {
                  credentials: 'include'
                });
                const result = await response.json();
                console.log('🔐 Auth result:', result);
                console.log('🔐 Auth result.data:', result.data);
                console.log('🔐 Auth result.user:', result.user);
                console.log('🔐 Response status:', response.status);
                
                if (response.ok && result.user) {
                  alert(`✅ Authenticated as: ${result.user.fullName} (${result.user.role})`);
                } else if (response.ok && result.data) {
                  alert(`✅ Authenticated as: ${result.data.fullName} (${result.data.role})`);
                } else {
                  alert(`❌ Not authenticated: ${result.error || 'Unknown error'}\n\nStatus: ${response.status}\n\nFull result: ${JSON.stringify(result, null, 2)}`);
                }
              } catch (error) {
                console.error('❌ Auth test error:', error);
                alert(`❌ Auth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
          >
            🔐 Test Authentication
          </motion.button>
          
          {/* Test Restore Button */}
          <motion.button
            onClick={async () => {
              try {
                console.log('🧪 Testing restore functionality...');
                                 const response = await fetch('/api/admin/test-restore', {
                   credentials: 'include'
                 });
                const result = await response.json();
                console.log('🧪 Test result:', result);
                
                if (response.ok) {
                  alert(`✅ Test successful!\n\nAuthenticated: ${result.data.authenticated}\nRole: ${result.data.userRole}\nAgents found: ${result.data.totalAgents}`);
                } else {
                  alert(`❌ Test failed: ${result.error}`);
                }
              } catch (error) {
                console.error('❌ Test error:', error);
                alert(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
          >
            🧪 Test Restore Functionality
          </motion.button>

          {/* Debug Agent Images Button */}
          <motion.button
            onClick={async () => {
              try {
                console.log('🔍 Debugging agent images...');
                const response = await fetch('/api/admin/users?role=agent,agency', {
                  credentials: 'include'
                });
                const result = await response.json();
                
                if (response.ok && result.data) {
                  const agents = result.data;
                  let debugInfo = `Found ${agents.length} agents:\n\n`;
                  
                  agents.forEach((agent: any, index: number) => {
                    const avatarUrl = agent.profile?.avatar || 'No avatar';
                    const isCloudflare = avatarUrl.includes('r2.dev') || avatarUrl.includes('cloudflarestorage.com');
                    debugInfo += `${index + 1}. ${agent.fullName}\n`;
                    debugInfo += `   Avatar: ${avatarUrl}\n`;
                    debugInfo += `   Cloudflare: ${isCloudflare ? '✅ Yes' : '❌ No'}\n\n`;
                  });
                  
                  alert(debugInfo);
                } else {
                  alert(`❌ Failed to fetch agents: ${result.error}`);
                }
              } catch (error) {
                console.error('❌ Debug error:', error);
                alert(`❌ Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
          >
            🔍 Debug Agent Images
          </motion.button>

          {/* Test R2 Upload Button */}
          <motion.button
            onClick={async () => {
              try {
                console.log('🧪 Testing R2 upload...');
                const response = await fetch('/api/r2/test', {
                  credentials: 'include'
                });
                const result = await response.json();
                
                if (response.ok) {
                  alert(`✅ R2 Connection Test Successful!\n\n${JSON.stringify(result, null, 2)}`);
                } else {
                  alert(`❌ R2 Connection Test Failed:\n\n${JSON.stringify(result, null, 2)}`);
                }
              } catch (error) {
                console.error('❌ R2 test error:', error);
                alert(`❌ R2 test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
          >
            🧪 Test R2 Connection
          </motion.button>

                       {/* Test Local Images Button */}
             <motion.button
               onClick={async () => {
                 try {
                   console.log('🧪 Testing local images...');
                   const response = await fetch('/api/admin/test-local-images', {
                     credentials: 'include'
                   });
                   const result = await response.json();

                   if (response.ok) {
                     let message = `Local Image Test Results:\n\n`;
                     result.data.results.forEach((agent: any) => {
                       message += `${agent.agentName}:\n`;
                       message += `  Status: ${agent.status}\n`;
                       if (agent.status === 'accessible') {
                         message += `  Size: ${agent.imageSize} bytes\n`;
                       } else if (agent.error) {
                         message += `  Error: ${agent.error}\n`;
                       }
                       message += `  URL: ${agent.imageUrl}\n\n`;
                     });
                     alert(message);
                   } else {
                     alert(`❌ Local image test failed: ${result.error}`);
                   }
                 } catch (error) {
                   console.error('❌ Local image test error:', error);
                   alert(`❌ Local image test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                 }
               }}
               className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
             >
               🧪 Test Local Images
             </motion.button>

             {/* Test R2 Upload Button */}
             <motion.button
               onClick={async () => {
                 try {
                   console.log('🧪 Testing R2 upload...');
                   const response = await fetch('/api/test-r2-upload', {
                     method: 'POST',
                     credentials: 'include'
                   });
                   const result = await response.json();

                   if (response.ok) {
                     alert(`✅ R2 Upload Test Successful!\n\nURL: ${result.data.url}\nKey: ${result.data.key}\nBucket: ${result.data.bucket}`);
                   } else {
                     alert(`❌ R2 Upload Test Failed:\n\n${JSON.stringify(result, null, 2)}`);
                   }
                 } catch (error) {
                   console.error('❌ R2 upload test error:', error);
                   alert(`❌ R2 upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                 }
               }}
               className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
             >
               🧪 Test R2 Upload
             </motion.button>

                           {/* Test Agent Image Button */}
              <motion.button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing agent image download and upload...');
                    const response = await fetch('/api/test-agent-image', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const result = await response.json();

                    if (response.ok) {
                      let message = `🧪 Agent Image Test Results:\n\n`;
                      message += `Total Tested: ${result.data.totalTested}\n`;
                      message += `Successful: ${result.data.successful}\n`;
                      message += `Failed: ${result.data.failed}\n\n`;
                      
                      result.data.results.forEach((img: any) => {
                        message += `Image ${img.imageNumber}:\n`;
                        message += `  Status: ${img.status}\n`;
                        if (img.status === 'success') {
                          message += `  Size: ${img.size} bytes\n`;
                          message += `  Uploaded: ${img.uploadedUrl}\n`;
                        } else {
                          message += `  Error: ${img.error}\n`;
                        }
                        message += `  Original: ${img.originalUrl}\n\n`;
                      });
                      
                      alert(message);
                    } else {
                      alert(`❌ Agent Image Test Failed:\n\n${JSON.stringify(result, null, 2)}`);
                    }
                  } catch (error) {
                    console.error('❌ Agent image test error:', error);
                    alert(`❌ Agent image test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
              >
                🧪 Test Multiple Agent Images
              </motion.button>
                     {/* Action Buttons */}
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
             {/* Backup Agent Images Button */}
             <motion.button
               onClick={async () => {
                 if (confirm('This will backup all agent images to Cloudflare R2 to prevent data loss. Continue?')) {
                                       try {
                      const response = await fetch('/api/admin/backup-agent-images', {
                        method: 'POST',
                        credentials: 'include',
                      });
                     const result = await response.json();
                     
                     if (response.ok) {
                       alert(`✅ Successfully backed up ${result.data.backupCount} agent images to Cloudflare R2!\n\nErrors: ${result.data.errorCount}`);
                       window.location.reload();
                     } else {
                       alert(`❌ Error: ${result.error}`);
                     }
                   } catch (error) {
                     alert('❌ Error backing up agent images');
                   }
                 }
               }}
               className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
             >
               💾 Backup All Agent Images to Cloudflare R2
             </motion.button>

             {/* Restore Agent Images Button */}
             <motion.button
               onClick={async () => {
                 console.log('🔄 Restore button clicked');
                 if (confirm('This will restore all agent images to Cloudflare R2 and update all properties. This may take a few minutes. Continue?')) {
                   try {
                     console.log('📡 Sending restore request...');
                     const response = await fetch('/api/admin/restore-agent-images', {
                       method: 'POST',
                       credentials: 'include',
                       headers: {
                         'Content-Type': 'application/json',
                       },
                     });
                     console.log('📡 Response status:', response.status);
                     
                     const result = await response.json();
                     console.log('📡 Response result:', result);
                     
                     if (response.ok) {
                       alert(`✅ Successfully restored ${result.data.restoredCount} agent images to Cloudflare R2!\n\nUpdated ${result.data.propertyUpdateCount} properties.\n\nErrors: ${result.data.errorCount}`);
                       window.location.reload();
                     } else {
                       alert(`❌ Error: ${result.error}\n\nStatus: ${response.status}`);
                     }
                   } catch (error) {
                     console.error('❌ Restore error:', error);
                     alert(`❌ Error restoring agent images: ${error instanceof Error ? error.message : 'Unknown error'}`);
                   }
                 }
               }}
               className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
             >
               🔄 Restore All Agent Images to Cloudflare R2
             </motion.button>

             {/* Update Properties Button */}
             <motion.button
               onClick={async () => {
                 if (confirm('This will update all existing properties to use the agent\'s current profile pictures. Continue?')) {
                   try {
                     const response = await fetch('/api/admin/update-agent-images', {
                       method: 'POST',
                       credentials: 'include',
                     });
                     const result = await response.json();
                     
                     if (response.ok) {
                       alert(`✅ Successfully updated ${result.data.updatedCount} properties with agent profile pictures!`);
                       window.location.reload();
                     } else {
                       alert(`❌ Error: ${result.error}`);
                     }
                   } catch (error) {
                     alert('❌ Error updating agent images');
                   }
                 }
               }}
               className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
             >
               🔄 Update All Properties with Agent Profile Pictures
             </motion.button>
           </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 mb-8"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-red-400" />
              <span className="text-red-200 font-semibold">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <motion.div
              key={agent._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              {/* Agent Avatar */}
              <div className="relative mb-4">
                                 <img
                   src={agent.profile.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'}
                   alt={agent.fullName}
                   className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-500/30"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
                   }}
                 />
                
                {/* Avatar Update Button */}
                <button
                  onClick={() => setEditingAvatar(agent._id)}
                  disabled={uploading === agent._id}
                  className="absolute bottom-0 right-0 bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {uploading === agent._id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(agent._id, e)}
                  className="hidden"
                  id={`avatar-${agent._id}`}
                />
              </div>

              {/* Agent Info */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white">{agent.fullName}</h3>
                  {isUltimateSuperadmin(agent) && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white border border-blue-500 shadow-lg">
                      <div className="relative">
                        <Shield className="w-3 h-3 text-white drop-shadow-sm" />
                        <Crown className="w-2 h-2 text-yellow-300 absolute -top-0.5 -right-0.5" />
                      </div>
                      <span>SUPERADMIN</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    agent.role === 'agent' 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>
                    {agent.role === 'agent' ? 'Agent' : 'Agency'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    agent.status === 'active'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-purple-200">
                  <p 
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => {
                      if (agent.phone) {
                        // Clean the phone number for tel: link and format with 061
                        const cleanPhone = agent.phone.replace(/\D/g, '');
                        const formattedPhone = cleanPhone.startsWith('2526') ? `061${cleanPhone.substring(5)}` : `061${cleanPhone}`;
                        const phoneLink = `tel:${formattedPhone}`;
                        window.location.href = phoneLink;
                      }
                    }}
                  >
                    {formatPhoneNumber(agent.phone)}
                  </p>
                  {agent.profile.location && <p>📍 {agent.profile.location}</p>}
                  {agent.profile.occupation && <p>💼 {agent.profile.occupation}</p>}
                  {agent.profile.company && <p>🏢 {agent.profile.company}</p>}
                </div>

                <div className="mt-4 text-xs text-purple-300">
                  Joined: {new Date(agent.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Avatar Update Modal */}
              {editingAvatar === agent._id && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold text-white mb-4">Update Agent Avatar</h3>
                    <p className="text-purple-200 mb-4">Select a new profile image for {agent.fullName}</p>
                    
                    <div className="flex space-x-3">
                      <label
                        htmlFor={`avatar-${agent._id}`}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg text-center cursor-pointer transition-colors"
                      >
                        Select Image
                      </label>
                      <button
                        onClick={() => setEditingAvatar(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {agents.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Agents Found</h3>
            <p className="text-purple-200">No agents have been registered yet.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}