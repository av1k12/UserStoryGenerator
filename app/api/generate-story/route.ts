import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { saveNewStory, addTweakToStory, getRecentStoriesForTeam, TeamConfigStored, getTeamContextFilePath, updateTeamContextFile } from '@/lib/teamStorage'
import fs from 'fs'

export const runtime = 'nodejs'

interface StoryRequest {
  userInput: string
  teamId?: string
  teamConfig: {
    teamName: string
    mission: string
    projectDescription: string
    userStoryTemplate: string
    teamRoles: string
  }
}

interface StoryResponse {
  formattedStory: string
  suggestions?: string[]
  storyId?: string
}

// Initialize OpenAI client conditionally
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function readFullTeamContext(teamId?: string): string {
  if (!teamId) return '';
  try {
    // Ensure latest cache exists
    updateTeamContextFile(teamId);
    const filePath = getTeamContextFilePath(teamId);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch {}
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const { userInput, teamConfig, teamId } = body

    if (!userInput || !teamConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const fullContext = readFullTeamContext(teamId)

    if (!process.env.OPENAI_API_KEY) {
      const result = await processUserInputFallback(userInput, teamConfig, fullContext)
      const saved = teamId ? saveNewStory({
        teamId,
        originalInput: userInput,
        formattedStory: result.formattedStory,
        suggestions: result.suggestions ?? [],
        teamConfig: toStoredConfig(teamConfig, teamId)
      }) : null
      return NextResponse.json({ ...result, storyId: saved?.id })
    }

    const result = await generateStoryWithChatGPT(userInput, teamConfig, fullContext)
    const saved = teamId ? saveNewStory({
      teamId,
      originalInput: userInput,
      formattedStory: result.formattedStory,
      suggestions: result.suggestions ?? [],
      teamConfig: toStoredConfig(teamConfig, teamId)
    }) : null
    return NextResponse.json({ ...result, storyId: saved?.id })
  } catch (error) {
    console.error('Error generating story:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalStory, tweakInstructions, teamConfig, storyId, teamId } = body as {
      originalStory: string;
      tweakInstructions: string;
      teamConfig: TeamConfigStored;
      storyId?: string;
      teamId?: string;
    };

    if (!originalStory || !tweakInstructions || !teamConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fullContext = readFullTeamContext(teamId)

    if (!process.env.OPENAI_API_KEY) {
      const formatted = `${originalStory}\n\n(Tweak: ${tweakInstructions})`;
      const response = { formattedStory: formatted, suggestions: ['No OpenAI API key, tweak applied as note.'] };
      if (storyId) {
        addTweakToStory({
          storyId,
          formattedStory: response.formattedStory,
          suggestions: response.suggestions ?? [],
          tweakInstructions,
        });
      }
      return NextResponse.json(response);
    }

    const systemPrompt = `You are an expert SAFe agile coach and user story writer. Your task is to help teams refine and improve user stories.\n\nTeam Context:\n- Team Name: ${teamConfig.teamName}\n- Mission: ${teamConfig.mission}\n- Project: ${teamConfig.projectDescription}\n- Team Roles: ${teamConfig.teamRoles}\n\nUser Story Template: ${teamConfig.userStoryTemplate}\n\nTeam Story Knowledge Base (use as background only; do not repeat verbatim):\n${fullContext}\n\nInstructions:\n1. Take the provided user story and the user's tweak instructions.\n2. Revise the story according to the instructions, keeping it well-structured and clear.\n3. Provide 1-2 suggestions for further improvement if applicable.\n\nRespond in JSON format:\n{\n  "formattedStory": "the revised user story",\n  "suggestions": ["suggestion 1", "suggestion 2"]\n}`;

    const userPrompt = `Original Story: "${originalStory}"\n\nTweak Instructions: ${tweakInstructions}\n\nPlease revise the user story as requested.`;

    const openai = getOpenAI();
    if (!openai) {
      throw new Error('OpenAI client not available');
    }
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from ChatGPT');
      }
      try {
        const parsed = JSON.parse(response);
        const payload = {
          formattedStory: parsed.formattedStory || '',
          suggestions: parsed.suggestions || []
        };
        if (storyId) {
          addTweakToStory({
            storyId,
            formattedStory: payload.formattedStory,
            suggestions: payload.suggestions ?? [],
            tweakInstructions,
          });
        }
        return NextResponse.json(payload);
      } catch (parseError) {
        const payload = { formattedStory: response, suggestions: [] as string[] };
        if (storyId) {
          addTweakToStory({
            storyId,
            formattedStory: payload.formattedStory,
            suggestions: payload.suggestions,
            tweakInstructions,
          });
        }
        return NextResponse.json(payload);
      }
    } catch (error) {
      console.error('ChatGPT API error (tweak):', error);
      const payload = {
        formattedStory: `${originalStory}\n\n(Tweak failed: ${tweakInstructions})`,
        suggestions: ['AI tweak failed, see error log.']
      };
      if (storyId) {
        addTweakToStory({
          storyId,
          formattedStory: payload.formattedStory,
          suggestions: payload.suggestions,
          tweakInstructions,
        });
      }
      return NextResponse.json(payload);
    }
  } catch (error) {
    console.error('Error tweaking story:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function toStoredConfig(config: any, teamId: string): TeamConfigStored {
  return {
    id: teamId,
    teamName: config.teamName,
    mission: config.mission,
    projectDescription: config.projectDescription,
    userStoryTemplate: config.userStoryTemplate,
    teamRoles: config.teamRoles,
  };
}

async function generateStoryWithChatGPT(input: string, config: any, fullContext: string): Promise<StoryResponse> {
  const systemPrompt = `You are an expert SAFe agile coach and user story writer. Your task is to help teams create well-structured user stories.\n\nTeam Context:\n- Team Name: ${config.teamName}\n- Mission: ${config.mission}\n- Project: ${config.projectDescription}\n- Team Roles: ${config.teamRoles}\n\nUser Story Template: ${config.userStoryTemplate}\n\nTeam Story Knowledge Base (use as background only; do not repeat verbatim):\n${fullContext}\n\nInstructions:\n1. Analyze the user's input and extract the role, feature/functionality, and benefit/value\n2. Format the user story using the provided template\n3. Provide 1-2 suggestions for improving the story if applicable\n\nRespond in JSON format:\n{\n  "formattedStory": "the formatted user story",\n  "suggestions": ["suggestion 1", "suggestion 2"]\n}`

  const userPrompt = `User Input: "${input}"\n\nPlease generate a user story based on this input.`

  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI client not available');
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from ChatGPT')
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(response)
      return {
        formattedStory: parsed.formattedStory || '',
        suggestions: parsed.suggestions || []
      }
    } catch (parseError) {
      // If JSON parsing fails, extract content manually
      return extractContentFromText(response, config)
    }
  } catch (error) {
    console.error('ChatGPT API error:', error)
    // Fallback to text processing
    return await processUserInputFallback(input, config, fullContext)
  }
}

function extractContentFromText(text: string, config: any): StoryResponse {
  const lines = text.split('\n')
  let formattedStory = ''
  let suggestions: string[] = []

  let currentSection = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.toLowerCase().includes('user story') || trimmed.toLowerCase().includes('story:')) {
      currentSection = 'story'
    } else if (trimmed.toLowerCase().includes('suggestion')) {
      currentSection = 'suggestions'
    } else if (trimmed && currentSection === 'story') {
      formattedStory = trimmed
    } else if (trimmed && currentSection === 'suggestions') {
      suggestions.push(trimmed)
    }
  }

  return {
    formattedStory: formattedStory || config.userStoryTemplate,
    suggestions
  }
}

async function processUserInputFallback(input: string, config: any, _fullContext: string = ''): Promise<StoryResponse> {
  const words = input.toLowerCase().split(' ')
  const sentences = input.split(/[.!?]+/)
  
  const rolePatterns = [
    /as\s+an?\s+(\w+)/i,
    /as\s+a\s+(\w+)/i,
    /i\s+am\s+a\s+(\w+)/i,
    /(\w+)\s+here/i
  ]
  
  let role = 'user'
  for (const pattern of rolePatterns) {
    const match = input.match(pattern)
    if (match) {
      role = match[1]
      break
    }
  }
  
  const actionPatterns = [
    /want\s+to\s+([^\.]+)/i,
    /need\s+to\s+([^\.]+)/i,
    /would\s+like\s+to\s+([^\.]+)/i,
    /can\s+([^\.]+)/i
  ]
  
  let action = 'access a feature'
  for (const pattern of actionPatterns) {
    const match = input.match(pattern)
    if (match) {
      action = match[1].trim()
      break
    }
  }
  
  const benefitPatterns = [
    /so\s+(?:that\s+)?([^\.]+)/i,
    /because\s+([^\.]+)/i,
    /in\s+order\s+to\s+([^\.]+)/i,
    /to\s+([^\.]+)/i
  ]
  
  let benefit = 'achieve my goals'
  for (const pattern of benefitPatterns) {
    const match = input.match(pattern)
    if (match) {
      benefit = match[1].trim()
      break
    }
  }
  
  const formattedStory = config.userStoryTemplate
    .replace('[role]', role)
    .replace('[feature/functionality]', action)
    .replace('[benefit/value]', benefit)
  
  const suggestions = generateSuggestions(input, role, action, benefit)
  
  return {
    formattedStory,
    suggestions
  }
}

function generateSuggestions(input: string, role: string, action: string, benefit: string): string[] {
  const suggestions: string[] = []
  
  if (role === 'user') {
    suggestions.push('Consider being more specific about the user role (e.g., "customer", "admin", "developer")')
  }
  
  if (action.length < 10) {
    suggestions.push('Try to be more specific about what functionality you want')
  }
  
  if (benefit.length < 10) {
    suggestions.push('Consider explaining the business value or user benefit more clearly')
  }
  
  if (!input.includes('so') && !input.includes('because') && !input.includes('to')) {
    suggestions.push('Try to include the benefit or reason using words like "so", "because", or "to"')
  }
  
  return suggestions.slice(0, 3)
} 