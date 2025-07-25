'use client'

import React, { useState } from 'react'
import { Save, Copy, Check } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface TeamConfig {
  id: string
  teamName: string
  mission: string
  projectDescription: string
  userStoryTemplate: string
  teamRoles: string
  createdAt: string
}

export default function SetupPage() {
  const [config, setConfig] = useState<TeamConfig>({
    id: '',
    teamName: '',
    mission: '',
    projectDescription: '',
    userStoryTemplate: 'As a [role], I want [feature/functionality], so that [benefit/value].',
    teamRoles: '',
    createdAt: ''
  })

  const [isSaved, setIsSaved] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const handleSave = () => {
    const newConfig = {
      ...config,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    }
    
    // In a real app, this would be saved to a database
    localStorage.setItem('teamConfig', JSON.stringify(newConfig))
    
    const url = `${window.location.origin}/create?team=${newConfig.id}`
    setShareUrl(url)
    setIsSaved(true)
    
    setTimeout(() => setIsSaved(false), 3000)
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleInputChange = (field: keyof TeamConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Setup</h1>
          <p className="mt-2 text-gray-600">
            Configure your team's user story template and background information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                {/* Team Information */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Information</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      id="teamName"
                      value={config.teamName}
                      onChange={(e) => handleInputChange('teamName', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Product Development Team"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="mission" className="block text-sm font-medium text-gray-700 mb-2">
                      Team Mission
                    </label>
                    <textarea
                      id="mission"
                      value={config.mission}
                      onChange={(e) => handleInputChange('mission', e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="Describe your team's mission and goals..."
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description
                    </label>
                    <textarea
                      id="projectDescription"
                      value={config.projectDescription}
                      onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                      className="input-field"
                      rows={4}
                      placeholder="Describe what your team is working on..."
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="teamRoles" className="block text-sm font-medium text-gray-700 mb-2">
                      Team Roles
                    </label>
                    <textarea
                      id="teamRoles"
                      value={config.teamRoles}
                      onChange={(e) => handleInputChange('teamRoles', e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="e.g., Product Owner, Developer, QA Engineer, UX Designer"
                      required
                    />
                  </div>
                </div>

                {/* User Story Template */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">User Story Template</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="userStoryTemplate" className="block text-sm font-medium text-gray-700 mb-2">
                      Story Format
                    </label>
                    <textarea
                      id="userStoryTemplate"
                      value={config.userStoryTemplate}
                      onChange={(e) => handleInputChange('userStoryTemplate', e.target.value)}
                      className="input-field"
                      rows={2}
                      placeholder="As a [role], I want [feature/functionality], so that [benefit/value]."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Use [role], [feature/functionality], and [benefit/value] as placeholders. 
                      Acceptance criteria will be automatically generated using AI.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary flex items-center"
                    disabled={isSaved}
                  >
                    {isSaved ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Save Configuration
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share with Team</h3>
              
              {shareUrl ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Share this link with your team members to start creating user stories:
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="input-field text-sm"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="btn-secondary flex items-center"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {isCopied ? 'URL copied to clipboard!' : 'Click to copy URL'}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Save your configuration to generate a shareable link
                  </p>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Preview</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">User Story Format:</p>
                <p className="text-sm text-gray-600 mb-4 italic">
                  {config.userStoryTemplate || 'As a [role], I want [feature/functionality], so that [benefit/value].'}
                </p>
                
                <p className="text-sm text-gray-700 mb-2">Acceptance Criteria:</p>
                <p className="text-sm text-gray-600 italic">
                  Will be automatically generated using AI based on the user story
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 