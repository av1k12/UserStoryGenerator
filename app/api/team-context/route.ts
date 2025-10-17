import { NextRequest, NextResponse } from 'next/server'
import { getTeamContextFilePath, updateTeamContextFile } from '@/lib/teamStorage'
import fs from 'fs'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team')

    if (!teamId) {
      return NextResponse.json({ error: 'Missing team parameter' }, { status: 400 })
    }

    // Ensure latest context is generated
    updateTeamContextFile(teamId)

    const path = getTeamContextFilePath(teamId)
    let contextText = ''
    if (fs.existsSync(path)) {
      contextText = fs.readFileSync(path, 'utf-8')
    }

    return NextResponse.json({ contextText })
  } catch (error) {
    console.error('Error reading team context:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 