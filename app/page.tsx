'use client'

import React, { useState } from 'react'
import { ArrowRight, Users, FileText, Share2 } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">SAFeScript</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/setup" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Setup
              </Link>
              <Link href="/create" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Create Story
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">AI-Powered</span>
            <span className="block text-primary-600">User Story Generator</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your SAFe agile process with intelligent user story creation. 
            Let AI help your team write better stories faster.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/setup" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/create" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                Create Story
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="card">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Team Setup</h3>
              <p className="mt-2 text-base text-gray-500">
                Configure your team's user story template and background information for consistent story generation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Simple Creation</h3>
              <p className="mt-2 text-base text-gray-500">
                Team members just need to write a sentence describing their role, task, and benefit.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <Share2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Easy Sharing</h3>
              <p className="mt-2 text-base text-gray-500">
                Share a simple link with your team to start creating user stories immediately.
              </p>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Agilist Setup</h3>
              <p className="text-gray-600">Configure your team's template and background information</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Link</h3>
              <p className="text-gray-600">Share the generated link with your team members</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Stories</h3>
              <p className="text-gray-600">Team members write simple sentences to generate formatted user stories</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 