'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Send, Copy, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface TeamConfig {
  id: string
  teamName: string
  mission: string
  projectDescription: string
  userStoryTemplate: string
  teamRoles: string
  createdAt: string
}

interface GeneratedStory {
  id: string
  originalInput: string
  formattedStory: string
  suggestions: string[]
  createdAt: string
  storyId?: string
}

// Add tweak state and history types
interface TweakHistoryItem {
  id: string;
  tweakInstructions: string;
  formattedStory: string;
  suggestions: string[];
  createdAt: string;
}

interface GeneratedStoryWithTweaks extends GeneratedStory {
  tweakHistory: TweakHistoryItem[];
}

function CreatePageContent() {
  const searchParams = useSearchParams()
  const teamId = searchParams.get('team')
  
  const [teamConfig, setTeamConfig] = useState<TeamConfig | null>(null)
  const [userInput, setUserInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStories, setGeneratedStories] = useState<GeneratedStoryWithTweaks[]>([]);
  const [tweakInputs, setTweakInputs] = useState<{ [storyId: string]: string }>({});
  const [isTweaking, setIsTweaking] = useState<{ [storyId: string]: boolean }>({});
  const [isCopied, setIsCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [contextText, setContextText] = useState<string>('')
  const [isLoadingContext, setIsLoadingContext] = useState(false)

  useEffect(() => {
    if (teamId) {
      const savedConfig = localStorage.getItem('teamConfig')
      if (savedConfig) {
        const config = JSON.parse(savedConfig)
        if (config.id === teamId) {
          setTeamConfig(config)
        }
      }
    }
  }, [teamId])

  const openTeamContext = async () => {
    if (!teamId) return
    setIsContextOpen(true)
    setIsLoadingContext(true)
    try {
      const res = await fetch(`/api/team-context?team=${encodeURIComponent(teamId)}`)
      const data = await res.json()
      setContextText(data.contextText || 'No context available yet.')
    } catch (e) {
      setContextText('Failed to load team knowledge. Please try again later.')
    } finally {
      setIsLoadingContext(false)
    }
  }

  const generateStory = async () => {
    if (!userInput.trim() || !teamConfig) return

    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: userInput.trim(),
          teamId: teamId ?? undefined,
          teamConfig: {
            teamName: teamConfig.teamName,
            mission: teamConfig.mission,
            projectDescription: teamConfig.projectDescription,
            userStoryTemplate: teamConfig.userStoryTemplate,
            teamRoles: teamConfig.teamRoles,
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate story')
      }

      const result = await response.json()
      
      const newStory: GeneratedStoryWithTweaks = {
        id: Date.now().toString(),
        originalInput: userInput,
        formattedStory: result.formattedStory,
        suggestions: result.suggestions || [],
        createdAt: new Date().toISOString(),
        storyId: result.storyId,
        tweakHistory: []
      }
      
      setGeneratedStories(prev => [newStory, ...prev])
      setUserInput('')
    } catch (error) {
      console.error('Error generating story:', error)
      setError('Failed to generate story. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Tweak handler
  const handleTweak = async (storyIdLocal: string) => {
    const story = generatedStories.find(s => s.id === storyIdLocal)
    if (!story || !teamConfig) return
    const tweakInstructions = tweakInputs[storyIdLocal]?.trim()
    if (!tweakInstructions) return
    setIsTweaking(prev => ({ ...prev, [storyIdLocal]: true }))
    setError(null)
    try {
      const response = await fetch('/api/generate-story', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalStory: story.formattedStory,
          tweakInstructions,
          teamId: teamId ?? undefined,
          storyId: story.storyId,
          teamConfig: {
            teamName: teamConfig.teamName,
            mission: teamConfig.mission,
            projectDescription: teamConfig.projectDescription,
            userStoryTemplate: teamConfig.userStoryTemplate,
            teamRoles: teamConfig.teamRoles,
          }
        })
      })
      if (!response.ok) {
        throw new Error('Failed to tweak story')
      }
      const result = await response.json()
      const tweakItem: TweakHistoryItem = {
        id: Date.now().toString(),
        tweakInstructions,
        formattedStory: result.formattedStory,
        suggestions: result.suggestions || [],
        createdAt: new Date().toISOString()
      }
      setGeneratedStories(prev => prev.map(s =>
        s.id === storyIdLocal
          ? {
              ...s,
              formattedStory: result.formattedStory,
              suggestions: result.suggestions || [],
              tweakHistory: [tweakItem, ...s.tweakHistory]
            }
          : s
      ))
      setTweakInputs(prev => ({ ...prev, [storyIdLocal]: '' }))
    } catch (error) {
      console.error('Error tweaking story:', error)
      setError('Failed to tweak story. Please try again.')
    } finally {
      setIsTweaking(prev => ({ ...prev, [storyIdLocal]: false }))
    }
  }

  const handleCopy = async (text: string, storyId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(storyId)
      setTimeout(() => setIsCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleDownload = () => {
    const storiesText = generatedStories.map(story => 
      `Original Input: ${story.originalInput}\n\n${story.formattedStory}${story.suggestions.length > 0 ? `\n\nSuggestions:\n${story.suggestions.map(s => `- ${s}`).join('\n')}` : ''}\n\n---\n`
    ).join('\n')
    
    const blob = new Blob([storiesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-stories-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!teamConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <p className="text-gray-600 mb-6">
            The team configuration could not be found. Please check the URL or contact your agilist.
          </p>
          <a href="/setup" className="btn-primary">
            Go to Setup
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create User Stories</h1>
          <p className="mt-2 text-gray-600">
            Team: <span className="font-semibold">{teamConfig.teamName}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story Creation */}
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create New Story</h2>
                <button onClick={openTeamContext} className="btn-secondary">View Team Knowledge</button>
              </div>
              
              <div className="mb-4">
                <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your story in one sentence
                </label>
                <textarea
                  id="userInput"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && userInput.trim() && !isGenerating) {
                      e.preventDefault()
                      generateStory()
                    }
                  }}
                  className="input-field"
                  rows={3}
                  placeholder="e.g., As a customer, I want to reset my password so I can access my account when I forget it"
                  disabled={isGenerating}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Include your role, what you want to accomplish, and why it's beneficial.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={generateStory}
                disabled={!userInput.trim() || isGenerating}
                className="btn-primary flex items-center"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Generate Story
                  </>
                )}
              </button>
            </div>

            {/* Generated Stories */}
            {generatedStories.length > 0 && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Generated Stories</h2>
                  <button
                    onClick={handleDownload}
                    className="btn-secondary flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download All
                  </button>
                </div>
                
                <div className="space-y-6">
                  {generatedStories.map((story) => (
                    <div key={story.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Original Input:</p>
                        <p className="text-gray-700 italic">"{story.originalInput}"</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">User Story:</p>
                        <pre className="text-gray-900 font-medium whitespace-pre-wrap bg-gray-50 rounded p-3">{story.formattedStory}</pre>
                        <button
                          onClick={() => handleCopy(story.formattedStory, story.id)}
                          className="btn-secondary mt-2 flex items-center"
                        >
                          {isCopied === story.id ? (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Story
                            </>
                          )}
                        </button>
                      </div>
                      {story.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">AI Suggestions:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {story.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Tweak UI */}
                      <div className="mt-4">
                        <label htmlFor={`tweak-${story.id}`} className="block text-xs font-medium text-gray-700 mb-1">Tweak this story</label>
                        <div className="flex gap-2">
                          <input
                            id={`tweak-${story.id}`}
                            type="text"
                            className="input-field flex-1"
                            placeholder="e.g., Add acceptance criteria, make it shorter, etc."
                            value={tweakInputs[story.id] || ''}
                            onChange={e => setTweakInputs(prev => ({ ...prev, [story.id]: e.target.value }))}
                            disabled={isTweaking[story.id]}
                          />
                          <button
                            onClick={() => handleTweak(story.id)}
                            disabled={!tweakInputs[story.id]?.trim() || isTweaking[story.id]}
                            className="btn-primary"
                          >
                            {isTweaking[story.id] ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Tweak'}
                          </button>
                        </div>
                      </div>
                      {/* Tweak History */}
                      {story.tweakHistory.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center mb-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <h4 className="text-sm font-medium text-gray-700">Edit History</h4>
                            <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                              {story.tweakHistory.length} {story.tweakHistory.length === 1 ? 'edit' : 'edits'}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {story.tweakHistory.map((tweak, idx) => (
                              <div key={tweak.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                {/* Edit Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                      <span className="text-xs font-medium text-blue-600">{idx + 1}</span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Edit #{idx + 1}</p>
                                      <p className="text-xs text-gray-500">{new Date(tweak.createdAt).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Tweak Instructions */}
                                <div className="mb-3">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Request:</p>
                                  <p className="text-sm text-gray-900 bg-blue-50 px-3 py-2 rounded-md border-l-4 border-blue-200">
                                    "{tweak.tweakInstructions}"
                                  </p>
                                </div>
                                
                                {/* Updated Story */}
                                <div className="mb-3">
                                  <p className="text-xs font-medium text-gray-700 mb-2">Updated Story:</p>
                                  <div className="bg-gray-50 px-3 py-2 rounded-md border">
                                    <p className="text-sm text-gray-900 leading-relaxed">{tweak.formattedStory}</p>
                                  </div>
                                </div>
                                
                                {/* Suggestions */}
                                {tweak.suggestions.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-700 mb-2">AI Suggestions:</p>
                                    <ul className="space-y-1">
                                      {tweak.suggestions.map((suggestion, i) => (
                                        <li key={i} className="flex items-start">
                                          <span className="text-green-500 mr-2 mt-1">•</span>
                                          <span className="text-sm text-gray-700">{suggestion}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Context</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Mission</h4>
                  <p className="text-sm text-gray-600">{teamConfig.mission}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Project</h4>
                  <p className="text-sm text-gray-600">{teamConfig.projectDescription}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Team Roles</h4>
                  <p className="text-sm text-gray-600">{teamConfig.teamRoles}</p>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Generation</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>ChatGPT Integration:</strong>
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Analyzes your input with team context</li>
                  <li>• Generates professional user stories</li>
                  <li>• Provides improvement suggestions</li>
                </ul>
              </div>
            </div>

            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">Story Format:</p>
                <p className="text-xs text-gray-600 italic mb-3">{teamConfig.userStoryTemplate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isContextOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Team Knowledge</h3>
              <button onClick={() => setIsContextOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4">
              {isLoadingContext ? (
                <div className="text-sm text-gray-500">Loading...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-[60vh] overflow-y-auto bg-gray-50 p-3 rounded border">{contextText || 'No context available yet.'}</pre>
              )}
            </div>
            <div className="flex justify-end p-4 border-t">
              <button onClick={() => setIsContextOpen(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your team configuration.</p>
        </div>
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  )
} 